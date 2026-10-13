import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authApi, AuthSession, ProfileDetails } from '../api/auth.api';

const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';
const USER_PROFILE_KEY = 'societychef_user_profile';

const isWebOrServer = Platform.OS === 'web' || typeof window === 'undefined';
const memoryCache: Record<string, string> = {};

const safeStore = {
  setItemAsync: async (key: string, value: string) => {
    if (isWebOrServer) {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      } else {
        memoryCache[key] = value;
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key: string): Promise<string | null> => {
    if (isWebOrServer) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      } else {
        return memoryCache[key] || null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  deleteItemAsync: async (key: string) => {
    if (isWebOrServer) {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      } else {
        delete memoryCache[key];
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  }
};

export class AuthRepository {
  static async saveSession(session: AuthSession): Promise<void> {
    await safeStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
    await safeStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);
  }

  static async loadSession(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const accessToken = await safeStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await safeStore.getItemAsync(REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  }

  static async clearSession(): Promise<void> {
    await safeStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await safeStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await safeStore.deleteItemAsync(USER_PROFILE_KEY);
  }

  static async sendOtp(phone: string): Promise<void> {
    await authApi.sendOtp(phone);
  }

  static async verifyOtp(phone: string, token: string): Promise<AuthSession> {
    const data = await authApi.verifyOtp(phone, token);
    await this.saveSession(data.session);
    return data.session;
  }

  static async refreshSession(refreshToken: string): Promise<AuthSession> {
    const data = await authApi.refreshToken(refreshToken);
    await this.saveSession(data.session);
    return data.session;
  }

  static async getProfile(): Promise<ProfileDetails> {
    const profile = await authApi.getMe();
    await safeStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  static async getCachedProfile(): Promise<ProfileDetails | null> {
    const profileStr = await safeStore.getItemAsync(USER_PROFILE_KEY);
    if (profileStr) {
      try {
        return JSON.parse(profileStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default AuthRepository;
