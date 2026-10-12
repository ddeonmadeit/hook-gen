"""Builds the self-hosted Apple emoji images in emoji/ from iamcal/emoji-data.

    git clone --depth 1 --branch v16.0.0 --filter=blob:none --sparse https://github.com/iamcal/emoji-data.git
    git -C emoji-data sparse-checkout set img-apple-160
    python3 scripts/build-emoji-assets.py emoji-data

Outputs:
    emoji/160/<unified>.webp   one file per emoji (incl. skin tones), drawn into the PNG
    emoji/sheets/<cat>.webp    one sprite sheet per picker category, SHEET_COLS cells per row
"""
import json
import math
import os
import sys
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

SHEET_COLS = 16  # keep in sync with app.js
CELL = 64

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out160 = os.path.join(root, "emoji", "160")
outSheets = os.path.join(root, "emoji", "sheets")


def load(src, u):
    return Image.open(os.path.join(src, u + ".png")).convert("RGBA")


def save160(args):
    src, u = args
    load(src, u).save(os.path.join(out160, u + ".webp"), "WEBP", quality=90, method=4)


def save_sheet(args):
    src, i, items = args
    rows = math.ceil(len(items) / SHEET_COLS)
    sheet = Image.new("RGBA", (SHEET_COLS * CELL, rows * CELL), (0, 0, 0, 0))
    for k, u in enumerate(items):
        cell = load(src, u).resize((CELL, CELL), Image.LANCZOS)
        sheet.paste(cell, ((k % SHEET_COLS) * CELL, (k // SHEET_COLS) * CELL))
    path = os.path.join(outSheets, f"{i}.webp")
    sheet.save(path, "WEBP", quality=80, method=6)
    return f"sheet {i}: {len(items)} emoji, {os.path.getsize(path) // 1024} KB"


if __name__ == "__main__":
    src = os.path.join(sys.argv[1], "img-apple-160")
    text = open(os.path.join(root, "emoji-data.js")).read()
    data = json.loads(text[text.index("{") : text.rindex("}") + 1])
    os.makedirs(out160, exist_ok=True)
    os.makedirs(outSheets, exist_ok=True)

    every = [u for c in data["cats"] for u, _ in c["items"]] + data["extra"]
    sheets = [(src, i, [u for u, _ in c["items"]]) for i, c in enumerate(data["cats"])]
    with ProcessPoolExecutor() as pool:
        list(pool.map(save160, [(src, u) for u in every], chunksize=32))
        for line in pool.map(save_sheet, sheets):
            print(line)
