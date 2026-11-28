#!/usr/bin/env python3
"""Repackage the Neo game HTML into the existing Cordova APK and sign it.

Only local JDK tools are used (keytool / jarsigner / javac / java).
The output APK is aligned and signed with both v1 and v2 APK signatures.

Paths can be overridden with environment variables:
  NEO_BASE_APK, NEO_GAME_DIR, NEO_HTML, NEO_OUT_APK, NEO_KEYSTORE, JAVA_HOME,
  NEO_VERSION_NAME, NEO_BASE_VERSION_NAME
"""
import hashlib
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE_APK_CANDIDATES = [
    Path(os.environ["NEO_BASE_APK"]) if os.environ.get("NEO_BASE_APK") else None,
    Path(r"E:\dolmod4\DoL-ModLoader-0.5.12.13-v2.101.1.APK"),
    Path(r"C:\Users\14430\Downloads\DoL-ModLoader-0.5.12.13-v2.101.1.APK"),
    Path(r"E:\DoL-ModLoader-0.5.12.13-v2.101.1\DoL-ModLoader-0.5.12.13-v2.101.1.APK"),
]
BASE_APK_CANDIDATES = [p for p in BASE_APK_CANDIDATES if p is not None]
BASE_APK = next((p for p in BASE_APK_CANDIDATES if p.exists()), BASE_APK_CANDIDATES[0])
GAME_DIR = Path(os.environ["NEO_GAME_DIR"]) if os.environ.get("NEO_GAME_DIR") else ROOT.parent / "游戏本体"
NEO_HTML = Path(os.environ["NEO_HTML"]) if os.environ.get("NEO_HTML") else GAME_DIR / "DoL-ModLoader-Neo-0.5.12.13-v1.0.6.html"
OUT_APK = Path(os.environ["NEO_OUT_APK"]) if os.environ.get("NEO_OUT_APK") else GAME_DIR / "DoL-ModLoader-Neo-0.5.12.13-v1.0.6.apk"
APP_VERSION_NAME = os.environ.get("NEO_VERSION_NAME") or "1.0.6"
BASE_VERSION_NAME = os.environ.get("NEO_BASE_VERSION_NAME") or ""

TOOLS = ROOT / "tools" / "apk"
BUILD = TOOLS / "build"
KEYSTORE = Path(os.environ["NEO_KEYSTORE"]) if os.environ.get("NEO_KEYSTORE") else ROOT.parent / "签名密钥" / "neo-signing.p12"
KEY_PASS = os.environ.get("NEO_KEY_PASS") or "neo-local-build"
KEY_ALIAS = os.environ.get("NEO_KEY_ALIAS") or "neo"
KEY_DNAME = "CN=ModLoader Neo, OU=Local, O=ModLoaderNeo, C=CN"

MAGIC = b"APK Sig Block 42"
SIG_ALG_RSA_SHA256 = 0x0103
V2_BLOCK_ID = 0x7109871a
CHUNK_SIZE = 1024 * 1024

BRIDGE = (
    b'<script src="cordova.js" type="text/javascript"></script>\n'
    b'<script src="custom_cordova_additions.js" type="text/javascript"></script>\n'
)


def find_jdk():
    env = os.environ.get("JAVA_HOME")
    if env:
        candidate = Path(env)
        if (candidate / "bin" / "javac.exe").exists() or (candidate / "bin" / "javac").exists():
            return candidate
    base = Path(r"C:\Program Files\Java")
    candidates = sorted([p for p in base.glob("jdk-*") if (p / "bin" / "javac.exe").exists()])
    if not candidates:
        raise SystemExit("No JDK found. Set JAVA_HOME or install a JDK.")
    return candidates[-1]


def lp(data: bytes) -> bytes:
    return struct.pack("<I", len(data)) + data


def chunked_digest(sections):
    chunk_digests = []
    total = 0
    for section in sections:
        for i in range(0, len(section), CHUNK_SIZE):
            chunk = section[i:i + CHUNK_SIZE]
            h = hashlib.sha256()
            h.update(b"\x5a")
            h.update(struct.pack("<I", len(chunk)))
            h.update(chunk)
            chunk_digests.append(h.digest())
            total += 1
    h = hashlib.sha256()
    h.update(b"\xa5")
    h.update(struct.pack("<I", total))
    for digest in chunk_digests:
        h.update(digest)
    return h.digest()


