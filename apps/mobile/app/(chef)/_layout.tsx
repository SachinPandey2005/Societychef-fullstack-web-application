import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useRoleGuard } from '../../hooks/useRoleGuard';

export default function ChefLayout() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const guard = useRoleGuard(['chef'], '/(consumer)/discover');
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
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.home', 'Home'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('nav.menu', 'Menu'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Planner — embedded inside Menu -> Weekly Planner */}
      <Tabs.Screen
        name="planner"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('nav.orders', 'Orders'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'bag' : 'bag-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Chat — not a persistent tab. Reachable only from an order's detail
          sheet ("Chat with customer"), matching "chat is part of help &
          support for any active order, it cannot be enabled all the time." */}
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />
      {/* Pay / Settlements — navigated to from Profile */}
      <Tabs.Screen
        name="settlements"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile', 'Profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Hide onboarding from the tab bar — navigated to programmatically */}
      <Tabs.Screen
        name="onboarding"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="wallet"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="supplies"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ href: null }}
      />
    </Tabs>
  );
}
