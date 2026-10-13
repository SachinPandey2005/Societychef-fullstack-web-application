import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type FavoritesState = {
  favoriteKitchens: string[]; // List of kitchenIds
  favoriteDishes: string[];   // List of dish names/ids
};

type FavoritesActions = {
  toggleKitchenFavorite: (kitchenId: string) => void;
  toggleDishFavorite: (dishId: string) => void;
  isKitchenFavorite: (kitchenId: string) => boolean;
  isDishFavorite: (dishId: string) => boolean;
};

type FavoritesStore = FavoritesState & FavoritesActions;

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteKitchens: [],
      favoriteDishes: [],

      toggleKitchenFavorite: (kitchenId) => {
        set((state) => {
          const exists = state.favoriteKitchens.includes(kitchenId);
          return {
            favoriteKitchens: exists
              ? state.favoriteKitchens.filter((id) => id !== kitchenId)
              : [...state.favoriteKitchens, kitchenId],
          };
        });
      },

      toggleDishFavorite: (dishId) => {
        set((state) => {
          const exists = state.favoriteDishes.includes(dishId);
          return {
            favoriteDishes: exists
              ? state.favoriteDishes.filter((id) => id !== dishId)
              : [...state.favoriteDishes, dishId],
          };
        });
      },

      isKitchenFavorite: (kitchenId) => {
        return get().favoriteKitchens.includes(kitchenId);
      },

      isDishFavorite: (dishId) => {
        return get().favoriteDishes.includes(dishId);
      },
    }),
    {
      name: 'rasohi-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
