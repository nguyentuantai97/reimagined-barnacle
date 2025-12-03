'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/ui/logo';
import { useCartStore } from '@/stores/cart-store';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/menu', label: 'Menu' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCartStore();
  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" variant="header" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Phone - Desktop */}
            <a
              href="tel:0976257223"
              className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              <span>0976 257 223</span>
            </a>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                {/* Mobile Logo */}
                <div className="mb-8">
                  <Logo size="lg" variant="header" />
                </div>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-primary py-2 border-b border-border"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <a
                    href="tel:0976257223"
                    className="flex items-center gap-2 text-lg text-foreground hover:text-primary py-2"
                  >
                    <Phone className="h-5 w-5" />
                    0976 257 223
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
