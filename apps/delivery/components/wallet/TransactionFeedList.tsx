import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { TransactionItem, TransactionFilterType } from '../../store/useTransactionStore';

interface TransactionFeedListProps {
  transactions: TransactionItem[];
  filterType: TransactionFilterType;
  onSelectFilter: (type: TransactionFilterType) => void;
}

export const TransactionFeedList: React.FC<TransactionFeedListProps> = ({
  transactions,
  filterType,
  onSelectFilter,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const filterOptions: { label: string; value: TransactionFilterType }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Credits', value: 'CREDIT' },
    { label: 'Debits', value: 'DEBIT' },
    { label: 'Bonuses', value: 'BONUS' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="sm" weight="extrabold" style={{ color: '#0F172A' }}>
          Recent transactions
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        {filterOptions.map((opt) => {
          const selected = filterType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.8}
              onPress={() => onSelectFilter(opt.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? '#059669' : '#F1F5F9',
                  borderRadius: 16,
                },
              ]}
            >
              <Text variant="caption" weight={selected ? 'extrabold' : 'medium'} style={{ color: selected ? '#FFF' : '#64748B', fontSize: 11 }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions Feed / Empty State */}
      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="account-balance-wallet" size={32} color="#94A3B8" />
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginTop: 8 }}>
            No transactions yet
          </Text>
          <Text variant="caption" style={{ color: '#64748B', textAlign: 'center', marginTop: 2 }}>
            Complete deliveries to start seeing earnings here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {transactions.map((t) => {
            const isPositive = t.type === 'CREDIT' || t.type === 'BONUS';

            return (
              <View key={t.id} style={styles.txnRow}>
                <View style={styles.arrowCircle}>
                  <Icon name={isPositive ? "arrow-upward" : "arrow-downward"} size={18} color={isPositive ? "#059669" : "#EF4444"} />
                </View>

                <View style={styles.metaCol}>
                  <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                    {t.description || 'Delivery Payout'}
                  </Text>
                  <Text variant="caption" style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="sm" weight="extrabold" style={{ color: isPositive ? '#059669' : '#EF4444' }}>
                    {isPositive ? '+' : '-'}₹{t.amount}
                  </Text>
                  {isPositive && (
                    <Text variant="caption" style={{ color: '#64748B', fontSize: 9, marginTop: 1 }}>
                      +₹{((t.amount || 0) * 0.15).toFixed(2)} tips
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  list: {
    gap: 12,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metaCol: {
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
});

export default TransactionFeedList;
