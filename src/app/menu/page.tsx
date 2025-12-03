'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, RefreshCw, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ProductGrid } from '@/components/menu/product-grid';
import { ProductModal } from '@/components/menu/product-modal';
import { useMenu } from '@/hooks/use-menu';
import { Product, CartItemOption } from '@/types';
import { useCartStore } from '@/stores/cart-store';

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addItem, openCart } = useCartStore();

  // Use synced menu from CUKCUK
  const { categories, products, isLoading, refetch } = useMenu();

  // Sync URL param with state
  useEffect(() => {
    if (categoryParam && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    } else if (!categoryParam && activeCategory !== 'all') {
      setActiveCategory('all');
    }
  }, [categoryParam]);

  // Update URL when category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      router.push('/menu', { scroll: false });
    } else {
      router.push(`/menu?category=${category}`, { scroll: false });
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCategory, searchQuery, products]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    options: CartItemOption[],
    note?: string
  ) => {
    addItem(product, quantity, options, note);
    openCart();
  };

  // Count products per category for display
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    categories.forEach((cat) => {
      counts[cat.slug] = products.filter((p) => p.category === cat.slug).length;
    });
    return counts;
  }, [products, categories]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Title Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                <span>Thực đơn đa dạng</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Thực Đơn
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Khám phá hương vị đặc biệt từ những ly trà sữa thơm ngon, được pha chế tỉ mỉ mỗi ngày
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300" />
                <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-amber-100">
                  <Search className="ml-4 h-5 w-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Tìm món yêu thích của bạn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 h-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
                <span>{products.length} sản phẩm</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{categories.length} danh mục</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <button
                  onClick={refetch}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Category Tabs - Sticky */}
        <div className="sticky top-16 z-40 -mx-4 px-4 py-4 bg-gradient-to-b from-white via-white to-transparent">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            productCounts={productCounts}
          />
        </div>

        {/* Active Category Info */}
        {activeCategory !== 'all' && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {categories.find((c) => c.slug === activeCategory)?.name || 'Danh mục'}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} sản phẩm
            </span>
          </div>
        )}

        {/* Products */}
        <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />

        {/* Empty State */}
        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500 mb-4">
              Không có sản phẩm nào khớp với &quot;{searchQuery}&quot;
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')} className="border-amber-200 text-amber-700 hover:bg-amber-50">
              Xóa tìm kiếm
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            <p className="text-gray-500">Đang tải menu...</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

// Loading fallback for Suspense
function MenuLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-gray-500">Đang tải menu...</p>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuContent />
    </Suspense>
  );
}
