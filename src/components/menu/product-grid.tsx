'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from './product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const ITEMS_PER_PAGE = 8; // 2 rows x 4 columns on desktop, 2 rows x 2 columns on mobile

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when products change (e.g., category filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">🧋</span>
        <p className="text-gray-500">Không có sản phẩm nào trong danh mục này</p>
      </div>
    );
  }

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of grid smoothly
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div>
      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {currentProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onProductClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-amber-200 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-lg text-sm font-medium',
                    currentPage === page
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'border-amber-200 hover:bg-amber-50 hover:border-amber-300'
                  )}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2 text-gray-400">
                  {page}
                </span>
              )
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-amber-200 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Trang {currentPage} / {totalPages} ({products.length} sản phẩm)
        </p>
      )}
    </div>
  );
}
