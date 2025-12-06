'use client';

import { Minus, Plus, Trash2, Edit3 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { formatPriceShort } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove, onEdit }: CartItemProps) {
  // Phân loại options theo type
  const sugar = item.selectedOptions.find(opt => opt.optionId === 'sugar');
  const iceType = item.selectedOptions.find(opt => opt.optionId === 'ice-type');
  const iceLevel = item.selectedOptions.find(opt => opt.optionId === 'ice-level');
  const toppings = item.selectedOptions.filter(opt => opt.optionId === 'topping');

  // Group toppings by name và đếm số lượng
  const toppingGroups = toppings.reduce((acc, topping) => {
    const existing = acc.find(g => g.name === topping.choiceName);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ name: topping.choiceName, quantity: 1, price: topping.priceAdjustment });
    }
    return acc;
  }, [] as Array<{ name: string; quantity: number; price: number }>);

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 leading-tight">{item.product.name}</h4>

          {/* Options - hiển thị chi tiết theo từng loại */}
          {item.selectedOptions.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {/* Đường */}
              {sugar && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-gray-400">•</span>
                  <span>Đường: {sugar.choiceName}</span>
                </div>
              )}

              {/* Đá */}
              {iceType && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-gray-400">•</span>
                  <span>
                    Đá: {iceType.choiceName}
                    {iceLevel && iceType.choiceId === 'ice-type-with' && ` (${iceLevel.choiceName})`}
                  </span>
                </div>
              )}

              {/* Topping */}
              {toppingGroups.length > 0 && (
                <div className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <div className="flex-1">
                    <span className="font-medium">Topping: </span>
                    <span className="text-amber-600">
                      {toppingGroups.map((t, idx) => (
                        <span key={idx}>
                          {t.name}{t.quantity > 1 ? ` x${t.quantity}` : ''}
                          {idx < toppingGroups.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {item.note && (
            <p className="text-xs text-amber-600 mt-1.5 italic flex items-start gap-1">
              <span className="text-gray-400">💬</span>
              <span>"{item.note}"</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(item.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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
