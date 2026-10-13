import { API_CONFIG } from '../constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import supabase from './supabase';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class ApiClient {
  private getBaseUrl(): string {
    const rawUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.PROD_BASE_URL || 'https://societychef-1.onrender.com';
    return rawUrl.replace(/\/$/, '');
  }

  private async getValidToken(): Promise<string | null> {
    // 1. Try reading stored token first (set explicitly by auth flow or onAuthStateChange)
    try {
      let storedToken: string | null = null;
      if (Platform.OS === 'web' || typeof window === 'undefined') {
        if (typeof window !== 'undefined' && window.localStorage) {
          storedToken = window.localStorage.getItem('supabase_access_token');
        }
      } else {
        storedToken = await SecureStore.getItemAsync('supabase_access_token');
      }

      if (storedToken) {
        return storedToken;
      }
    } catch (e) {
      console.warn('[ApiClient] Failed to retrieve stored token', e);
    }

    // 2. Fallback to Supabase client session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0;
        if (expiresAtMs > 0 && Date.now() >= expiresAtMs - 10000) {
          console.log('[ApiClient] Access token expired or expiring soon. Refreshing proactively...');
          const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr && refreshData?.session?.access_token) {
            await this.saveTokenToStorage(refreshData.session.access_token);
            return refreshData.session.access_token;
          }
        }
        this.saveTokenToStorage(session.access_token).catch(() => {});
        return session.access_token;
      }
    } catch (err) {
      console.warn('[ApiClient] Failed to get session from Supabase:', err);
    }

    return null;
  }

  public async saveTokenToStorage(token: string): Promise<void> {
    if (Platform.OS === 'web' || typeof window === 'undefined') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('supabase_access_token', token);
      }
    } else {
      await SecureStore.setItemAsync('supabase_access_token', token);
    }
  }

  public async clearTokenFromStorage(): Promise<void> {
    if (Platform.OS === 'web' || typeof window === 'undefined') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('supabase_access_token');
        window.localStorage.removeItem('supabase_refresh_token');
      }
    } else {
      await SecureStore.deleteItemAsync('supabase_access_token');
      await SecureStore.deleteItemAsync('supabase_refresh_token');
    }
  }

  private async getHeaders(overrideToken?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = overrideToken || (await this.getValidToken());
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Safe metadata diagnostic log (NO RAW TOKENS LOGGED)
    let tokenExp: string | null = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payloadStr = Platform.OS === 'web' ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadStr);
          if (payload.exp) {
            tokenExp = new Date(payload.exp * 1000).toISOString();
          }
        }
      } catch {}
    }

    console.log('[FRONTEND REQUEST]', JSON.stringify({
      hasAccessToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenExpiresAt: tokenExp,
      requestStartedAt: new Date().toISOString()
    }));

    return headers;
  }

  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any,
    isRetry = false,
    overrideToken?: string
  ): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    let url: string;
    if (cleanEndpoint === '/health') {
      url = `${baseUrl}${cleanEndpoint}`;
    } else if (cleanEndpoint.startsWith('/api/v1/')) {
      url = `${baseUrl}${cleanEndpoint}`;
    } else {
      const apiPrefix = baseUrl.endsWith('/api/v1') ? '' : '/api/v1';
      url = `${baseUrl}${apiPrefix}${cleanEndpoint}`;
    }
    const headers = await this.getHeaders(overrideToken);

    console.log('[REQUEST LOG]', JSON.stringify({
      path: endpoint,
      method,
      isRetry
    }));

    const timeoutMs = API_CONFIG.TIMEOUT || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      if (fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted')) {
        console.error(`[ApiClient TIMEOUT] Request to ${method} ${endpoint} timed out after ${timeoutMs}ms`);
        throw new Error('Verification request timed out. Please check your internet connection and try again.');
      }
      console.error(`[ApiClient NETWORK_ERROR] Request to ${method} ${endpoint} failed:`, fetchErr?.message || fetchErr);
      throw new Error(`Network error: Unable to reach server (${endpoint}). Please check your connection.`);
    } finally {
      clearTimeout(timer);
    }

    // Handle 401 Unauthorized with ONE automatic session refresh retry using the freshly returned token
    if (response.status === 401 && !isRetry) {
      console.log(`[ApiClient 401_RETRY] Received HTTP 401 for ${method} ${endpoint}. Attempting session refresh...`);
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data?.session?.access_token) {
          const newToken = data.session.access_token;
          console.log('[ApiClient 401_RETRY]', JSON.stringify({
            path: endpoint,
            refreshSucceeded: true,
            newTokenPresent: !!newToken,
            retryAttempt: 1
          }));
          await this.saveTokenToStorage(newToken);
          return await this.request<T>(method, endpoint, body, true, newToken);
        } else {
          console.warn('[ApiClient 401_RETRY]', JSON.stringify({
            path: endpoint,
            refreshSucceeded: false,
            error: error?.message || 'No valid session returned'
          }));
        }
      } catch (refreshErr: any) {
        console.warn('[ApiClient 401_RETRY] Error during session refresh:', refreshErr?.message || refreshErr);
      }
    }

    return this.handleResponse<T>(response);
  }

  public async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  public async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  public async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = typeof data === 'string' ? data : data?.message;
      if (!errorMessage) {
        if (response.status === 401) {
          errorMessage = 'Session expired. Please sign in again.';
        } else if (response.status === 403) {
          errorMessage = 'Permission denied: Access requires delivery partner role.';
        } else if (response.status === 422) {
          errorMessage = 'Verification information is incomplete or invalid.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Verification service is temporarily unavailable. Please try again.';
        } else {
          errorMessage = `HTTP error status ${response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    return {
      success: true,
      message: data?.message || 'Success',
      data: data?.data ?? data,
    };
  }
}

export const apiClient = new ApiClient();
export default apiClient;
