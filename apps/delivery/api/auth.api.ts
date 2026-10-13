import { apiClient } from './client';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    phone?: string;
    email?: string;
  };
}

export interface ProfileDetails {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar_url?: string;
  society_id?: string;
  created_at: string;
}

export const authApi = {
  sendOtp: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/send-otp', { phone });
  },

  verifyOtp: async (phone: string, token: string): Promise<{ session: AuthSession }> => {
    const response = await apiClient.post<{ session: AuthSession }>('/auth/verify-otp', { phone, token });
    return response.data;
  },

  refreshToken: async (refresh_token: string): Promise<{ session: AuthSession }> => {
    const response = await apiClient.post<{ session: AuthSession }>('/auth/refresh', { refresh_token });
    return response.data;
  },

  getMe: async (overrideToken?: string): Promise<ProfileDetails> => {
    const response = await (apiClient as any).request('GET', '/auth/me', undefined, false, overrideToken);
    return response.data;
  },

  updateProfile: async (payload: { name?: string; avatar_url?: string; society_id?: string }): Promise<ProfileDetails> => {
    const response = await apiClient.patch<ProfileDetails>('/auth/profile', payload);
    return response.data;
  },
};

export default authApi;
