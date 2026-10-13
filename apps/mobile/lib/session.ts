import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useRecentlyViewedStore } from '../store/useRecentlyViewedStore';

export function resetUserSession() {
  useAuthStore.getState().clearUser();
  useCartStore.getState().clearCart();
  useNotificationStore.getState().clearAll();
  useRecentlyViewedStore.getState().clearViewed();
}
