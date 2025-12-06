#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recolor drink images for AN Milk Tea menu.
Uses TWO original images:
1. original-cup.jpg - for milk tea (opaque drinks)
2. original-tea.jpg - for fruit tea (transparent drinks)
"""

import os
import sys
import io
from pathlib import Path
from typing import Tuple

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    from PIL import Image, ImageEnhance
    import colorsys
except ImportError:
    print("Error: Pillow not installed")
    print("Install with: pip install Pillow")
    sys.exit(1)

# Directories
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'images' / 'products'
IMAGES_DIR = Path(__file__).parent.parent / 'public' / 'images'

# Original images
MILKTEA_IMAGE = IMAGES_DIR / 'original-cup.jpg'  # For opaque milk tea drinks
FRUITTEA_IMAGE = IMAGES_DIR / 'original-tea.jpg'  # For transparent fruit tea drinks

# Product definitions with source image type
# Format: 'code': ((R, G, B), 'Name', 'source')
# source: 'milktea' or 'fruittea'

PRODUCTS = {
    # === TRA SUA (Milk Tea - use milktea image) ===
    'tra-sua': ((210, 180, 140), 'Tra Sua', 'milktea'),
    'tra-sua-default': ((210, 180, 140), 'Tra Sua Default', 'milktea'),
    'tra-sua-tc-trang': ((220, 195, 160), 'Tra Sua TC Trang', 'milktea'),
    'tra-sua-tc-den': ((180, 140, 100), 'Tra Sua TC Den', 'milktea'),
    'tra-sua-tc-hoang-kim': ((200, 160, 80), 'Tra Sua TC Hoang Kim', 'milktea'),
    'tra-sua-socola': ((120, 80, 50), 'Tra Sua Socola', 'milktea'),
    'tra-sua-cacao': ((100, 70, 45), 'Tra Sua Cacao', 'milktea'),
    'tra-sua-full-topping': ((190, 150, 110), 'Tra Sua Full Topping', 'milktea'),
    'tra-sua-lai': ((230, 220, 200), 'Tra Sua Lai', 'milktea'),
    'tra-sua-lai-vai': ((240, 210, 200), 'Tra Sua Lai Vai', 'milktea'),

    # === TRA TRAI CAY (Fruit Tea - use fruittea image) ===
    'tra-trai-cay-default': ((255, 150, 80), 'Tra Trai Cay Default', 'fruittea'),
    'tra-xanh-xoai': ((255, 180, 50), 'Tra Xanh Xoai', 'fruittea'),
    'tra-xanh-dao': ((255, 160, 120), 'Tra Xanh Dao', 'fruittea'),
    'tra-xanh-vai': ((255, 200, 200), 'Tra Xanh Vai', 'fruittea'),
    'tra-dao-xoai': ((255, 140, 70), 'Tra Dao Xoai', 'fruittea'),
    'tra-dao-vai': ((255, 170, 150), 'Tra Dao Vai', 'fruittea'),
    'tra-vai-xoai': ((255, 190, 120), 'Tra Vai Xoai', 'fruittea'),
    'tra-sen-vang': ((240, 180, 80), 'Tra Sen Vang', 'fruittea'),
    'tra-xoai-macchiato': ((255, 180, 50), 'Tra Xoai Macchiato', 'fruittea'),

    # === TRA DONG GIA 12K (use fruittea image) ===
    'tra-12k-default': ((180, 200, 120), 'Tra 12K Default', 'fruittea'),
    'tra-xanh': ((150, 190, 100), 'Tra Xanh', 'fruittea'),
    'tra-xanh-chanh': ((180, 200, 80), 'Tra Xanh Chanh', 'fruittea'),
    'tra-tac': ((255, 160, 50), 'Tra Tac', 'fruittea'),
    'tra-dao': ((255, 160, 120), 'Tra Dao', 'fruittea'),

    # === TRA BI DAO (use fruittea image) ===
    'tra-bi-dao-default': ((220, 200, 120), 'Tra Bi Dao Default', 'fruittea'),
    'tra-bi-dao': ((220, 200, 120), 'Tra Bi Dao', 'fruittea'),
    'tra-xanh-bi-dao': ((180, 200, 100), 'Tra Xanh Bi Dao', 'fruittea'),

    # === LATTE (use milktea image - creamy) ===
    'latte-default': ((180, 150, 120), 'Latte Default', 'milktea'),
    'latte-matcha': ((120, 180, 100), 'Latte Matcha', 'milktea'),
    'latte-socola': ((100, 70, 50), 'Latte Socola', 'milktea'),
    'latte-khoai-mon': ((180, 140, 180), 'Latte Khoai Mon', 'milktea'),
    'latte-cacao': ((90, 60, 40), 'Latte Cacao', 'milktea'),

    # === SUA TUOI (use milktea image - creamy) ===
    'sua-tuoi-default': ((250, 250, 245), 'Sua Tuoi Default', 'milktea'),
    'sua-tuoi-matcha': ((150, 200, 120), 'Sua Tuoi Matcha', 'milktea'),
    'sua-tuoi-socola': ((130, 90, 60), 'Sua Tuoi Socola', 'milktea'),
    'sua-tuoi-khoai-mon': ((200, 170, 200), 'Sua Tuoi Khoai Mon', 'milktea'),
    'sua-tuoi-duong-den': ((240, 230, 220), 'Sua Tuoi Duong Den', 'milktea'),
    'sua-tuoi-tran-chau': ((250, 250, 245), 'Sua Tuoi Tran Chau', 'milktea'),

    # === YAOURT (use milktea image - creamy) ===
    'yaourt-default': ((250, 245, 240), 'Yaourt Default', 'milktea'),
    'yaourt-da': ((250, 248, 245), 'Yaourt Da', 'milktea'),
    'yaourt-dau': ((255, 180, 190), 'Yaourt Dau', 'milktea'),
    'yaourt-viet-quat': ((140, 100, 160), 'Yaourt Viet Quat', 'milktea'),
    'yaourt-tc-duong-den': ((245, 235, 225), 'Yaourt TC Duong Den', 'milktea'),
}


def rgb_to_hls(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """Convert RGB to HLS."""
    return colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)


def hls_to_rgb(h: float, l: float, s: float) -> Tuple[int, int, int]:
    """Convert HLS to RGB."""
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return int(r * 255), int(g * 255), int(b * 255)


def is_drink_pixel(r: int, g: int, b: int, drink_type: str) -> bool:
    """
    Check if a pixel is part of the drink area.
    Different detection for milk tea vs fruit tea.
    """
    h, l, s = rgb_to_hls(r, g, b)

    if drink_type == 'milktea':
        # Milk tea: brownish/tan colors with decent saturation
        # Hue around 0.03-0.12 (orange-brown range)
        is_drink_hue = 0.02 <= h <= 0.15
        has_saturation = s > 0.15
        not_too_dark = l > 0.20
        not_too_light = l < 0.90
        return is_drink_hue and has_saturation and not_too_dark and not_too_light
    else:
        # Fruit tea: orange/amber colors, more saturated
        # Hue around 0.05-0.15 (orange range)
        is_drink_hue = 0.02 <= h <= 0.18
        has_saturation = s > 0.20
        not_too_dark = l > 0.25
        not_too_light = l < 0.85
        return is_drink_hue and has_saturation and not_too_dark and not_too_light


def recolor_drink(image: Image.Image, target_rgb: Tuple[int, int, int], drink_type: str) -> Image.Image:
    """
    Recolor the drink to the target color.
    Preserves the cup, logo, ice, and lighting.
    """
    # Convert to RGB if necessary
    if image.mode == 'RGBA':
        # Create white background
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')

    # Get target color in HLS
    target_h, target_l, target_s = rgb_to_hls(*target_rgb)

    # Create a copy to modify
    result = image.copy()
    pixels = result.load()
    width, height = result.size

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]

            # Check if this pixel is part of the drink
            if is_drink_pixel(r, g, b, drink_type):
                # Get original color properties
                orig_h, orig_l, orig_s = rgb_to_hls(r, g, b)

                # Apply target hue while preserving original lighting
                new_h = target_h

                # Preserve lightness variations for 3D effect
                # Blend original lightness with target for natural look
                if drink_type == 'milktea':
                    new_l = orig_l * 0.6 + target_l * 0.4
                    new_s = orig_s * 0.4 + target_s * 0.6
                else:
                    # Fruit tea: keep more original brightness for transparency effect
                    new_l = orig_l * 0.7 + target_l * 0.3
                    new_s = orig_s * 0.5 + target_s * 0.5

                # Clamp values
                new_l = max(0.1, min(0.95, new_l))
                new_s = max(0.1, min(0.95, new_s))

                # Convert back to RGB
                new_r, new_g, new_b = hls_to_rgb(new_h, new_l, new_s)
                pixels[x, y] = (new_r, new_g, new_b)

    return result


def main():
    print("AN Milk Tea - Drink Image Recoloring Tool v2")
    print("=" * 50)

    # Check original images exist
    if not MILKTEA_IMAGE.exists():
        print(f"ERROR: Milk tea image not found: {MILKTEA_IMAGE}")
        return

    if not FRUITTEA_IMAGE.exists():
        print(f"ERROR: Fruit tea image not found: {FRUITTEA_IMAGE}")
        return

    # Load original images
    milktea_img = Image.open(MILKTEA_IMAGE)
    fruittea_img = Image.open(FRUITTEA_IMAGE)

    print(f"Milk tea image: {milktea_img.size} {milktea_img.mode}")
    print(f"Fruit tea image: {fruittea_img.size} {fruittea_img.mode}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total products: {len(PRODUCTS)}")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = 0
    skipped = 0

    for code, (color, name, source) in PRODUCTS.items():
        output_path = OUTPUT_DIR / f"{code}.jpg"

        # Skip if exists
        if output_path.exists():
            print(f"  [SKIP] {code}.jpg exists")
            skipped += 1
            continue

        # Select source image
        if source == 'milktea':
            source_img = milktea_img
        else:
            source_img = fruittea_img

        print(f"  Processing: {name} ({source}) -> {code}.jpg")
        print(f"    Target color: RGB{color}")

        try:
            # Recolor the drink
            recolored = recolor_drink(source_img, color, source)

            # Save with high quality
            recolored.save(output_path, 'JPEG', quality=92)
            print(f"    [OK] Saved: {output_path.name}")
            success += 1

        except Exception as e:
            print(f"    [ERROR] {e}")
            failed += 1

    print("\n" + "=" * 50)
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
