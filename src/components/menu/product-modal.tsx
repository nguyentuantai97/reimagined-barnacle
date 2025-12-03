'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Product, CartItemOption } from '@/types';
import { formatPriceShort } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, options: CartItemOption[], note?: string) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption>>({});
  const [note, setNote] = useState('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNote('');
      // Initialize with first choice of each option
      const initialOptions: Record<string, CartItemOption> = {};
      product.options?.forEach((option) => {
        if (option.choices.length > 0) {
          const choice = option.choices[0];
          initialOptions[option.id] = {
            optionId: option.id,
            optionName: option.name,
            choiceId: choice.id,
            choiceName: choice.name,
            priceAdjustment: choice.priceAdjustment,
          };
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [product]);

  if (!product) return null;

  const handleOptionChange = (
    optionId: string,
    optionName: string,
    choiceId: string,
    choiceName: string,
    priceAdjustment: number
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: { optionId, optionName, choiceId, choiceName, priceAdjustment },
    }));
  };

  const calculateTotal = () => {
    const optionsTotal = Object.values(selectedOptions).reduce(
      (sum, opt) => sum + opt.priceAdjustment,
      0
    );
    return (product.price + optionsTotal) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, Object.values(selectedOptions), note || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Product Image */}
        <div className="relative aspect-video bg-amber-50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
              <span className="text-6xl">🧋</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">{product.name}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
          </DialogHeader>

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4">
              {product.options.map((option) => (
                <div key={option.id}>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    {option.name}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() =>
                          handleOptionChange(
                            option.id,
                            option.name,
                            choice.id,
                            choice.name,
                            choice.priceAdjustment
                          )
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition-colors',
                          selectedOptions[option.id]?.choiceId === choice.id
                            ? 'border-amber-600 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-amber-300'
                        )}
                      >
                        {choice.name}
                        {choice.priceAdjustment > 0 && (
                          <span className="text-amber-600 ml-1">
                            +{formatPriceShort(choice.priceAdjustment)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          {/* Note */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Ghi chú (tuỳ chọn)
            </Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít đá, không đường..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Số lượng</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
            onClick={handleAddToCart}
          >
            Thêm vào giỏ - {formatPriceShort(calculateTotal())}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
