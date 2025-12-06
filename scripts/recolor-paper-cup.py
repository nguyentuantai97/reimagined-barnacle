#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recolor paper cup images for AN Milk Tea menu.
Uses paper-cup-an.jpg as the base template.
Changes the cup color (brown) to different colors for each product.
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
    from PIL import Image
    import colorsys
except ImportError:
    print("Error: Pillow not installed")
    print("Install with: pip install Pillow")
    sys.exit(1)

# Directories
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'images' / 'products'
IMAGES_DIR = Path(__file__).parent.parent / 'public' / 'images'

# Paper cup template
PAPER_CUP_IMAGE = IMAGES_DIR / 'paper-cup-an.jpg'

# Original cup color (brown/tan from the image)
# This is the color we'll be replacing
ORIGINAL_CUP_HUE_MIN = 0.02  # Orange-brown range
ORIGINAL_CUP_HUE_MAX = 0.12

# Product definitions with target cup colors
# Format: 'code': ((R, G, B), 'Name')
PRODUCTS = {
    # === TRA SUA (Milk Tea - brown/tan cups) ===
    'tra-sua': ((180, 130, 90), 'Tra Sua'),
    'tra-sua-default': ((180, 130, 90), 'Tra Sua Default'),
    'tra-sua-tc-trang': ((190, 145, 105), 'Tra Sua TC Trang'),
    'tra-sua-tc-den': ((160, 110, 75), 'Tra Sua TC Den'),
    'tra-sua-tc-hoang-kim': ((200, 160, 80), 'Tra Sua TC Hoang Kim'),
    'tra-sua-socola': ((120, 80, 50), 'Tra Sua Socola'),
    'tra-sua-cacao': ((100, 70, 45), 'Tra Sua Cacao'),
    'tra-sua-full-topping': ((175, 125, 85), 'Tra Sua Full Topping'),
    'tra-sua-lai': ((200, 180, 150), 'Tra Sua Lai'),
    'tra-sua-lai-vai': ((210, 170, 160), 'Tra Sua Lai Vai'),

    # === TRA TRAI CAY (Fruit Tea - orange/yellow/pink cups) ===
    'tra-trai-cay-default': ((255, 150, 80), 'Tra Trai Cay Default'),
    'tra-xanh-xoai': ((255, 180, 50), 'Tra Xanh Xoai'),
    'tra-xanh-dao': ((255, 160, 120), 'Tra Xanh Dao'),
    'tra-xanh-vai': ((255, 180, 190), 'Tra Xanh Vai'),
    'tra-dao-xoai': ((255, 140, 70), 'Tra Dao Xoai'),
    'tra-dao-vai': ((255, 170, 150), 'Tra Dao Vai'),
    'tra-vai-xoai': ((255, 190, 120), 'Tra Vai Xoai'),
    'tra-sen-vang': ((240, 180, 80), 'Tra Sen Vang'),
    'tra-xoai-macchiato': ((255, 180, 50), 'Tra Xoai Macchiato'),

    # === TRA DONG GIA 12K (green/yellow cups) ===
    'tra-12k-default': ((150, 180, 100), 'Tra 12K Default'),
    'tra-xanh': ((130, 170, 90), 'Tra Xanh'),
    'tra-xanh-chanh': ((170, 190, 70), 'Tra Xanh Chanh'),
    'tra-tac': ((255, 160, 50), 'Tra Tac'),
    'tra-dao': ((255, 160, 120), 'Tra Dao'),

    # === TRA BI DAO (light yellow/green cups) ===
    'tra-bi-dao-default': ((210, 200, 130), 'Tra Bi Dao Default'),
    'tra-bi-dao': ((210, 200, 130), 'Tra Bi Dao'),
    'tra-xanh-bi-dao': ((170, 190, 110), 'Tra Xanh Bi Dao'),

    # === LATTE (creamy/pastel cups) ===
    'latte-default': ((180, 150, 120), 'Latte Default'),
    'latte-matcha': ((120, 170, 100), 'Latte Matcha'),
    'latte-socola': ((100, 70, 50), 'Latte Socola'),
    'latte-khoai-mon': ((170, 130, 170), 'Latte Khoai Mon'),
    'latte-cacao': ((90, 60, 40), 'Latte Cacao'),

    # === SUA TUOI (white/cream cups) ===
    'sua-tuoi-default': ((240, 235, 230), 'Sua Tuoi Default'),
    'sua-tuoi-matcha': ((140, 190, 120), 'Sua Tuoi Matcha'),
    'sua-tuoi-socola': ((130, 90, 60), 'Sua Tuoi Socola'),
    'sua-tuoi-khoai-mon': ((190, 160, 190), 'Sua Tuoi Khoai Mon'),
    'sua-tuoi-duong-den': ((220, 200, 180), 'Sua Tuoi Duong Den'),
    'sua-tuoi-tran-chau': ((245, 240, 235), 'Sua Tuoi Tran Chau'),

    # === YAOURT (white/pink/purple cups) ===
    'yaourt-default': ((245, 240, 235), 'Yaourt Default'),
    'yaourt-da': ((240, 238, 235), 'Yaourt Da'),
    'yaourt-dau': ((255, 180, 190), 'Yaourt Dau'),
    'yaourt-viet-quat': ((140, 100, 160), 'Yaourt Viet Quat'),
    'yaourt-tc-duong-den': ((235, 225, 215), 'Yaourt TC Duong Den'),
}