def read_eocd(data: bytes):
    eocd = data.rfind(b"PK\x05\x06")
    if eocd < 0:
        raise SystemExit("EOCD not found")
    cd_size = struct.unpack_from("<I", data, eocd + 12)[0]
    cd_offset = struct.unpack_from("<I", data, eocd + 16)[0]
    if cd_size == 0xFFFFFFFF or cd_offset == 0xFFFFFFFF:
        raise SystemExit("ZIP64 APK is not supported by this script")
    return eocd, cd_offset, cd_size


def assemble_apk_html():
    html = NEO_HTML.read_bytes()
    if b'src="cordova.js"' in html:
        return html
    marker = b"window.modDataValueZipList"
    at = html.find(marker)
    if at < 0:
        raise SystemExit("window.modDataValueZipList not found in Neo HTML")
    tag = html.rfind(b"<script", 0, at)
    if tag < 0:
        raise SystemExit("mod list <script> tag not found")
    return html[:tag] + BRIDGE + html[tag:]


VERSION_STRING_RE = re.compile(rb"(?:[0-9]\x00){1,3}(?:\.\x00(?:[0-9]\x00){1,3}){1,3}")


def detect_manifest_version_name(data: bytes) -> str:
    names = []
    for match in VERSION_STRING_RE.finditer(data):
        pos = match.start()
        if pos < 2:
            continue
        try:
            name = match.group().decode("utf-16le")
        except UnicodeDecodeError:
            continue
        length = struct.unpack_from("<H", data, pos - 2)[0]
        if length == len(name) and name not in names:
            names.append(name)
    if len(names) != 1:
        raise SystemExit(
            "cannot detect a unique AndroidManifest versionName: " + repr(names)
        )
    return names[0]


def _read_pool_string(data: bytes, start: int, utf8: bool):
    if utf8:
        first = data[start]
        if first & 0x80:
            length = ((first & 0x7F) << 8) | data[start + 1]
            pos = start + 2
        else:
            length = first
            pos = start + 1
        raw = data[pos:pos + length]
        value = raw.decode("utf-8", errors="surrogateescape")
        return value, pos + length + 1
    length = struct.unpack_from("<H", data, start)[0]
    pos = start + 2
    if length & 0x8000:
        length = ((length & 0x7FFF) << 16) | struct.unpack_from("<H", data, start + 2)[0]
        pos = start + 4
    raw = data[pos:pos + length * 2]
    value = raw.decode("utf-16le", errors="surrogatepass")
    return value, pos + length * 2 + 2


def _encode_pool_string(value: str, utf8: bool) -> bytes:
    if utf8:
        raw = value.encode("utf-8")
        length = len(raw)
        if length < 0x80:
            prefix = bytes([length])
        elif length < 0x8000:
            prefix = bytes([0x80 | (length >> 8), length & 0xFF])
        else:
            raise SystemExit("versionName is too long for a UTF-8 manifest string")
        return prefix + raw + b"\x00"
    raw = value.encode("utf-16le", errors="surrogatepass")
    length = len(raw) // 2
    if length < 0x8000:
        prefix = struct.pack("<H", length)
    else:
        prefix = struct.pack("<HH", 0x8000 | (length >> 16), length & 0xFFFF)
    return prefix + raw + b"\x00\x00"


