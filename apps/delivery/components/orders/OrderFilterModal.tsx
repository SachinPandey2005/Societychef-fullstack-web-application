import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { HistoryFilterOptions } from '../../store/useHistoryStore';

interface OrderFilterModalProps {
  visible: boolean;
  filters: HistoryFilterOptions;
  onClose: () => void;
  onApplyFilters: (newFilters: Partial<HistoryFilterOptions>) => void;
  onReset: () => void;
}

export const OrderFilterModal: React.FC<OrderFilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApplyFilters,
  onReset,
}) => {
  const { colors, spacing, radius } = useTheme();

  const [statusFilter, setStatusFilter] = useState(filters.statusFilter || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(filters.priorityFilter || 'ALL');
  const [dateRange, setDateRange] = useState<HistoryFilterOptions['dateRange']>(filters.dateRange || 'ALL');

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: 'ALL' },
    { label: 'VIP', value: 'VIP' },
    { label: 'Express', value: 'EXPRESS' },
    { label: 'High Value', value: 'HIGH_VALUE' },
    { label: 'Festival', value: 'FESTIVAL' },
    { label: 'Corporate', value: 'CORPORATE' },
  ];

  const dateOptions: { label: string; value: HistoryFilterOptions['dateRange'] }[] = [
    { label: 'All Time', value: 'ALL' },
    { label: 'Today', value: 'TODAY' },
    { label: 'Yesterday', value: 'YESTERDAY' },
    { label: 'This Week', value: 'THIS_WEEK' },
  ];

  const handleApply = () => {
    onApplyFilters({ statusFilter, priorityFilter, dateRange });
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Filter Order History
        </Text>

        {/* Status Filter */}
        <Text variant="xs" weight="bold" color="secondary" style={{ marginTop: spacing.md }}>
          Filter by Status
        </Text>
        <View style={[styles.chipsRow, { marginTop: 4 }]}>
          {statusOptions.map((opt) => {
            const selected = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                    borderRadius: radius.pill,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text variant="caption" weight={selected ? 'bold' : 'medium'} style={{ color: selected ? '#FFF' : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Priority Filter */}
        <Text variant="xs" weight="bold" color="secondary" style={{ marginTop: spacing.md }}>
          Filter by Priority
        </Text>
        <View style={[styles.chipsRow, { marginTop: 4 }]}>
          {priorityOptions.map((opt) => {
            const selected = priorityFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => setPriorityFilter(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                    borderRadius: radius.pill,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text variant="caption" weight={selected ? 'bold' : 'medium'} style={{ color: selected ? '#FFF' : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Range Filter */}
        <Text variant="xs" weight="bold" color="secondary" style={{ marginTop: spacing.md }}>
          Filter by Date Range
        </Text>
        <View style={[styles.chipsRow, { marginTop: 4 }]}>
          {dateOptions.map((opt) => {
            const selected = dateRange === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => setDateRange(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                    borderRadius: radius.pill,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text variant="caption" weight={selected ? 'bold' : 'medium'} style={{ color: selected ? '#FFF' : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <Button label="Reset All" onPress={onReset} variant="outline" size="md" style={{ flex: 1 }} />
          <Button label="Apply Filters" onPress={handleApply} variant="primary" size="md" style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default OrderFilterModal;
