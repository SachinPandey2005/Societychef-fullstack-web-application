import i18n from '../i18n';
import { I18nextProvider } from 'react-i18next';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '../components/ui/Toast';
import { Platform, View, StyleSheet, ImageBackground } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { isMockMode } from '../lib/mockMode';
import { apiClient } from '../lib/apiClient';
import { mapBackendUserToAuthUser } from '../lib/authMapper';
import { registerForPushNotificationsAsync } from '../lib/pushNotifications';
import { useAuthStore } from '../store/useAuthStore';

import { useState } from 'react';
import { VideoSplashScreen } from '../components/VideoSplashScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { reportError } from '../lib/crashReporting';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const [showSplash, setShowSplash] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [videoDone, setVideoDone] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      Promise.resolve(useThemeStore.getState().hydrate()),
      Promise.resolve(useLanguageStore.getState().hydrate()),
    ]).finally(() => setHydrated(true));
  }, []);

  // Keep the splash overlay up until the persisted theme/language have been
  // applied, so a returning user never sees a flash of the wrong language.
  useEffect(() => {
    if (hydrated && videoDone) setShowSplash(false);
  }, [hydrated, videoDone]);

  // ── Session restore (backend-issued JWT) ────────────────────────────────────
  // Login itself (otp.tsx) already sets the full session + resolved user in
  // useAuthStore directly, so there's no separate "auth state change" event
  // to listen for here — this effect just re-validates/refreshes the
  // persisted profile against the backend on cold start, since role/kitchen
  // linkage can change server-side between sessions. If the stored token is
  // no longer valid, apiClient's own 401 handling logs the user out locally.
  useEffect(() => {
    if (isMockMode) return; // skip in mock/dev mode

    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    apiClient
      .get('/auth/me')
      .then((response) => {
        const backendUser = response?.data;
        if (backendUser) {
          useAuthStore.getState().setUser(mapBackendUserToAuthUser(backendUser));
        }
      })
      .catch(() => {
        // Unrecoverable session errors are already handled by apiClient
        // (clearUser on a failed refresh); nothing further to do here.
      });

    // Re-registering on every cold start (not just at login) covers the case
    // where the OS issued a new Expo push token since the app was last
    // opened — registerForPushNotificationsAsync() is a cheap no-op/upsert
    // when nothing changed.
    registerForPushNotificationsAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary onError={reportError}>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
              {showSplash && (
                <VideoSplashScreen
                  onPrepareRoute={() => {
                    const { user, isGuest, pendingChefSignup } = useAuthStore.getState();
                    if (user) {
                      if (user.role === 'ops' || user.role === 'admin' || user.activeRole === 'ops' || user.activeRole === 'admin') {
                        router.replace('/(ops)' as any);
                      } else if ((user.activeRole ?? user.role) === 'chef') {
                        router.replace('/(chef)/dashboard');
                      } else if (pendingChefSignup) {
                        // A chef signup (landing.tsx's "Become a Chef" ->
                        // phone/OTP -> chef-register) was interrupted after
                        // OTP verified (which already sets `user`, role:
                        // consumer) but before chef-register actually
                        // finished creating the kitchen — resume it instead
                        // of dropping them on consumer Discover with no
                        // memory this was in progress. See the matching
                        // comment on pendingChefSignup in useAuthStore.ts.
                        router.replace('/(auth)/chef-register' as any);
                      } else {
                        router.replace('/(consumer)/discover');
                      }
                    } else if (isGuest) {
                      router.replace('/(consumer)/discover');
                    } else {
                      router.replace('/landing' as any);
                    }
                  }}
                  onFinish={() => {
                    setVideoDone(true);
                  }}
                />
              )}
              <ImageBackground
                source={require('../assets/doodle_bg.png')}
                style={Platform.OS === 'web' ? styles.webWrapper : styles.container}
                imageStyle={{ opacity: 0.12 }}
                resizeMode="repeat"
              >
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
              </ImageBackground>
            </View>
          </ToastProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
    </ErrorBoundary>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0px 0px 20px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
      },
    }),
  },
});
