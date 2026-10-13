import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Switch } from '../ui/Switch';
import { AvailabilityStateMode } from '../../store/useAvailabilityStore';

interface AvailabilityToggleCardProps {
  status: AvailabilityStateMode;
  isOnline: boolean;
  isUpdating: boolean;
  onToggleOnline: () => void;
  onSelectStatus: (status: AvailabilityStateMode) => void;
}

export const AvailabilityToggleCard: React.FC<AvailabilityToggleCardProps> = ({
  status,
  isOnline,
  isUpdating,
  onToggleOnline,
  onSelectStatus,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          paddingHorizontal: 18,
          paddingVertical: 16,
          marginVertical: 6,
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isOnline ? '#10B981' : '#94A3B8',
              }}
            />
            <Text variant="md" weight="extrabold" style={{ color: '#0F172A' }}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#64748B', marginTop: 3, fontSize: 11 }}>
            {isOnline ? 'Open to any delivery' : 'Offline • You won\'t receive new delivery requests'}
          </Text>
        </View>

        <View style={styles.switchCol}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Switch value={isOnline} onValueChange={onToggleOnline} activeColor="#10B981" />
          )}
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
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  switchCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvailabilityToggleCard;