def patch_manifest_string_pool(data: bytes, old_name: str, new_name: str) -> bytes:
    """Replace one string pool entry with a longer value.

    The original build script only patched versionName in place, which limits
    the new name to the length of the base APK's versionName (0.5.12.13).
    Rebuilding the UTF-16/UTF-8 string pool keeps the attribute's string index
    unchanged while allowing names such as 1.0.6.
    """
    xml_type, xml_header, xml_size = struct.unpack_from("<HHI", data, 0)
    if xml_type != 0x0003:
        raise SystemExit("AndroidManifest.xml is not a binary XML document")

    pool_off = None
    off = xml_header
    while off + 8 <= len(data):
        chunk_type, chunk_header, chunk_size = struct.unpack_from("<HHI", data, off)
        if chunk_type == 0x0001:
            pool_off = off
            pool_head = chunk_header
            pool_size = chunk_size
            break
        if chunk_size <= 0:
            break
        off += chunk_size
    if pool_off is None:
        raise SystemExit("AndroidManifest.xml string pool not found")

    string_count, style_count, flags, strings_start, styles_start = struct.unpack_from(
        "<IIIII", data, pool_off + 8
    )
    if style_count:
        raise SystemExit("styled AndroidManifest string pools are not supported")
    utf8 = bool(flags & 0x100)
    min_strings_start = pool_head + (string_count + style_count) * 4
    if strings_start < min_strings_start:
        raise SystemExit("AndroidManifest string pool has an invalid stringsStart")

    data_start = pool_off + strings_start
    data_end = pool_off + (styles_start if styles_start else pool_size)
    offsets = [
        struct.unpack_from("<I", data, pool_off + pool_head + index * 4)[0]
        for index in range(string_count)
    ]

    values = []
    target = None
    for index, offset in enumerate(offsets):
        start = data_start + offset
        if start < data_start or start >= data_end:
            raise SystemExit("AndroidManifest string offset is out of range")
        value, end = _read_pool_string(data, start, utf8)
        if end > data_end:
            raise SystemExit("AndroidManifest string overruns the string pool")
        values.append(value)
        if value == old_name:
            if target is not None:
                raise SystemExit("versionName string is not unique in AndroidManifest")
            target = index
    if target is None:
        raise SystemExit("versionName string not found in AndroidManifest string pool")

    encoded = [_encode_pool_string(value, utf8) for value in values]
    encoded[target] = _encode_pool_string(new_name, utf8)
    new_data = b"".join(encoded)
    new_offsets = []
    cursor = 0
    for chunk in encoded:
        new_offsets.append(cursor)
        cursor += len(chunk)

    new_pool_size = strings_start + len(new_data)
    pool = bytearray()
    pool += struct.pack("<HHI", 0x0001, pool_head, new_pool_size)
    pool += struct.pack("<IIIII", string_count, style_count, flags, strings_start, styles_start)
    if pool_head > 28:
        pool += data[pool_off + 28:pool_off + pool_head]
    for offset in new_offsets:
        pool += struct.pack("<I", offset)
    if len(pool) < strings_start:
        pool += b"\x00" * (strings_start - len(pool))
    elif len(pool) > strings_start:
        raise SystemExit("AndroidManifest string offsets overlap string data")
    pool += new_data

    delta = len(pool) - pool_size
    result = bytearray()
    result += data[:xml_header]
    struct.pack_into("<I", result, 4, xml_size + delta)
    result += data[xml_header:pool_off]
    result += pool
    result += data[pool_off + pool_size:]
    return bytes(result)


def patch_manifest_version_name(data: bytes) -> bytes:
    old_name = BASE_VERSION_NAME or detect_manifest_version_name(data)
    new_name = APP_VERSION_NAME
    if old_name == new_name:
        return data
    if len(new_name) > len(old_name):
        return patch_manifest_string_pool(data, old_name, new_name)
    old_bytes = old_name.encode("utf-16le")
    pos = data.find(old_bytes)
    if pos < 2 or data.find(old_bytes, pos + 1) >= 0:
        raise SystemExit(
            "AndroidManifest versionName %r not found exactly once" % old_name
        )
    length_pos = pos - 2
    old_length = struct.unpack_from("<H", data, length_pos)[0]
    if old_length != len(old_name):
        raise SystemExit(
            "AndroidManifest versionName length mismatch: %r" % old_name
        )
    region = old_length * 2 + 2
    new_bytes = new_name.encode("utf-16le")
    replacement = new_bytes + b"\x00" * (region - len(new_bytes))
    return (
        data[:length_pos]
        + struct.pack("<H", len(new_name))
        + replacement
        + data[length_pos + 2 + region:]
    )


def repackage(apk_html: bytes, target: Path, extra_entries=None):
    with zipfile.ZipFile(BASE_APK, "r") as zin, zipfile.ZipFile(target, "w") as zout:
        for info in zin.infolist():
            name = info.filename
            upper = name.upper()
            if upper == "META-INF/MANIFEST.MF" or (
                upper.startswith("META-INF/")
                and (upper.endswith(".SF") or upper.endswith(".RSA") or upper.endswith(".DSA") or upper.endswith(".EC"))
            ):
                continue
            data = zin.read(info)
            if name == "assets/www/index.html":
                data = apk_html
            elif name == "AndroidManifest.xml":
                data = patch_manifest_version_name(data)
            out = zipfile.ZipInfo(name, date_time=info.date_time)
            out.compress_type = info.compress_type
            out.external_attr = info.external_attr
            out.internal_attr = info.internal_attr
            out.create_system = info.create_system
            out.extra = info.extra
            if out.compress_type == zipfile.ZIP_STORED:
                header_start = zout.fp.tell()
                name_len = len(name.encode("utf-8"))
                data_offset = header_start + 30 + name_len + len(out.extra)
                pad = (-data_offset) % 4
                if pad:
                    out.extra = out.extra + b"\x00" * pad
            zout.writestr(out, data)
        for name, data in extra_entries or []:
            out = zipfile.ZipInfo(name)
            out.compress_type = zipfile.ZIP_DEFLATED
            out.external_attr = 0o600 << 16
            zout.writestr(out, data)


