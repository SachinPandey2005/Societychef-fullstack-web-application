/**
 * Platform-safe storage adapter for Supabase auth and Zustand persist.
 *
 * Problem: @react-native-async-storage reads `window` at import time. During
 * Expo Router's SSR pass (Node.js), `window` is undefined → ReferenceError crash.
 *
 * Solution:
 *  - Native (iOS / Android) → expo-secure-store  (encrypted, no `window` issue)
 *  - Web (browser)          → localStorage shim  (guarded so it only runs after
 *                             hydration, never during SSR where `window` is absent)
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Web localStorage shim (SSR-safe) ────────────────────────────────────────
// We wrap every access in a typeof-window guard so that during the Node.js SSR
// render pass the functions are no-ops, preventing the `window is not defined`
// crash that originated from AsyncStorage.
const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

// ─── Native SecureStore adapter ───────────────────────────────────────────────
// SecureStore is async; we expose async getItem / setItem / removeItem so that
// Supabase auth and Zustand persist can use a unified interface.
const nativeStorage = {
  getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};

/**
 * Unified storage object.
 * – Compatible with `@supabase/supabase-js` `auth.storage` option.
 * – Compatible with Zustand `createJSONStorage(() => storage)`.
 */
export const storage = Platform.OS === 'web' ? webStorage : nativeStorage;
