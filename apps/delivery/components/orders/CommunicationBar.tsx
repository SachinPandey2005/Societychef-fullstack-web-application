import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface CommunicationBarProps {
  onCallCustomer: () => void;
  onCallChef: () => void;
  onOpenQuickMessages: () => void;
  onOpenSupport: () => void;
}

export const CommunicationBar: React.FC<CommunicationBarProps> = ({
  onCallCustomer,
  onCallChef,
  onOpenQuickMessages,
  onOpenSupport,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const buttons = [
    { label: 'Call Customer', icon: 'phone', color: colors.primary, onPress: onCallCustomer },
    { label: 'Call Chef', icon: 'phone', color: colors.secondary, onPress: onCallChef },
    { label: 'Quick Message', icon: 'chat', color: colors.info, onPress: onOpenQuickMessages },
    { label: 'Support', icon: 'help-outline', color: colors.warning, onPress: onOpenSupport },
  ];

  return (
    <View style={styles.container}>
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>
        Order Communication Shortcuts
      </Text>

      <View style={styles.grid}>
        {buttons.map((b, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={b.onPress}
            style={[
              styles.btn,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.medium,
                paddingVertical: spacing.sm,
                ...shadows.sm,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: b.color + '1F' }]}>
              <Icon name={b.icon as any} size={16} colorType="primary" />
            </View>
            <Text variant="caption" weight="bold" align="center" style={{ marginTop: 4 }}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunicationBar;
