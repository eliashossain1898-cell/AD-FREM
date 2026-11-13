#!/usr/bin/env python3
"""
AI Product Cutout & Background Removal Pipeline (rembg + Pillow).

Removes backgrounds from client product photos or logos, trims transparent
whitespace, and saves a crisp alpha-channel PNG ready for CTAScreen.tsx.
"""

import argparse
import io
import json
import sys
from pathlib import Path

from PIL import Image
from rembg import remove


def remove_background(input_path: Path, output_path: Path, max_size: int = 1080) -> dict:
    raw_bytes = input_path.read_bytes()
    cutout_bytes = remove(raw_bytes)
    img = Image.open(io.BytesIO(cutout_bytes)).convert("RGBA")

    # Auto-crop transparent padding for crisp centering in CTAScreen
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Fit inside max_size square while preserving aspect ratio
    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, format="PNG")

    return {
        "ok": True,
        "input": str(input_path),
        "output": str(output_path),
        "width": img.width,
        "height": img.height,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove background from product image using rembg.")
    parser.add_argument("input", type=str, help="Input image path (JPG/PNG/WEBP)")
    parser.add_argument("output", type=str, help="Output transparent PNG path")
    parser.add_argument("--max-size", type=int, default=1080, help="Max dimension in pixels")
    args = parser.parse_args()

    result = remove_background(Path(args.input), Path(args.output), args.max_size)
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
