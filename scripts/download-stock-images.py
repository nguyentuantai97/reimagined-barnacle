#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download stock images for AN Milk Tea menu from Unsplash.
Using free stock photos that match bubble tea aesthetic.
"""

import os
import sys
import io
import time
import urllib.request
import ssl
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'images' / 'products'

# Unsplash image URLs for bubble tea related images
# Using direct links from unsplash with size parameters
STOCK_IMAGES = {
    # Category defaults - use high quality bubble tea images
    'tra-sua-default': 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=600&fit=crop',
    'tra-trai-cay-default': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    'latte-default': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop',
    'sua-tuoi-default': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&h=600&fit=crop',
    'yaourt-default': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop',
    'tra-12k-default': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&h=600&fit=crop',
    'tra-bi-dao-default': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop',

    # Tra Sua variations
    'tra-sua': 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=600&fit=crop',
    'tra-sua-tc-trang': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&h=600&fit=crop',
    'tra-sua-tc-den': 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=600&fit=crop',
    'tra-sua-tc-hoang-kim': 'https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=600&h=600&fit=crop',
    'tra-sua-socola': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=600&fit=crop',
    'tra-sua-cacao': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop',
    'tra-sua-full-topping': 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=600&fit=crop',
    'tra-sua-lai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&h=600&fit=crop',
    'tra-sua-lai-vai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&h=600&fit=crop',

    # Tra Trai Cay
    'tra-xanh-xoai': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    'tra-xanh-dao': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=600&fit=crop',
    'tra-xanh-vai': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    'tra-dao-xoai': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=600&fit=crop',
    'tra-dao-vai': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=600&fit=crop',
    'tra-vai-xoai': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    'tra-sen-vang': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&h=600&fit=crop',

    # Tra Dong Gia 12K
    'tra-xanh': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop',
    'tra-xanh-chanh': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&h=600&fit=crop',
    'tra-tac': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&h=600&fit=crop',
    'tra-dao': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=600&fit=crop',

    # Tra Bi Dao
    'tra-bi-dao': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop',
    'tra-xanh-bi-dao': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop',

    # Latte
    'latte-matcha': 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&h=600&fit=crop',
    'latte-socola': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop',
    'latte-khoai-mon': 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600&h=600&fit=crop',
    'latte-cacao': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop',

    # Sua Tuoi
    'sua-tuoi-matcha': 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&h=600&fit=crop',
    'sua-tuoi-socola': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=600&fit=crop',
    'sua-tuoi-khoai-mon': 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600&h=600&fit=crop',
    'sua-tuoi-duong-den': 'https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=600&h=600&fit=crop',
    'sua-tuoi-tran-chau': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&h=600&fit=crop',

    # Yaourt
    'yaourt-da': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop',
    'yaourt-dau': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=600&fit=crop',
    'yaourt-viet-quat': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=600&fit=crop',
    'yaourt-tc-duong-den': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop',
}


def download_image(url: str, output_path: Path) -> bool:
    """Download image from URL."""
    try:
        # Create SSL context that doesn't verify certificates (for development)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        req = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            data = response.read()

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(data)

            return True

    except Exception as e:
        print(f"  [ERROR] {e}")
        return False


def main():
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total images: {len(STOCK_IMAGES)}")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = 0
    skipped = 0

    for name, url in STOCK_IMAGES.items():
        output_path = OUTPUT_DIR / f"{name}.jpg"

        if output_path.exists():
            print(f"  [SKIP] {name}.jpg exists")
            skipped += 1
            continue

        print(f"  Downloading: {name}.jpg...")

        if download_image(url, output_path):
            print(f"  [OK] {name}.jpg")
            success += 1
        else:
            failed += 1

        # Small delay between requests
        time.sleep(0.5)

    print("\n" + "=" * 50)
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
