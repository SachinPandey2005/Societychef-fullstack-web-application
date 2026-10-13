import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REVERSAL' | 'ADJUSTMENT';
  source: string;
  created_at: string;
  description?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
  scrollEnabled?: boolean;
}

export function TransactionHistory({ transactions, loading, scrollEnabled = true }: TransactionHistoryProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>{t('walletCard.noTransactions', 'No recent transactions')}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'CREDIT' || item.type === 'RELEASE';
    const isHold = item.type === 'HOLD';
    const amountColor = isCredit ? '#4CAF50' : isHold ? '#FF9800' : '#F44336';
    const sign = isCredit ? '+' : isHold ? '' : '-';

    const formattedDate = new Date(item.created_at).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <View style={styles.transactionRow}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={isCredit ? 'arrow-down-circle' : isHold ? 'lock-closed' : 'arrow-up-circle'} 
            size={24} 
            color={amountColor} 
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.sourceText}>{item.source}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
          {item.description && <Text style={styles.descText}>{item.description}</Text>}
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {sign}₹{item.amount.toFixed(2)}
          </Text>
          <Text style={styles.typeText}>{t(`walletCard.txn.${item.type}`, item.type)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('walletCard.recentTransactions', 'Recent Transactions')}</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        scrollEnabled={scrollEnabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  center: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    paddingHorizontal: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  descText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  }
});
