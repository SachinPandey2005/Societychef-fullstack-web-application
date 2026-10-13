import { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useThemeStore } from '../../../store/useThemeStore';
// Removed mock DISHES import; dish fetched via Supabase
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCartStore } from '../../../store/useCartStore';
import { Card } from '../../../components/ui/Card';
import { DishVisual } from '../../../components/ui/DishVisual';
import { SummaryLine } from '../../../components/ui/SummaryLine';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { money } from '../../../lib/format';
import { Badge } from '../../../components/ui/Badge';
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery';
import { getOrder, cancelOrder, getDish, subscribeToOrder } from '../../../services';
import type { Order, OrderStatus } from '../../../types';

// ── Progress timeline config ──────────────────────────────────────────────────
type Step = { status: OrderStatus; label: string; icon: string; description: string };

const STEPS: Step[] = [
  { status: 'placed', label: 'Order placed', icon: 'receipt-outline', description: 'Your order is confirmed and payment received.' },
  { status: 'accepted', label: 'Accepted by chef', icon: 'checkmark-circle-outline', description: 'The chef has accepted your order.' },
  { status: 'preparing', label: 'Being prepared', icon: 'flame-outline', description: 'Your meal is being freshly cooked.' },
  { status: 'ready', label: 'Ready', icon: 'bag-check-outline', description: 'Your order is packed and ready for pickup.' },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: 'bicycle-outline', description: 'Rider is on the way to your address.' },
  { status: 'delivered', label: 'Delivered', icon: 'home-outline', description: 'Enjoy your meal!' },
];

const STATUS_ORDER: OrderStatus[] = STEPS.map((s) => s.status);

function stepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

