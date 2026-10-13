import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

// Stores & Repositories
import { useWalletStore } from '../../store/useWalletStore';
import { useEarningsStore } from '../../store/useEarningsStore';
import { useSettlementStore } from '../../store/useSettlementStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { usePayoutStore } from '../../store/usePayoutStore';
import { useBankStore } from '../../store/useBankStore';

import { WalletRepository } from '../../repositories/WalletRepository';
import { EarningsRepository } from '../../repositories/EarningsRepository';
import { SettlementRepository } from '../../repositories/SettlementRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { PayoutRepository } from '../../repositories/PayoutRepository';
import { BankRepository } from '../../repositories/BankRepository';

// Wallet Components
import {
  WalletSummaryCard,
  EarningsItemCard,
  SettlementTabsWidget,
  BankDetailsCard,
  TipsSummaryCard,
  PenaltiesListWidget,
  PayoutRequestModal,
  StatementDownloadModal,
} from '../../components/wallet';

export default function WalletScreen() {
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const { summary, isLoading } = useWalletStore();
  const { earningsList } = useEarningsStore();
  const { settlementsList, activeTab, setActiveTab } = useSettlementStore();
  const { isSubmitting } = usePayoutStore();
  const { bankDetails } = useBankStore();

  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [statementModalVisible, setStatementModalVisible] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('WEEK');

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  useEffect(() => {
    WalletRepository.fetchSummary();
    EarningsRepository.fetchEarningsBreakdown();
    SettlementRepository.fetchSettlements(activeTab);
    TransactionRepository.fetchTransactions();
    PayoutRepository.fetchPayoutHistory();
  }, []);

  const handleRefresh = useCallback(async () => {
    await WalletRepository.fetchSummary();
    await EarningsRepository.fetchEarningsBreakdown();
    await SettlementRepository.fetchSettlements(activeTab);
    await TransactionRepository.fetchTransactions();
    await PayoutRepository.fetchPayoutHistory();
    showToast('Financial summary updated', 'info');
  }, [activeTab]);

  return (
    <ScreenWrapper>
      {/* Top Header Bar matching mockup */}
      <View style={styles.headerBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.walletIconCircle}>
            <Icon name="account-balance-wallet" size={24} color="#059669" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text variant="md" weight="extrabold" style={{ color: '#0F172A', fontSize: 20 }}>
              Earnings
            </Text>
            <Text variant="caption" style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
              Track your earnings & payouts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setStatementModalVisible(true)}
          style={styles.stmtBtn}
        >
          <Icon name="file-download" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollableLayout
        refreshing={isLoading}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 6 }}
      >
        {/* 1. Live Wallet Balance & Earnings Card */}
        <WalletSummaryCard
          summary={summary}
          onRequestPayout={() => setPayoutModalVisible(true)}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />

        {/* 2. Linked Bank Account & UPI Details Card */}
        <BankDetailsCard
          bankDetails={bankDetails}
          onUpdateBankDetails={async (details) => {
            await BankRepository.updateDetails(details);
            showToast('Bank details submitted for verification', 'success');
          }}
        />

        {/* 3. Ops CRM Settlement Cycles Card */}
        <SettlementTabsWidget
          activeTab={activeTab}
          settlements={settlementsList}
          onSelectTab={(tab) => setActiveTab(tab)}
          onSelectSettlement={(id) => showToast(`Opening Settlement #${id} breakdown...`, 'info')}
        />

        {/* 4. Customer Tips Summary Card */}
        <TipsSummaryCard todayTips={80} monthlyTips={1450} lifetimeTips={6200} />

        {/* 5. Applied Financial Penalties Card */}
        <PenaltiesListWidget
          onAppeal={(id) => showToast(`Appeal submitted for penalty #${id} to CRM`, 'info')}
        />

        {/* 6. Order Earnings Breakdown Accordion Feed */}
        <View style={{ marginTop: 14 }}>
          <Text variant="caption" weight="extrabold" style={{ color: '#64748B', letterSpacing: 0.8, fontSize: 11, marginBottom: 6 }}>
            EARNINGS BREAKDOWN
          </Text>
          {earningsList.length === 0 ? (
            <View style={styles.emptyEarningsBox}>
              <Icon name="account-balance-wallet" size={32} color="#94A3B8" />
              <Text variant="sm" weight="bold" style={{ color: '#0F172A', marginTop: 8 }}>
                No order earnings yet
              </Text>
              <Text variant="caption" style={{ color: '#64748B', textAlign: 'center', marginTop: 2 }}>
                Your completed delivery earnings will appear here.
              </Text>
            </View>
          ) : (
            earningsList.map((item) => (
              <EarningsItemCard
                key={item.order_id}
                earning={item}
                isExpanded={expandedOrderId === item.order_id}
                onToggleExpand={() => handleToggleExpand(item.order_id)}
              />
            ))
          )}
        </View>
      </ScrollableLayout>

      {/* Payout Request Modal */}
      <PayoutRequestModal
        visible={payoutModalVisible}
        availableBalance={summary?.available_balance || 4250}
        onClose={() => setPayoutModalVisible(false)}
        onRequestPayout={async (amount) => {
          await PayoutRepository.requestInstantPayout(amount);
          showToast(`Payout request for ₹${amount} submitted to Ops CRM!`, 'success');
        }}
        isSubmitting={isSubmitting}
      />

      {/* Statement Download Modal */}
      <StatementDownloadModal
        visible={statementModalVisible}
        onClose={() => setStatementModalVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stmtBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEarningsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    marginVertical: 6,
  },
});
