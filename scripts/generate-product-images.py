#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate product images for AN Milk Tea menu using Gemini API.
All drinks should be in a clear plastic cup with AN logo, top view or 3/4 view.
"""

import os
import sys
import time
import io
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed")
    print("Install with: pip install google-genai")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    # Load from skill .env
    skill_env = Path(__file__).parent.parent.parent / '.claude' / 'skills' / 'ai-multimodal' / '.env'
    if skill_env.exists():
        load_dotenv(skill_env)
except ImportError:
    pass

# Product definitions with prompts
PRODUCTS = [
    # === TRÀ SỮA ===
    {
        "code": "tra-sua",
        "name": "Trà Sữa Truyền Thống",
        "color": "creamy light brown milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-tc-trang",
        "name": "Trà Sữa Trân Châu Trắng",
        "color": "creamy light brown milk tea",
        "toppings": "white tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-tc-den",
        "name": "Trà Sữa Trân Châu Đen",
        "color": "creamy brown milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-tc-hoang-kim",
        "name": "Trà Sữa Trân Châu Hoàng Kim",
        "color": "creamy golden brown milk tea",
        "toppings": "golden tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-socola",
        "name": "Trà Sữa Socola",
        "color": "rich chocolate brown milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-cacao",
        "name": "Trà Sữa Cacao",
        "color": "deep cocoa brown milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-full-topping",
        "name": "Trà Sữa Full Topping",
        "color": "creamy brown milk tea",
        "toppings": "layers of black tapioca pearls, white tapioca pearls, and pudding"
    },
    {
        "code": "tra-sua-lai",
        "name": "Trà Sữa Lài",
        "color": "light creamy white-green jasmine milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-sua-lai-vai",
        "name": "Trà Sữa Lài Vải",
        "color": "light creamy white-pink lychee jasmine milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },

    # === TRÀ TRÁI CÂY ===
    {
        "code": "tra-xanh-xoai",
        "name": "Trà Xanh Xoài",
        "color": "vibrant golden-orange mango green tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-xanh-dao",
        "name": "Trà Xanh Đào",
        "color": "soft peachy-pink peach green tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-xanh-vai",
        "name": "Trà Xanh Vải",
        "color": "light pink-white lychee green tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-dao-xoai",
        "name": "Trà Đào Xoài",
        "color": "gradient peach-orange tropical fruit tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-dao-vai",
        "name": "Trà Đào Vải",
        "color": "soft pink peach-lychee fruit tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-vai-xoai",
        "name": "Trà Vải Xoài",
        "color": "gradient light pink to golden lychee-mango tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-sen-vang",
        "name": "Trà Sen Vàng",
        "color": "golden-amber lotus tea",
        "toppings": "ice cubes visible"
    },

    # === TRÀ ĐỒNG GIÁ 12K ===
    {
        "code": "tra-xanh",
        "name": "Trà Xanh",
        "color": "light green matcha green tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-xanh-chanh",
        "name": "Trà Xanh Chanh",
        "color": "light yellow-green lemon green tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-tac",
        "name": "Trà Tắc",
        "color": "bright orange kumquat tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-dao",
        "name": "Trà Đào",
        "color": "soft peachy-pink peach tea",
        "toppings": "ice cubes visible"
    },

    # === TRÀ BÍ ĐAO ===
    {
        "code": "tra-bi-dao",
        "name": "Trà Bí Đao",
        "color": "light golden-yellow winter melon tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-xanh-bi-dao",
        "name": "Trà Xanh Bí Đao",
        "color": "light greenish-yellow winter melon green tea",
        "toppings": "ice cubes visible"
    },

    # === LATTE ===
    {
        "code": "latte-matcha",
        "name": "Latte Matcha",
        "color": "vibrant green matcha latte with white milk layer",
        "toppings": "cream foam on top"
    },
    {
        "code": "latte-socola",
        "name": "Latte Socola",
        "color": "rich chocolate brown latte with white milk layer",
        "toppings": "cream foam on top"
    },
    {
        "code": "latte-khoai-mon",
        "name": "Latte Khoai Môn",
        "color": "purple taro latte with white milk layer",
        "toppings": "cream foam on top"
    },
    {
        "code": "latte-cacao",
        "name": "Latte Cacao",
        "color": "deep cocoa brown latte with white milk layer",
        "toppings": "cream foam on top"
    },

    # === SỮA TƯƠI ===
    {
        "code": "sua-tuoi-matcha",
        "name": "Sữa Tươi Matcha",
        "color": "bright green matcha fresh milk",
        "toppings": "none, smooth surface"
    },
    {
        "code": "sua-tuoi-socola",
        "name": "Sữa Tươi Socola",
        "color": "rich chocolate fresh milk",
        "toppings": "none, smooth surface"
    },
    {
        "code": "sua-tuoi-khoai-mon",
        "name": "Sữa Tươi Khoai Môn",
        "color": "light purple taro fresh milk",
        "toppings": "none, smooth surface"
    },
    {
        "code": "sua-tuoi-duong-den",
        "name": "Sữa Tươi Đường Đen",
        "color": "white fresh milk with dark brown sugar swirls",
        "toppings": "tiger stripes pattern from brown sugar"
    },
    {
        "code": "sua-tuoi-tran-chau",
        "name": "Sữa Tươi Trân Châu",
        "color": "pure white fresh milk",
        "toppings": "black tapioca pearls at the bottom"
    },

    # === YAOURT ===
    {
        "code": "yaourt-da",
        "name": "Yaourt Đá",
        "color": "creamy white yogurt drink",
        "toppings": "crushed ice visible"
    },
    {
        "code": "yaourt-dau",
        "name": "Yaourt Dâu",
        "color": "pink strawberry yogurt drink",
        "toppings": "crushed ice visible"
    },
    {
        "code": "yaourt-viet-quat",
        "name": "Yaourt Việt Quất",
        "color": "deep purple blueberry yogurt drink",
        "toppings": "crushed ice visible"
    },
    {
        "code": "yaourt-tc-duong-den",
        "name": "Yaourt Trân Châu Đường Đen",
        "color": "creamy white yogurt with brown sugar swirls",
        "toppings": "black tapioca pearls at the bottom"
    },
]

# Default category images
CATEGORY_DEFAULTS = [
    {
        "code": "tra-sua-default",
        "name": "Trà Sữa (Default)",
        "color": "creamy brown milk tea",
        "toppings": "black tapioca pearls at the bottom"
    },
    {
        "code": "tra-trai-cay-default",
        "name": "Trà Trái Cây (Default)",
        "color": "colorful tropical fruit tea with orange and pink gradient",
        "toppings": "ice cubes visible"
    },
    {
        "code": "latte-default",
        "name": "Latte (Default)",
        "color": "creamy coffee latte with milk layer",
        "toppings": "cream foam on top"
    },
    {
        "code": "sua-tuoi-default",
        "name": "Sữa Tươi (Default)",
        "color": "pure white fresh milk",
        "toppings": "none, smooth surface"
    },
    {
        "code": "yaourt-default",
        "name": "Yaourt (Default)",
        "color": "creamy white yogurt drink",
        "toppings": "crushed ice visible"
    },
    {
        "code": "tra-12k-default",
        "name": "Trà Đồng Giá 12K (Default)",
        "color": "light refreshing tea",
        "toppings": "ice cubes visible"
    },
    {
        "code": "tra-bi-dao-default",
        "name": "Trà Bí Đao (Default)",
        "color": "light golden winter melon tea",
        "toppings": "ice cubes visible"
    },
]


def generate_prompt(product: dict) -> str:
    """Generate the image prompt for a product."""
    return f"""Create a professional product photo of a Vietnamese bubble tea drink.

