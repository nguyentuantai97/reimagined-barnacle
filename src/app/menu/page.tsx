'use client';

import { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ProductGrid } from '@/components/menu/product-grid';
import { ProductModal } from '@/components/menu/product-modal';
import { useMenu } from '@/hooks/use-menu';
import { Product, CartItemOption } from '@/types';
import { useCartStore } from '@/stores/cart-store';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addItem, openCart } = useCartStore();

  // Use synced menu from CUKCUK
  const { categories, products, isLoading, refetch } = useMenu();

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
  }, [activeCategory, searchQuery]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
            Menu
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Khám phá các món đồ uống thơm ngon của chúng tôi
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white border-amber-200 focus:border-amber-400"
            />
          </div>

          {/* Sync Button */}
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="text-amber-700 hover:text-amber-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Đang cập nhật...' : 'Cập nhật menu'}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Category Tabs */}
        <div className="mb-8 sticky top-16 z-40 bg-gray-50 py-4 -mx-4 px-4">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Products */}
        <ProductGrid
          products={filteredProducts}
          onProductClick={handleProductClick}
        />

        {/* Empty State */}
        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-gray-500">
              Không tìm thấy sản phẩm &quot;{searchQuery}&quot;
            </p>
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
