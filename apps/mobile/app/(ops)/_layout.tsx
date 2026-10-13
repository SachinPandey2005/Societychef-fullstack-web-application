import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useRoleGuard } from '../../hooks/useRoleGuard';

export default function OpsLayout() {
  const guard = useRoleGuard(['ops', 'admin'], '/landing');
  // See the matching comment in (consumer)/_layout.tsx — without this, the
  // tab bar sits under the device's own navigation buttons on 3-button-nav
  // phones.
  const insets = useSafeAreaInsets();

  if (guard.state === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (guard.state === 'denied') {
    return <Redirect href={guard.redirectTo as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ops',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trust"
        options={{
          title: 'Trust',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Metrics',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
