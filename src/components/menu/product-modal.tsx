'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product, CartItemOption } from '@/types';
import { formatPriceShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getProductImage } from '@/lib/data/product-images';
import { FlyingCartIcon } from '@/components/animations/flying-cart-icon';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, options: CartItemOption[], note?: string) => void;
  toppingProducts?: Product[]; // Danh sách topping từ CUKCUK
  initialQuantity?: number;
  initialOptions?: CartItemOption[];
  initialNote?: string;
  isEditing?: boolean;
  cardElement?: HTMLElement | null; // Product card element for animation
}

// Default options nếu sản phẩm không có
const defaultSugarOptions = {
  id: 'sugar',
  name: 'Ngọt',
  choices: [
    { id: 'sugar-30', name: '30%', priceAdjustment: 0 },
    { id: 'sugar-50', name: '50%', priceAdjustment: 0 },
    { id: 'sugar-70', name: '70%', priceAdjustment: 0 },
    { id: 'sugar-100', name: '100%', priceAdjustment: 0 },
  ],
};

// Ice type options: Đá riêng, Không đá, Có đá
const defaultIceTypeOptions = {
  id: 'ice-type',
  name: 'Đá',
  choices: [
    { id: 'ice-type-separate', name: 'Đá riêng', priceAdjustment: 0 },
    { id: 'ice-type-none', name: 'Không đá', priceAdjustment: 0 },
    { id: 'ice-type-with', name: 'Có đá', priceAdjustment: 0 },
  ],
};

// Ice level options: chỉ hiện khi chọn "Có đá"
const defaultIceLevelOptions = {
  id: 'ice-level',
  name: 'Lượng đá',
  choices: [
    { id: 'ice-level-30', name: '30%', priceAdjustment: 0 },
    { id: 'ice-level-50', name: '50%', priceAdjustment: 0 },
    { id: 'ice-level-70', name: '70%', priceAdjustment: 0 },
    { id: 'ice-level-100', name: '100%', priceAdjustment: 0 },
  ],
};

// Fallback topping options nếu không có từ CUKCUK
// Sắp xếp theo thứ tự logic: TC → Thạch → Topping đặc biệt
const fallbackToppingOptions = {
  id: 'topping',
  name: 'Topping',
  choices: [
    { id: 'topping-none', name: 'Không', priceAdjustment: 0 },
    { id: 'topping-tran-chau-trang', name: 'TC Trắng', priceAdjustment: 8000 },
    { id: 'topping-tran-chau-den', name: 'TC Đen', priceAdjustment: 8000 },
    { id: 'topping-thach-dua', name: 'Thạch dừa', priceAdjustment: 8000 },
    { id: 'topping-pudding', name: 'Pudding', priceAdjustment: 10000 },
    { id: 'topping-kem-cheese', name: 'Kem cheese', priceAdjustment: 12000 },
  ],
};

// Interface for topping with quantity
interface ToppingSelection {
  topping: CartItemOption;
  quantity: number;
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  toppingProducts = [],
  initialQuantity = 1,
  initialOptions = [],
  initialNote = '',
  isEditing = false,
  cardElement = null
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption>>({});
  const [toppingQuantities, setToppingQuantities] = useState<Record<string, number>>({}); // choiceId -> quantity
  const [useToppings, setUseToppings] = useState(false); // false = không dùng, true = có dùng
  const [note, setNote] = useState(initialNote);
  const [showFlyingIcon, setShowFlyingIcon] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Tạo dynamic topping options từ CUKCUK products
  const dynamicToppingOptions = useMemo(() => {
    if (toppingProducts.length === 0) return fallbackToppingOptions;

    const choices = [
      { id: 'topping-none', name: 'Không', priceAdjustment: 0 },
      ...toppingProducts
        .filter(t => t.isAvailable)
        .map(t => ({
          id: `topping-${t.id}`,
          name: t.name.replace(/^Topping\s*/i, ''), // Bỏ prefix "Topping" nếu có
          priceAdjustment: t.price,
          cukcukId: t.cukcukId, // Lưu cukcukId để gửi order
          cukcukCode: t.cukcukCode,
        }))
    ];

    return {
      id: 'topping',
      name: 'Topping',
      choices,
    };
  }, [toppingProducts]);

  const getProductOptions = () => {
    if (!product) return [];
    const options = [];
    // Sugar options
    const hasSugar = product.options?.some(opt => opt.id === 'sugar');
    if (hasSugar) {
      const sugarOpt = product.options?.find(opt => opt.id === 'sugar');
      if (sugarOpt) options.push(sugarOpt);
    } else {
      options.push(defaultSugarOptions);
    }
    // Ice type options (Đá riêng, Không đá, Có đá)
    options.push(defaultIceTypeOptions);
    // Ice level options (30%, 50%, 70%, 100%) - chỉ hiện khi chọn "Có đá"
    options.push(defaultIceLevelOptions);
    // Luôn thêm topping options từ CUKCUK
    options.push(dynamicToppingOptions);
    return options;
  };

