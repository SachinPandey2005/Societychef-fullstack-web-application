import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWebOrSSR = Platform.OS === 'web' || typeof window === 'undefined';
const memoryCache: Record<string, string> = {};

// A custom storage adapter for Supabase client persistence in React Native using SecureStore
const secureStoreAdapter = {
  getItem: async (key: string) => {
    if (isWebOrSSR) {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : (memoryCache[key] || null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (isWebOrSSR) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        memoryCache[key] = value;
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (isWebOrSSR) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        delete memoryCache[key];
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
