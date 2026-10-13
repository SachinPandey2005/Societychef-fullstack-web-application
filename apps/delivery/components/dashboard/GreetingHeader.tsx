import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { GreetingData } from '../../store/useDashboardStore';

interface GreetingHeaderProps {
  greeting: GreetingData | null;
  isOnline?: boolean;
  isUpdating?: boolean;
  onToggleOnline?: () => void;
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
  notificationCount?: number;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  greeting,
  isOnline = true,
  isUpdating = false,
  onToggleOnline,
  onPressProfile,
  onPressNotifications,
  notificationCount = 3,
}) => {
  const { colors, radius, shadows } = useTheme();

  const name = greeting?.name || 'New User';

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}! 👋`;
    if (hour < 17) return `Good afternoon, ${name}! 👋`;
    return `Good evening, ${name}! 👋`;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      {/* Top Bell Button Positioned Absolutely at Top Right */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressNotifications}
        style={styles.bellBtn}
      >
        <Icon name="notifications-none" size={20} color="#0F172A" />
        {notificationCount > 0 && (
          <View style={styles.badgeCircle}>
            <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF', fontSize: 9 }}>
              {notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.contentRow}>
        {/* Left Side: Avatar & Rider Info */}
        <TouchableOpacity activeOpacity={0.8} onPress={onPressProfile} style={styles.avatarCircle}>
          <Icon name="person" size={32} color="#059669" />
        </TouchableOpacity>

        <View style={styles.textCol}>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 15 }}>
            {getGreetingText()}
          </Text>
          
          <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 11 }}>
            Ready to deliver happiness
          </Text>

          {/* Duty Buttons Row */}
          <View style={styles.dutyRow}>
            {isOnline ? (
              <View style={styles.onlinePill}>
                <View style={styles.greenDot} />
                <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11, marginLeft: 4 }}>
                  ONLINE
                </Text>
              </View>
            ) : (
              <View style={styles.offlinePill}>
                <View style={styles.grayDot} />
                <Text variant="caption" weight="extrabold" style={{ color: '#64748B', fontSize: 11, marginLeft: 4 }}>
                  OFFLINE
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onToggleOnline}
              disabled={isUpdating}
              style={styles.toggleOutlineBtn}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text variant="caption" weight="bold" style={{ color: '#334155', fontSize: 11 }}>
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Side: Scooter Vector Illustration */}
        <View style={styles.scooterCol}>
          <View style={styles.scooterBgCircle}>
            <Icon name="two-wheeler" size={38} color="#059669" />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    position: 'relative',
  },
  bellBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textCol: {
    flex: 1,
    paddingRight: 6,
  },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  grayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  toggleOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  scooterCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scooterBgCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GreetingHeader;
