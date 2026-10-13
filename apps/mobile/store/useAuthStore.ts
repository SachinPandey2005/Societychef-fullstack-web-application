import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../lib/storage';

import type { AuthUser, Role } from '../types';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isGuest: boolean;
  _hasHydrated: boolean;
  registeredUsersMap: Record<string, AuthUser>;
  // A chef signup in progress (landing.tsx's "Become a Chef" -> phone/OTP ->
  // chef-register) needs to survive an app restart mid-flow — otp.tsx sets
  // `user` (role: consumer) as soon as OTP verifies, before chef-register
  // ever runs, so if the app gets backgrounded/reloaded by the OS between
  // those two steps (confirmed: a developer landed back on consumer
  // Discover after exactly this), the splash screen's routing — which only
  // looks at user.role/activeRole — has no way to know registration was
  // still in progress. This flag is the durable (persisted) memory of that
  // intent, checked by _layout.tsx's splash alongside otp.tsx's own
  // same-session redirect.
  pendingChefSignup: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser) => void;
  setToken: (token: string | null) => void;
  setSession: (token: string | null, refreshToken: string | null) => void;
  setPendingChefSignup: (pending: boolean) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
  switchActiveRole: (role: Role) => void;
  addRole: (role: Role) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  findRegisteredUserByPhone: (phone: string) => AuthUser | undefined;
  deleteAccount: () => Promise<void>;
};

type AuthStore = AuthState & AuthActions;

import { useNotificationStore } from './useNotificationStore';
import { useCartStore } from './useCartStore';
import { useRewardsStore } from './useRewardsStore';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isGuest: false,
      _hasHydrated: false,
      registeredUsersMap: {},
      pendingChefSignup: false,

      setUser: (user) => {
        const phoneKey = user.phone ? user.phone.replace(/\D/g, '') : '';
        set((state) => ({
          user,
          isGuest: false,
          registeredUsersMap: phoneKey
            ? { ...state.registeredUsersMap, [phoneKey]: user }
            : state.registeredUsersMap,
        }));
      },
      setToken: (token) => set({ token }),
      setSession: (token, refreshToken) => set({ token, refreshToken }),
      setPendingChefSignup: (pending) => set({ pendingChefSignup: pending }),

      clearUser: () => {
        try {
          useNotificationStore.getState().clearAll();
          useCartStore.getState().clearCart();
          useRewardsStore.setState({ points: 0, ordersCompleted: 0, lifetimePoints: 0 });
          const { useWeeklyStore } = require('./useWeeklyStore');
          useWeeklyStore.setState({ preBookings: [], weeklyDishes: [] });
          const { disconnectSocket } = require('../lib/socket');
          disconnectSocket();
        } catch {}
        set({ user: null, token: null, refreshToken: null, isGuest: false, pendingChefSignup: false });
      },

      deleteAccount: async () => {
        const user = get().user;
        if (user?.id) {
          try {
            const { isMockMode } = require('../lib/mockMode');
            if (!isMockMode) {
              const { apiClient } = require('../lib/apiClient');
              // DELETE /auth/account deactivates the profile (status='DELETED')
              // and, if the caller has a kitchen, pauses it (is_live=false) —
              // see auth.controller.ts#deleteAccount. This replaces direct
              // Supabase deletes of weekly_dishes/dishes/kitchens/profiles,
              // which stopped reaching real data once those tables moved to
              // Drizzle/local Postgres (Phase 1) — account "deletion" had been
              // a complete no-op against the actual database ever since.
              await apiClient.delete('/auth/account').catch(() => {});
            }
          } catch (e) {
            console.warn('Account deletion cleanup notice:', e);
          }
        }

        const phoneKey = user?.phone ? user.phone.replace(/\D/g, '') : '';
        const updatedMap = { ...get().registeredUsersMap };
        if (phoneKey) delete updatedMap[phoneKey];

        try {
          useNotificationStore.getState().clearAll();
          useCartStore.getState().clearCart();
          useRewardsStore.setState({ points: 0, ordersCompleted: 0, lifetimePoints: 0 });
        } catch {}

        set({ user: null, token: null, refreshToken: null, isGuest: false, registeredUsersMap: updatedMap });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setGuest: (isGuest) => set({ isGuest }),

      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      findRegisteredUserByPhone: (phone: string) => {
        const phoneKey = phone ? phone.replace(/\D/g, '') : '';
        if (!phoneKey) return undefined;
        return get().registeredUsersMap[phoneKey];
      },

      switchActiveRole: (role) =>
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, activeRole: role };
          const phoneKey = updated.phone ? updated.phone.replace(/\D/g, '') : '';
          return {
            user: updated,
            registeredUsersMap: phoneKey
              ? { ...state.registeredUsersMap, [phoneKey]: updated }
              : state.registeredUsersMap,
          };
        }),

      addRole: (role) =>
        set((state) => {
          if (!state.user) return state;
          if (state.user.roles.includes(role)) return state;
          const updated = { ...state.user, roles: [...state.user.roles, role] };
          const phoneKey = updated.phone ? updated.phone.replace(/\D/g, '') : '';
          return {
            user: updated,
            registeredUsersMap: phoneKey
              ? { ...state.registeredUsersMap, [phoneKey]: updated }
              : state.registeredUsersMap,
          };
        }),

      updateUser: (partial) =>
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...partial };
          const phoneKey = updated.phone ? updated.phone.replace(/\D/g, '') : '';
          return {
            user: updated,
            registeredUsersMap: phoneKey
              ? { ...state.registeredUsersMap, [phoneKey]: updated }
              : state.registeredUsersMap,
          };
        }),
    }),
    {
      name: 'rasohi-auth',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken, isGuest: state.isGuest, registeredUsersMap: state.registeredUsersMap, pendingChefSignup: state.pendingChefSignup }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
