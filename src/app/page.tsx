'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ProductGrid } from '@/components/menu/product-grid';
import { ProductModal } from '@/components/menu/product-modal';
import { useMenu } from '@/hooks/use-menu';
import { Product, CartItemOption } from '@/types';
import { useCartStore } from '@/stores/cart-store';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductCard, setSelectedProductCard] = useState<HTMLElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addItem } = useCartStore();

  // Use synced menu from CUKCUK
  const { categories, products } = useMenu();

  // Lọc ra topping products để truyền cho modal
  const toppingProducts = useMemo(() => {
    return products.filter(p => p.category === 'topping');
  }, [products]);

  const filteredProducts = useMemo(() => {
    return activeCategory === 'all'
      ? products.slice(0, 8) // Show first 8 products on homepage
      : products.filter((p) => p.category === activeCategory).slice(0, 8);
  }, [activeCategory, products]);

  const handleProductClick = (product: Product, cardElement?: HTMLElement) => {
    setSelectedProduct(product);
    setSelectedProductCard(cardElement || null);
    setIsModalOpen(true);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    options: CartItemOption[],
    note?: string
  ) => {
    addItem(product, quantity, options, note);
    // Không tự động mở cart drawer - để khách tiếp tục chọn món khác
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-[#B87333] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center relative z-10">
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/logo_an-removebg-while.png"
                alt="AN Milk Tea & Tea"
                width={200}
                height={200}
                className="mx-auto object-contain drop-shadow-lg"
                priority
              />
              <p className="text-white/80 text-sm tracking-[0.3em] uppercase mt-4">
                Milk Tea & Tea · Since 2025
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Đặt hàng online
              <br />
              <span className="text-[#FDF5ED]">Giao tận nơi</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto">
              Thưởng thức hương vị trà sữa thơm ngon, đậm đà với nguyên liệu tươi mới mỗi ngày
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-[#B87333] hover:bg-[#FDF5ED] h-12 px-8 font-semibold"
              >
                <Link href="/menu">
                  Xem Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 border-white/50 text-white hover:bg-white/10 bg-transparent"
              >
                <a href="tel:0976257223">
                  Gọi đặt hàng: 0976 257 223
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Giao hàng nhanh</h3>
                <p className="text-sm text-muted-foreground">Chỉ 15-30 phút</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Free ship</h3>
                <p className="text-sm text-muted-foreground">Đơn hàng từ 100K</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Mở cửa hàng ngày</h3>
                <p className="text-sm text-muted-foreground">10:00 - 21:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      <section className="py-12 md:py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Menu Nổi Bật
            </h2>
            <p className="text-muted-foreground">
              Những món đồ uống được yêu thích nhất
            </p>
          </div>

          <div className="mb-6">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          <ProductGrid
            products={filteredProducts}
            onProductClick={handleProductClick}
          />

          <div className="text-center mt-8">
            <Button
              asChild
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Link href="/menu">
                Xem tất cả menu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#B87333] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Đặt hàng ngay hôm nay!
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Chọn món yêu thích, đặt hàng online và nhận ngay tại nhà. Nhanh chóng, tiện lợi!
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-[#B87333] hover:bg-[#FDF5ED] h-12 px-8 font-semibold"
          >
            <Link href="/menu">
              Đặt hàng ngay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
        toppingProducts={toppingProducts}
        cardElement={selectedProductCard}
      />
    </div>
  );
}
