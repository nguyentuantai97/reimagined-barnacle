'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

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

  // Check scroll on mount and resize
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [categories]);

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const allCategories = [
    { id: 'all', slug: 'all', name: 'Tất cả' },
    ...categories,
  ];

  return (
    <div className="relative flex items-center gap-2">
      {/* Left Arrow Button */}
      <button
        onClick={() => scrollBy('left')}
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-all duration-200',
          'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
          showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={checkScrollPosition}
        className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
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

      {/* Right Arrow Button */}
      <button
        onClick={() => scrollBy('right')}
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-all duration-200',
          'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
          showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