  useEffect(() => {
    if (!product) return;

    // Nếu đang edit, load initial values
    if (isEditing && initialOptions && initialOptions.length > 0) {
      setQuantity(initialQuantity);
      setNote(initialNote);

      // Convert initialOptions array to selectedOptions object
      const optionsMap: Record<string, CartItemOption> = {};
      const toppingQty: Record<string, number> = {};
      let hasToppings = false;

      initialOptions.forEach(opt => {
        if (opt.optionId === 'topping') {
          hasToppings = true;
          // Count topping quantities
          toppingQty[opt.choiceId] = (toppingQty[opt.choiceId] || 0) + 1;
        } else {
          optionsMap[opt.optionId] = opt;
        }
      });

      setSelectedOptions(optionsMap);
      setToppingQuantities(toppingQty);
      setUseToppings(hasToppings);
      return; // Early return để tránh set default
    }

    // Reset về default cho new item
    setQuantity(1);
    setNote('');
    setToppingQuantities({});
    setUseToppings(false);

    const options = getProductOptions();
    const defaultOptions: Record<string, CartItemOption> = {};

    options.forEach((option) => {
      if (option.choices.length > 0) {
        let defaultChoice;
        if (option.id === 'topping') {
          // Skip topping default selection - use quantities instead
          return;
        } else if (option.id === 'ice-type') {
          // Mặc định chọn "Có đá"
          defaultChoice = option.choices.find(c => c.id === 'ice-type-with') || option.choices[2];
        } else if (option.id === 'ice-level') {
          // Mặc định 100%
          defaultChoice = option.choices[option.choices.length - 1];
        } else {
          // Sugar và các option khác: chọn cuối (100%)
          defaultChoice = option.choices[option.choices.length - 1];
        }
        defaultOptions[option.id] = {
          optionId: option.id,
          optionName: option.name,
          choiceId: defaultChoice.id,
          choiceName: defaultChoice.name,
          priceAdjustment: defaultChoice.priceAdjustment,
        };
      }
    });
    setSelectedOptions(defaultOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isEditing]);

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
      (sum, opt) => {
        // Không tính ice-level nếu không chọn "Có đá"
        if (opt.optionId === 'ice-level' && selectedOptions['ice-type']?.choiceId !== 'ice-type-with') {
          return sum;
        }
        return sum + opt.priceAdjustment;
      },
      0
    );

    // Calculate topping total from quantities
    const toppingOptions = getProductOptions().find(opt => opt.id === 'topping');
    const toppingTotal = toppingOptions?.choices.reduce((sum, choice) => {
      const qty = toppingQuantities[choice.id] || 0;
      return sum + (choice.priceAdjustment * qty);
    }, 0) || 0;

