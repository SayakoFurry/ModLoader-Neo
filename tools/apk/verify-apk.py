#!/usr/bin/env python3
"""Verify the v2 signature and Neo payload of the generated APK."""
import base64
import hashlib
import io
import json
import struct
import sys
import zipfile
from pathlib import Path

MAGIC = b"APK Sig Block 42"
V2_BLOCK_ID = 0x7109871a
SIG_ALG_RSA_SHA256 = 0x0103
CHUNK_SIZE = 1024 * 1024
SHA256_DIGEST_INFO = bytes.fromhex("3031300d060960864801650304020105000420")


def u32(b, p):
    return struct.unpack_from("<I", b, p)[0]


def u64(b, p):
    return struct.unpack_from("<Q", b, p)[0]


def read_lp(b, p):
    n = u32(b, p)
    return b[p + 4:p + 4 + n], p + 4 + n


def chunked_digest(sections):
    chunks = []
    total = 0
    for section in sections:
        for i in range(0, len(section), CHUNK_SIZE):
            piece = section[i:i + CHUNK_SIZE]
            h = hashlib.sha256()
            h.update(b"\x5a")
            h.update(struct.pack("<I", len(piece)))
            h.update(piece)
            chunks.append(h.digest())
            total += 1
    h = hashlib.sha256()
    h.update(b"\xa5")
    h.update(struct.pack("<I", total))
    for c in chunks:
        h.update(c)
    return h.digest()


def der_read(b, p):
    tag = b[p]
    p += 1
    length = b[p]
    p += 1
    if length & 0x80:
        count = length & 0x7f
        length = int.from_bytes(b[p:p + count], "big")
        p += count
    return tag, b[p:p + length], p + length


def rsa_verify(pubkey_der, message, signature):
    _, seq, _ = der_read(pubkey_der, 0)
    _, _, p = der_read(seq, 0)
    _, bitstr, _ = der_read(seq, p)
    _, rsa_seq, _ = der_read(bitstr[1:], 0)
    _, n_bytes, p = der_read(rsa_seq, 0)
    _, e_bytes, _ = der_read(rsa_seq, p)
    n = int.from_bytes(n_bytes, "big")
    e = int.from_bytes(e_bytes, "big")
    size = (n.bit_length() + 7) // 8
    em = pow(int.from_bytes(signature, "big"), e, n).to_bytes(size, "big")
    digest = hashlib.sha256(message).digest()
    digest_info = SHA256_DIGEST_INFO + digest
    expected = b"\x00\x01" + b"\xff" * (size - 3 - len(digest_info)) + b"\x00" + digest_info
    return em == expected


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: verify-apk.py <apk>")
    apk = Path(sys.argv[1])
    data = apk.read_bytes()
    eocd = data.rfind(b"PK\x05\x06")
    if eocd < 0:
        raise SystemExit("EOCD not found")
    cd_size = u32(data, eocd + 12)
    cd_offset = u32(data, eocd + 16)
    if data[cd_offset - 16:cd_offset] != MAGIC:
        raise SystemExit("APK Signing Block magic missing")
    block_size = u64(data, cd_offset - 24)
    block_start = cd_offset - block_size - 8
    if u64(data, block_start) != block_size:
        raise SystemExit("APK Signing Block size mismatch")

    value = None
    pos = block_start + 8
    end = cd_offset - 24
    while pos < end:
        pair_len = u64(data, pos)
        pair_id = u32(data, pos + 8)
        pair_value = data[pos + 12:pos + 8 + pair_len]
        if pair_id == V2_BLOCK_ID:
            value = pair_value
        pos += 8 + pair_len
    if value is None:
        raise SystemExit("v2 signer block not found")

    signers, _ = read_lp(value, 0)
    signer, _ = read_lp(signers, 0)
    signed_data, p = read_lp(signer, 0)
    signatures, p = read_lp(signer, p)
    public_key, p = read_lp(signer, p)

    digests, p = read_lp(signed_data, 0)
    certs, p = read_lp(signed_data, p)
    additional, p = read_lp(signed_data, p)
    if additional:
        raise SystemExit("unexpected additional attributes")

    digest_record, _ = read_lp(digests, 0)
    alg = u32(digest_record, 0)
    stored_digest, _ = read_lp(digest_record, 4)
    if alg != SIG_ALG_RSA_SHA256:
        raise SystemExit("unexpected digest algorithm")

    signature_record, _ = read_lp(signatures, 0)
    sig_alg = u32(signature_record, 0)
    signature, _ = read_lp(signature_record, 4)
    if sig_alg != SIG_ALG_RSA_SHA256:
        raise SystemExit("unexpected signature algorithm")

    cert, _ = read_lp(certs, 0)
    eocd_bytes = bytearray(data[eocd:])
    struct.pack_into("<I", eocd_bytes, 16, block_start)
    computed = chunked_digest([
        data[:block_start],
        data[cd_offset:cd_offset + cd_size],
        bytes(eocd_bytes),
    ])
    if computed != stored_digest:
        raise SystemExit("content digest mismatch")
    if not rsa_verify(public_key, signed_data, signature):
        raise SystemExit("RSA signature verification failed")

    with zipfile.ZipFile(apk) as z:
        html = z.read("assets/www/index.html")
        names = set(z.namelist())

    neo_js = b""
    marker = b"window.modDataValueZipList = ["
    start = html.index(marker) + len(marker) - 1
    stop = html.index(b"];</script>", start)
    for item in json.loads(html[start:stop + 1]):
        mod = zipfile.ZipFile(io.BytesIO(base64.b64decode(item)))
        boot = json.loads(mod.read("boot.json"))
        if boot.get("name") == "ModLoaderNeoUI":
            neo_js = mod.read("dist/ModLoaderNeoUI.js")
            break

    checks = {
        "cordova bridge": b'src="cordova.js"' in html,
        "neo ui": b"neo-order-enhanced" in neo_js and b"neo-log-export" in neo_js and b"neo-cache-clear" in neo_js,
        "mod cache": b"modLoaderNeoCache" in html and b"parsedModInfo" in html,
        "zh-cn locale": b"zh-cn" in html,
        "v1 certificate": all(n in names for n in ("META-INF/MANIFEST.MF", "META-INF/CERT.SF", "META-INF/CERT.RSA")),
    }
    print("v2 digest : OK")
    print("RSA sign  : OK")
    print("cert bytes:", len(cert))
    for name, ok in checks.items():
        print(f"{name:10}:", "OK" if ok else "MISSING")
    if not all(checks.values()):
        raise SystemExit(1)
    print("APK verification: OK")


if __name__ == "__main__":
    main()
