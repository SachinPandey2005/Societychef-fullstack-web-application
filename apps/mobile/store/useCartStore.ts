import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Alert } from 'react-native';
import type { CartItem } from '../types';

type CartState = {
  items: CartItem[];
  needChangeFor500: boolean;
};

type CartActions = {
  addItem: (item: CartItem, onConfirmReplace?: () => void) => void;
  removeItem: (kitchenId: string, dishId: string) => void;
  updateQuantity: (kitchenId: string, dishId: string, quantity: number) => void;
  setNeedChangeFor500: (val: boolean) => void;
  clearCart: () => void;
};

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      needChangeFor500: false,

      addItem: (newItem) => {
        const currentItems = get().items;
        const existing = currentItems.find(
          (item) => item.kitchenId === newItem.kitchenId && item.dishId === newItem.dishId,
        );

        if (existing) {
          set((state) => ({
            items: state.items.map((item) =>
              item.kitchenId === newItem.kitchenId && item.dishId === newItem.dishId
                ? {
                    ...item,
                    quantity: item.quantity + newItem.quantity,
                    dishName: newItem.dishName || item.dishName,
                    kitchenName: newItem.kitchenName || item.kitchenName,
                    societyName: newItem.societyName || item.societyName,
                    price: newItem.price ?? item.price,
                    imageUrl: newItem.imageUrl || item.imageUrl,
                  }
                : item,
            ),
          }));
        } else {
          set((state) => ({ items: [...state.items, newItem] }));
        }
      },

      removeItem: (kitchenId, dishId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.kitchenId === kitchenId && item.dishId === dishId),
          ),
        }));
      },

      updateQuantity: (kitchenId, dishId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(kitchenId, dishId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.kitchenId === kitchenId && item.dishId === dishId
              ? { ...item, quantity }
              : item,
          ),
        }));
      },

      setNeedChangeFor500: (val) => set({ needChangeFor500: val }),

      clearCart: () => set({ items: [], needChangeFor500: false }),
    }),
    {
      name: 'rasohi-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}
