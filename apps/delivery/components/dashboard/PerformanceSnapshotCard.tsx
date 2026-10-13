import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { PerformanceMetrics } from '../../store/usePerformanceStore';

interface PerformanceSnapshotCardProps {
  metrics: PerformanceMetrics | null;
  onPressView?: () => void;
}

export const PerformanceSnapshotCard: React.FC<PerformanceSnapshotCardProps> = ({
  metrics,
  onPressView,
}) => {
  const { colors, radius, shadows } = useTheme();

  const levelText = metrics?.level || 'Level 3 Captain';
  const rating = metrics?.rating ?? 4.92;
  const acceptance = metrics?.acceptance_rate ?? 98.4;
  const completion = metrics?.completion_rate ?? 99.1;
  const onTime = metrics?.on_time_delivery_rate ?? 97.8;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      {/* Header Row: Title & View Details -> */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="trending-up" size={16} color="#059669" />
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6, fontSize: 13 }}>
            Performance & Level
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={onPressView}>
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
            View Details →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5-Column Stats Row */}
      <View style={styles.row}>
        {/* Column 1: Shield & Level */}
        <View style={styles.col}>
          <View style={styles.shieldRow}>
            <View style={styles.shieldBg}>
              <Icon name="verified-user" size={16} color="#059669" />
            </View>
            <View style={{ marginLeft: 4 }}>
              <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', fontSize: 10 }}>
                Level 3
              </Text>
              <Text variant="caption" style={{ color: '#64748B', fontSize: 9 }}>
                Captain
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Column 2: Rating */}
        <View style={styles.col}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="star" size={12} color="#EAB308" />
            <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', marginLeft: 3, fontSize: 11 }}>
              {rating}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>
            Rating
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Column 3: Acceptance */}
        <View style={styles.col}>
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
            {acceptance}%
          </Text>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>
            Acceptance
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Column 4: Completion */}
        <View style={styles.col}>
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
            {completion}%
          </Text>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>
            Completion
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Column 5: On-Time */}
        <View style={styles.col}>
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
            {onTime}%
          </Text>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>
            On-Time
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    flexShrink: 1,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
});

export default PerformanceSnapshotCard;
