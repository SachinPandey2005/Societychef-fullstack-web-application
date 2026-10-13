import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { RouteOptimizationType } from '../../store/useNavigationStore';

interface RouteInfoCardProps {
  selectedType: RouteOptimizationType;
  onSelectRouteType: (type: RouteOptimizationType) => void;
}

export const RouteInfoCard: React.FC<RouteInfoCardProps> = ({
  selectedType,
  onSelectRouteType,
}) => {
  const { colors, spacing, radius } = useTheme();

  const options: { label: string; value: RouteOptimizationType; sub: string }[] = [
    { label: 'Fastest', value: 'FASTEST', sub: '11 mins (2.4 km)' },
    { label: 'Shortest', value: 'SHORTEST', sub: '14 mins (1.9 km)' },
    { label: 'Traffic Avoid', value: 'TRAFFIC_AWARE', sub: '12 mins (2.6 km)' },
  ];

  return (
    <View style={styles.container}>
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs }}>
        Route Optimization Options
      </Text>

      <View style={styles.row}>
        {options.map((opt) => {
          const isSelected = selectedType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.8}
              onPress={() => onSelectRouteType(opt.value)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: radius.medium,
                  padding: spacing.xs,
                },
              ]}
            >
              <Text
                variant="caption"
                weight={isSelected ? 'bold' : 'medium'}
                style={{ color: isSelected ? '#FFFFFF' : colors.text }}
              >
                {opt.label}
              </Text>
              <Text
                variant="caption"
                style={{ color: isSelected ? '#E2E8F0' : colors.textMuted, fontSize: 10, marginTop: 1 }}
              >
                {opt.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
});

export default RouteInfoCard;
