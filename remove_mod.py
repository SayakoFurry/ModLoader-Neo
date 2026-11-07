import argparse
import base64
import io
import json
import os
import zipfile

HTML = r"E:\ModLoader Neo新架构试验版\游戏本体\Degrees of Lewdity.neo.html"
MARKER = b"window.modDataValueZipList = ["
END = b"];</script>"


def mod_name(b64_item: str) -> str:
    with zipfile.ZipFile(io.BytesIO(base64.b64decode(b64_item))) as z:
        boot = json.loads(z.read("boot.json").decode("utf-8"))
    return boot.get("name", "")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", default=HTML)
    parser.add_argument("--name", required=True, action="append")
    parser.add_argument("--out", default="")
    parser.add_argument("--font-css", default="")
    args = parser.parse_args()

    html = open(args.html, "rb").read()
    start = html.index(MARKER) + len(MARKER) - 1
    end = html.index(END, start)
    arr = json.loads(html[start:end + 1].decode("utf-8"))
    names = set(args.name)

    kept = []
    removed = []
    for item in arr:
        try:
            name = mod_name(item)
        except Exception:
            kept.append(item)
            continue
        if name in names:
            removed.append(name)
        else:
            kept.append(item)
    if not removed:
        raise SystemExit("no matching mod found: " + ", ".join(sorted(names)))

    new_array = json.dumps(kept, separators=(",", ":")).encode("utf-8")
    out = html[:start] + new_array + html[end + 1:]

    if args.font_css:
        css = open(args.font_css, "rb").read()
        head = out.find(b"<head>")
        if head < 0:
            raise SystemExit("<head> not found")
        style = b'<style id="neo-roschild-font">' + css + b"</style>"
        out = out[:head + 6] + style + out[head + 6:]

    target = args.out or args.html
    open(target, "wb").write(out)

    print("removed:", ",".join(removed))
    print("mods:", len(kept))
    print("html:", len(out), "bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