def rgb_to_hls(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """Convert RGB to HLS."""
    return colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)


def hls_to_rgb(h: float, l: float, s: float) -> Tuple[int, int, int]:
    """Convert HLS to RGB."""
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return int(r * 255), int(g * 255), int(b * 255)


def is_cup_pixel(r: int, g: int, b: int) -> bool:
    """
    Check if a pixel is part of the cup (brown/tan color).
    """
    h, l, s = rgb_to_hls(r, g, b)

    # Cup is brown/tan color
    is_cup_hue = ORIGINAL_CUP_HUE_MIN <= h <= ORIGINAL_CUP_HUE_MAX
    has_saturation = s > 0.15
    not_too_dark = l > 0.20
    not_too_light = l < 0.85

    return is_cup_hue and has_saturation and not_too_dark and not_too_light


def recolor_cup(image: Image.Image, target_rgb: Tuple[int, int, int]) -> Image.Image:
    """
    Recolor the cup to the target color.
    Preserves the logo, lid, and lighting.
    """
    # Convert to RGB if necessary
    if image.mode == 'RGBA':
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

            # Check if this pixel is part of the cup
            if is_cup_pixel(r, g, b):
                # Get original color properties
                orig_h, orig_l, orig_s = rgb_to_hls(r, g, b)

                # Apply target hue while preserving original lighting
                new_h = target_h

                # Preserve lightness variations for 3D effect
                new_l = orig_l * 0.5 + target_l * 0.5
                new_s = orig_s * 0.3 + target_s * 0.7

                # Clamp values
                new_l = max(0.15, min(0.90, new_l))
                new_s = max(0.15, min(0.90, new_s))

                # Convert back to RGB
                new_r, new_g, new_b = hls_to_rgb(new_h, new_l, new_s)
                pixels[x, y] = (new_r, new_g, new_b)

    return result


def main():
    print("AN Milk Tea - Paper Cup Recoloring Tool")
    print("=" * 50)

    # Check paper cup image exists
    if not PAPER_CUP_IMAGE.exists():
        print(f"ERROR: Paper cup image not found: {PAPER_CUP_IMAGE}")
        return

    # Load paper cup image
    cup_img = Image.open(PAPER_CUP_IMAGE)
    print(f"Paper cup image: {cup_img.size} {cup_img.mode}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total products: {len(PRODUCTS)}")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clear existing product images first
    print("\n[CLEANUP] Removing old product images...")
    removed = 0
    for code in PRODUCTS.keys():
        old_path = OUTPUT_DIR / f"{code}.jpg"
        if old_path.exists():
            old_path.unlink()
            removed += 1
    print(f"  Removed {removed} old images")

    success = 0
    failed = 0

    print("\n[GENERATING] Creating new product images...")
    for code, (color, name) in PRODUCTS.items():
        output_path = OUTPUT_DIR / f"{code}.jpg"

        print(f"  Processing: {name} -> {code}.jpg")
        print(f"    Target color: RGB{color}")

        try:
            # Recolor the cup
            recolored = recolor_cup(cup_img, color)

            # Resize to 600x600 for consistency
            recolored = recolored.resize((600, 600), Image.Resampling.LANCZOS)

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
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
