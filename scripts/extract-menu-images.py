#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract drink images from AN Milk Tea menu.
Uses bounding box coordinates from Gemini analysis.
"""

import sys
import io
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow not installed")
    print("Install with: pip install Pillow")
    sys.exit(1)

# Paths
MENU_IMAGE = Path(__file__).parent.parent / 'public' / 'images' / 'menu-an.jpg'
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'images' / 'menu-extracted'

# Drink photos from Gemini analysis (bbox as percentage: left%, top%, right%, bottom%)
# Manually adjusted based on visual inspection
DRINK_PHOTOS = [
    # TRA SUA section (top-left)
    {"name": "tra-sua-socola", "bbox": [3, 8, 13, 22], "type": "milktea"},
    {"name": "tra-sua-tc-den", "bbox": [13, 8, 23, 22], "type": "milktea"},

    # LATTE section
    {"name": "matcha-latte", "bbox": [33, 8, 43, 22], "type": "latte"},

    # TRA DEN section (right side)
    {"name": "tra-den-vai", "bbox": [67, 18, 79, 34], "type": "fruittea"},

    # TRA NGUYEN VI section (far right)
    {"name": "tra-xanh-nguyen-vi", "bbox": [83, 8, 93, 22], "type": "fruittea"},
    {"name": "tra-cam", "bbox": [91, 18, 100, 32], "type": "fruittea"},

    # TRA SUA LAI section (bottom-left)
    {"name": "tra-sua-lai-vai", "bbox": [3, 55, 13, 69], "type": "milktea"},
    {"name": "tra-sua-lai-tc-hoang-kim", "bbox": [13, 55, 23, 69], "type": "milktea"},
    {"name": "tra-sua-lai-macchiato", "bbox": [23, 55, 33, 69], "type": "milktea"},

    # SUA TUOI section (bottom middle)
    {"name": "sua-tuoi-duong-den", "bbox": [33, 67, 43, 81], "type": "milktea"},
    {"name": "sua-tuoi-suong-sao", "bbox": [43, 67, 53, 81], "type": "milktea"},
    {"name": "sua-tuoi-tc-trang", "bbox": [53, 67, 63, 81], "type": "milktea"},

    # TRA XANH section (middle right)
    {"name": "tra-xanh-xoai", "bbox": [79, 37, 91, 52], "type": "fruittea"},

    # TRA OLONG / TRA SEN VANG (large image bottom right)
    {"name": "tra-sen-vang", "bbox": [65, 60, 90, 95], "type": "fruittea"},
]


def extract_drink_image(menu_img: Image.Image, bbox_percent: list, output_path: Path, padding: int = 5) -> bool:
    """
    Extract a drink image from the menu using percentage-based bounding box.

    Args:
        menu_img: PIL Image of the menu
        bbox_percent: [left%, top%, right%, bottom%] as percentages
        output_path: Path to save extracted image
        padding: Extra padding in pixels around the crop
    """
    width, height = menu_img.size

    # Convert percentage to pixels
    left = int(width * bbox_percent[0] / 100) - padding
    top = int(height * bbox_percent[1] / 100) - padding
    right = int(width * bbox_percent[2] / 100) + padding
    bottom = int(height * bbox_percent[3] / 100) + padding

    # Clamp to image bounds
    left = max(0, left)
    top = max(0, top)
    right = min(width, right)
    bottom = min(height, bottom)

    try:
        # Crop the image
        cropped = menu_img.crop((left, top, right, bottom))

        # Resize to square 600x600 for consistency
        cropped = cropped.resize((600, 600), Image.Resampling.LANCZOS)

        # Convert RGBA to RGB if needed
        if cropped.mode == 'RGBA':
            background = Image.new('RGB', cropped.size, (255, 255, 255))
            background.paste(cropped, mask=cropped.split()[3])
            cropped = background
        elif cropped.mode != 'RGB':
            cropped = cropped.convert('RGB')

        # Save
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(output_path, 'JPEG', quality=92)

        return True
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False


def main():
    print("AN Milk Tea - Menu Image Extractor")
    print("=" * 50)

    # Check menu image exists
    if not MENU_IMAGE.exists():
        print(f"ERROR: Menu image not found: {MENU_IMAGE}")
        return

    # Load menu image
    menu_img = Image.open(MENU_IMAGE)
    width, height = menu_img.size
    print(f"Menu image: {width}x{height}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total drinks to extract: {len(DRINK_PHOTOS)}")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = 0

    for drink in DRINK_PHOTOS:
        name = drink['name']
        bbox = drink['bbox']
        drink_type = drink['type']

        output_path = OUTPUT_DIR / f"{name}.jpg"

        print(f"  Extracting: {name} ({drink_type})")
        print(f"    BBox: {bbox}%")

        if extract_drink_image(menu_img, bbox, output_path):
            print(f"    [OK] Saved: {output_path.name}")
            success += 1
        else:
            failed += 1

    print("\n" + "=" * 50)
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Output: {OUTPUT_DIR}")

    # List which drink types we extracted
    milktea_count = sum(1 for d in DRINK_PHOTOS if d['type'] == 'milktea')
    fruittea_count = sum(1 for d in DRINK_PHOTOS if d['type'] == 'fruittea')
    latte_count = sum(1 for d in DRINK_PHOTOS if d['type'] == 'latte')

    print(f"\nExtracted by type:")
    print(f"  Milk Tea: {milktea_count}")
    print(f"  Fruit Tea: {fruittea_count}")
    print(f"  Latte: {latte_count}")


if __name__ == '__main__':
    main()
