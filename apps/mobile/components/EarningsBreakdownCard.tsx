import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { env } from '../config/env';

interface EarningsBreakdownCardProps {
  orderId: string;
  grossAmount: number;
  platformCommission: number;
  taxAmount: number;
  netEarnings: number;
  date: string;
}

export const EarningsBreakdownCard = React.memo(function EarningsBreakdownCard({
  orderId,
  grossAmount,
  platformCommission,
  taxAmount,
  netEarnings,
  date,
}: EarningsBreakdownCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const handleDownloadInvoice = () => {
    Linking.openURL(`${env.API_URL}/finance/invoices/${orderId}/download`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>{t('walletCard.orderNum', { defaultValue: 'Order #{{id}}', id: orderId.slice(0, 8) })}</Text>
        <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('walletCard.grossAmount', 'Gross Amount')}</Text>
        <Text style={styles.value}>₹{(grossAmount || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('walletCard.platformCommission', 'Platform Commission')}</Text>
        <Text style={styles.negativeValue}>-₹{(platformCommission || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('walletCard.taxesGst', 'Taxes (GST)')}</Text>
        <Text style={styles.negativeValue}>-₹{(taxAmount || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.netLabel}>{t('walletCard.netEarnings', 'Net Earnings')}</Text>
        <Text style={styles.netValue}>₹{(netEarnings || 0).toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.invoiceButton} onPress={handleDownloadInvoice}>
        <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
        <Text style={styles.invoiceButtonText}>{t('walletCard.downloadInvoice', 'Download Invoice')}</Text>
      </TouchableOpacity>
    </View>
  );
});

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.dark,
  },
  date: {
    fontSize: 12,
    color: Colors.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.muted,
  },
  value: {
    fontSize: 14,
    color: Colors.dark,
  },
  negativeValue: {
    fontSize: 14,
    color: Colors.red,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  netValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  invoiceButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
});