const stepLabel = (t: TFunction, s: OrderStatus, fallback: string) => t(`orderDetail.step.${s}.label`, fallback);
const stepDesc = (t: TFunction, s: OrderStatus, fallback: string) => t(`orderDetail.step.${s}.desc`, fallback);

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const { addItem } = useCartStore();

  const { data: dbOrder, loading: isLoading, refetch } = useSupabaseQuery(
    async () => {
      if (!id) return null;
      return getOrder(id);
    },
    [id]
  );

  useEffect(() => {
    if (dbOrder) {
      setOrder(dbOrder);
    }
  }, [dbOrder]);

  // Subscribe to real-time updates for order status
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToOrder(id, (updatedOrder) => {
      if (updatedOrder && order && updatedOrder.status !== order.status) {
        import('../../../services/notifications').then(({ sendOrderStatusNotification }) => {
          sendOrderStatusNotification(updatedOrder.id, updatedOrder.status);
        });
      }
      setOrder(updatedOrder);
    });
    return () => {
      unsubscribe();
    };
  }, [id, order?.status]);

  if (isLoading && !order) {
    return <LoadingSpinner fullscreen label={t('orderDetail.loading', 'Loading order details...')} />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('orderDetail.notFound', 'Order not found.')}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>{t('orderDetail.backToOrders', '← Back to orders')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { data: dish, loading: dishLoading } = useSupabaseQuery(() => getDish(order.dishId), [order?.dishId]);
  const currentIdx = stepIndex(order.status);
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
  const canCancel = order.status === 'placed' || order.status === 'accepted';

  function handleCancel() {
    if (!order) return;
    const orderId = order.id;
    Alert.alert(
      t('orderDetail.cancelOrderTitle', 'Cancel order?'),
      t('orderDetail.cancelOrderBody', 'Your pre-order will be cancelled and portion availability restored.'),
      [
        { text: t('orderDetail.keepOrder', 'Keep order'), style: 'cancel' },
        {
          text: t('orderDetail.cancelOrder', 'Cancel order'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId);
              await refetch();
            } catch (e: any) {
              // Do NOT optimistically mark the order cancelled here — the write
              // was rejected (e.g. the kitchen already moved past a cancellable
              // stage), so the order is still active. Telling the customer it's
              // cancelled when it isn't means they think they won't be charged
              // or fed, while the kitchen is still preparing it.
              Alert.alert(
                t('orderDetail.cancelFailedTitle', 'Could not cancel'),
                e?.message || t('orderDetail.cancelFailedBody', 'This order could not be cancelled right now. Please try again or contact the chef.')
              );
            }
          },
        },
      ],
    );
  }

  function handleReorder() {
    router.replace('/(consumer)/discover');
  }

  // Advancing order status (Placed → Accepted → Preparing → Ready → Delivered) is
  // the chef's/ops's authority, not the consumer's — a "Simulate Next Status Step"
  // button used to sit here and call the same updateOrderStatus mutation the chef
  // uses, letting any customer mark their own order Delivered without the chef
  // ever preparing it. Removed; the database also now rejects a consumer setting
  // anything other than CANCELLED on their own order (see
  // supabase/migrations/20260920000001_lock_down_orders_authorization.sql).

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('orders.orderNumber', { defaultValue: 'Order {{id}}', id: order.orderCode || order.id })}</Text>
          <Text style={styles.headerSub}>{order.kitchenName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status hero ─────────────────────────────────────────────────── */}
        {order.status === 'cancelled' ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={28} color={Colors.red} />
            <View>
              <Text style={styles.cancelledTitle}>{t('orders.orderCancelledHero', 'Order cancelled')}</Text>
              <Text style={styles.cancelledSub}>{t('orders.refundInDays', 'Refund in 3–5 business days')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusHero}>
            <View style={styles.statusHeroTopRow}>
              <Text style={styles.statusHeroEyebrow}>
                {isActive ? t('orderDetail.liveTracking', '⚡ Live Kitchen Tracking') : t('orders.completed', 'Completed')}
              </Text>
              {isActive && (
                <View style={styles.otpPinBadge}>
                  <Text style={styles.otpPinText}>{t('orderDetail.pin', { defaultValue: 'PIN: {{pin}}', pin: String(order.id).slice(-4).toUpperCase() || '4821' })}</Text>
                </View>
              )}
            </View>

            <Text style={styles.statusHeroTitle}>
              {stepLabel(t, order.status, STEPS[currentIdx]?.label ?? order.status)}
            </Text>
            <Text style={styles.statusHeroSub}>
              {STEPS[currentIdx] ? stepDesc(t, order.status, STEPS[currentIdx].description) : ''}
            </Text>

            {isActive && (
              <View style={styles.etaRow}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.etaText}>{t('orderDetail.estimatedReady', { defaultValue: 'Estimated Ready: {{eta}}', eta: order.eta })}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Progress timeline ────────────────────────────────────────────── */}
        <Card style={styles.timelineCard}>
          <Text style={styles.sectionLabel}>{t('orders.orderProgress', 'Order progress')}</Text>
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;
            const isLast = idx === STEPS.length - 1;

            return (
              <View key={step.status} style={styles.timelineRow}>
                {/* Left: icon + line */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIconWrap,
                    isDone && styles.timelineIconDone,
                    isCurrent && styles.timelineIconCurrent,
                    isPending && styles.timelineIconPending,
                  ]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Ionicons
                        name={step.icon as any}
                        size={14}
                        color={isCurrent ? '#fff' : Colors.muted}
                      />
                    )}
                  </View>
                  {!isLast && (
                    <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                  )}
                </View>

                {/* Right: label + description */}
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    isCurrent && styles.timelineLabelCurrent,
                    isPending && styles.timelineLabelPending,
                  ]}>
                    {stepLabel(t, step.status, step.label)}
                  </Text>
                  {(isDone || isCurrent) && (
                    <Text style={styles.timelineDesc}>{stepDesc(t, step.status, step.description)}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        {/* ── Dish info ────────────────────────────────────────────────────── */}
        <Card>
          <Text style={styles.sectionLabel}>{t('orders.yourOrder', 'Your order')}</Text>
          <View style={styles.dishRow}>
            {dish && <DishVisual dish={dish} size="md" />}
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{order.dishName}</Text>
              <Text style={styles.dishMeta}>{order.kitchenName}</Text>
              <Text style={styles.dishMeta}>{t('orders.qtyLabel', { defaultValue: 'Qty {{qty}}', qty: order.quantity })}</Text>
            </View>
          </View>
        </Card>

        {/* ── Bill breakdown ───────────────────────────────────────────────── */}
        <Card>
          <Text style={styles.sectionLabel}>{t('orders.billSummary', 'Bill summary')}</Text>
          <View style={styles.billBox}>
            <SummaryLine label={t('orders.listPrice', 'List price')} value={money(order.listAmount)} />
            {order.societyDiscount > 0 && (
              <SummaryLine
                label={t('orders.societyDiscountLine', 'Same society discount (10%)')}
                value={`-${money(order.societyDiscount)}`}
              />
            )}
            <SummaryLine
              label={t('checkout.deliveryMethod', 'Delivery method')}
              value={order.delivery?.method === 'PICKUP' ? t('orderDetail.selfPickup', '🚶 Self Pickup') : t('orderDetail.deliveryByPartner', '🚚 Delivery by Delivery Partner')}
            />
            <SummaryLine
              label={t('orders.deliveryFeeLine', 'Delivery fee')}
              value={order.delivery?.fee === 0 ? t('orders.free', 'FREE') : money(order.delivery?.fee ?? order.deliveryFee)}
              valueColor={order.delivery?.fee === 0 ? Colors.primary : undefined}
            />
            <SummaryLine label={t('orders.totalPaidLine', 'Total paid')} value={money(order.total)} strong separator />
          </View>
          <View style={styles.paymentTag}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={styles.paymentTagText}>{t('orders.paidVerified', 'Paid via RasoHi · Platform verified')}</Text>
          </View>
        </Card>

        {/* ── Delivery details ─────────────────────────────────────────────── */}
        <Card>
          <Text style={styles.sectionLabel}>
            {order.delivery?.method === 'PICKUP' ? t('orderDetail.pickupLocation', 'Pickup Location') : t('orders.deliveryDetails', 'Delivery details')}
          </Text>
          {order.delivery?.method === 'PICKUP' ? (
            <>
              <View style={styles.detailRow}>
                <Ionicons name="storefront-outline" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailText, { fontWeight: '700' }]}>
                    {order.delivery.pickupLocation?.label ?? t('chefOrders.chefKitchen', "Chef's Kitchen")}
                  </Text>
                  <Text style={[styles.detailText, { color: Colors.muted, marginTop: 2 }]}>
                    {order.delivery.pickupLocation?.address}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={Colors.muted} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailText, { fontWeight: '700' }]}>{t('orderDetail.pickupTime', 'Pickup Time')}</Text>
                  <Text style={[styles.detailText, { color: Colors.muted, marginTop: 2 }]}>
                    {t('orderDetail.estimatedReadyBy', { defaultValue: 'Estimated Ready by {{time}}', time: order.delivery.pickupLocation?.estimatedReadyTime ?? order.eta })}
                  </Text>
                </View>
              </View>
              <View style={[styles.detailRow, { marginTop: 6 }]}>
                <Badge label={t('orderDetail.noDeliveryFee', '✓ No Delivery Fee')} tone="green" />
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={Colors.muted} />
                <Text style={styles.detailText}>
                  {order.delivery?.deliveryAddress?.address ||
                    useAuthStore.getState().user?.address ||
                    [useAuthStore.getState().user?.society, useAuthStore.getState().user?.tower, useAuthStore.getState().user?.flat].filter(Boolean).join(', ') ||
                    t('orders.deliveryAddressFallback', 'Delivery Address')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={Colors.muted} />
                <Text style={styles.detailText}>
                  {t('orderDetail.estimatedDeliveryBy', { defaultValue: 'Estimated delivery by {{time}}', time: order.delivery?.deliveryAddress?.estimatedDeliveryTime ?? order.eta })}
                </Text>
              </View>
              {!!order.delivery?.deliveryAddress?.partnerStatus && (
                <View style={styles.detailRow}>
                  <Ionicons name="bicycle-outline" size={16} color={Colors.primary} />
                  <Text style={[styles.detailText, styles.detailTextGreen]}>
                    {t('orderDetail.partnerStatus', { defaultValue: 'Status: {{status}}', status: order.delivery.deliveryAddress.partnerStatus })}
                  </Text>
                </View>
              )}
            </>
          )}
          {order.societyDiscount > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="home-outline" size={16} color={Colors.primary} />
              <Text style={[styles.detailText, styles.detailTextGreen]}>
                {t('orders.sameSocietyDiscountApplied', 'Same society — 10% discount applied')}
              </Text>
            </View>
          )}
        </Card>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <View style={styles.actionsSection}>
          {canCancel && (
            <Button
              label={t('orders.cancelOrder', 'Cancel order')}
              variant="secondary"
              onPress={handleCancel}
            />
          )}
          <Button
            label={t('orders.chatWithChef', 'Chat with chef')}
            variant="secondary"
            icon={<Ionicons name="chatbubble-outline" size={16} color={Colors.dark} />}
            onPress={() => router.push(`/(consumer)/chat?kitchenId=${order.kitchenId}&kitchenName=${encodeURIComponent(order.kitchenName)}` as any)}
          />
          {order.status === 'delivered' && (
            <Button
              label={t('orders.reorderBtn', 'Re-order')}
              variant="primary"
              icon={<Ionicons name="refresh-outline" size={16} color="#fff" />}
              onPress={handleReorder}
            />
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  headerSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  headerRight: { width: 30 },

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: Colors.muted },
  backLink: { fontSize: 15, color: Colors.primary, fontWeight: '800' },

  // Status hero
  statusHero: {
    backgroundColor: Colors.primaryDeep,
    borderRadius: 16,
    padding: 20,
  },
  statusHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusHeroEyebrow: { color: Colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  otpPinBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  otpPinText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  statusHeroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  statusHeroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  etaText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },

  // Cancelled
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fde8e6', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#f5c0bb',
  },
  cancelledTitle: { fontSize: 16, fontWeight: '900', color: Colors.red },
  cancelledSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },

  // Timeline
  timelineCard: { paddingBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  timelineIconDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineIconCurrent: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  timelineIconPending: { backgroundColor: Colors.bg, borderColor: Colors.border },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: Colors.primary },
  timelineContent: { flex: 1, paddingBottom: 16, paddingTop: 4 },
  timelineLabel: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  timelineLabelCurrent: { color: Colors.gold },
  timelineLabelPending: { color: Colors.muted, fontWeight: '700' },
  timelineDesc: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 18 },

  // Dish
  dishRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 17, fontWeight: '900', color: Colors.dark },
  dishMeta: { fontSize: 13, color: Colors.muted, marginTop: 3 },

  // Bill
  billBox: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginBottom: 10 },
  paymentTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paymentTagText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // Delivery details
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  detailText: { flex: 1, fontSize: 14, color: Colors.dark, lineHeight: 20 },
  detailTextGreen: { color: Colors.primary, fontWeight: '700' },

  // Actions
  actionsSection: { gap: 10 },
});