def ensure_keystore(jdk: Path):
    if KEYSTORE.exists():
        return
    KEYSTORE.parent.mkdir(parents=True, exist_ok=True)
    keytool = jdk / "bin" / "keytool.exe"
    subprocess.run([
        str(keytool), "-genkeypair",
        "-keystore", str(KEYSTORE),
        "-storetype", "PKCS12",
        "-alias", KEY_ALIAS,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", KEY_PASS,
        "-keypass", KEY_PASS,
        "-dname", KEY_DNAME,
    ], check=True)


def compile_helper(jdk: Path):
    BUILD.mkdir(parents=True, exist_ok=True)
    javac = jdk / "bin" / "javac.exe"
    sources = [TOOLS / "V2SignHelper.java"]
    subprocess.run([str(javac), "-encoding", "UTF-8", "-d", str(BUILD)] + [str(p) for p in sources], check=True)


def run_v1(jdk: Path, unsigned: Path, signed: Path):
    jarsigner = jdk / "bin" / "jarsigner.exe"
    subprocess.run([
        str(jarsigner),
        "-keystore", str(KEYSTORE),
        "-storepass", KEY_PASS,
        "-keypass", KEY_PASS,
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        "-sigfile", "CERT",
        "-signedjar", str(signed),
        str(unsigned),
        KEY_ALIAS,
    ], check=True)


def extract_v1_signature(signed: Path):
    names = ["META-INF/MANIFEST.MF", "META-INF/CERT.SF", "META-INF/CERT.RSA"]
    with zipfile.ZipFile(signed, "r") as z:
        return [(name, z.read(name)) for name in names]


def verify_v1(jdk: Path, apk: Path):
    jarsigner = jdk / "bin" / "jarsigner.exe"
    result = subprocess.run(
        [str(jarsigner), "-verify", str(apk)],
        capture_output=True,
        text=True,
    )
    text = (result.stdout or "") + "\n" + (result.stderr or "")
    if result.returncode != 0:
        raise SystemExit("v1 verification failed:\n" + text[-3000:])
    with zipfile.ZipFile(apk) as z:
        names = set(z.namelist())
    for name in ("META-INF/MANIFEST.MF", "META-INF/CERT.SF", "META-INF/CERT.RSA"):
        if name not in names:
            raise SystemExit("v1 signature file missing: " + name)


def sign_payload(jdk: Path, payload: Path, work: Path):
    java = jdk / "bin" / "java.exe"
    sig_out = work / "signature.bin"
    pub_out = work / "public-key.der"
    cert_out = work / "certificate.der"
    subprocess.run([
        str(java), "-cp", str(BUILD), "V2SignHelper",
        str(KEYSTORE), KEY_PASS, KEY_ALIAS,
        str(payload), str(sig_out), str(pub_out), str(cert_out),
    ], check=True)
    return sig_out.read_bytes(), pub_out.read_bytes(), cert_out.read_bytes()


def build_v2_apk(jdk: Path, signed_apk: Path, out_apk: Path, work: Path):
    data = signed_apk.read_bytes()
    eocd, cd_offset, cd_size = read_eocd(data)
    digest = chunked_digest([
        data[:cd_offset],
        data[cd_offset:cd_offset + cd_size],
        data[eocd:],
    ])

    # First obtain certificate/public key, then sign the real signed-data.
    digest_record = struct.pack("<I", SIG_ALG_RSA_SHA256) + lp(digest)
    digests = lp(lp(digest_record))
    probe = work / "probe-signed-data.bin"
    probe.write_bytes(digests)
    _, pub_key, cert_der = sign_payload(jdk, probe, work)

    certs = lp(lp(cert_der))
    additional = lp(b"")
    signed_data_content = digests + certs + additional
    payload = work / "signed-data.bin"
    payload.write_bytes(signed_data_content)
    signature, pub_key, cert_der = sign_payload(jdk, payload, work)

    signatures = lp(lp(struct.pack("<I", SIG_ALG_RSA_SHA256) + lp(signature)))
    public_key = lp(pub_key)
    signer_block = lp(lp(signed_data_content) + signatures + public_key)
    value = lp(signer_block)

    pair = struct.pack("<Q", len(value) + 4) + struct.pack("<I", V2_BLOCK_ID) + value
    size = len(pair) + 8 + 16
    block = struct.pack("<Q", size) + pair + struct.pack("<Q", size) + MAGIC

    new_cd_offset = cd_offset + len(block)
    eocd_bytes = bytearray(data[eocd:])
    struct.pack_into("<I", eocd_bytes, 16, new_cd_offset)
    final = data[:cd_offset] + block + data[cd_offset:eocd] + bytes(eocd_bytes)
    out_apk.write_bytes(final)
    return final, digest


