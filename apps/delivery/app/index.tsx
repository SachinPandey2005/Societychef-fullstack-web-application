import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { usePartnerStore } from '../store/usePartnerStore';
import { useTheme } from '../theme/ThemeContext';

export default function Index() {
  const { authStatus, isChecking: authChecking, restoreSession } = useAuthStore();
  const { loadProfile, partner } = usePartnerStore();
  const { colors } = useTheme();
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await restoreSession();
    };
    init();
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' || authStatus === 'kyc_required') {
      setProfileLoading(true);
      loadProfile()
        .catch(err => console.warn('Failed to load profile details:', err))
        .finally(() => setProfileLoading(false));
    }
  }, [authStatus]);

  if (authChecking || profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Session restored: allow immediate entry into main app
  if (authStatus === 'authenticated' || authStatus === 'kyc_required') {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
