import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';

export default function ConsumerLayout() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  // A fixed-height tab bar sits right at the bottom edge of the screen —
  // on a device with 3-button (or gesture) navigation, the OS's own nav bar
  // then overlaps/sits on top of it, making the last tabs (Chat, Profile)
  // hard or impossible to tap. Reported directly: "there is no way to reach
  // to my profile," confirmed via a device screenshot showing the tab bar
  // squeezed under the system navigation buttons.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: '#1B4332',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5DFD7',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
          shadowColor: '#1B4332',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('nav.discover', 'Discover'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weekly"
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
      {/* Wallet — navigated to from Profile */}
      <Tabs.Screen
        name="wallet"
        options={{ href: null }}
      />
      {/* Chat — not a persistent tab. Reachable only from an active order
          (orders list / order detail), matching "we cannot allow chat with
          chef without any order" / "chat is part of help & support for any
          active order, it cannot be enabled all the time." */}
      <Tabs.Screen
        name="chat"
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
      {/* Hidden screens — navigated to programmatically */}
      <Tabs.Screen name="kitchen/[id]"    options={{ href: null }} />
      <Tabs.Screen name="order/[id]"      options={{ href: null }} />
      <Tabs.Screen name="notifications"   options={{ href: null }} />
      <Tabs.Screen name="dish/[id]"       options={{ href: null }} />
      <Tabs.Screen name="cart"            options={{ href: null }} />
      <Tabs.Screen name="favorites"       options={{ href: null }} />
      <Tabs.Screen name="track/[order_id]" options={{ href: null }} />
    </Tabs>
  );
}