def verify_v2(final: bytes, expected_digest: bytes):
    eocd, cd_offset, cd_size = read_eocd(final)
    if final[cd_offset - 16:cd_offset] != MAGIC:
        raise SystemExit("v2 verification: signing block magic missing")
    block_size = struct.unpack_from("<Q", final, cd_offset - 24)[0]
    block_start = cd_offset - (block_size + 8)
    if block_start < 0 or struct.unpack_from("<Q", final, block_start)[0] != block_size:
        raise SystemExit("v2 verification: signing block size mismatch")
    pos = block_start + 8
    value = None
    end = cd_offset - 24
    while pos < end:
        pair_len = struct.unpack_from("<Q", final, pos)[0]
        pair_id = struct.unpack_from("<I", final, pos + 8)[0]
        pair_value = final[pos + 12:pos + 8 + pair_len]
        if pair_id == V2_BLOCK_ID:
            value = pair_value
        pos += 8 + pair_len
    if value is None:
        raise SystemExit("v2 verification: v2 signer block missing")
    eocd_bytes = bytearray(final[eocd:])
    struct.pack_into("<I", eocd_bytes, 16, block_start)
    digest = chunked_digest([final[:block_start], final[cd_offset:cd_offset + cd_size], bytes(eocd_bytes)])
    if digest != expected_digest:
        raise SystemExit("v2 verification: content digest mismatch")


def check_stored_alignment(apk: Path):
    with zipfile.ZipFile(apk, "r") as z, open(apk, "rb") as f:
        for info in z.infolist():
            if info.compress_type != zipfile.ZIP_STORED:
                continue
            f.seek(info.header_offset + 26)
            name_len, extra_len = struct.unpack("<HH", f.read(4))
            data_offset = info.header_offset + 30 + name_len + extra_len
            if data_offset % 4:
                raise SystemExit("stored entry is not 4-byte aligned: " + info.filename)


def main():
    if not BASE_APK.exists():
        raise SystemExit("base APK not found: " + str(BASE_APK))
    if not NEO_HTML.exists():
        raise SystemExit("Neo HTML not found: " + str(NEO_HTML))
    jdk = find_jdk()
    print("JDK:", jdk)
    print("versionName:", APP_VERSION_NAME)
    ensure_keystore(jdk)
    compile_helper(jdk)

    OUT_APK.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="neo-apk-") as tmp:
        work = Path(tmp)
        unsigned = work / "unsigned.apk"
        signed_v1 = work / "signed-v1.apk"
        aligned_v1 = work / "aligned-v1.apk"
        print("assembling HTML ...")
        apk_html = assemble_apk_html()
        print("repackage ...")
        repackage(apk_html, unsigned)
        check_stored_alignment(unsigned)
        print("v1 sign (certificate extraction) ...")
        run_v1(jdk, unsigned, signed_v1)
        extras = extract_v1_signature(signed_v1)
        print("repackage with v1 signature ...")
        repackage(apk_html, aligned_v1, extras)
        check_stored_alignment(aligned_v1)
        print("v2 sign ...")
        final, digest = build_v2_apk(jdk, aligned_v1, OUT_APK, work)
        verify_v2(final, digest)
        check_stored_alignment(OUT_APK)
        print("v1 verify ...")
        verify_v1(jdk, OUT_APK)
    print("APK:", OUT_APK)
    print("size:", OUT_APK.stat().st_size, "bytes")
    print("sha256:", hashlib.sha256(OUT_APK.read_bytes()).hexdigest())


if __name__ == "__main__":
    main()
