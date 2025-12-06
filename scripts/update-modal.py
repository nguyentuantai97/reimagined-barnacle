#!/usr/bin/env python3
# -*- coding: utf-8 -*-

content = '''\'use client\';

import { useState, useEffect } from \'react\';
import Image from \'next/image\';
import { Minus, Plus, ShoppingCart, ImageIcon } from \'lucide-react\';
import { Dialog, DialogContent } from \'@/components/ui/dialog\';
import { Button } from \'@/components/ui/button\';
import { Product, CartItemOption } from \'@/types\';
import { formatPriceShort } from \'@/lib/format\';
import { cn } from \'@/lib/utils\';
import { getProductImage } from \'@/lib/data/product-images\';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, options: CartItemOption[], note?: string) => void;
}

// Default options nếu sản phẩm không có
const defaultSugarOptions = {
  id: \'sugar\',
  name: \'Ngọt\',
  choices: [
    { id: \'sugar-30\', name: \'30%\', priceAdjustment: 0 },
    { id: \'sugar-50\', name: \'50%\', priceAdjustment: 0 },
    { id: \'sugar-70\', name: \'70%\', priceAdjustment: 0 },
    { id: \'sugar-100\', name: \'100%\', priceAdjustment: 0 },
  ],
};

const defaultIceOptions = {
  id: \'ice\',
  name: \'Đá\',
  choices: [
    { id: \'ice-30\', name: \'30%\', priceAdjustment: 0 },
    { id: \'ice-50\', name: \'50%\', priceAdjustment: 0 },
    { id: \'ice-70\', name: \'70%\', priceAdjustment: 0 },
    { id: \'ice-100\', name: \'100%\', priceAdjustment: 0 },
  ],
};

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption>>({});
  const [note, setNote] = useState(\'\');

  const getProductOptions = () => {
    if (!product) return [];
    const options = [];
    const hasSugar = product.options?.some(opt => opt.id === \'sugar\');
    if (hasSugar) {
      const sugarOpt = product.options?.find(opt => opt.id === \'sugar\');
      if (sugarOpt) options.push(sugarOpt);
    } else {
      options.push(defaultSugarOptions);
    }
    const hasIce = product.options?.some(opt => opt.id === \'ice\');
    if (hasIce) {
      const iceOpt = product.options?.find(opt => opt.id === \'ice\');
      if (iceOpt) options.push(iceOpt);
    } else {
      options.push(defaultIceOptions);
    }
    const toppingOpt = product.options?.find(opt => opt.id === \'topping\');
    if (toppingOpt) {
      options.push(toppingOpt);
    }
    return options;
  };

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNote(\'\');
      const options = getProductOptions();
      const initialOptions: Record<string, CartItemOption> = {};
      options.forEach((option) => {
        if (option.choices.length > 0) {
          let defaultChoice = option.choices[option.choices.length - 1];
          initialOptions[option.id] = {
            optionId: option.id,
            optionName: option.name,
            choiceId: defaultChoice.id,
            choiceName: defaultChoice.name,
            priceAdjustment: defaultChoice.priceAdjustment,
          };
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [product]);

  if (!product) return null;

  const imageUrl = product.image || getProductImage(product.id, product.category);
  const hasImage = Boolean(imageUrl);
  const productOptions = getProductOptions();

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-2/5 aspect-square md:aspect-auto md:min-h-[400px] bg-amber-50 shrink-0">
            {hasImage ? (
              <>
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white text-[8px] rounded-full backdrop-blur-sm">
                  <ImageIcon className="h-2 w-2" />
                  <span>Hình ảnh mang tính chất minh họa</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                <span className="text-7xl">🧋</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-amber-700">{product.name}</h2>
              {product.description && (
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-amber-600">
                  {formatPriceShort(product.price)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-amber-600 hover:bg-amber-700"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-amber-600 hover:bg-amber-700"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {productOptions.map((option) => (
                <div key={option.id}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">{option.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map((choice) => {
                      const isSelected = selectedOptions[option.id]?.choiceId === choice.id;
                      return (
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
                            \'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all\',
                            isSelected
                              ? \'border-amber-600 bg-amber-600 text-white\'
                              : \'border-gray-200 bg-white text-gray-700 hover:border-amber-300\'
                          )}
                        >
                          {choice.name}
                          {choice.priceAdjustment > 0 && (
                            <span className={cn(\'ml-1\', isSelected ? \'text-amber-100\' : \'text-amber-600\')}>
                              +{formatPriceShort(choice.priceAdjustment)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Ghi chú</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Yêu cầu đặc biệt..."
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-amber-500"
                rows={2}
              />
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 p-4 bg-white border-t">
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base font-semibold rounded-xl"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Thêm vào giỏ hàng : {formatPriceShort(calculateTotal())}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'''

from pathlib import Path
output_path = Path(__file__).parent.parent / 'src' / 'components' / 'menu' / 'product-modal.tsx'
output_path.write_text(content, encoding='utf-8')
print(f"Written to {output_path}")
