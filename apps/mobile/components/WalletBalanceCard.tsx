import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';

interface WalletBalanceCardProps {
  balance: number;
  currency?: string;
  loading?: boolean;
  onTopup?: () => void;
  onWithdraw?: () => void;
  isChef?: boolean;
}

export function WalletBalanceCard({ balance, currency = '₹', loading, onTopup, onWithdraw, isChef }: WalletBalanceCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('walletCard.availableBalance', 'Available Balance')}</Text>
        <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
      </View>

      <View style={styles.balanceContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Text style={styles.balance}>{currency}{balance?.toFixed(2) || '0.00'}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {!isChef && onTopup && (
          <TouchableOpacity style={styles.button} onPress={onTopup}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t('walletCard.addMoney', 'Add Money')}</Text>
          </TouchableOpacity>
        )}

        {isChef && onWithdraw && (
          <TouchableOpacity style={styles.button} onPress={onWithdraw}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t('walletCard.withdraw', 'Withdraw')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { boxShadow: `0px 4px 20px ${Colors.border}80` },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: Colors.muted,
    fontWeight: '600',
  },
  balanceContainer: {
    marginVertical: 15,
  },
  balance: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.dark,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
});
