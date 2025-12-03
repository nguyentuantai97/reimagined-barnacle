import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, CartItemOption } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, quantity: number, options: CartItemOption[], note?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
}

const calculateItemTotal = (
  basePrice: number,
  quantity: number,
  options: CartItemOption[]
): number => {
  const optionsTotal = options.reduce((sum, opt) => sum + opt.priceAdjustment, 0);
  return (basePrice + optionsTotal) * quantity;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity, options, note) => {
        const totalPrice = calculateItemTotal(product.price, quantity, options);

        set((state) => {
          // Check if same product with same options exists
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              JSON.stringify(item.selectedOptions) === JSON.stringify(options)
          );

          if (existingIndex >= 0) {
            // Update existing item
            const newItems = [...state.items];
            const existingItem = newItems[existingIndex];
            const newQuantity = existingItem.quantity + quantity;
            newItems[existingIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalPrice: calculateItemTotal(product.price, newQuantity, options),
            };
            return { items: newItems };
          }

          // Add new item
          const newItem: CartItem = {
            id: uuidv4(),
            product,
            quantity,
            selectedOptions: options,
            note,
            totalPrice,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  totalPrice: calculateItemTotal(
                    item.product.price,
                    quantity,
                    item.selectedOptions
                  ),
                }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },
    }),
    {
      name: 'tea-shop-an-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