    return (product.price + optionsTotal + toppingTotal) * quantity;
  };

  const handleAddToCart = () => {
    // Lọc bỏ ice-level nếu không chọn "Có đá"
    const filteredOptions = Object.values(selectedOptions).filter(opt => {
      if (opt.optionId === 'ice-level' && selectedOptions['ice-type']?.choiceId !== 'ice-type-with') {
        return false;
      }
      return true;
    });

    // Add toppings based on quantities
    const toppingOptions = getProductOptions().find(opt => opt.id === 'topping');
    if (toppingOptions) {
      toppingOptions.choices.forEach(choice => {
        const qty = toppingQuantities[choice.id] || 0;
        if (qty > 0 && choice.id !== 'topping-none') {
          // Add each topping multiple times based on quantity
          for (let i = 0; i < qty; i++) {
            filteredOptions.push({
              optionId: 'topping',
              optionName: 'Topping',
              choiceId: choice.id,
              choiceName: choice.name,
              priceAdjustment: choice.priceAdjustment,
            });
          }
        }
      });
    }

    // Save card position before closing modal (use center of card image)
    if (!isEditing && cardElement) {
      const rect = cardElement.getBoundingClientRect();
      setCardPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 3, // Slightly higher to match product image center
      });
    }

    // Add to cart immediately
    onAddToCart(product, quantity, filteredOptions, note || undefined);

    // Close modal first
    onClose();

    // Trigger animation after modal closes
    if (!isEditing && cardElement) {
      // Wait for modal to close (250ms for dialog animation)
      setTimeout(() => {
        setShowFlyingIcon(true);

        // Clean up after animation completes
        setTimeout(() => {
          setShowFlyingIcon(false);
          setCardPosition(null);
        }, 1300); // Updated to match new 1.2s animation duration
      }, 250);
    }
  };

  const handleAnimationComplete = () => {
    setShowFlyingIcon(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header: Image + Info side by side */}
        <div className="flex items-stretch gap-3 p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50/50">
          {/* Product image */}
          <div className="relative w-28 sm:w-36 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-white shadow-sm">
            {hasImage ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-1"
                sizes="(max-width: 640px) 112px, 144px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                <span className="text-5xl">🧋</span>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight line-clamp-2">{product.name}</h2>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
              {formatPriceShort(product.price)}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hasImage && (
              <div className="flex items-center gap-1 mt-2 text-gray-400 text-[8px] sm:text-[9px]">
                <ImageIcon className="h-2 w-2 shrink-0" />
                <span className="truncate">Hình ảnh mang tính chất minh họa</span>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="px-3 sm:px-4 py-3 space-y-3">
          {productOptions.map((option) => {
            // Ẩn ice-level nếu không chọn "Có đá"
            if (option.id === 'ice-level' && selectedOptions['ice-type']?.choiceId !== 'ice-type-with') {
              return null;
            }

            // Special rendering for topping with tabs
            if (option.id === 'topping') {
              // Filter out "Không" option and check if there are any toppings
              const availableToppings = option.choices.filter(c => c.id !== 'topping-none');

              return (
                <div key={option.id}>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">{option.name}</h3>

                  {/* Tabs: Không dùng / Có dùng */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUseToppings(false);
                        setToppingQuantities({}); // Clear all topping selections
                      }}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all border-2',
                        !useToppings
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                      )}
                    >
                      Không thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseToppings(true)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all border-2',
                        useToppings
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                      )}
                    >
                      Thêm topping
                    </button>
                  </div>

                  {/* Topping selector - chỉ hiện khi chọn "Có dùng" */}
                  {useToppings && (
                    availableToppings.length === 0 ? (
                      // Message khi không có topping available
                      <div className="py-3 px-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                        <span className="text-xs sm:text-sm text-gray-500">Sản phẩm này không có topping</span>
                      </div>
                    ) : (
                      // Grid 2 cột cho mobile và desktop
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableToppings.map((choice) => {
                          const qty = toppingQuantities[choice.id] || 0;
                          return (
                            <div key={choice.id} className="flex items-center justify-between py-2 px-2 sm:px-3 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-300 transition-colors">
                              <div className="flex-1 min-w-0 mr-2">
                                <span className="block text-xs sm:text-sm font-medium text-gray-700 truncate">
                                  {choice.name}
                                </span>
                                {choice.priceAdjustment > 0 && (
                                  <span className="block text-[10px] sm:text-xs text-amber-600">
                                    +{formatPriceShort(choice.priceAdjustment)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                                  onClick={() => setToppingQuantities(prev => ({
                                    ...prev,
                                    [choice.id]: Math.max(0, (prev[choice.id] || 0) - 1)
                                  }))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 sm:w-6 text-center font-bold text-xs sm:text-sm">{qty}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() => setToppingQuantities(prev => ({
                                    ...prev,
                                    [choice.id]: (prev[choice.id] || 0) + 1
                                  }))}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              );
            }

            // Regular options (sugar, ice-type, ice-level)
            return (
              <div key={option.id}>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1.5">{option.name}</h3>
                <div className={cn(
                  'grid gap-1.5 sm:gap-2',
                  option.id === 'ice-type' ? 'grid-cols-3' : 'grid-cols-4'
                )}>
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
                          'py-1.5 sm:py-2 px-1 rounded-lg text-xs sm:text-sm font-medium border-2 transition-all',
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'
                        )}
                      >
                        <span className="block truncate">{choice.name}</span>
                        {choice.priceAdjustment > 0 && (
                          <span className={cn(
                            'block text-[10px] sm:text-xs',
                            isSelected ? 'text-amber-100' : 'text-amber-600'
                          )}>
                            +{formatPriceShort(choice.priceAdjustment)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Note */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1.5">Ghi chú</h3>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yêu cầu đặc biệt..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Add to cart button - sticky on mobile */}
        <div className="sticky bottom-0 px-3 sm:px-4 pb-4 pt-2 bg-white border-t border-gray-100">
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-lg shadow-amber-600/30"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {isEditing ? 'Cập nhật' : 'Thêm vào giỏ hàng'} : {formatPriceShort(calculateTotal())}
          </Button>
        </div>
      </DialogContent>

      {/* Flying cart animation */}
      {showFlyingIcon && (
        <FlyingCartIcon
          startPosition={cardPosition}
          endElement={typeof document !== 'undefined' ? document.querySelector('[data-cart-icon]') : null}
          onComplete={handleAnimationComplete}
        />
      )}
    </Dialog>
  );
}
