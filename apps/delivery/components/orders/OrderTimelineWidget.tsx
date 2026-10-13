import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { OrderLifecycleStatus } from '../../store/useOrderStore';

interface OrderTimelineWidgetProps {
  status: OrderLifecycleStatus;
}

export const OrderTimelineWidget: React.FC<OrderTimelineWidgetProps> = ({ status }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const steps: { key: OrderLifecycleStatus; label: string; icon: string }[] = [
    { key: 'ACCEPTED', label: 'Accepted', icon: 'check-circle' },
    { key: 'HEADING_TO_CHEF', label: 'To Kitchen', icon: 'navigation' },
    { key: 'REACHED_CHEF', label: 'At Kitchen', icon: 'storefront' },
    { key: 'FOOD_PICKED', label: 'Picked Up', icon: 'inventory' },
    { key: 'HEADING_TO_CUSTOMER', label: 'To Customer', icon: 'navigation' },
    { key: 'REACHED_CUSTOMER', label: 'Arrived', icon: 'home' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'check-circle' },
  ];

  const getStepState = (stepKey: OrderLifecycleStatus) => {
    const sequence: OrderLifecycleStatus[] = [
      'ASSIGNED',
      'ACCEPTED',
      'HEADING_TO_CHEF',
      'REACHED_CHEF',
      'FOOD_PICKED',
      'HEADING_TO_CUSTOMER',
      'REACHED_CUSTOMER',
      'DELIVERED',
      'COMPLETED',
    ];
    const currentIndex = sequence.indexOf(status);
    const stepIndex = sequence.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.large,
          padding: spacing.md,
          marginTop: spacing.sm,
          ...shadows.sm,
        },
      ]}
    >
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs }}>
        Delivery Timeline
      </Text>

      <View style={styles.stepsContainer}>
        {steps.map((s, idx) => {
          const stepState = getStepState(s.key);
          const isCompleted = stepState === 'completed';
          const isActive = stepState === 'active';

          return (
            <View key={s.key} style={styles.stepColumn}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isCompleted || isActive ? colors.primary : colors.border,
                    borderColor: isActive ? colors.primary : 'transparent',
                    borderWidth: isActive ? 2 : 0,
                  },
                ]}
              >
                <Icon
                  name={s.icon as any}
                  size={12}
                  color={isCompleted || isActive ? '#FFFFFF' : colors.textMuted}
                />
              </View>

              <Text
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? 'primary' : isCompleted ? 'secondary' : 'muted'}
                style={styles.stepText}
                numberOfLines={1}
              >
                {s.label}
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
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepColumn: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 9,
    textAlign: 'center',
  },
});

export default OrderTimelineWidget;
