'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, Phone, Home, ChevronDown, Coffee, Milk, IceCream, Cookie, Leaf, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/ui/logo';
import { useCartStore } from '@/stores/cart-store';
import { useMenu } from '@/hooks/use-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Icon mapping for categories
const categoryIcons: Record<string, typeof Coffee> = {
  'tra-trai-cay': Leaf,
  'tra-sua': Milk,
  'latte': Coffee,
  'sua-tuoi': Milk,
  'yaourt': IceCream,
  'topping': Cookie,
  'tang': Gift,
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCartStore();
  const { categories } = useMenu();
  const itemCount = getItemCount();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo size="md" variant="header" className="transition-transform group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {/* Trang chủ */}
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === '/'
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
              )}
            >
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>

            {/* Thực đơn with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <Link
                href="/menu"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === '/menu' || pathname.startsWith('/menu')
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                )}
              >
                <Coffee className="h-4 w-4" />
                <span>Thực đơn</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', menuOpen && 'rotate-180')} />
              </Link>

              {/* Mega Menu Dropdown */}
              <div
                className={cn(
                  'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200',
                  menuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                )}
              >
                <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-6 min-w-[480px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
                    <h3 className="font-semibold text-gray-900">Danh mục sản phẩm</h3>
                    <Link
                      href="/menu"
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Xem tất cả →
                    </Link>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category.slug] || Coffee;
                      return (
                        <Link
                          key={category.id}
                          href={`/menu?category=${category.slug}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                          onClick={() => setMenuOpen(false)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Icon className="h-5 w-5 text-amber-700" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                              {category.name}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Footer CTA */}
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <Link
                      href="/menu"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Coffee className="h-4 w-4" />
                      Khám phá thực đơn
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Phone - Desktop */}
            <a
              href="tel:0976257223"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-sm font-medium"
            >
              <Phone className="h-4 w-4" />
              <span>0976 257 223</span>
            </a>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 rounded-full hover:bg-amber-50"
              onClick={openCart}
            >
              <ShoppingBag className="h-6 w-6 text-gray-700" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center bg-amber-600 text-white text-xs font-semibold border-2 border-white">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-amber-50">
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
                {/* Mobile Header */}
                <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
                  <Logo size="lg" variant="header" />
                  <p className="text-sm text-amber-700 mt-2">Trà sữa & Trà trái cây</p>
                </div>

                {/* Mobile Navigation */}
                <nav className="p-4">
                  {/* Trang chủ */}
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      pathname === '/'
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                    )}
                  >
                    <Home className="h-5 w-5" />
                    Trang chủ
                  </Link>

                  {/* Thực đơn Header */}
                  <div className="mt-4 mb-2">
                    <Link
                      href="/menu"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                        pathname === '/menu'
                          ? 'bg-amber-100 text-amber-800'
                          : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                      )}
                    >
                      <Coffee className="h-5 w-5" />
                      Thực đơn
                    </Link>
                  </div>

                  {/* Categories */}
                  <div className="ml-4 space-y-1 border-l-2 border-amber-200 pl-4">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category.slug] || Coffee;
                      return (
                        <Link
                          key={category.id}
                          href={`/menu?category=${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {category.name}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Mobile Contact */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                  <a
                    href="tel:0976257223"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Gọi ngay: 0976 257 223
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
