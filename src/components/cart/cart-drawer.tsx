'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { CartItem } from './cart-item';
import { formatPriceShort } from '@/lib/format';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const deliveryFee = 15000; // Fixed delivery fee for now
  const total = subtotal + deliveryFee;

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Giỏ hàng ({items.length} sản phẩm)
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🧋</span>
            <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống</p>
            <Button asChild onClick={closeCart}>
              <Link href="/menu">Xem menu</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="py-4">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatPriceShort(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí giao hàng</span>
                <span>{formatPriceShort(deliveryFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Tổng cộng</span>
                <span className="text-amber-700">{formatPriceShort(total)}</span>
              </div>

              <Button
                asChild
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12"
                onClick={closeCart}
              >
                <Link href="/checkout" className="flex items-center justify-center gap-2">
                  Đặt hàng
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
