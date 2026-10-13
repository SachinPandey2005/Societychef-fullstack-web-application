import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function Index() {
  const { user, isGuest, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#123524" />
      </View>
    );
  }

  if (user) {
    if (user.role === 'ops' || user.role === 'admin' || user.activeRole === 'ops' || user.activeRole === 'admin') {
      return <Redirect href="/(ops)" />;
    }
    const active = user.activeRole ?? user.role;
    if (active === 'chef') {
      return <Redirect href="/(chef)/dashboard" />;
    }
    return <Redirect href="/(consumer)/discover" />;
  }

  if (isGuest) {
    return <Redirect href="/(consumer)/discover" />;
  }

  return <Redirect href="/landing" />;
}
