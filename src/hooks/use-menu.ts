'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import {
  products as staticProducts,
  categories as staticCategories,
} from '@/lib/data/menu';

interface MenuData {
  categories: Category[];
  products: Product[];
  lastSynced?: string;
}

interface UseMenuResult {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getProductsByCategory: (categorySlug: string) => Product[];
  getProductById: (id: string) => Product | undefined;
}

// Cache menu data in memory
let menuCache: MenuData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useMenu(): UseMenuResult {
  const [data, setData] = useState<MenuData>({
    categories: staticCategories,
    products: staticProducts,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = async () => {
    // Check cache first
    const now = Date.now();
    if (menuCache && now - lastFetchTime < CACHE_DURATION) {
      setData(menuCache);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/menu');
      const result = await response.json();

      if (result.success && result.data) {
        const newData: MenuData = {
          categories: result.data.categories,
          products: result.data.products,
          lastSynced: result.data.lastSynced,
        };

        // Update cache
        menuCache = newData;
        lastFetchTime = now;

        setData(newData);
      } else {
        // Fall back to static data on error
        console.warn('Using static menu data:', result.error);
        setData({
          categories: staticCategories,
          products: staticProducts,
        });
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu');
      // Fall back to static data
      setData({
        categories: staticCategories,
        products: staticProducts,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const getProductsByCategory = (categorySlug: string): Product[] => {
    return data.products.filter((p) => p.category === categorySlug);
  };

  const getProductById = (id: string): Product | undefined => {
    return data.products.find((p) => p.id === id || p.cukcukId === id);
  };

  return {
    categories: data.categories,
    products: data.products,
    isLoading,
    error,
    refetch: fetchMenu,
    getProductsByCategory,
    getProductById,
  };
}
