import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { ExecutionStep } from '../../store/useDeliveryStore';

interface ExecutionTimelineWidgetProps {
  currentStep: ExecutionStep;
}

export const ExecutionTimelineWidget: React.FC<ExecutionTimelineWidgetProps> = ({ currentStep }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const steps: { key: ExecutionStep; label: string; icon: string }[] = [
    { key: 'REACHED_CHEF', label: 'At Kitchen', icon: 'storefront' },
    { key: 'FOOD_PICKED', label: 'Picked Up', icon: 'inventory' },
    { key: 'HEADING_TO_CUSTOMER', label: 'En Route', icon: 'navigation' },
    { key: 'REACHED_CUSTOMER', label: 'At Gate', icon: 'home' },
    { key: 'OTP_VERIFIED', label: 'OTP Verified', icon: 'lock' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'check-circle' },
  ];

  const getStepStatus = (key: ExecutionStep) => {
    const sequence: ExecutionStep[] = [
      'REACHED_CHEF',
      'FOOD_PICKED',
      'HEADING_TO_CUSTOMER',
      'REACHED_CUSTOMER',
      'OTP_VERIFIED',
      'PROOF_UPLOADED',
      'DELIVERED',
    ];
    const currentIndex = sequence.indexOf(currentStep);
    const stepIndex = sequence.indexOf(key);

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
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.sm,
        },
      ]}
    >
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs }}>
        Handover Execution Progress
      </Text>

      <View style={styles.stepsRow}>
        {steps.map((s) => {
          const status = getStepStatus(s.key);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

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
  stepsRow: {
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

export default ExecutionTimelineWidget;
