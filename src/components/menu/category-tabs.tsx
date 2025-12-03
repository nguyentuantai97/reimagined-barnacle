'use client';

import { useRef, useEffect } from 'react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categorySlug: string) => void;
  productCounts?: Record<string, number>;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  productCounts,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll to active button when category changes
  useEffect(() => {
    if (activeButtonRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeButtonRef.current;
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;

      // Center the active button
      const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const allCategories = [
    { id: 'all', slug: 'all', name: 'Tất cả' },
    ...categories,
  ];

  return (
    <div className="relative">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-2 -mx-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCategories.map((category) => {
          const isActive = activeCategory === category.slug;
          const count = productCounts?.[category.slug];

          return (
            <button
              key={category.id}
              ref={isActive ? activeButtonRef : null}
              onClick={() => onCategoryChange(category.slug)}
              className={cn(
                'relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300 hover:bg-amber-50'
              )}
            >
              <span className="relative z-10">{category.name}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 text-xs',
                    isActive ? 'text-amber-100' : 'text-gray-400'
                  )}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
