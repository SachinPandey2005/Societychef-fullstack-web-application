import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import supabase from '../api/supabase';
import { authApi, ProfileDetails } from '../api/auth.api';
import { deliveryApi, PartnerRegistration } from '../api/delivery.api';
import { DevPhoneAuthService } from '../services/devPhoneAuth';
import usePartnerStore from './usePartnerStore';
import useVehicleStore from './useVehicleStore';
import useBankStore from './useBankStore';
import useSocietyStore from './useSocietyStore';
import { useUserStore } from './useUserStore';

const clearAllUserStores = () => {
  usePartnerStore.setState({ profile: null, partner: null, documents: [], isLoading: false, error: null });
  useVehicleStore.setState({ vehicle: null, isLoading: false, error: null });
  useBankStore.setState({
    bankDetails: {
      bank_name: '',
      account_number: '',
      account_number_masked: '',
      ifsc_code: '',
      upi_id: '',
      holder_name: '',
      verification_status: 'UNVERIFIED' as const,
    },
    isUpdating: false,
    error: null,
  });
  useSocietyStore.setState({ society: null, isLoading: false, error: null });
  useUserStore.setState({ profile: null, isOnline: false });
};

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'kyc_required' | 'suspended';

const isWebOrServer = Platform.OS === 'web' || typeof window === 'undefined';
const memoryCache: Record<string, string> = {};

