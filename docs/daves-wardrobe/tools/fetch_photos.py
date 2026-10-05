#!/usr/bin/env python3
"""Build photo packs for Dave's Wardrobe.

The wardrobe page runs as a claude.ai artifact, and the artifact sandbox blocks
images from other websites. So listing photos have to be downloaded once,
shrunk, and published alongside the page. This script does the downloading and
shrinking. Run it on a machine (or a Claude session) whose network can reach
the shops.

For each pick in data/items.json it:
  1. opens the listing URL and reads the main product photo
     (og:image, twitter:image, or the first JSON-LD "image"),
  2. downloads it, crops it to 4:3 around the centre, resizes it to 480x360
     and saves it as a WebP of about 15-25 KB,
  3. packs the results into photos/pack-01.json, pack-02.json, ...
     ({itemId: "data:image/webp;base64,..."}, about 3 MB per pack).

Pre-owned picks (Vinted and eBay searches) and category pages are skipped,
because they have no single listing photo.

With --browser, picks the plain download could not reach are retried in
headless Chromium (browser_fetch.js), which gets past most bot protection.

Then publish the packs with the page and point meta/photos at them:
  Artifact publish  url=<wardrobe url>  file_path=page.html
                    files={"photos/pack-01.json": "photos/pack-01.json", ...}
  ArtifactData update  collection=meta  doc_id=photos
                    data={"packs": ["photos/pack-01.json", ...], "updated": "<date>"}

The page loads every pack named in meta/photos, so a re-run only needs a
republish and one meta/photos write.

Needs: Python 3.9+, Pillow (pip install pillow).
Usage: python3 fetch_photos.py [--items ../data/items.json] [--out photos]
                               [--only id1,id2] [--workers 8]
"""
import argparse
import base64
import concurrent.futures as cf
import html
import io
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

from PIL import Image

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")
PATTERNS = [
    r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image',
    r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',
    r'"image"\s*:\s*\[?\s*"(https?:[^"]+)"',
]
SIZE = (480, 360)
PACK_BYTES = 3_000_000
# Links that open a list of products rather than one listing.
NOT_A_LISTING = re.compile(r"/(collections/(all|sale)/?$|catalog\?|/b/bn_|search|/shop/mens/.*/f/|/browse/)", re.I)


def get(url, limit=3_000_000):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,*/*",
        "Accept-Language": "en-GB,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read(limit), resp.headers.get_content_type()


def photo_url(page_url):
    body, _ = get(page_url)
    text = body.decode("utf8", "replace")
    for pat in PATTERNS:
        m = re.search(pat, text, re.I)
        if m:
            u = html.unescape(m.group(1)).replace("\\/", "/")
            if u.startswith("//"):
                u = "https:" + u
            return u
    return None


def shrink(raw):
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = img.size
    target = SIZE[0] / SIZE[1]
    if w / h > target:  # too wide: trim the sides
        nw = int(h * target)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:  # too tall: keep the top, where the garment usually is
        nh = int(w / target)
        top = max(0, min((h - nh) // 4, h - nh))
        img = img.crop((0, top, w, top + nh))
    img = img.resize(SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=68, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def one(item_id, item):
    if item.get("kind") == "preowned" or NOT_A_LISTING.search(item.get("url", "")):
        return item_id, None, "skipped: not a single listing"
    try:
        src = photo_url(item["url"])
        if not src:
            return item_id, None, "no photo tag on the page"
        raw, ctype = get(src, 8_000_000)
        if not ctype.startswith("image/"):
            return item_id, None, "photo URL did not return an image"
        return item_id, raw, "ok"
    except Exception as exc:  # network errors, blocked shops, bad images
        return item_id, None, "failed: %s" % str(exc)[:100]


def main():
    ap = argparse.ArgumentParser()
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--items", default=os.path.join(here, "..", "data", "items.json"))
    ap.add_argument("--out", default="photos")
    ap.add_argument("--only", default="")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--browser", action="store_true",
                    help="retry refused shops in headless Chromium (node + playwright, see browser_fetch.js)")
    ap.add_argument("--skip-hosts", default="www.asos.com",
                    help="comma-separated hosts not worth a browser retry (they block data-centre traffic)")
    args = ap.parse_args()

    items = json.load(open(args.items))
    if args.only:
        keep = set(args.only.split(","))
        items = {k: v for k, v in items.items() if k in keep}
    os.makedirs(args.out, exist_ok=True)

    raw, report = {}, {}
    with cf.ThreadPoolExecutor(args.workers) as ex:
        for item_id, data, why in ex.map(lambda kv: one(*kv), items.items()):
            report[item_id] = why
            if data:
                raw[item_id] = data
            print(("+ " if data else "- ") + item_id + ": " + why, file=sys.stderr)

    if args.browser:
        skip = set(h for h in args.skip_hosts.split(",") if h)
        retry = [k for k, why in report.items()
                 if k not in raw and not why.startswith("skipped")
                 and urllib.parse.urlsplit(items[k]["url"]).hostname not in skip]
        if retry:
            rawdir = os.path.join(args.out, "browser-raw")
            os.makedirs(rawdir, exist_ok=True)
            subprocess.run(["node", os.path.join(here, "browser_fetch.js"), args.items, ",".join(retry), rawdir])
            for k in retry:
                f = os.path.join(rawdir, k + ".img")
                if os.path.exists(f):
                    raw[k] = open(f, "rb").read()
                    report[k] = "ok (browser)"
                else:
                    report[k] += "; browser retry failed too"

    got = {}
    for k, data in raw.items():
        try:
            got[k] = shrink(data)
        except Exception as exc:  # unreadable or unsupported image format
            report[k] = "could not read the image: %s" % str(exc)[:80]

    packs, cur, size = [], {}, 0
    for k in sorted(got):
        if cur and size + len(got[k]) > PACK_BYTES:
            packs.append(cur)
            cur, size = {}, 0
        cur[k] = got[k]
        size += len(got[k])
    if cur:
        packs.append(cur)
    names = []
    for i, pack in enumerate(packs, 1):
        name = "photos/pack-%02d.json" % i
        with open(os.path.join(args.out, os.path.basename(name)), "w") as f:
            json.dump(pack, f, separators=(",", ":"))
        names.append(name)
    with open(os.path.join(args.out, "meta-photos.json"), "w") as f:
        json.dump({"packs": names}, f, indent=1)
    with open(os.path.join(args.out, "report.json"), "w") as f:
        json.dump(report, f, indent=1, sort_keys=True)
    print("%d of %d picks have a photo, in %d packs. See %s/report.json for the rest."
          % (len(got), len(items), len(names), args.out))


if __name__ == "__main__":
    main()
