'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, Category } from '@/types';

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

// Cache menu data in memory (shared across all hook instances)
let menuCache: MenuData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useMenu(): UseMenuResult {
  // Start with cached data if available, otherwise empty
  const [data, setData] = useState<MenuData>(() => {
    if (menuCache) {
      return menuCache;
    }
    return {
      categories: [],
      products: [],
    };
  });
  const [isLoading, setIsLoading] = useState(!menuCache);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchMenu = async (forceRefresh = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;

    // Check cache first (unless force refresh)
    const now = Date.now();
    if (!forceRefresh && menuCache && now - lastFetchTime < CACHE_DURATION) {
      if (data.products.length === 0) {
        setData(menuCache);
      }
      return;
    }

    fetchingRef.current = true;
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
        // Keep current data if we have it, otherwise show error
        console.warn('Menu API error:', result.error);
        if (menuCache) {
          setData(menuCache);
        }
        setError(result.error || 'Không thể tải menu');
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải menu');
      // Keep current cached data if available
      if (menuCache) {
        setData(menuCache);
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  // Refetch function for manual refresh
  const refetch = async () => {
    await fetchMenu(true); // Force refresh
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
    refetch,
    getProductsByCategory,
    getProductById,
  };
}
