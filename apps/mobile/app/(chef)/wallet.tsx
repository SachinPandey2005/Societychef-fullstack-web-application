import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, FlatList, Text } from 'react-native';
// react-native's own SafeAreaView is a no-op on Android (doesn't apply
// status-bar insets, especially with edgeToEdgeEnabled: true) — use the real
// one, consistent with every other screen in this app.
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WalletBalanceCard } from '../../components/WalletBalanceCard';
import { TransactionHistory } from '../../components/TransactionHistory';
import { EarningsBreakdownCard } from '../../components/EarningsBreakdownCard';
import { apiClient } from '../../lib/apiClient';
import { getKitchen } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChefWalletScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<{ holder: string; ifsc: string; account: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [res, kitchen] = await Promise.all([
        apiClient.get('/finance/chef/earnings'),
        getKitchen(user?.chefProfileId || user?.id || ''),
      ]);
      if (res.success) {
        setWallet(res.data.wallet);
        setOrders(res.data.orders);
      }
      const bank = (kitchen as any)?.kitchenInfo?.kitchenDetails?.bankDetails || (kitchen as any)?.kitchenInfo?.bankDetails;
      setBankDetails(bank && bank.account ? bank : null);
    } catch (error) {
      console.error('Failed to load wallet', error);
      Alert.alert(t('chefWallet.errorTitle', 'Error'), t('chefWallet.loadFailed', 'Failed to load wallet details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdraw = async () => {
    // A payout request with no real bank account on file used to silently
    // submit placeholder values ({ account: '1234', ifsc: 'ABCD0123456' })
    // instead of the chef's actual saved details — meaning the request either
    // failed against real bank rails or, worse, routed to nobody. Require a
    // real saved account before allowing a withdrawal request at all.
    if (!bankDetails) {
      Alert.alert(
        t('chefWallet.noBankTitle', 'Add a bank account first'),
        t('chefWallet.noBankBody', "You need to add your payout bank account before you can withdraw."),
        [
          { text: t('chefWallet.cancel', 'Cancel'), style: 'cancel' },
          { text: t('chefWallet.addBankAccount', 'Add bank account'), onPress: () => router.push('/(chef)/settlements') },
        ]
      );
      return;
    }

    try {
      Alert.alert(t('chefWallet.withdrawTitle', 'Withdraw Request'), t('chefWallet.withdrawBody', 'Requesting payout of available balance...'), [
        { text: t('chefWallet.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('chefWallet.confirm', 'Confirm'),
          onPress: async () => {
            // Endpoint path was previously '/finance/payout/request' (singular),
            // which doesn't exist — the real, chef-role-gated route is plural.
            // bank_details is no longer sent from the client at all: the backend
            // now resolves the chef's own saved bank account server-side and
            // ignores anything submitted here, so a request can't be redirected
            // to an arbitrary account (see finance.controller.ts#requestPayout).
            const res = await apiClient.post('/finance/payouts/request', {
              amount: wallet?.available_balance || 0,
            });
            if (res.success) {
              Alert.alert(t('chefWallet.successTitle', 'Success'), t('chefWallet.payoutRequested', 'Payout requested successfully'));
              fetchWalletData();
            } else {
              Alert.alert(t('chefWallet.errorTitle', 'Error'), t('chefWallet.payoutFailed', 'Failed to request payout'));
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert(t('chefWallet.errorTitle', 'Error'), t('chefWallet.payoutFailed', 'Failed to request payout'));
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <EarningsBreakdownCard
      orderId={item.id}
      grossAmount={item.grand_total}
      platformCommission={item.platform_commission}
      taxAmount={item.tax_amount}
      netEarnings={item.net_chef_earnings}
      date={item.created_at}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: t('chefWallet.screenTitle', 'Earnings & Wallet'), headerShadowVisible: false }} />
      <View style={styles.container}>
        <WalletBalanceCard 
          balance={wallet?.available_balance || 0} 
          currency={'₹'}
          loading={loading}
          isChef={true}
          onWithdraw={handleWithdraw}
        />
        
        <View style={styles.pendingContainer}>
          <Text style={styles.pendingText}>{t('chefWallet.pendingSettlements', { defaultValue: 'Pending Settlements: ₹{{amount}}', amount: wallet?.pending_balance || 0 })}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('chefWallet.recentBreakdown', 'Recent Earnings Breakdown')}</Text>
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  pendingContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  pendingText: {
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  }
});