const safeSecureStore = {
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

interface AuthState {
  authStatus: AuthStatus;
  userProfile: ProfileDetails | null;
  partnerProfile: PartnerRegistration | null;
  isChecking: boolean;
  
  restoreSession: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  registerPartner: (vehicleDetails: string, licenseNumber: string) => Promise<void>;
  refreshPartnerProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for Supabase session changes to sync with SecureStore access token
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`[useAuthStore] onAuthStateChange event: ${event}, session: ${!!session}`);
    if (session?.access_token) {
      await safeSecureStore.setItemAsync('supabase_access_token', session.access_token);
      await safeSecureStore.setItemAsync('supabase_refresh_token', session.refresh_token || '');
    } else if (event === 'SIGNED_OUT') {
      let token: string | null = null;
      if (isWebOrServer) {
        if (typeof window !== 'undefined' && window.localStorage) {
          token = window.localStorage.getItem('supabase_access_token');
        } else {
          token = memoryCache['supabase_access_token'] || null;
        }
      } else {
        token = await SecureStore.getItemAsync('supabase_access_token');
      }
      if (token && token.includes('dev_signature')) {
        // Keep dev session unless explicit logout was triggered
        return;
      }
      await safeSecureStore.deleteItemAsync('supabase_access_token');
      await safeSecureStore.deleteItemAsync('supabase_refresh_token');
    }
  });

  return {
    authStatus: 'unauthenticated',
    userProfile: null,
    partnerProfile: null,
    isChecking: true,

    restoreSession: async () => {
      set({ isChecking: true });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await safeSecureStore.setItemAsync('supabase_access_token', session.access_token);
          const profile = await authApi.getMe();
          set({ userProfile: profile });
          await get().refreshPartnerProfile();
        } else {
          let token: string | null = null;
          if (isWebOrServer) {
            if (typeof window !== 'undefined' && window.localStorage) {
              token = window.localStorage.getItem('supabase_access_token');
            } else {
              token = memoryCache['supabase_access_token'] || null;
            }
          } else {
            token = await SecureStore.getItemAsync('supabase_access_token');
          }

          if (token) {
            try {
              const profile = await authApi.getMe();
              set({ userProfile: profile });
              await get().refreshPartnerProfile();
            } catch (err) {
              console.warn('[useAuthStore] Stored token invalid or getMe failed:', err);
              await safeSecureStore.deleteItemAsync('supabase_access_token');
              await safeSecureStore.deleteItemAsync('supabase_refresh_token');
              set({ authStatus: 'unauthenticated', userProfile: null, partnerProfile: null });
            }
          } else {
            set({ authStatus: 'unauthenticated', userProfile: null, partnerProfile: null });
          }
        }
      } catch (e) {
        console.warn('Failed to restore session:', e);
        set({ authStatus: 'unauthenticated', userProfile: null, partnerProfile: null });
      } finally {
        set({ isChecking: false });
      }
    },

    sendOtp: async (phone: string) => {
      if (DevPhoneAuthService.shouldSkipOtpSend() || (typeof __DEV__ !== 'undefined' && __DEV__)) {
        console.log('[DevPhoneAuth] DEV_PHONE_AUTH=true: Skipping OTP SMS send for phone:', phone);
        return;
      }
      try {
        await authApi.sendOtp(phone);
      } catch (err) {
        if (DevPhoneAuthService.isDevAuthEnabled() || (typeof __DEV__ !== 'undefined' && __DEV__)) {
          console.warn('[DevPhoneAuth] Suppressing sendOtp error in dev mode to allow OTP entry:', err);
          return;
        }
        throw err;
      }
    },

    verifyOtp: async (phone: string, token: string) => {
      // 1. Force clear all previous store state and purge cached tokens
      clearAllUserStores();
      await safeSecureStore.deleteItemAsync('supabase_access_token');
      await safeSecureStore.deleteItemAsync('supabase_refresh_token');
      try {
        await supabase.auth.signOut();
      } catch {}

      set({ isChecking: true, userProfile: null, partnerProfile: null });
      try {
        let authResult: { access_token: string; refresh_token: string; user?: any } | null = null;

        // Try standard backend verification first
        try {
          const res = await authApi.verifyOtp(phone, token);
          if (res?.session) {
            authResult = {
              access_token: res.session.access_token,
              refresh_token: res.session.refresh_token || 'dev_refresh_token',
              user: res.session.user,
            };
          }
        } catch (apiErr: any) {
          console.warn('[useAuthStore] authApi.verifyOtp failed, evaluating dev phone auth fallback:', apiErr?.message);
          
          if (DevPhoneAuthService.isDevAuthEnabled()) {
            if (!DevPhoneAuthService.validateDevOtp(token)) {
              throw new Error('Invalid OTP');
            }
            const cleanPhoneDigits = phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0');
            const devUserId = `00000000-0000-4000-8000-${cleanPhoneDigits}`;
            const payload = {
              sub: devUserId,
              phone,
              role: 'DELIVERY_PARTNER',
              exp: Math.floor(Date.now() / 1000) + 86400 * 30,
            };
            const devToken = `header.${Platform.OS === 'web' ? btoa(JSON.stringify(payload)) : Buffer.from(JSON.stringify(payload)).toString('base64')}.dev_signature`;
            authResult = {
              access_token: devToken,
              refresh_token: 'dev_refresh_token',
              user: { id: devUserId, phone },
            };
          } else {
            throw apiErr;
          }
        }

        if (!authResult) {
          throw new Error('Verification failed');
        }

        await safeSecureStore.setItemAsync('supabase_access_token', authResult.access_token);
        await safeSecureStore.setItemAsync('supabase_refresh_token', authResult.refresh_token);

        try {
          const profile = await authApi.getMe(authResult.access_token);
          set({ userProfile: profile });
        } catch {
          const cleanPhoneDigits = phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0');
          const userId = authResult.user?.id || `00000000-0000-4000-8000-${cleanPhoneDigits}`;
          set({
            userProfile: {
              id: userId,
              phone,
              name: `Partner ${phone.slice(-4)}`,
              role: 'DELIVERY_PARTNER',
              created_at: new Date().toISOString(),
            },
          });
        }

        await get().refreshPartnerProfile();
      } catch (e) {
        set({ isChecking: false });
        throw e;
      }
    },

    refreshPartnerProfile: async () => {
      try {
        let userId: string | null = get().userProfile?.id || null;

        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
          if (user) {
            userId = user.id;
          } else {
            const token = await safeSecureStore.getItemAsync('supabase_access_token');
            if (token) {
              try {
                const parts = token.split('.');
                if (parts.length >= 2) {
                  const jsonStr = Platform.OS === 'web' ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('utf-8');
                  const payload = JSON.parse(jsonStr);
                  if (payload.sub) {
                    userId = payload.sub;
                  } else if (payload.phone) {
                    const cleanPhoneDigits = payload.phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0');
                    userId = `00000000-0000-4000-8000-${cleanPhoneDigits}`;
                  }
                }
              } catch {}
            }
          }
        }

        if (!userId) {
          set({ authStatus: 'unauthenticated' });
          return;
        }

        // Query the delivery_partners table directly using supabase client with user_id
        const { data: partner, error } = await supabase
          .from('delivery_partners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!partner) {
          const userPhone = get().userProfile?.phone || `+91 ${userId.slice(-10)}`;
          const defaultName = `Partner ${userPhone.slice(-4)}`;

          // 1. Upsert profile in profiles table
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              phone: userPhone,
              name: defaultName,
              role: 'DELIVERY_PARTNER',
            });
          } catch {}

          // 2. Insert distinct delivery partner record
          let newPartner: any = null;
          try {
            const { data } = await supabase
              .from('delivery_partners')
              .insert({
                user_id: userId,
                vehicle_type: 'SCOOTER',
                status: 'OFFLINE',
                kyc_status: 'PENDING',
              })
              .select('*')
              .single();
            newPartner = data;
          } catch {}

          const activePartner = newPartner || {
            id: `dp_${userId.substring(0, 8)}`,
            user_id: userId,
            vehicle_type: 'SCOOTER',
            status: 'OFFLINE',
            kyc_status: 'PENDING',
          };

          // 3. Send verification request to Ops CRM Queue
          if (newPartner?.id) {
            try {
              await supabase.from('verification_requests').insert({
                partner_id: newPartner.id,
                status: 'PENDING',
              });
            } catch {}
          }

          set({ partnerProfile: activePartner as any, authStatus: 'authenticated', isChecking: false });
        } else {
          const typedPartner = partner as any;
          set({ partnerProfile: typedPartner });

          if (typedPartner.status === 'SUSPENDED') {
            set({ authStatus: 'suspended' });
          } else {
            set({ authStatus: 'authenticated' });
          }
        }
      } catch (e) {
        console.error('Failed to sync partner profile:', e);
        set({ authStatus: 'unauthenticated', isChecking: false });
      }
    },

    registerPartner: async (vehicleDetails: string, licenseNumber: string) => {
      set({ isChecking: true });
      try {
        const partner = await deliveryApi.registerPartner(vehicleDetails, licenseNumber);
        set({ partnerProfile: partner });
        if (partner.status === 'PENDING_VERIFICATION') {
          set({ authStatus: 'kyc_required' });
        } else {
          set({ authStatus: 'authenticated' });
        }
      } catch (e) {
        throw e;
      } finally {
        set({ isChecking: false });
      }
    },

    logout: async () => {
      set({ isChecking: true });
      clearAllUserStores();
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      } finally {
        await safeSecureStore.deleteItemAsync('supabase_access_token');
        await safeSecureStore.deleteItemAsync('supabase_refresh_token');
        set({
          authStatus: 'unauthenticated',
          userProfile: null,
          partnerProfile: null,
          isChecking: false,
        });
      }
    },
  };
});

export default useAuthStore;
