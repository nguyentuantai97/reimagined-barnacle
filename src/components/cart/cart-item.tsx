'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { formatPriceShort } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 leading-tight">{item.product.name}</h4>
          {item.selectedOptions.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {item.selectedOptions
                .filter((opt) => opt.priceAdjustment > 0 || !opt.choiceName.includes('không'))
                .map((opt) => opt.choiceName)
                .join(', ')}
            </p>
          )}
          {item.note && (
            <p className="text-xs text-amber-600 mt-1 italic">"{item.note}"</p>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Price & Quantity Row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <p className="text-amber-700 font-semibold">
          {formatPriceShort(item.totalPrice)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-amber-300 hover:text-amber-600 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-amber-300 hover:text-amber-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
