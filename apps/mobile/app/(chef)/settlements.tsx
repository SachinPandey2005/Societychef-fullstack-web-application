import React, { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { SummaryLine } from '../../components/ui/SummaryLine';
import { getChefSettlement, getKitchen, updateKitchenProfile } from '../../services';
import { money } from '../../lib/format';
import { formatNiceDate } from '../../lib/dateUtils';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../lib/apiClient';

type Settlement = {
  gross: number;
  platformFee: number;
  gatewayFee: number;
  net: number;
};

type SettlementHistoryItem = {
  id: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  net_payable: number;
};

export default function SettlementsScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { user } = useAuthStore();

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [kitchen, setKitchen] = useState<any>(null);
  const [history, setHistory] = useState<SettlementHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bank edit modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sData, kData, historyRes] = await Promise.all([
          getChefSettlement(),
          getKitchen(user?.chefProfileId || user?.id || ''),
          apiClient.get('/finance/settlements').catch(() => null),
        ]);
        setSettlement(sData);
        if (kData) setKitchen(kData);
        if (historyRes?.success && Array.isArray(historyRes.data)) {
          setHistory(historyRes.data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  function openBankModal() {
    const existingBank = kitchen?.kitchenInfo?.kitchenDetails?.bankDetails || kitchen?.kitchenInfo?.bankDetails;
    setHolderName(existingBank?.holder || user?.displayName || '');
    setIfscCode(existingBank?.ifsc || '');
    setAccountNumber(existingBank?.account || '');
    setShowBankModal(true);
  }

  async function handleSaveBank() {
    if (!holderName.trim() || !ifscCode.trim() || !accountNumber.trim()) {
      Alert.alert(t('settlements.requiredTitle', 'Required'), t('settlements.fillAllBank', 'Please fill in all bank details.'));
      return;
    }

    setIsSavingBank(true);
    try {
      const chefProfileId = user?.chefProfileId || user?.id || '';
      const updated = await updateKitchenProfile(chefProfileId, {
        bankDetails: {
          holder: holderName.trim(),
          ifsc: ifscCode.trim().toUpperCase(),
          account: accountNumber.trim(),
        },
        bankStatus: 'verified',
        kitchenInfo: {
          bankDetails: {
            holder: holderName.trim(),
            ifsc: ifscCode.trim().toUpperCase(),
            account: accountNumber.trim(),
          },
        },
      } as any);

      if (updated) setKitchen(updated);
      setShowBankModal(false);
      Alert.alert(t('settlements.success', 'Success'), t('settlements.bankUpdated', 'Payout bank account updated successfully!'));
    } catch (e: any) {
      // This used to claim success ("Bank details saved to your profile") on
      // any failure here, including a real save failure — meaning a chef could
      // believe their payout account was on file when it wasn't, and only find
      // out when a payout silently had nowhere to go. Report the real failure.
      Alert.alert(
        t('settlements.saveFailedTitle', 'Could not save bank details'),
        e?.message || t('settlements.saveFailedBody', 'Please check the details and try again.')
      );
    } finally {
      setIsSavingBank(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullscreen label={t('settlements.loading', 'Loading settlements...')} />;
  }

  const s = settlement ?? { gross: 0, platformFee: 0, gatewayFee: 0, net: 0 };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.dark} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('settlements.back', 'Back')}</Text>
            </Pressable>
            <LanguageTogglePill />
          </View>

          <ScreenTitle eyebrow={t('settlements.finance', 'Finance')} title={t('settlements.title', 'Settlements')} />

        {/* Settlement hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{t('settlements.nextPayout', 'NEXT PAYOUT')}</Text>
          <Text style={styles.heroAmount}>{money(s.net)}</Text>
          <Text style={styles.heroSub}>{t('settlements.weeklyCycle', 'Weekly settlement cycle')}</Text>
        </View>

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text style={styles.sectionTitle}>{t('settlements.howPaymentsWork', 'How payments work')}</Text>
          <View style={styles.flowStep}>
            <View style={styles.flowDot} />
            <Text style={styles.flowText}>{t('settlements.flow1', 'Consumer pays RasoHi via our payment gateway')}</Text>
          </View>
          <View style={styles.flowStep}>
            <View style={styles.flowDot} />
            <Text style={styles.flowText}>{t('settlements.flow2', 'RasoHi deducts platform fee (10%) and gateway fee (2%)')}</Text>
          </View>
          <View style={[styles.flowStep, styles.flowStepLast]}>
            <View style={[styles.flowDot, styles.flowDotGreen]} />
            <Text style={[styles.flowText, { color: Colors.primary, fontWeight: '700' }]}>
              {t('settlements.flow3', 'Net amount settled directly to your bank account')}
            </Text>
          </View>
          <Text style={styles.flowNote}>
            {t('settlements.flowNote', "You never handle cash or UPI from consumers. All money flows through RasoHi's payment gateway.")}
          </Text>
        </Card>

        {/* Bill breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t('settlements.weekBreakdown', "This week's breakdown")}</Text>
          <SummaryLine label={t('settlements.grossCollected', 'Gross collected by RasoHi')} value={money(s.gross)} />
          <SummaryLine label={t('settlements.platformFee', 'Platform fee (10%)')}          value={`-${money(s.platformFee)}`} />
          <SummaryLine label={t('settlements.gatewayFee', 'Payment gateway fee (2%)')}    value={`-${money(s.gatewayFee)}`} />
          <SummaryLine
            label={t('settlements.netPayout', 'Your net payout')}
            value={money(s.net)}
            strong
            separator
          />
        </Card>

        {/* Bank details */}
        {(() => {
          const bankDetails = kitchen?.kitchenInfo?.kitchenDetails?.bankDetails || kitchen?.kitchenInfo?.bankDetails;
          const hasBank = !!(bankDetails && bankDetails.account);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.sectionTitle}>{t('settlements.payoutBankAccount', 'Payout bank account')}</Text>
                <Pressable onPress={openBankModal}>
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>
                    {hasBank ? t('settlements.editDetails', 'Edit details') : t('settlements.addBankAccountPlus', '+ Add bank account')}
                  </Text>
                </Pressable>
              </View>
              {hasBank ? (
                <>
                  <Text style={styles.bankDetails}>
                    {t('settlements.bankLine', { defaultValue: 'Account holder: {{holder}} · IFSC: {{ifsc}} · Account: {{account}}', holder: bankDetails.holder, ifsc: bankDetails.ifsc, account: bankDetails.account.length > 4 ? `XXXXXX${bankDetails.account.slice(-4)}` : bankDetails.account })}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={t('settlements.verified', 'Verified')} tone="green" small />
                    <Badge label={t('settlements.weeklyPayout', 'Weekly payout')} tone="blue" small />
                  </View>
                </>
              ) : (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 12 }}>
                    {t('settlements.noBankYet', 'No bank account added yet. Add your bank details to receive your weekly payouts directly.')}
                  </Text>
                  <Button label={t('settlements.addBankAccount', 'Add bank account')} variant="primary" onPress={openBankModal} />
                </View>
              )}
            </Card>
          );
        })()}

        {/* Bank Edit Modal */}
        <Modal visible={showBankModal} animationType="slide" transparent onRequestClose={() => setShowBankModal(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowBankModal(false)} />
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>{t('settlements.modalTitle', 'Payout Bank Account')}</Text>
              <Text style={styles.sheetSub}>{t('settlements.modalSub', 'Enter your bank account details for direct weekly settlements.')}</Text>

              <Text style={styles.fieldLabel}>{t('settlements.holderLabel', 'Account Holder Name *')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('settlements.holderPlaceholder', 'e.g. Kavita Sharma')}
                placeholderTextColor={Colors.muted}
                value={holderName}
                onChangeText={setHolderName}
              />

              <Text style={styles.fieldLabel}>{t('settlements.ifscLabel', 'IFSC Code *')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('settlements.ifscPlaceholder', 'e.g. HDFC0001234')}
                placeholderTextColor={Colors.muted}
                value={ifscCode}
                onChangeText={(v) => setIfscCode(v.toUpperCase())}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>{t('settlements.accountLabel', 'Account Number *')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('settlements.accountPlaceholder', 'e.g. 5010023456789')}
                placeholderTextColor={Colors.muted}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <Button flex label={t('settlements.cancel', 'Cancel')} variant="secondary" onPress={() => setShowBankModal(false)} />
                <Button flex label={isSavingBank ? t('settlements.saving', 'Saving...') : t('settlements.saveDetails', 'Save details')} variant="primary" onPress={handleSaveBank} disabled={isSavingBank} />
              </View>
            </View>
          </View>
        </Modal>

        {/*
          Settlement history — this used to render a hardcoded array ("Week of
          May 5 · ₹1,240 · Settled") to every chef regardless of their real
          payout history. Now backed by GET /finance/settlements, a real
          chef-scoped endpoint over the actual public.settlements table (see
          apps/backend/src/controllers/finance.controller.ts#getMySettlements),
          rather than the unrelated, still-mocked delivery-partner endpoint at
          apps/backend/src/controllers/wallet_finance.controller.ts.
        */}
        <Card>
          <Text style={styles.sectionTitle}>{t('settlements.previousSettlements', 'Previous settlements')}</Text>
          {history.length === 0 ? (
            <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 19, paddingVertical: 8 }}>
              {t('settlements.historyComingSoon', 'Your settlement history will appear here after your first weekly payout.')}
            </Text>
          ) : (
            history.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.historyRow,
                  index < history.length - 1 && styles.historyRowBorder,
                ]}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>
                    {formatNiceDate(item.period_start || '')} – {formatNiceDate(item.period_end || '')}
                  </Text>
                  <Badge
                    label={item.status === 'PAID' ? t('settlements.settled', 'Settled') : t(`settlements.status.${item.status}`, item.status)}
                    tone={item.status === 'PAID' ? 'green' : 'gold'}
                    small
                  />
                </View>
                <Text style={styles.historyAmount}>{money(item.net_payable)}</Text>
              </View>
            ))
          )}
        </Card>

        <View style={styles.bottomPad} />
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Hero
  hero: {
    backgroundColor: Colors.blue,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.76)',
  },

  // Breakdown card
  breakdownCard: {
    backgroundColor: Colors.surfaceAlt,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 8,
  },

  // Bank
  bankDetails: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '700',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },

  // How it works
  howCard: { marginBottom: 16 },
  flowStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  flowStepLast: { paddingBottom: 0 },
  flowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.muted, marginTop: 5, flexShrink: 0 },
  flowDotGreen: { backgroundColor: Colors.primary },
  flowText: { flex: 1, fontSize: 13, color: Colors.dark, lineHeight: 20 },
  flowNote: {
    fontSize: 12, color: Colors.muted, lineHeight: 18, marginTop: 10,
    padding: 10, backgroundColor: Colors.pillInactive, borderRadius: 8,
  },

  bottomPad: {
    height: 20,
  },

  // Modal Sheet styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark,
  },
});
