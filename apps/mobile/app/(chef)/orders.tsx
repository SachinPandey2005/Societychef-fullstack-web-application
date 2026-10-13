import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { DISHES } from '../../constants/data';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DishVisual } from '../../components/ui/DishVisual';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SummaryLine } from '../../components/ui/SummaryLine';
import { getActiveChefProfileId, getChefOrders, subscribeToChefOrders, updateOrderStatus } from '../../services';
import { sendPartyOrderAcceptedNotification } from '../../services/notifications';
import { money, timeAgo } from '../../lib/format';
import type { ChefOrder, OrderStatus } from '../../types';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Delivered'];

const NEXT_STEP: Record<string, { label: string; labelKey: string; icon: string; nextStatus: string }> = {
  Placed:    { label: 'Accept order',    labelKey: 'chefOrders.acceptOrder',    icon: 'checkmark-circle-outline', nextStatus: 'Accepted'  },
  Accepted:  { label: 'Start preparing', labelKey: 'chefOrders.startPreparing', icon: 'flame-outline',            nextStatus: 'Preparing' },
  Preparing: { label: 'Mark as ready',   labelKey: 'chefOrders.markAsReady',    icon: 'bag-check-outline',        nextStatus: 'Ready'     },
  Ready:     { label: 'Mark delivered',  labelKey: 'chefOrders.markDelivered',  icon: 'home-outline',             nextStatus: 'Delivered' },
};

const nextStepLabel = (t: TFunction, status: string) =>
  NEXT_STEP[status] ? t(NEXT_STEP[status].labelKey, NEXT_STEP[status].label) : '';
const chefStatusLabel = (t: TFunction, status: string) => t(`chefOrders.step.${status}`, status);

