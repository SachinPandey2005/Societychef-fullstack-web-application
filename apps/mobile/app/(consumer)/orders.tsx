import React, { useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Colors } from '../../constants/colors';
import { DISHES } from '../../constants/data';
import { getOrders, cancelOrder, subscribeToOrder, addMorePartyPacks, subscribeToOpsOrders } from '../../services';
import { initiateCashfreePayment } from '../../services/payments';
import { RateOrderModal } from '../../components/RateOrderModal';
import { useReviewStore } from '../../store/useReviewStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DishVisual } from '../../components/ui/DishVisual';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SummaryLine } from '../../components/ui/SummaryLine';
import { money } from '../../lib/format';
import type { Order, OrderStatus } from '../../types';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<OrderStatus, 'default' | 'gold' | 'blue' | 'green' | 'red'> = {
  placed: 'default', accepted: 'blue', preparing: 'gold',
  ready: 'green', out_for_delivery: 'green', delivered: 'green', cancelled: 'red',
};

// English fallbacks — display text resolves through i18n (orders.status.*)
const statusLabel = (t: TFunction, s: OrderStatus) =>
  t(`orders.status.${s}`, STATUS_LABELS[s]);

type StepConfig = { status: OrderStatus; label: string; icon: string; description: string };
const STEP_CONFIG: StepConfig[] = [
  { status: 'placed',           label: 'Order placed',      icon: 'receipt-outline',         description: 'Confirmed and payment received.' },
  { status: 'accepted',         label: 'Accepted by chef',  icon: 'checkmark-circle-outline', description: 'The chef has accepted your order.' },
  { status: 'preparing',        label: 'Being prepared',    icon: 'flame-outline',            description: 'Your meal is being freshly cooked.' },
  { status: 'ready',            label: 'Ready',             icon: 'bag-check-outline',        description: 'Packed and ready for pickup.' },
  { status: 'out_for_delivery', label: 'Out for delivery',  icon: 'bicycle-outline',          description: 'Rider is on the way to you.' },
  { status: 'delivered',        label: 'Delivered',         icon: 'home-outline',             description: 'Enjoy your meal!' },
];
const stepLabel = (t: TFunction, s: OrderStatus, fallback: string) => t(`orders.step.${s}.label`, fallback);
const stepDesc = (t: TFunction, s: OrderStatus, fallback: string) => t(`orders.step.${s}.desc`, fallback);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const { addReview, reviewedOrderIds } = useReviewStore();
  const { addPoints } = useRewardsStore();
  const { addNotification } = useNotificationStore();

  const loadOrders = useCallback(() => {
    const user = useAuthStore.getState().user;
    getOrders(user?.id || '')
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => {
        setIsLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      const unsubAll = subscribeToOpsOrders(() => {
        loadOrders();
      });
      return () => {
        unsubAll();
      };
    }, [loadOrders])
  );

  // Subscribe to real-time updates for each active order
  useFocusEffect(
    useCallback(() => {
      const unsubscribers: Array<() => void> = [];
      orders.forEach((order) => {
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
          const unsub = subscribeToOrder(order.id, (updated) => {
            if (updated && updated.status !== order.status) {
              import('../../services/notifications').then(({ sendOrderStatusNotification }) => {
                sendOrderStatusNotification(updated.id, updated.status);
              });
            }
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            setSelectedOrder((sel) =>
              sel?.id === updated.id ? updated : sel
            );
          });
          unsubscribers.push(unsub);
        }
      });
      return () => {
        unsubscribers.forEach((fn) => fn());
      };
    }, [orders.map((o) => `${o.id}:${o.status}`).join(',')])
  );

  function handleCancel(targetOrder: Order) {
    // Party orders genuinely can't be cancelled within 72 hours of the real,
    // chef-committed event date — the chef has already procured ingredients
    // for a group booking by then.
    if (targetOrder.isPartyOrder && targetOrder.partyBookingDate) {
      const hoursUntilEvent = (new Date(targetOrder.partyBookingDate).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilEvent < 72) {
        Alert.alert(
          t('orders.cancelClosedTitle', 'Cancellation Closed ⚠️'),
          t('orders.cancelClosedParty', 'Party mode bookings cannot be cancelled within 3 days (72 hours) of the scheduled event date as the chef has already prepared ingredients.')
        );
        return;
      }
    }

    // Previously also blocked any non-party order from cancelling within 24
    // hours of createdAt + 24h — a fake "meal prep time" invented for every
    // regular order, not just actual weekly pre-bookings (the mobile Order
    // type has no way to tell them apart from a plain same-day order
    // anyway). Reported directly: cancelling a perfectly normal order showed
    // a confusing "Weekly planner orders cannot be cancelled..." message,
    // even though the order had nothing to do with the weekly planner. The
    // Cancel button is already only shown for orders still in a genuinely
    // cancellable status (canCancel, below) — that's the real, correct gate
    // for regular orders; the backend's own status-transition rules are the
    // final authority regardless.

    // Refund calculation shown here is informational only — the backend is
    // the real authority on refund amount/eligibility (see RefundService,
    // triggered server-side on cancellation of a paid order).
    const originalTotal = targetOrder.total || 0;
    const deductionFee = Math.round(originalTotal * 0.20);
    const refundAmount = originalTotal - deductionFee;

    Alert.alert(
      t('orders.cancelRefundTitle', 'Cancel Order & Refund'),
      t('orders.cancelRefundBody', {
        defaultValue: 'Are you sure you want to cancel this order?\n\n• Order Total: {{total}}\n• Cancellation Fee (20%): -{{fee}}\n• Refund Amount (80%): {{refund}}\n\nRefund will be credited to your account within 3–5 business days.',
        total: money(originalTotal),
        fee: money(deductionFee),
        refund: money(refundAmount),
      }),
      [
        { text: t('orders.keepOrder', 'Keep Order'), style: 'cancel' },
        {
          text: t('orders.confirmCancellation', 'Confirm Cancellation'),
          style: 'destructive',
          onPress: async () => {
            // Previously only flipped local state to "cancelled" and showed
            // a success alert — the order was never actually cancelled on
            // the server, and the fake status reverted on the next refresh.
            try {
              await cancelOrder(targetOrder.id);
              loadOrders();
              setSelectedOrder((o) => (o?.id === targetOrder.id ? { ...o, status: 'cancelled' as OrderStatus } : o));
              Alert.alert(
                t('orders.orderCancelledTitle', 'Order Cancelled'),
                t('orders.orderCancelledBody', {
                  defaultValue: 'Your order has been cancelled. {{refund}} (80% of total) has been initiated for refund after 20% cancellation fee deduction.',
                  refund: money(refundAmount),
                })
              );
            } catch (e: any) {
              Alert.alert(
                t('orders.cancelFailedTitle', 'Could not cancel'),
                e?.message || t('orders.cancelFailedBody', 'This order could not be cancelled right now. Please try again or contact the chef.')
              );
            }
          },
        },
      ]
    );
  }

  function handleSubmitReview(rating: number, comment: string) {
    if (!ratingOrder) return;
    addReview({
      orderId: ratingOrder.id,
      kitchenId: ratingOrder.kitchenId,
      kitchenName: ratingOrder.kitchenName,
      dishId: ratingOrder.dishId,
      dishName: ratingOrder.dishName,
      rating,
      comment,
    });
    // Bonus points for reviewing
    addPoints(10);
    addNotification({
      type: 'promo',
      title: t('orders.reviewThanksTitle', 'Thanks for your review!'),
      body: t('orders.reviewThanksBody', {
        defaultValue: 'You earned 10 bonus points for reviewing {{kitchen}}.',
        kitchen: ratingOrder.kitchenName,
      }),
      icon: 'star-outline',
      tone: 'gold',
    });
    setRatingOrder(null);
  }

  const { addItem } = useCartStore();

  function handleRepeatOrder(targetOrder: Order) {
    if (targetOrder.isPartyOrder) {
      router.push('/(consumer)/discover');
      Alert.alert(t('orders.partyModeBookingTitle', 'Party Mode Booking'), t('orders.partyModeBookingBody', 'Navigated to kitchens list. Select kitchen to customize party package!'));
      return;
    }

    const dishItem = DISHES.find((d) => d.id === targetOrder.dishId);
    addItem({
      kitchenId: targetOrder.kitchenId,
      dishId: targetOrder.dishId,
      quantity: targetOrder.quantity || 1,
      dishName: targetOrder.dishName,
      kitchenName: targetOrder.kitchenName,
      price: targetOrder.price,
      imageUrl: dishItem?.image,
    });

    Alert.alert(
      t('orders.orderRepeatedTitle', 'Order Repeated! 🛍️'),
      t('orders.orderRepeatedBody', {
        defaultValue: 'Added {{qty}}x {{dish}} to your cart.',
        qty: targetOrder.quantity || 1,
        dish: targetOrder.dishName,
      }),
      [
        { text: t('orders.continueShopping', 'Continue Shopping'), style: 'cancel' },
        { text: t('orders.goToCart', 'Go to Cart'), onPress: () => router.push('/(consumer)/cart') },
      ]
    );
  }

  async function handlePayNow(orderToPay: Order) {
    try {
      const currentUser = useAuthStore.getState().user;
      const payRes = await initiateCashfreePayment({
        orderId: orderToPay.id,
        amount: orderToPay.total,
        customerName: currentUser?.displayName || 'Resident',
        customerPhone: currentUser?.phone || '9999999999',
      });

      if (payRes && payRes.success) {
        // payRes.success already means the backend independently verified this
        // payment with Cashfree and wrote payment_status='paid' itself (see
        // apps/backend/src/services/cashfree.service.ts). We used to also call
        // payPartyOrder() here to set payment_status directly from the client —
        // that was a second, unverified path to the same flag: anyone could call
        // it directly on any order id and mark it paid without ever paying. It's
        // now rejected at the database level (see
        // supabase/migrations/20260920000001_lock_down_orders_authorization.sql),
        // and unnecessary here since the backend already did the real write.
        setOrders((prev) =>
          prev.map((o) => (o.id === orderToPay.id ? { ...o, paymentStatus: 'PAID' } : o))
        );
        if (selectedOrder?.id === orderToPay.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: 'PAID' } : null));
        }
        addNotification({
          type: 'order_update',
          title: t('orders.paymentSuccessNotifTitle', '🎉 Payment Successful!'),
          body: t('orders.paymentSuccessNotifBody', {
            defaultValue: 'Payment of ₹{{amount}} for {{dish}} has been received by chef.',
            amount: orderToPay.total,
            dish: orderToPay.dishName,
          }),
          icon: 'checkmark-circle-outline',
          tone: 'green',
        });
        Alert.alert(t('orders.paymentSuccessTitle', 'Payment Successful! 🎉'), t('orders.paymentSuccessBody', 'Your pre-booking payment is complete.'));
      } else {
        Alert.alert(t('orders.paymentFailedTitle', 'Payment Failed'), t('orders.paymentFailedBody', 'Transaction could not be completed. Please try again.'));
      }
    } catch {
      Alert.alert(t('orders.paymentFailedTitle', 'Payment Failed'), t('orders.paymentErrorBody', 'An error occurred during payment.'));
    }
  }

  const [addPackOrder, setAddPackOrder] = useState<Order | null>(null);
  const [additionalCount, setAdditionalCount] = useState<number>(2);
  const [isSubmittingPacks, setIsSubmittingPacks] = useState<boolean>(false);

  async function handleConfirmAddPacks() {
    if (!addPackOrder || additionalCount <= 0) return;
    setIsSubmittingPacks(true);
    try {
      const isAccepted = addPackOrder.status !== 'placed';
      const perHeadPrice = addPackOrder.perHeadPrice || Math.round(addPackOrder.total / (addPackOrder.guestCount || 1));
      const res = await addMorePartyPacks(addPackOrder.id, additionalCount, perHeadPrice, isAccepted);

      if (!isAccepted) {
        // Pre-acceptance flow: Directly updates order & sends updated request to chef (0% extra fee)
        setOrders((prev) =>
          prev.map((o) =>
            o.id === addPackOrder.id
              ? {
                  ...o,
                  guestCount: (o.guestCount || 10) + additionalCount,
                  quantity: (o.guestCount || 10) + additionalCount,
                  total: o.total + res.addonTotal,
                }
              : o
          )
        );
        addNotification({
          type: 'order_update',
          title: t('orders.addonUpdatedNotifTitle', '📝 Order Request Updated'),
          body: t('orders.addonUpdatedNotifBody', {
            defaultValue: 'Updated request for {{dish}} with {{count}} extra packs sent directly to chef (0% fee).',
            dish: addPackOrder.dishName,
            count: additionalCount,
          }),
          icon: 'paper-plane-outline',
          tone: 'gold',
        });
        Alert.alert(
          t('orders.requestUpdatedTitle', 'Request Updated 🎉'),
          t('orders.requestUpdatedBody', {
            defaultValue: 'Added {{count}} packs at base rate ₹{{rate}}/pack (0% extra fee). Updated pre-booking request sent directly to chef for approval.',
            count: additionalCount,
            rate: res.ratePerPack,
          })
        );
      } else {
        // Post-acceptance flow: Requires chef approval -> payment notification -> payment (includes 10% fee)
        setOrders((prev) =>
          prev.map((o) =>
            o.id === addPackOrder.id
              ? {
                  ...o,
                  status: 'placed', // resets to placed for chef re-approval of add-on
                  guestCount: (o.guestCount || 10) + additionalCount,
                  quantity: (o.guestCount || 10) + additionalCount,
                  total: o.total + res.addonTotal,
                  paymentStatus: 'PENDING',
                }
              : o
          )
        );
        addNotification({
          type: 'order_update',
          title: t('orders.addonSentNotifTitle', '⏳ Add-on Request Sent to Chef'),
          body: t('orders.addonSentNotifBody', {
            defaultValue: 'Add-on request for {{count}} extra packs (includes 10% edit fee: ₹{{rate}}/pack) sent for chef approval. You will receive a payment notification once chef approves!',
            count: additionalCount,
            rate: res.ratePerPack,
          }),
          icon: 'time-outline',
          tone: 'gold',
        });
        Alert.alert(
          t('orders.addonSentTitle', 'Add-on Request Sent! ⏱️'),
          t('orders.addonSentBody', {
            defaultValue: '📌 10% Edit Fee Applied: Rate per pack is ₹{{rate}}/pack.\n\nYour request for {{count}} additional packs ({{total}}) has been sent to the chef. Once the chef approves, you will receive a Payment Notification to complete payment!',
            rate: res.ratePerPack,
            count: additionalCount,
            total: money(res.addonTotal),
          })
        );
      }

      if (selectedOrder?.id === addPackOrder.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: !isAccepted ? prev.status : 'placed',
                guestCount: (prev.guestCount || 10) + additionalCount,
                quantity: (prev.guestCount || 10) + additionalCount,
                total: prev.total + res.addonTotal,
                paymentStatus: !isAccepted ? prev.paymentStatus : 'PENDING',
              }
            : null
        );
      }

      setAddPackOrder(null);
    } catch (e: any) {
      // This used to show a fake "Additional packs updated" success message on
      // any failure, which is worse than no message at all here: this write can
      // now be genuinely rejected by the database (adding packs recalculates and
      // writes total_amount directly from the client, which the new orders
      // authorization lockdown blocks — see
      // supabase/migrations/20260920000001_lock_down_orders_authorization.sql).
      // That's a known gap: this feature needs to move to a backend endpoint
      // that recomputes the bill server-side rather than trusting a client-sent
      // total. Until then, tell the customer honestly that it didn't go through.
      Alert.alert(
        t('orders.addonFailedTitle', 'Could not add packs'),
        e?.message || t('orders.addonFailedBody', 'This request could not be sent right now. Please try again or contact the chef directly.')
      );
    } finally {
      setIsSubmittingPacks(false);
    }
  }

  if (isLoading) return <LoadingSpinner fullscreen label={t('orders.loading', 'Loading orders...')} />;

  const active = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const past   = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />}
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.dark} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('orders.back', 'Back')}</Text>
          </Pressable>

          <ScreenTitle eyebrow={t('orders.eyebrow', 'Your orders')} title={t('orders.screenTitle', 'Track active meals.')} />

        {orders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title={t('orders.emptyTitle', 'No orders yet')}
            body={t('orders.emptyBody', 'Discover home kitchens nearby and place your first order!')}
            action={{ label: t('orders.emptyAction', 'Browse kitchens'), onPress: () => router.push('/(consumer)/discover') }}
          />
        ) : (
          <View style={styles.list}>
            {active.length > 0 && (
              <>
                <Text style={styles.groupLabel}>{t('orders.groupActive', 'Active')}</Text>
                {active.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onPress={() => setSelectedOrder(o)}
                    onRate={() => setRatingOrder(o)}
                    onRepeat={handleRepeatOrder}
                    onPayNow={() => handlePayNow(o)}
                    onAddMorePacks={(targetOrder) => {
                      setAdditionalCount(2);
                      setAddPackOrder(targetOrder);
                    }}
                    alreadyReviewed={reviewedOrderIds.includes(o.id)}
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.groupLabel}>{t('orders.groupPast', 'Past orders')}</Text>
                {past.map((o) => (
                  <OrderCard key={o.id} order={o} onPress={() => setSelectedOrder(o)} onRate={() => setRatingOrder(o)} onRepeat={handleRepeatOrder} onPayNow={() => handlePayNow(o)} alreadyReviewed={reviewedOrderIds.includes(o.id)} />
                ))}
              </>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Order detail modal ───────────────────────────────────────────── */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <OrderDetailSheet
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onCancel={() => handleCancel(selectedOrder)}
            onPayNow={() => handlePayNow(selectedOrder)}
            onAddMorePacks={(o) => {
              setAdditionalCount(2);
              setAddPackOrder(o);
            }}
          />
        )}
      </Modal>

      {/* ── Add Additional Packs Modal ────────────────────────────────────── */}
      <Modal
        visible={!!addPackOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setAddPackOrder(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setAddPackOrder(null)} />
          {addPackOrder && (() => {
            const isAccepted = addPackOrder.status !== 'placed';
            const basePerHead = addPackOrder.perHeadPrice || Math.round(addPackOrder.total / (addPackOrder.guestCount || 1));
            const editFeePerPack = isAccepted ? Math.round(basePerHead * 0.10) : 0;
            const ratePerPack = basePerHead + editFeePerPack;
            const addonTotal = ratePerPack * additionalCount;

            return (
              <View style={{ backgroundColor: '#FAF6F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5C9BD', alignSelf: 'center', marginBottom: 16 }} />
                
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.dark, marginBottom: 4 }}>{t('orders.addAdditionalPacks', 'Add Additional Packs')}</Text>
                <Text style={{ fontSize: 13, color: Colors.muted, marginBottom: 16 }}>{t('orders.topUpOrder', { defaultValue: 'Top up Order #{{id}} — same pack you already booked', id: addPackOrder.id })}</Text>

                <View style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8E1D9', marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#D97724', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>{t('orders.currentlyBooked', 'CURRENTLY BOOKED')}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.dark }}>{t('orders.packName', { defaultValue: '{{pack}} Pack', pack: addPackOrder.selectedPackName || 'Luxury' })}</Text>
                    <View style={{ backgroundColor: '#F5E6D3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97724' }}>{t('orders.bookedCount', { defaultValue: '{{count}} booked', count: addPackOrder.guestCount || 10 })}</Text>
                    </View>
                  </View>
                </View>

                {/* Counter card (Capped at maximum 6 members) */}
                <View style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E1D9', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 4 }}>{t('orders.howManyPacks', 'How many additional packs?')}</Text>
                  <Text style={{ fontSize: 11, color: '#D97724', fontWeight: '700', marginBottom: 12 }}>{t('orders.maxCap', 'Max cap: Up to 6 additional members')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                    <Pressable
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: additionalCount <= 1 ? '#F0EBE5' : '#E8E1D9', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => setAdditionalCount((c) => Math.max(1, c - 1))}
                      disabled={additionalCount <= 1}
                    >
                      <Ionicons name="remove" size={20} color={additionalCount <= 1 ? Colors.muted : Colors.dark} />
                    </Pressable>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.dark, minWidth: 30, textAlign: 'center' }}>{additionalCount}</Text>
                    <Pressable
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: additionalCount >= 6 ? '#F0EBE5' : Colors.primary, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => {
                        if (additionalCount >= 6) {
                          Alert.alert(t('orders.maxLimitTitle', 'Maximum Limit Reached ⚠️'), t('orders.maxLimitBody', 'You can add up to a maximum of 6 additional members per edit.'));
                          return;
                        }
                        setAdditionalCount((c) => Math.min(6, c + 1));
                      }}
                    >
                      <Ionicons name="add" size={20} color={additionalCount >= 6 ? Colors.muted : '#FFF'} />
                    </Pressable>
                  </View>
                </View>

                {/* Rate breakdown card */}
                <View style={{ backgroundColor: '#2C221E', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{t('orders.basePackRate', 'Base pack rate')}</Text>
                    <Text style={{ fontSize: 13, color: '#FFF', fontWeight: '600' }}>{money(basePerHead)}</Text>
                  </View>
                  {isAccepted ? (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                        <Text style={{ fontSize: 13, color: '#EAB308', fontWeight: '700' }}>{t('orders.addonEditFee', 'Add-on edit fee (10%)')}</Text>
                        <Text style={{ fontSize: 13, color: '#EAB308', fontWeight: '700' }}>+{money(editFeePerPack)}</Text>
                      </View>
                      <View style={{ marginTop: 6, padding: 8, backgroundColor: 'rgba(234, 179, 8, 0.15)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="information-circle-outline" size={16} color="#EAB308" />
                        <Text style={{ color: '#EAB308', fontSize: 11, fontWeight: '700', flex: 1 }}>
                          {t('orders.addonEditFeeNote', 'Note: Since this order is already accepted by the chef, adding extra packs incurs a 10% edit fee per person.')}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                      <Text style={{ fontSize: 13, color: '#22C55E', fontWeight: '700' }}>{t('orders.preAcceptanceEditFee', 'Pre-acceptance edit fee')}</Text>
                      <Text style={{ fontSize: 13, color: '#22C55E', fontWeight: '700' }}>{t('orders.freePercent', 'FREE (0%)')}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '800' }}>{t('orders.effectiveRatePerPack', 'Effective rate per pack')}</Text>
                    <Text style={{ fontSize: 14, color: '#FFF', fontWeight: '800' }}>{money(ratePerPack)}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '900' }}>{t('orders.addonTotalLabel', 'Add-on total')}</Text>
                    <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '900' }}>{money(addonTotal)}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button flex label={t('orders.cancel', 'Cancel')} variant="secondary" onPress={() => setAddPackOrder(null)} />
                  <Button
                    flex
                    label={isSubmittingPacks ? t('orders.updating', 'Updating...') : t('orders.addPacksCount', { defaultValue: 'Add {{count}} Packs · {{total}}', count: additionalCount, total: money(addonTotal) })}
                    variant="primary"
                    onPress={handleConfirmAddPacks}
                    disabled={isSubmittingPacks}
                  />
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      <RateOrderModal
        visible={!!ratingOrder}
        order={ratingOrder}
        onClose={() => setRatingOrder(null)}
        onSubmit={handleSubmitReview}
      />
      </ImageBackground>
    </SafeAreaView>
  );
}