DRINK DETAILS:
- Name: {product['name']}
- Color/Appearance: {product['color']}
- Toppings: {product['toppings']}

REQUIREMENTS:
- Clear plastic cup with dome lid, branded with "AN" logo
- 3/4 angle view, slightly from above
- Clean white or light gradient background
- Professional studio lighting
- The drink should look refreshing and appetizing
- No fresh fruit pieces visible (drinks made from syrup)
- Photorealistic food photography style
- High resolution, commercial quality

STYLE: Modern Asian bubble tea shop product photography, Instagram-worthy, clean and minimal aesthetic."""


def generate_image(client: genai.Client, prompt: str, output_path: Path, verbose: bool = True) -> bool:
    """Generate a single image using Gemini Imagen 3."""
    try:
        if verbose:
            print(f"  Generating: {output_path.name}...")

        # Use Imagen 3 for image generation
        response = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio='1:1',
                safety_filter_level='BLOCK_MEDIUM_AND_ABOVE'
            )
        )

        # Extract and save image from Imagen response
        if hasattr(response, 'generated_images') and response.generated_images:
            image = response.generated_images[0]
            if hasattr(image, 'image') and hasattr(image.image, 'image_bytes'):
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'wb') as f:
                    f.write(image.image.image_bytes)
                if verbose:
                    print(f"  [OK] Saved: {output_path}")
                return True

        if verbose:
            print(f"  [FAIL] No image in response")
        return False

    except Exception as e:
        if verbose:
            print(f"  [ERROR] {e}")
        return False


def main():
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: GEMINI_API_KEY not found")
        print("Set the environment variable or create .env file")
        sys.exit(1)

    # Output directory
    output_dir = Path(__file__).parent.parent / 'public' / 'images' / 'products'
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Output directory: {output_dir}")
    print(f"Total products: {len(PRODUCTS)}")
    print(f"Category defaults: {len(CATEGORY_DEFAULTS)}")
    print("=" * 50)

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Track results
    success = 0
    failed = 0

    # Generate category defaults first
    print("\n[CATEGORIES] Generating category default images...")
    for product in CATEGORY_DEFAULTS:
        output_path = output_dir / f"{product['code']}.jpg"
        if output_path.exists():
            print(f"  [SKIP] Exists: {product['code']}")
            continue

        prompt = generate_prompt(product)
        if generate_image(client, prompt, output_path):
            success += 1
        else:
            failed += 1

        # Rate limiting
        time.sleep(2)

    # Generate product images
    print("\n[PRODUCTS] Generating product images...")
    for i, product in enumerate(PRODUCTS, 1):
        print(f"\n[{i}/{len(PRODUCTS)}] {product['name']}")

        output_path = output_dir / f"{product['code']}.jpg"
        if output_path.exists():
            print(f"  [SKIP] Exists: {product['code']}")
            continue

        prompt = generate_prompt(product)
        if generate_image(client, prompt, output_path):
            success += 1
        else:
            failed += 1

        # Rate limiting - avoid API throttling
        time.sleep(2)

    # Summary
    print("\n" + "=" * 50)
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Output: {output_dir}")


if __name__ == '__main__':
    main()
