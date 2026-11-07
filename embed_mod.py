import argparse
import base64
import io
import json
import zipfile

HTML = r"E:\ModLoader Neo新架构试验版\游戏本体\Degrees of Lewdity.neo.html"
MOD = r"E:\ModLoader Neo新架构试验版\ModLoader-Neo-Source\dist\ModLoaderNeoUI.mod.zip"
MOD_NAME = "ModLoaderNeoUI"
MARKER = b"window.modDataValueZipList = ["
END = b"];</script>"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", default=HTML)
    parser.add_argument("--zip", default=MOD)
    parser.add_argument("--name", default=MOD_NAME)
    args = parser.parse_args()

    html = open(args.html, "rb").read()
    start = html.index(MARKER) + len(MARKER) - 1
    end = html.index(END, start)
    arr = json.loads(html[start:end + 1].decode("utf-8"))

    zdata = open(args.zip, "rb").read()
    b64 = base64.b64encode(zdata).decode("ascii")

    replaced = False
    for idx, item in enumerate(arr):
        try:
            with zipfile.ZipFile(io.BytesIO(base64.b64decode(item))) as z:
                boot = json.loads(z.read("boot.json").decode("utf-8"))
        except Exception:
            continue
        if boot.get("name") == args.name:
            arr[idx] = b64
            replaced = True
            break
    if not replaced:
        arr.append(b64)

    new_array = json.dumps(arr, separators=(",", ":")).encode("utf-8")
    out = html[:start] + new_array + html[end + 1:]
    open(args.html, "wb").write(out)

    print(("replaced" if replaced else "appended"), args.name)
    print("mods:", len(arr))
    print("html:", len(out), "bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
