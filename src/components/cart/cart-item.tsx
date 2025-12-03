'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType } from '@/types';
import { formatPriceShort } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
        {item.selectedOptions.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {item.selectedOptions
              .filter((opt) => opt.priceAdjustment > 0 || !opt.choiceName.includes('không'))
              .map((opt) => opt.choiceName)
              .join(', ')}
          </p>
        )}
        {item.note && (
          <p className="text-sm text-amber-600 mt-1">Ghi chú: {item.note}</p>
        )}
        <p className="text-amber-700 font-semibold mt-2">
          {formatPriceShort(item.totalPrice)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-red-500"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
