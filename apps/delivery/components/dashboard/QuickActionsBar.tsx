import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface QuickActionsBarProps {
  isOnline?: boolean;
  onToggleOnline?: () => void;
  onViewOrders: () => void;
  onViewNavigation: () => void;
  onViewWallet: () => void;
  onViewSupport: () => void;
  onTriggerSos: () => void;
  onViewProfile: () => void;
  onViewPerformance?: () => void;
  onViewLeaderboard?: () => void;
  onViewRewards?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  isOnline = true,
  onToggleOnline,
  onViewOrders,
  onViewNavigation,
  onViewWallet,
  onViewSupport,
  onTriggerSos,
  onViewProfile,
  onViewPerformance,
  onViewLeaderboard,
  onViewRewards,
}) => {
  const { colors, shadows } = useTheme();

  const actions = [
    {
      label: isOnline ? 'Go Offline' : 'Go Online',
      icon: isOnline ? 'wifi-off' : 'wifi',
      bgColor: isOnline ? '#FEF3C7' : '#E6F4EA',
      iconColor: isOnline ? '#D97706' : '#059669',
      onPress: onToggleOnline || (() => {}),
    },
    {
      label: 'Navigation',
      icon: 'map',
      bgColor: '#ECFDF5',
      iconColor: '#059669',
      onPress: onViewNavigation,
    },
    {
      label: 'Orders',
      icon: 'assignment',
      bgColor: '#EFF6FF',
      iconColor: '#2563EB',
      onPress: onViewOrders,
    },
    {
      label: 'Earnings',
      icon: 'account-balance-wallet',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      onPress: onViewWallet,
    },
    {
      label: 'Support',
      icon: 'headset-mic',
      bgColor: '#EFF6FF',
      iconColor: '#2563EB',
      onPress: onViewSupport,
    },
    {
      label: 'SOS Panic',
      icon: 'notification-important',
      bgColor: '#FEE2E2',
      iconColor: '#EF4444',
      onPress: onTriggerSos,
    },
    {
      label: 'Performance',
      icon: 'bar-chart',
      bgColor: '#D1FAE5',
      iconColor: '#059669',
      onPress: onViewPerformance || (() => {}),
    },
    {
      label: 'Rewards',
      icon: 'card-giftcard',
      bgColor: '#FCE7F3',
      iconColor: '#DB2777',
      onPress: onViewRewards || (() => {}),
    },
    {
      label: 'Leaderboard',
      icon: 'emoji-events',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      onPress: onViewLeaderboard || (() => {}),
    },
    {
      label: 'Wallet',
      icon: 'credit-card',
      bgColor: '#E0F2FE',
      iconColor: '#0284C7',
      onPress: onViewWallet,
    },
    {
      label: 'Profile',
      icon: 'person',
      bgColor: '#D1FAE5',
      iconColor: '#059669',
      onPress: onViewProfile,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 14 }}>
          Quick Actions
        </Text>
        <Text variant="caption" style={{ color: '#64748B', fontSize: 11 }}>
          Slide ›
        </Text>
      </View>

      {/* Horizontal Sliding Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={94}
        snapToAlignment="start"
      >
        {actions.map((act, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={act.onPress}
            style={[
              styles.actionCard,
              {
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                borderColor: '#E2E8F0',
                borderWidth: 1,
                ...shadows.xs,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: act.bgColor }]}>
              <Icon name={act.icon as any} size={22} color={act.iconColor} />
            </View>
            <Text
              variant="caption"
              weight="extrabold"
              numberOfLines={1}
              style={{ color: '#0F172A', fontSize: 10, marginTop: 8, textAlign: 'center' }}
            >
              {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  actionCard: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default QuickActionsBar;
