import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { OrderLifecycleStatus } from '../../store/useOrderStore';

interface OrderHeaderProps {
  orderNumber: string;
  status: OrderLifecycleStatus;
  etaMinutes?: number;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ orderNumber, status, etaMinutes = 15 }) => {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={20} colorType="primary" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text variant="sm" weight="extrabold">
          Order #{orderNumber}
        </Text>
        <Text variant="caption" color="secondary">
          ETA: ~{etaMinutes} mins
        </Text>
      </View>

      <StatusChip status={status.toLowerCase() as any} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
});

export default OrderHeader;
