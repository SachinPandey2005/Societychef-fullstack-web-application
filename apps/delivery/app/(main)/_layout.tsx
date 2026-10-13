import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme/ThemeContext';
import { Icon, IconName } from '../../components/Icon';
import { Text } from '../../components/Typography';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_TAB_NAMES = ['home', 'orders', 'wallet', 'support', 'profile'];

function CustomPillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom + 6, Platform.OS === 'ios' ? 20 : 12);

  const getTabIconName = (routeName: string): IconName => {
    const baseName = routeName.split('/')[0];
    switch (baseName) {
      case 'home':
        return 'home';
      case 'orders':
        return 'assignment';
      case 'wallet':
        return 'account-balance-wallet';
      case 'support':
        return 'help-outline';
      case 'profile':
        return 'person';
      default:
        return 'help';
    }
  };

  const currentRoute = state.routes[state.index];
  const currentBaseName = currentRoute ? currentRoute.name.split('/')[0] : '';

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomMargin }]} pointerEvents="box-none">
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0',
            borderWidth: 1,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const baseName = route.name.split('/')[0];

          // Strictly filter out any route that is not one of the 5 primary tabs
          if (!PRIMARY_TAB_NAMES.includes(baseName) && !PRIMARY_TAB_NAMES.includes(route.name)) {
            return null;
          }
          if ((options as any).href === null) {
            return null;
          }

          const isFocused = currentBaseName === baseName;
          const label = (options.title as string) || baseName;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <Icon
                name={getTabIconName(route.name)}
                size={20}
                color={isFocused ? '#059669' : '#64748B'}
              />
              <Text
                variant="caption"
                weight={isFocused ? 'extrabold' : 'bold'}
                numberOfLines={1}
                style={{
                  color: isFocused ? '#059669' : '#64748B',
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomPillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Earnings',
        }}
      />
      <Tabs.Screen
        name="support/index"
        options={{
          title: 'Help',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />

      {/* Explicitly hide non-tab sub-stacks & secondary screens from bottom bar */}
      <Tabs.Screen name="kyc/index" options={{ href: null }} />
      <Tabs.Screen name="incentives/index" options={{ href: null }} />
      <Tabs.Screen name="leaderboard/index" options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="performance/index" options={{ href: null }} />
      <Tabs.Screen name="rewards/index" options={{ href: null }} />
      <Tabs.Screen name="settings/index" options={{ href: null }} />
      <Tabs.Screen name="support_feedback" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 36,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    maxWidth: 420,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabItemActive: {
    transform: [{ scale: 1.05 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
    marginTop: 2,
  },
});
