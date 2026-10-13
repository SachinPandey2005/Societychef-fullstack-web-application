import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { useRewardsStore, pointsValue, MIN_REDEEM_POINTS } from '../../store/useRewardsStore';
import { WalletBalanceCard } from '../../components/WalletBalanceCard';
import { TransactionHistory } from '../../components/TransactionHistory';
import { apiClient } from '../../lib/apiClient';

const REWARDS = [
  'Free Matar Paneer',
  'Free Rajma Chawal',
  '20% Off next order',
  'Free Poha',
  'Free delivery (3 orders)',
  'Free Idli Sambar',
  'Bonus 10 points',
];

const ORDERS_TARGET = 5;

export default function WalletAndRewardsScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  // Wallet
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rewards
  const { points, ordersCompleted, lifetimePoints } = useRewardsStore();
  const pointsWorth = pointsValue(points);
  const canRedeem = points >= MIN_REDEEM_POINTS;

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/finance/wallet');
      if (res.success) {
        setWallet(res.data.wallet);
        setTransactions(res.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load wallet', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: 12,
            }}
            onPress={() => {
              // Reported directly: back landed on the home/Discover tab
              // instead of Profile. This screen is only ever reached from
              // Profile (it's a hidden route in the Tabs navigator, not a
              // visible tab), and router.back() pops the Tabs navigator's
              // own history — switching tabs isn't a stack push there, so
              // "back" from a pushed screen resolves to the Tabs'
              // originally-active tab (Discover), not whichever tab the
              // screen was actually opened from. Navigating to Profile
              // explicitly is correct regardless of how this screen was
              // reached.
              router.replace('/(consumer)/profile');
            }}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.dark} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('consumerWallet.back', 'Back')}</Text>
          </Pressable>

          <ScreenTitle
            eyebrow={t('consumerWallet.eyebrow', 'Wallet & Rewards')}
            title={t('consumerWallet.title', 'Manage your balance and earn points.')}
          />

        {/*
          This was fetched from /finance/wallet on every load but never actually
          rendered — WalletBalanceCard was imported and unused, so any real
          rupee balance (e.g. from a refund) was invisible here even though the
          "points" balance below (a separate, client-side rewards system) was
          shown prominently. Both are real and distinct; both should be visible.
        */}
        <WalletBalanceCard
          balance={wallet?.available_balance || 0}
          currency="₹"
          loading={loading}
        />

        {/* ── Points balance card ──────────────────────────────────────── */}
        <View style={styles.pointsHero}>
          <View style={styles.pointsHeroLeft}>
            <Text style={styles.pointsHeroEyebrow}>{t('consumerWallet.yourBalance', 'YOUR BALANCE')}</Text>
            <View style={styles.pointsHeroRow}>
              <Ionicons name="star" size={22} color={Colors.gold} />
              <Text style={styles.pointsHeroValue}>{points}</Text>
              <Text style={styles.pointsHeroUnit}>{t('consumerWallet.pts', 'pts')}</Text>
            </View>
            <Text style={styles.pointsHeroWorth}>
              {t('consumerWallet.worthRedeem', { defaultValue: 'Worth {{worth}} · Redeem at checkout', worth: pointsWorth > 0 ? `₹${pointsWorth}` : '₹0' })}
            </Text>
          </View>
          <View style={styles.pointsHeroRight}>
            <View style={styles.pointsStat}>
              <Text style={styles.pointsStatValue}>{lifetimePoints}</Text>
              <Text style={styles.pointsStatLabel}>{t('consumerWallet.lifetimePts', 'Lifetime pts')}</Text>
            </View>
            <View style={[styles.redeemBadge, canRedeem ? styles.redeemBadgeActive : styles.redeemBadgeLocked]}>
              <Ionicons
                name={canRedeem ? 'checkmark-circle' : 'lock-closed-outline'}
                size={13}
                color={canRedeem ? Colors.primary : Colors.muted}
              />
              <Text style={[styles.redeemBadgeText, canRedeem && styles.redeemBadgeTextActive]}>
                {canRedeem ? t('consumerWallet.redeemable', 'Redeemable') : t('consumerWallet.needMore', { defaultValue: 'Need {{count}} more', count: MIN_REDEEM_POINTS - points })}
              </Text>
            </View>
          </View>
        </View>

        {/* Earning guide */}
        <View style={styles.earnGuide}>
          <View style={styles.earnGuideItem}>
            <Ionicons name="bag-outline" size={16} color={Colors.primary} />
            <Text style={styles.earnGuideText} numberOfLines={2}>{t('consumerWallet.earn1pt', 'Earn 1 pt per ₹1 spent')}</Text>
          </View>
          <View style={styles.earnGuideDot} />
          <View style={styles.earnGuideItem}>
            <Ionicons name="star-outline" size={16} color={Colors.gold} />
            <Text style={styles.earnGuideText} numberOfLines={2}>{t('consumerWallet.hundredPts', '100 pts = ₹10 off')}</Text>
          </View>
          <View style={styles.earnGuideDot} />
          <View style={styles.earnGuideItem}>
            <Ionicons name="flash-outline" size={16} color={Colors.primary} />
            <Text style={styles.earnGuideText} numberOfLines={2}>{t('consumerWallet.minToRedeem', { defaultValue: 'Min. {{count}} pts to redeem', count: MIN_REDEEM_POINTS })}</Text>
          </View>
        </View>
        
        <View style={{ marginTop: 10 }}>
          <TransactionHistory transactions={transactions} loading={loading} scrollEnabled={false} />
        </View>

        {/* Free dish rules panel */}
        <Card style={styles.freeCard}>
          <View style={styles.freeTitleRow}>
            <Text style={styles.cardTitle}>{t('consumerWallet.weeklyFreeDish', 'Weekly Free Dish')}</Text>
            <Badge label={t('consumerWallet.availableNow', 'Available now')} tone="green" />
          </View>
          <Text style={styles.freeBody}>
            {t('consumerWallet.weeklyFreeBody', 'Every chef on RasoHi publishes one free dish each week for society members. These dishes are available in limited quantities — first come, first served.')}
          </Text>
          <View style={styles.freeRuleList}>
            <View style={styles.freeRule}>
              <Text style={styles.freeRuleDot}>•</Text>
              <Text style={styles.freeRuleText}>
                {t('consumerWallet.rule1', 'One free dish per kitchen per week')}
              </Text>
            </View>
            <View style={styles.freeRule}>
              <Text style={styles.freeRuleDot}>•</Text>
              <Text style={styles.freeRuleText}>
                {t('consumerWallet.rule2', 'Available to same-society members first')}
              </Text>
            </View>
            <View style={styles.freeRule}>
              <Text style={styles.freeRuleDot}>•</Text>
              <Text style={styles.freeRuleText}>
                {t('consumerWallet.rule3', 'Delivery fee still applies (₹10 same society)')}
              </Text>
            </View>
            <View style={styles.freeRule}>
              <Text style={styles.freeRuleDot}>•</Text>
              <Text style={styles.freeRuleText}>
                {t('consumerWallet.rule4', 'Look for the "Weekly free" badge on listings')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Points history hint */}
        <Card>
          <Text style={styles.cardTitle}>{t('consumerWallet.howToEarnMore', 'How to earn more')}</Text>
          <View style={styles.howList}>
            {[
              { icon: 'bag-handle-outline', label: t('consumerWallet.placeOrder', 'Place an order'),   pts: t('consumerWallet.placeOrderPts', '+1 pt/₹1') },
              { icon: 'star-outline',       label: t('consumerWallet.leaveReview', 'Leave a review'),    pts: t('consumerWallet.leaveReviewPts', '+10 pts') },
              { icon: 'people-outline',     label: t('consumerWallet.referFriend', 'Refer a friend'),    pts: t('consumerWallet.referFriendPts', '+50 pts') },
              { icon: 'gift-outline',       label: t('consumerWallet.claimFreeDish', 'Claim a free dish'), pts: t('consumerWallet.claimFreeDishPts', '+5 pts') },
            ].map((item) => (
              <View key={item.label} style={styles.howRow}>
                <View style={styles.howIcon}>
                  <Ionicons name={item.icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={styles.howLabel}>{item.label}</Text>
                <View style={styles.howPts}><Text style={styles.howPtsText}>{item.pts}</Text></View>
              </View>
            ))}
          </View>
        </Card>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  cardTitle: {
    color: Colors.dark,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  freeCard: {},
  freeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  freeBody: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  freeRuleList: {
    gap: 7,
  },
  freeRule: {
    flexDirection: 'row',
    gap: 8,
  },
  freeRuleDot: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 20,
  },
  freeRuleText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
  },
  pointsBlock: {
    alignItems: 'center',
    flex: 1,
  },
  pointsValue: {
    color: Colors.dark,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  pointsLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  pointsDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  pointsNote: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },

  // Points hero banner
  pointsHero: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryDeep, borderRadius: 16, padding: 18, gap: 12,
    marginTop: 10,
  },
  pointsHeroLeft:    { flex: 1 },
  pointsHeroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  pointsHeroRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  pointsHeroValue:   { color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 42 },
  pointsHeroUnit:    { color: Colors.gold, fontSize: 16, fontWeight: '900' },
  pointsHeroWorth:   { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 },
  pointsHeroRight:   { alignItems: 'flex-end', gap: 8 },
  pointsStat:        { alignItems: 'flex-end' },
  pointsStatValue:   { color: '#fff', fontSize: 18, fontWeight: '900' },
  pointsStatLabel:   { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  redeemBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  redeemBadgeActive: { backgroundColor: Colors.greenBadge },
  redeemBadgeLocked: { backgroundColor: 'rgba(255,255,255,0.1)' },
  redeemBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  redeemBadgeTextActive: { color: Colors.primary },

  // Earn guide
  earnGuide: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 12,
  },
  // Previously a tight single row (icon + text side by side, flex: 1 each,
  // no wrap/shrink control) — on a real device the text regularly didn't
  // fit its share of the row and overflowed horizontally into the divider
  // bar and the next item, visually overlapping both. Stacking icon above
  // text and letting the text wrap to 2 lines keeps each item's content
  // inside its own column no matter the screen width or font scale.
  earnGuideItem: { alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1, paddingHorizontal: 2 },
  earnGuideText: { fontSize: 10, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  earnGuideDot:  { width: 1, alignSelf: 'stretch', backgroundColor: Colors.border },

  // How to earn
  howList: { gap: 10, marginTop: 4 },
  howRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.greenBadge, alignItems: 'center', justifyContent: 'center' },
  howLabel:{ flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
  howPts:  { backgroundColor: Colors.goldBadge, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  howPtsText: { fontSize: 12, fontWeight: '900', color: '#7c5400' },
});
