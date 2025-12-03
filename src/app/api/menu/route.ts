import { NextResponse } from 'next/server';
import { fetchCukcukMenu, isCukcukConfigured } from '@/lib/cukcuk/client';
import { CukcukInventoryItem, CukcukInventoryCategory } from '@/lib/cukcuk/types';
import { Product, Category, ProductOption } from '@/types';
import { sugarOptions, iceOptions, sizeOptions, toppingOptions } from '@/lib/data/menu';

// Helper to create slug from Vietnamese text
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Map CUKCUK category to default options
function getDefaultOptionsForCategory(categoryName: string): ProductOption[] {
  const name = categoryName.toLowerCase();

  if (name.includes('trà sữa') || name.includes('milk tea')) {
    return [sizeOptions, sugarOptions, iceOptions, toppingOptions];
  }
  if (name.includes('trà') || name.includes('tea')) {
    return [sizeOptions, sugarOptions, iceOptions];
  }
  if (name.includes('cà phê') || name.includes('coffee')) {
    return [sizeOptions, iceOptions];
  }
  if (name.includes('nước ép') || name.includes('sinh tố') || name.includes('juice')) {
    return [sizeOptions, sugarOptions];
  }

  // Default options
  return [sizeOptions, sugarOptions, iceOptions];
}

// Transform CUKCUK inventory item to Product
function transformToProduct(
  item: CukcukInventoryItem,
  categorySlug: string,
  categoryName: string
): Product {
  return {
    id: item.Code || item.Id,
    cukcukId: item.Id,
    cukcukCode: item.Code,
    cukcukItemType: item.ItemType,
    cukcukUnitId: item.UnitID,
    cukcukUnitName: item.UnitName,
    name: item.Name,
    description: item.Description || '',
    price: item.Price,
    image: '', // CUKCUK API doesn't return images in list endpoint
    category: categorySlug,
    isAvailable: !item.Inactive,
    options: getDefaultOptionsForCategory(categoryName),
  };
}

// Transform CUKCUK category to Category
function transformToCategory(cat: CukcukInventoryCategory): Category {
  return {
    id: cat.Id,
    name: cat.Name,
    slug: createSlug(cat.Name),
  };
}

export async function GET() {
  if (!isCukcukConfigured()) {
    return NextResponse.json(
      { success: false, error: 'CUKCUK not configured' },
      { status: 500 }
    );
  }

  try {
    const result = await fetchCukcukMenu();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Transform categories
    const categories: Category[] = (result.categories || []).map(transformToCategory);

    // Create category lookup map
    const categoryMap = new Map<string, { slug: string; name: string }>();
    (result.categories || []).forEach((cat) => {
      categoryMap.set(cat.Id, {
        slug: createSlug(cat.Name),
        name: cat.Name,
      });
    });

    // Transform products
    const products: Product[] = (result.items || []).map((item) => {
      // CUKCUK API returns CategoryID (uppercase D)
      const catInfo = categoryMap.get(item.CategoryID || '') || {
        slug: 'khac',
        name: 'Khác',
      };
      return transformToProduct(item, catInfo.slug, catInfo.name);
    });

    return NextResponse.json({
      success: true,
      data: {
        categories,
        products,
        lastSynced: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Menu sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync menu from CUKCUK' },
      { status: 500 }
    );
  }
}