// Single tonal palette — no rainbow
const STATUS_TONE: Record<string, 'default' | 'gold' | 'blue' | 'green'> = {
  Placed:    'default',
  Accepted:  'blue',
  Preparing: 'gold',
  Ready:     'green',
  Delivered: 'green',
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChefOrdersScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { user } = useAuthStore();
  const chefProfileId = user?.chefProfileId || user?.id || '';
  const chefSociety = user?.society ?? '';

  const [orders, setOrders]   = useState<ChefOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected]   = useState<ChefOrder | null>(null);

  const loadOrders = React.useCallback(() => {
    getChefOrders().then((data) => { setOrders(data); setIsLoading(false); });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    getActiveChefProfileId().then((kId) => {
      if (!kId) return;
      unsub = subscribeToChefOrders(kId, async () => {
        const freshOrders = await getChefOrders();
        if (freshOrders.length > orders.length && orders.length > 0) {
          const latest = freshOrders[0];
          if (latest) {
            import('../../services/notifications').then(({ sendNewOrderNotificationToChef }) => {
              sendNewOrderNotificationToChef(user?.displayName || t('chefOrders.yourKitchen', 'Your Kitchen'), latest.id, latest.amount);
            });
          }
        }
        setOrders(freshOrders);
      });
    });
    return () => {
      if (unsub) unsub();
    };
  }, [orders.length, user?.displayName]);

  async function advanceStatus(id: string) {
    const currentOrder = orders.find((o) => o.id === id);
    if (!currentOrder) return;
    const nextStep = NEXT_STEP[currentOrder.status];
    if (!nextStep) return;

    const nextStatus = nextStep.nextStatus;
    const update = (o: ChefOrder) =>
      o.id === id ? { ...o, status: nextStatus } : o;
    
    setOrders((prev) => prev.map(update));
    setSelected((o) => (o?.id === id ? update(o) : o));

    try {
      await updateOrderStatus(id, nextStatus.toLowerCase() as OrderStatus);
      if ((nextStatus === 'Accepted' || nextStatus.toLowerCase() === 'accepted') && currentOrder.isPartyOrder) {
        sendPartyOrderAcceptedNotification(user?.displayName || t('chefOrders.chefKitchen', "Chef's Kitchen"), currentOrder.partyBookingDate ? new Date(currentOrder.partyBookingDate).toLocaleDateString() : t('chefOrders.selectedDate', 'selected date'));
      }
    } catch (e) {
      console.warn('Failed to update status on server:', e);
      loadOrders();
    }
  }

  if (isLoading) return <LoadingSpinner fullscreen label={t('chefOrders.loading', 'Loading orders...')} />;

  const open  = orders.filter((o) => o.status !== 'Delivered');
  const done  = orders.filter((o) => o.status === 'Delivered');
  const urgent = open.filter((o) => o.urgent).length;
  const gross  = orders.reduce((s, o) => s + o.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        {/* ── Header — same green gradient as dashboard ─────────────────── */}
        <LinearGradient
          colors={[Colors.primaryDeep, '#1a5c42', Colors.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View>
              <Text style={styles.headerEyebrow}>{t('chefOrders.headerEyebrow', 'KITCHEN')}</Text>
              <Text style={styles.headerTitle}>{t('chefOrders.headerTitle', 'Incoming orders')}</Text>
            </View>
            <LanguageTogglePill darkBg />
          </View>

          <View style={styles.headerStats}>
            <StatPill icon="bag-handle-outline"       value={String(open.length)}  label={t('chefOrders.openOrders', 'Open orders')}  />
            <StatPill icon="flash-outline"            value={String(urgent)}       label={t('chefOrders.urgent', 'Urgent')}       highlight={urgent > 0} />
            <StatPill icon="cash-outline"             value={money(gross)}         label={t('chefOrders.grossToday', 'Gross today')}  />
            <StatPill icon="checkmark-circle-outline" value={String(done.length)}  label={t('chefOrders.done', 'Done')}         dim />
          </View>
        </LinearGradient>

        {orders.length === 0 && (
          <View style={styles.padded}>
            <EmptyState icon="🛍️" title={t('chefOrders.emptyTitle', 'No orders yet')} body={t('chefOrders.emptyBody', 'Orders placed from your kitchen will appear here.')} />
          </View>
        )}

        {/* Active */}
        {open.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.activeDot} />
              <Text style={styles.sectionTitle}>{t('chefOrders.activeOrders', 'Active orders')}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{open.length}</Text>
              </View>
            </View>
            {open.map((o) => (
              <OrderCard key={o.id} order={o} onPress={() => setSelected(o)} onAdvance={() => advanceStatus(o.id)} />
            ))}
          </View>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleMuted}>{t('chefOrders.completedToday', 'Completed today')}</Text>
            {done.map((o) => (
              <OrderCard key={o.id} order={o} onPress={() => setSelected(o)} onAdvance={() => {}} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      </ImageBackground>

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <OrderDetailSheet order={selected} onClose={() => setSelected(null)} onAdvance={() => advanceStatus(selected.id)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, highlight, dim }: {
  icon: string; value: string; label: string; highlight?: boolean; dim?: boolean;
}) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const iconColor = dim
    ? 'rgba(255,255,255,0.35)'
    : highlight
    ? Colors.gold
    : 'rgba(255,255,255,0.82)';

  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text style={[styles.statValue, highlight && styles.statValueHighlight, dim && styles.statDim]}>{value}</Text>
      <Text style={[styles.statLabel, dim && styles.statDim]}>{label}</Text>
    </View>
  );
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
const OrderCard = React.memo(function OrderCard({ order, onPress, onAdvance }: {
  order: ChefOrder; onPress: () => void; onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { user } = useAuthStore();
  const chefSociety = user?.society ?? 'Lotus Heights';
  const dish     = DISHES.find((d) => d.id === order.dishId);
  const isDone   = order.status === 'Delivered';
  const nextStep = NEXT_STEP[order.status];
  const stepIdx  = STATUS_STEPS.indexOf(order.status);
  const progress = ((stepIdx + 1) / STATUS_STEPS.length) * 100;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isDone && styles.cardDone, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardBody}>
        {/* Dish photo */}
        {dish && (
          <View style={styles.photoWrap}>
            <DishVisual dish={dish} size="md" />
            {order.urgent && (
              <View style={styles.urgentDot}>
                <Ionicons name="flash" size={10} color="#fff" />
              </View>
            )}
          </View>
        )}

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardTopRow}>
            {order.isPartyOrder ? (
              <View style={{ backgroundColor: '#F5E6D3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97724' }}>{t('chefOrders.partyPreBooking', 'PARTY PRE-BOOKING')}</Text>
              </View>
            ) : (
              <Text style={styles.cardId}>{order.orderCode || order.id}</Text>
            )}
            <Text style={styles.cardTime}>{timeAgo(new Date(order.createdAt))}</Text>
          </View>
          <Text style={styles.cardDish} numberOfLines={1}>{order.dish}</Text>
          <View style={styles.customerRow}>
            <Ionicons name="location-outline" size={11} color={Colors.muted} />
            <Text style={styles.customerText}>{t('chefOrders.flatCustomer', { defaultValue: 'Flat {{flat}}', flat: order.customer })}</Text>
            <View style={[styles.societyPill, order.society === chefSociety && styles.societyPillSame]}>
              <Text style={[styles.societyText, order.society === chefSociety && styles.societyTextSame]}>
                {order.society}
              </Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAmount}>{money(order.amount)}</Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Badge label={chefStatusLabel(t, order.status)} tone={STATUS_TONE[order.status]} small />
              {order.paymentStatus === 'PAID' ? (
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#16A34A' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>{t('chefOrders.paymentDone', 'Payment Done')}</Text>
                </View>
              ) : (order.status === 'Accepted' || order.paymentStatus === 'PENDING') ? (
                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#EF4444' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#B91C1C' }}>{t('chefOrders.paymentPending', 'Payment Pending !')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
      </View>

      {/* Thin progress bar — always primary green */}
      {!isDone && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
      )}

      {/* Next-step button — always primary green */}
      {nextStep && (
        <Pressable
          style={styles.nextBtn}
          onPress={(e) => { e.stopPropagation?.(); onAdvance(); }}
        >
          <Ionicons name={nextStep.icon as any} size={15} color="#fff" />
          <Text style={styles.nextBtnText}>{nextStepLabel(t, order.status)}</Text>
        </Pressable>
      )}

      {isDone && (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
          <Text style={styles.doneText}>{t('chefOrders.deliveredTapToView', 'Delivered · tap to view details')}</Text>
        </View>
      )}
    </Pressable>
  );
});

// ── OrderDetailSheet ──────────────────────────────────────────────────────────
function OrderDetailSheet({ order, onClose, onAdvance }: {
  order: ChefOrder; onClose: () => void; onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { user } = useAuthStore();
  const chefSociety = user?.society ?? 'Lotus Heights';
  const isDone    = order.status === 'Delivered';
  const nextStep  = NEXT_STEP[order.status];
  const stepIdx   = STATUS_STEPS.indexOf(order.status);
  const dish      = DISHES.find((d) => d.id === order.dishId);

  return (
    <SafeAreaView style={styles.sheetSafe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={20} color={Colors.dark} />
        </Pressable>
        <View style={styles.sheetHeaderCenter}>
          {dish && <DishVisual dish={dish} size="sm" />}
          <View>
            <Text style={styles.sheetTitle}>{order.dish}</Text>
            <Text style={styles.sheetSub}>{t('chefOrders.orderNumber', { defaultValue: 'Order {{id}}', id: order.orderCode || order.id })}</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>

        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={styles.statusRowLeft}>
            <Text style={styles.statusRowLabel}>{t('chefOrders.currentStatus', 'Current status')}</Text>
            <Badge label={chefStatusLabel(t, order.status)} tone={STATUS_TONE[order.status]} />
          </View>
          <Text style={styles.statusRowTime}>{timeAgo(new Date(order.createdAt))}</Text>
        </View>

        {/* Progress timeline */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetSectionLabel}>{t('chefOrders.orderProgress', 'Order progress')}</Text>
          {STATUS_STEPS.map((step, idx) => {
            const isPast    = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            const isPending = idx > stepIdx;
            const isLast    = idx === STATUS_STEPS.length - 1;
            return (
              <View key={step} style={styles.tlRow}>
                <View style={styles.tlLeft}>
                  <View style={[
                    styles.tlIcon,
                    isPast    && styles.tlIconDone,
                    isCurrent && styles.tlIconCurrent,
                  ]}>
                    {isPast
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : <Text style={[styles.tlNum, isCurrent && styles.tlNumCurrent, isPending && styles.tlNumPending]}>
                          {idx + 1}
                        </Text>
                    }
                  </View>
                  {!isLast && <View style={[styles.tlLine, isPast && styles.tlLineDone]} />}
                </View>
                <View style={styles.tlBody}>
                  <Text style={[
                    styles.tlLabel,
                    isCurrent && styles.tlLabelCurrent,
                    isPending && styles.tlLabelPending,
                  ]}>
                    {chefStatusLabel(t, step)}
                  </Text>
                  {isCurrent && <Text style={styles.tlHere}>{t('chefOrders.youAreHere', '← You are here')}</Text>}
                </View>
              </View>
            );
          })}
        </View>
{/* Customer */}
<View style={styles.sheetSection}>
  <Text style={styles.sheetSectionLabel}>{t('chefOrders.customer', 'Customer')}</Text>

  <View style={styles.customerDetail}>
    <View style={styles.customerIcon}>
      <Ionicons
        name="person-outline"
        size={18}
        color={Colors.primary}
      />
    </View>

    <View>
      <Text style={styles.customerFlat}>
        {t('chefOrders.flatCustomer', { defaultValue: 'Flat {{flat}}', flat: order.customer })}
      </Text>

      <View style={styles.customerSocRow}>
        <Ionicons
          name="location-outline"
          size={11}
          color={Colors.muted}
        />

        <Text style={styles.customerSoc}>
          {order.society}
        </Text>

        {order.society === chefSociety && (
          <View style={styles.sameSocBadge}>
            <Text style={styles.sameSocText}>
              {t('chefOrders.sameSociety', 'Same society')}
            </Text>
          </View>
        )}
      </View>
    </View>
  </View>

  {order.urgent && (
    <View style={[styles.urgentBanner, { marginTop: 14 }]}>
      <Ionicons
        name="flash-outline"
        size={14}
        color={Colors.gold}
      />

      <Text style={styles.urgentText}>
        {t('chefOrders.urgentRequest', 'Urgent request — confirm timing before accepting.')}
      </Text>
    </View>
  )}

  {/* Chat is reachable only from a real order's detail — not a persistent
      tab — since a chef has no reason to message a consumer outside the
      context of an actual order. */}
  {order.customerId && (
    <Pressable
      style={styles.chatWithCustomerBtn}
      onPress={() => router.push(`/(chef)/chat?consumerId=${order.customerId}&consumerName=${encodeURIComponent(order.customerName || order.customer)}` as any)}
    >
      <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
      <Text style={styles.chatWithCustomerBtnText}>{t('chefOrders.chatWithCustomer', 'Chat with customer')}</Text>
    </Pressable>
  )}
</View>

        {/* Payout */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetSectionLabel}>{t('chefOrders.yourPayout', 'Your payout')}</Text>
          <View style={styles.billBox}>
            <SummaryLine label={t('chefOrders.orderAmount', 'Order amount')}       value={money(order.amount)} />
            <SummaryLine label={t('chefOrders.platformFee', 'Platform fee (10%)')} value={`-${money(order.amount * 0.1)}`} />
            <SummaryLine label={t('chefOrders.gatewayFee', 'Gateway fee (2%)')}   value={`-${money(order.amount * 0.02)}`} />
            <SummaryLine label={t('chefOrders.yourNetPayout', 'Your net payout')}    value={money(order.amount * 0.88)} strong separator />
          </View>
          {order.paymentStatus === 'PAID' ? (
            <View style={[styles.paidRow, { backgroundColor: '#DCFCE7', borderColor: '#16A34A', borderWidth: 1, borderRadius: 8, padding: 8 }]}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" />
              <Text style={[styles.paidText, { color: '#15803D', fontWeight: '800' }]}>{t('chefOrders.paymentDoneDetail', 'Payment Done (Paid via Pre-booking)')}</Text>
            </View>
          ) : (
            <View style={[styles.paidRow, { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1, borderRadius: 8, padding: 8 }]}>
              <Ionicons name="alert-circle" size={14} color="#B91C1C" />
              <Text style={[styles.paidText, { color: '#B91C1C', fontWeight: '800' }]}>{t('chefOrders.paymentPendingDetail', 'Payment Pending ! (Awaiting customer payment)')}</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        {nextStep && (
          <Button
            label={nextStepLabel(t, order.status)}
            variant="primary"
            icon={<Ionicons name={nextStep.icon as any} size={16} color="#fff" />}
            onPress={onAdvance}
          />
        )}
        {isDone && (
          <View style={styles.doneBanner}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            <Text style={styles.doneBannerText}>{t('chefOrders.orderCompletedPayout', 'Order completed · payout in next settlement cycle')}</Text>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  flex:    { flex: 1 },
  padded:  { paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 16 },

  // Header
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 24 },
  headerEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle:   { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2, marginBottom: 18 },
  headerStats:   { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  statValue:          { color: '#fff', fontSize: 15, fontWeight: '900' },
  statValueHighlight: { color: Colors.gold },
  statLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' },
  statDim:    { opacity: 0.45 },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  activeDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  sectionTitle:     { fontSize: 12, fontWeight: '900', color: Colors.dark, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionTitleMuted:{ fontSize: 12, fontWeight: '900', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  countBadge:     { backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Order card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  cardDone:    { opacity: 0.7 },
  cardPressed: { opacity: 0.85 },
  cardBody:  { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  photoWrap: { position: 'relative' },
  urgentDot: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  cardInfo:  { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  cardId:   { fontSize: 11, fontWeight: '900', color: Colors.red, letterSpacing: 0.5 },
  cardTime: { fontSize: 11, color: Colors.muted },
  cardDish: { fontSize: 16, fontWeight: '900', color: Colors.dark, marginBottom: 4 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  customerText: { fontSize: 12, fontWeight: '700', color: Colors.muted },
  societyPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: Colors.pillInactive },
  societyPillSame: { backgroundColor: Colors.greenBadge },
  societyText: { fontSize: 10, fontWeight: '800', color: Colors.secondary },
  societyTextSame: { color: Colors.primary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: 17, fontWeight: '900', color: Colors.primary },

  // Progress bar — always brand green
  progressTrack: { height: 3, backgroundColor: Colors.pillInactive, marginHorizontal: 14, borderRadius: 999, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 999 },

  // Next-step button — always brand green
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 14, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginBottom: 10, justifyContent: 'center' },
  doneText: { fontSize: 12, color: Colors.muted },

  // Detail sheet
  sheetSafe: { flex: 1, backgroundColor: Colors.bg },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.pillInactive, alignItems: 'center', justifyContent: 'center',
  },
  sheetHeaderCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  sheetSub:   { fontSize: 12, color: Colors.muted, marginTop: 1 },
  sheetContent: { padding: 16, gap: 12 },

  // Status row
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  statusRowLeft:  { gap: 6 },
  statusRowLabel: { fontSize: 11, fontWeight: '900', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRowTime:  { fontSize: 12, color: Colors.muted },

  // Timeline
  sheetSection: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  sheetSectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  tlRow:  { flexDirection: 'row', gap: 12, minHeight: 44 },
  tlLeft: { alignItems: 'center', width: 26 },
  tlIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg },
  tlIconDone:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tlIconCurrent: { backgroundColor: Colors.primaryDeep, borderColor: Colors.primaryDeep },
  tlNum:        { fontSize: 11, fontWeight: '900', color: Colors.dark },
  tlNumCurrent: { color: '#fff' },
  tlNumPending: { color: Colors.muted },
  tlLine:     { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  tlLineDone: { backgroundColor: Colors.primary },
  tlBody:     { flex: 1, paddingBottom: 12, paddingTop: 3 },
  tlLabel:        { fontSize: 14, fontWeight: '800', color: Colors.dark },
  tlLabelCurrent: { color: Colors.primary },
  tlLabelPending: { color: Colors.muted, fontWeight: '600' },
  tlHere: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: 2 },

  // Customer
  customerDetail: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  customerIcon:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.greenBadge, alignItems: 'center', justifyContent: 'center' },
  customerFlat:   { fontSize: 16, fontWeight: '900', color: Colors.dark },
  customerSocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  customerSoc:    { fontSize: 12, color: Colors.muted },
  sameSocBadge:   { backgroundColor: Colors.greenBadge, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  sameSocText:    { fontSize: 10, fontWeight: '800', color: Colors.primary },
  urgentBanner:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.goldBadge, borderRadius: 8, padding: 10, marginTop: 10 },
  urgentText:     { flex: 1, fontSize: 13, color: Colors.dark, lineHeight: 18 },
  chatWithCustomerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 11, marginTop: 14 },
  chatWithCustomerBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // Bill
  billBox:  { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginBottom: 10 },
  paidRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paidText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // Done banner
  doneBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.greenBadge, borderRadius: 12, padding: 14 },
  doneBannerText: { flex: 1, fontSize: 14, color: Colors.primary, fontWeight: '700', lineHeight: 20 },
});