// ── Order card (list item) ────────────────────────────────────────────────────
function OrderCard({ order, onPress, onRate, onRepeat, onPayNow, onAddMorePacks, alreadyReviewed }: { order: Order; onPress: () => void; onRate: () => void; onRepeat: (o: Order) => void; onPayNow: () => void; onAddMorePacks?: (o: Order) => void; alreadyReviewed: boolean }) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const dish = DISHES.find((d) => d.id === order.dishId);
  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isActive = !isCancelled && order.status !== 'delivered';
  const progressPct = Math.round(((currentIdx + 1) / STATUS_STEPS.length) * 100);
  const isPaymentPending = order.isPartyOrder && order.paymentStatus === 'PENDING' && order.status !== 'placed';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Dish photo + info */}
      <View style={styles.cardTop}>
        {order.isPartyOrder ? (
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#F5E6D3', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D97724' }}>
            <Ionicons name="sparkles" size={24} color="#D97724" />
          </View>
        ) : (
          dish && <DishVisual dish={dish} size="md" />
        )}
        <View style={styles.cardInfo}>
          {order.isPartyOrder && (
            <View style={{ backgroundColor: '#F5E6D3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97724' }}>{t('orders.partyPreBooking', 'PARTY PRE-BOOKING')}</Text>
            </View>
          )}
          <Text style={styles.orderId}>#{order.orderCode || order.id}</Text>
          <Text style={styles.dishName} numberOfLines={1}>{order.dishName}</Text>
          <Text style={styles.kitchenMeta}>{order.kitchenName}</Text>
          <Text style={styles.kitchenMeta}>
            {order.isPartyOrder
              ? t('orders.guestsAndTotal', { defaultValue: '{{count}} guests · {{total}}', count: order.guestCount, total: money(order.total) })
              : t('orders.qtyAndTotal', { defaultValue: 'Qty {{qty}} · {{total}}', qty: order.quantity, total: money(order.total) })}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Badge
            label={isCancelled ? statusLabel(t, 'cancelled') : (order.isPartyOrder && order.status === 'placed' ? t('orders.waitingForApproval', 'Waiting for approval') : statusLabel(t, order.status))}
            tone={order.isPartyOrder && order.status === 'placed' ? 'gold' : STATUS_TONE[order.status]}
            small
          />
          {isActive && (
            <View style={styles.etaRow}>
              <Ionicons name="time-outline" size={11} color={Colors.primary} />
              <Text style={styles.etaText}>
                {order.isPartyOrder && order.partyBookingDate
                  ? new Date(order.partyBookingDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                  : order.eta}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Progress bar for active orders */}
      {isActive && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>
            {order.isPartyOrder && order.status === 'placed' ? t('orders.waitingForChefApproval', 'Waiting for chef approval') : statusLabel(t, order.status)}
          </Text>
        </View>
      )}

      {order.isPartyOrder && order.status === 'placed' ? (
        <View style={{ marginTop: 8, padding: 10, backgroundColor: '#FEFCE8', borderRadius: 12, borderWidth: 1, borderColor: '#FDE047', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#854D0E' }}>⏳ {t('orders.waitingForChefApproval', 'Waiting for chef approval')}</Text>
            <Text style={{ fontSize: 11, color: '#A16207' }}>{t('orders.editPacksFree', 'Edit packs free (0% fee) before chef accepts!')}</Text>
          </View>
          <Pressable
            style={{ backgroundColor: '#D97724', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={(e) => { e.stopPropagation?.(); onAddMorePacks?.(order); }}
          >
            <Ionicons name="create" size={14} color="#FFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{t('orders.editPacks', 'Edit Packs')}</Text>
          </Pressable>
        </View>
      ) : isPaymentPending ? (
        <View style={{ marginTop: 8, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#991B1B' }}>{t('orders.chefAcceptedPaymentRequired', 'Chef Accepted! Payment Required')}</Text>
            <Text style={{ fontSize: 11, color: '#7F1D1D' }}>{t('orders.payNowToConfirmSlot', { defaultValue: 'Pay ₹{{amount}} now to confirm your party slot.', amount: order.total })}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push({ pathname: '/(consumer)/chat', params: { kitchenId: order.kitchenId, kitchenName: order.kitchenName } });
              }}
            >
              <Ionicons name="chatbubble" size={14} color={Colors.primary} />
              <Text style={{ color: Colors.dark, fontWeight: '700', fontSize: 12 }}>{t('orders.chat', 'Chat')}</Text>
            </Pressable>
            <Pressable
              style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
              onPress={(e) => { e.stopPropagation?.(); onPayNow(); }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{t('orders.payNow', 'Pay Now')}</Text>
            </Pressable>
          </View>
        </View>
      ) : order.isPartyOrder ? (
        <View style={{ marginTop: 8, padding: 10, backgroundColor: '#FAF6F0', borderRadius: 12, borderWidth: 1, borderColor: '#E8E1D9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.dark }}>{t('orders.packConfirmed', { defaultValue: '{{pack}} Pack Confirmed', pack: order.selectedPackName || 'Luxury' })}</Text>
            <Text style={{ fontSize: 11, color: Colors.muted }}>{t('orders.topUpGuestPacks', 'Top up guest packs anytime before event')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5C9BD', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push({ pathname: '/(consumer)/chat', params: { kitchenId: order.kitchenId, kitchenName: order.kitchenName } });
              }}
            >
              <Ionicons name="chatbubble" size={14} color={Colors.primary} />
              <Text style={{ color: Colors.dark, fontWeight: '800', fontSize: 12 }}>{t('orders.chat', 'Chat')}</Text>
            </Pressable>
            <Pressable
              style={{ backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={(e) => { e.stopPropagation?.(); onAddMorePacks?.(order); }}
            >
              <Ionicons name="add-circle" size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{t('orders.addPacks', 'Add Packs')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <Text style={styles.tapHint}>{t('orders.tapToViewDetails', 'Tap to view details & tracking →')}</Text>
          <Pressable
            style={{ backgroundColor: Colors.pillInactive, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push({ pathname: '/(consumer)/chat', params: { kitchenId: order.kitchenId, kitchenName: order.kitchenName } });
            }}
          >
            <Ionicons name="chatbubble-outline" size={13} color={Colors.dark} />
            <Text style={{ color: Colors.dark, fontWeight: '700', fontSize: 12 }}>{t('orders.chat', 'Chat')}</Text>
          </Pressable>
        </View>
      )}

      {order.status === 'delivered' && (
        <View style={styles.cardActionsRow}>
          {!alreadyReviewed && (
            <Pressable style={styles.rateBtn} onPress={onRate}>
              <Ionicons name="star-outline" size={14} color={Colors.gold} />
              <Text style={styles.rateBtnText}>{t('orders.rateOrder', 'Rate order')}</Text>
            </Pressable>
          )}
          {alreadyReviewed && (
            <View style={styles.reviewedRow}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              <Text style={styles.reviewedText}>{t('orders.reviewed', 'Reviewed')}</Text>
            </View>
          )}
          <Pressable style={styles.repeatBtn} onPress={() => onRepeat(order)}>
            <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
            <Text style={styles.repeatBtnText}>{t('orders.repeatOrder', 'Repeat Order')}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

// ── Order detail sheet (modal content) ───────────────────────────────────────
function OrderDetailSheet({
  order,
  onClose,
  onCancel,
  onPayNow,
  onAddMorePacks,
}: {
  order: Order;
  onClose: () => void;
  onCancel: () => void;
  onPayNow: () => void;
  onAddMorePacks?: (o: Order) => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const dish = DISHES.find((d) => d.id === order.dishId);
  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isActive = !isCancelled && order.status !== 'delivered';
  const canCancel = order.status === 'placed' || order.status === 'accepted';
  const isPaymentPending = order.isPartyOrder && order.paymentStatus === 'PENDING' && order.status !== 'placed';

  return (
    <SafeAreaView style={styles.sheetSafe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.sheetHeaderCenter}>
          <Text style={styles.sheetHeaderTitle}>{t('orders.orderNumber', { defaultValue: 'Order {{id}}', id: order.orderCode || order.id })}</Text>
          <Text style={styles.sheetHeaderSub}>{order.kitchenName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={28} color={Colors.red} />
            <View>
              <Text style={styles.cancelledTitle}>{t('orders.orderCancelledHero', 'Order cancelled')}</Text>
              <Text style={styles.cancelledSub}>{t('orders.refundInDays', 'Refund in 3–5 business days')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusHero}>
            <Text style={styles.heroEyebrow}>{isActive ? t('orders.liveStatus', 'Live status') : t('orders.completed', 'Completed')}</Text>
            <Text style={styles.heroTitle}>
              {order.isPartyOrder && order.status === 'placed'
                ? t('orders.waitingForChefApproval', 'Waiting for chef approval')
                : stepLabel(t, STEP_CONFIG[currentIdx]?.status, STEP_CONFIG[currentIdx]?.label)}
            </Text>
            <Text style={styles.heroSub}>
              {order.isPartyOrder && order.status === 'placed'
                ? t('orders.partyPendingHeroSub', 'Your party pre-booking has been sent to the chef. You can pay once the chef accepts!')
                : stepDesc(t, STEP_CONFIG[currentIdx]?.status, STEP_CONFIG[currentIdx]?.description)}
            </Text>
            {order.isPartyOrder && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={18} color={Colors.gold} />
                <Text style={{ flex: 1, color: '#FFFFFF', fontSize: 12, fontWeight: '600', lineHeight: 17 }}>
                  {t('orders.partyEventNote', 'Your event is scheduled — add-on edits close 6 hours before pickup time.')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Progress timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('orders.orderProgress', 'Order progress')}</Text>
          {STEP_CONFIG.map((step, idx) => {
            const isDone    = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;
            const isLast    = idx === STEP_CONFIG.length - 1;
            return (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    isDone    && styles.timelineIconDone,
                    isCurrent && styles.timelineIconCurrent,
                    isPending && styles.timelineIconPending,
                  ]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={13} color="#fff" />
                      : <Ionicons name={step.icon as any} size={13} color={isCurrent ? '#fff' : Colors.muted} />
                    }
                  </View>
                  {!isLast && (
                    <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={styles.timelineBody}>
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
        </View>

        {/* Dish / Party Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{order.isPartyOrder ? t('orders.partyMenuItems', 'Party Menu & Selected Items') : t('orders.yourOrder', 'Your order')}</Text>
          {order.isPartyOrder ? (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.dark }}>{t('orders.packLabel', { defaultValue: '{{pack}} PACK', pack: order.selectedPackName || 'JALSA' })}</Text>
                <View style={{ backgroundColor: '#F5E6D3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97724' }}>{t('orders.guestsCount', { defaultValue: '{{count}} Guests', count: order.guestCount })}</Text>
                </View>
              </View>
              {order.partyBookingDate && (
                <Text style={{ fontSize: 12, color: Colors.muted, marginBottom: 8 }}>
                  {t('orders.scheduledDate', { defaultValue: 'Scheduled Date: {{date}}', date: new Date(order.partyBookingDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) })}
                </Text>
              )}
              <View style={{ height: 1, backgroundColor: '#E5DFD7', marginVertical: 6 }} />
              {(order.partyDishes || []).map((d: any, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                  <Text style={{ fontSize: 14, color: Colors.dark, fontWeight: '600' }}>• {d.name} ({d.category})</Text>
                  {d.extraChargePerHead ? (
                    <Text style={{ fontSize: 12, color: '#D97724', fontWeight: '700' }}>{t('orders.extraPerHead', { defaultValue: '+₹{{amount}}/head', amount: d.extraChargePerHead })}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.dishRow}>
              {dish && <DishVisual dish={dish} size="md" />}
              <View style={{ flex: 1 }}>
                <Text style={styles.detailDishName}>{order.dishName}</Text>
                <Text style={styles.detailMeta}>{order.kitchenName}</Text>
                <Text style={styles.detailMeta}>{t('orders.qtyLabel', { defaultValue: 'Qty {{qty}}', qty: order.quantity })}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bill */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('orders.billSummary', 'Bill summary')}</Text>
          <View style={styles.billBox}>
            {order.isPartyOrder ? (
              <>
                <SummaryLine label={t('orders.partyPackageLine', { defaultValue: 'Party Package ({{count}} guests × ₹{{perHead}})', count: order.guestCount, perHead: order.perHeadPrice || Math.round(order.total / (order.guestCount || 1)) })} value={money(order.total)} />
                <SummaryLine label={t('orders.deliveryHandling', 'Delivery & Handling')} value={t('orders.free', 'FREE')} />
                <SummaryLine label={order.paymentStatus === 'PAID' ? t('orders.totalPaidLabel', 'Total Paid') : t('orders.totalPayableLabel', 'Total Payable')} value={money(order.total)} strong separator />
              </>
            ) : (
              <>
                <SummaryLine label={t('orders.listPrice', 'List price')} value={money(order.listAmount)} />
                {order.societyDiscount > 0 && (
                  <SummaryLine label={t('orders.societyDiscountLine', 'Same society discount (10%)')} value={`-${money(order.societyDiscount)}`} />
                )}
                <SummaryLine label={t('orders.deliveryFeeLine', 'Delivery fee')} value={money(order.deliveryFee)} />
                <SummaryLine label={t('orders.totalPaidLine', 'Total paid')} value={money(order.total)} strong separator />
              </>
            )}
          </View>
          {order.paymentStatus === 'PAID' ? (
            <View style={styles.payTag}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
              <Text style={styles.payTagText}>{t('orders.paidVerified', 'Paid via RasoHi · Platform verified')}</Text>
            </View>
          ) : (
            <View style={[styles.payTag, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
              <Text style={[styles.payTagText, { color: '#DC2626', fontWeight: '700' }]}>{t('orders.paymentPendingAction', 'Payment Pending · Action Required')}</Text>
            </View>
          )}
        </View>

        {/* Delivery details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('orders.deliveryDetails', 'Delivery details')}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={Colors.muted} />
            <Text style={styles.detailRowText}>
              {order.delivery?.deliveryAddress?.address ||
                useAuthStore.getState().user?.address ||
                [useAuthStore.getState().user?.society, useAuthStore.getState().user?.tower, useAuthStore.getState().user?.flat].filter(Boolean).join(', ') ||
                t('orders.deliveryAddressFallback', 'Delivery Address')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.muted} />
            <Text style={styles.detailRowText}>{t('orders.estimatedBy', { defaultValue: 'Estimated by {{eta}}', eta: order.eta })}</Text>
          </View>
          {order.societyDiscount > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="home-outline" size={16} color={Colors.primary} />
              <Text style={[styles.detailRowText, { color: Colors.primary, fontWeight: '700' }]}>
                {t('orders.sameSocietyDiscountApplied', 'Same society — 10% discount applied')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {order.isPartyOrder && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button
              label={t('orders.addMorePacks', 'Add More Packs')}
              variant="primary"
              icon={<Ionicons name="add-circle-outline" size={18} color="#fff" />}
              onPress={() => onAddMorePacks?.(order)}
            />
          )}
          {isPaymentPending && (
            <Button
              label={t('orders.payAmountNow', { defaultValue: 'Pay ₹{{amount}} Now', amount: order.total })}
              variant="primary"
              icon={<Ionicons name="card-outline" size={18} color="#fff" />}
              onPress={onPayNow}
            />
          )}
          {canCancel && (
            <Button label={t('orders.cancelOrder', 'Cancel order')} variant="secondary" onPress={onCancel} />
          )}
          <Button
            label={t('orders.chatWithChef', 'Chat with chef')}
            variant="secondary"
            icon={<Ionicons name="chatbubble-outline" size={16} color={Colors.dark} />}
            onPress={() => {
              onClose();
              router.push({
                pathname: '/(consumer)/chat',
                params: { kitchenId: order.kitchenId, kitchenName: order.kitchenName },
              });
            }}
          />
          {order.status === 'delivered' && (
            <Button
              label={t('orders.reorderBtn', 'Re-order')}
              variant="primary"
              icon={<Ionicons name="refresh-outline" size={16} color="#fff" />}
              onPress={() => { onClose(); router.push('/(consumer)/discover'); }}
            />
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  list: { gap: 12 },

  groupLabel: {
    fontSize: 12, fontWeight: '900', color: Colors.secondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 4,
  },

  // Order card
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 12,
  },
  cardPressed: { opacity: 0.82 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  orderId: { fontSize: 11, fontWeight: '900', color: Colors.red, letterSpacing: 0.4, marginBottom: 2 },
  dishName: { fontSize: 16, fontWeight: '900', color: Colors.dark, lineHeight: 22 },
  kitchenMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  etaText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  progressWrap: { gap: 4 },
  progressTrack: { height: 5, backgroundColor: Colors.pillInactive, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 999 },
  progressLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  tapHint: { fontSize: 11, color: Colors.muted, textAlign: 'right' },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingVertical: 8, backgroundColor: Colors.goldBadge, borderRadius: 8 },
  rateBtnText: { fontSize: 13, fontWeight: '800', color: '#7c5400' },
  repeatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingVertical: 8, backgroundColor: '#D97724', borderRadius: 8 },
  repeatBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  reviewedRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  reviewedText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  // Modal sheet
  sheetSafe: { flex: 1, backgroundColor: Colors.bg },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.pillInactive, alignItems: 'center', justifyContent: 'center',
  },
  sheetHeaderCenter: { flex: 1, alignItems: 'center' },
  sheetHeaderTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  sheetHeaderSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  sheetScroll: { flex: 1 },
  sheetContent: { padding: 16, gap: 12 },

  // Status hero
  statusHero: { backgroundColor: Colors.primaryDeep, borderRadius: 16, padding: 20 },
  heroEyebrow: { color: Colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 },
  heroEta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  heroEtaText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },

  // Cancelled
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fde8e6', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#f5c0bb',
  },
  cancelledTitle: { fontSize: 16, fontWeight: '900', color: Colors.red },
  cancelledSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },

  // Section wrapper
  section: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.secondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
  },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  timelineIconDone:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineIconCurrent: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  timelineIconPending: { backgroundColor: Colors.bg, borderColor: Colors.border },
  timelineLine:     { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: Colors.primary },
  timelineBody: { flex: 1, paddingBottom: 14, paddingTop: 4 },
  timelineLabel:        { fontSize: 14, fontWeight: '800', color: Colors.dark },
  timelineLabelCurrent: { color: Colors.gold },
  timelineLabelPending: { color: Colors.muted, fontWeight: '700' },
  timelineDesc: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 18 },

  // Dish row
  dishRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  detailDishName: { fontSize: 17, fontWeight: '900', color: Colors.dark },
  detailMeta: { fontSize: 13, color: Colors.muted, marginTop: 3 },

  // Bill
  billBox: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginBottom: 10 },
  payTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payTagText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // Delivery
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  detailRowText: { flex: 1, fontSize: 14, color: Colors.dark, lineHeight: 20 },

  // Actions
  actionsSection: { gap: 10 },
});
