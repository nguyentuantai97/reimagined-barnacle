'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { CartItem } from './cart-item';
import { ProductModal } from '@/components/menu/product-modal';
import { formatPriceShort } from '@/lib/format';
import { useMenu } from '@/hooks/use-menu';
import { Product, CartItemOption } from '@/types';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal, updateItem } = useCartStore();
  const subtotal = getSubtotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { products } = useMenu();

  // Lọc ra topping products
  const toppingProducts = useMemo(() => {
    return products.filter(p => p.category === 'topping');
  }, [products]);

  // Tìm item đang edit
  const editingItem = items.find(item => item.id === editingItemId);

  const handleEditItem = (itemId: string) => {
    setEditingItemId(itemId);
  };

  const handleUpdateItem = (
    product: Product,
    quantity: number,
    options: CartItemOption[],
    note?: string
  ) => {
    if (editingItemId) {
      updateItem(editingItemId, quantity, options, note);
      setEditingItemId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header - SheetContent has built-in close button at top-right */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Giỏ hàng</h2>
            <p className="text-sm text-gray-500">{itemCount} sản phẩm</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <span className="text-5xl">🧋</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Giỏ hàng trống</h3>
            <p className="text-sm text-gray-500 mb-6">Hãy thêm món ngon vào giỏ hàng nhé!</p>
            <Button asChild onClick={closeCart} className="bg-amber-600 hover:bg-amber-700">
              <Link href="/menu">Khám phá menu</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items - với overflow scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-3">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    onEdit={handleEditItem}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-white px-6 py-4 space-y-4 shrink-0">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính ({itemCount} món)</span>
                  <span className="font-medium">{formatPriceShort(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí giao hàng</span>
                  <span className="text-amber-600 font-medium">Tính khi đặt hàng</span>
                </div>
              </div>

              {/* Total & CTA */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Tổng cộng</p>
                  <p className="text-xl font-bold text-amber-700">{formatPriceShort(subtotal)}</p>
                </div>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 px-6 rounded-xl shadow-lg shadow-amber-200/50"
                  onClick={closeCart}
                >
                  <Link href="/checkout" className="flex items-center gap-2">
                    Đặt hàng
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      {/* Edit Modal */}
      {editingItem && (
        <ProductModal
          product={editingItem.product}
          isOpen={!!editingItemId}
          onClose={() => setEditingItemId(null)}
          onAddToCart={handleUpdateItem}
          toppingProducts={toppingProducts}
          initialQuantity={editingItem.quantity}
          initialOptions={editingItem.selectedOptions}
          initialNote={editingItem.note}
          isEditing={true}
        />
      )}
    </Sheet>
  );
}
