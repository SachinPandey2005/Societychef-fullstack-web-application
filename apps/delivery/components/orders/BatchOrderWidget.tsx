import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { BatchStopItem } from '../../store/useDispatchStore';

interface BatchOrderWidgetProps {
  stops: BatchStopItem[];
  currentIndex: number;
}

export const BatchOrderWidget: React.FC<BatchOrderWidgetProps> = ({ stops, currentIndex }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (!stops || stops.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.large,
          padding: spacing.md,
          marginTop: spacing.md,
          borderColor: colors.secondary,
          borderWidth: 1.5,
          ...shadows.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="layers" size={18} colorType="secondary" />
          <Text variant="sm" weight="extrabold" style={{ marginLeft: spacing.xs }}>
            Batched Delivery ({stops.length} Stops)
          </Text>
        </View>

        <View style={[styles.batchBadge, { backgroundColor: colors.secondary }]}>
          <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF' }}>
            STOP {currentIndex + 1} OF {stops.length}
          </Text>
        </View>
      </View>

      <View style={[styles.stopsList, { marginTop: spacing.xs }]}>
        {stops.map((stop, idx) => {
          const isCurrent = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <View
              key={idx}
              style={[
                styles.stopItem,
                {
                  backgroundColor: isCurrent ? colors.surfaceElevated : colors.surface,
                  borderColor: isCurrent ? colors.secondary : colors.border,
                  borderRadius: radius.medium,
                  padding: spacing.sm,
                },
              ]}
            >
              <View style={styles.stopHeader}>
                <View
                  style={[
                    styles.stopNumCircle,
                    {
                      backgroundColor: isCompleted ? colors.success : isCurrent ? colors.secondary : colors.textMuted,
                    },
                  ]}
                >
                  <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF' }}>
                    {stop.stop_number}
                  </Text>
                </View>

                <Text variant="xs" weight="bold" style={{ marginLeft: 8, flex: 1 }}>
                  {stop.type === 'PICKUP' ? 'PICKUP: ' : 'DROP: '}{stop.location_name}
                </Text>

                <Text variant="caption" weight="bold" color="primary">
                  #{stop.order_number}
                </Text>
              </View>

              <Text variant="caption" color="secondary" style={{ marginTop: 2, marginLeft: 28 }}>
                {stop.address}
              </Text>
            </View>
          );
        })}
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
  },
  batchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stopsList: {
    gap: 6,
  },
  stopItem: {
    borderWidth: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BatchOrderWidget;
