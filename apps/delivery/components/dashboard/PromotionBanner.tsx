import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { PromotionData } from '../../store/useDashboardStore';

interface PromotionBannerProps {
  promotions: PromotionData | null;
}

export const PromotionBanner: React.FC<PromotionBannerProps> = ({ promotions }) => {
  const { colors, radius, shadows } = useTheme();

  const target = promotions?.weekend_incentive_target || 20;
  const current = promotions?.weekend_incentive_current || 12;
  const reward = promotions?.weekend_incentive_reward || 500;
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFDF0',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#FEF08A',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.bannerRow}>
        {/* Left: Golden Trophy Graphic */}
        <View style={styles.trophyCircle}>
          <Icon name="emoji-events" size={32} color="#D97706" />
        </View>

        {/* Middle: Title, Subtitle, & Progress Bar */}
        <View style={styles.midCol}>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 14 }}>
            Weekend Target Incentive
          </Text>

          <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 11 }}>
            {current} of {target} deliveries completed
          </Text>

          {/* Progress Track & Pill Badge */}
          <View style={styles.progressContainer}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
            <View style={styles.pctPill}>
              <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF', fontSize: 10 }}>
                {pct}%
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Win ₹500 Readout */}
        <View style={styles.rightCol}>
          <Text variant="caption" style={{ color: '#D97706', fontSize: 11 }}>
            Win
          </Text>
          <Text variant="h2" weight="extrabold" style={{ color: '#059669', fontSize: 24, marginTop: -2 }}>
            ₹{reward}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  midCol: {
    flex: 1,
    paddingRight: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginRight: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  pctPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default PromotionBanner;
