import { useRef, useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { money } from '../lib/format';
import { calculateBill, FREE_DELIVERY_THRESHOLD } from '../lib/priceUtils';
import {
  useRewardsStore,
  pointsValue,
  rupeesToPoints,
  MIN_REDEEM_POINTS,
} from '../store/useRewardsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { DishVisual } from './ui/DishVisual';
import { SummaryLine } from './ui/SummaryLine';
import { Button } from './ui/Button';
import { AllergySelector, type AllergyValue } from './AllergySelector';
import { DeliveryMethodSelector } from './DeliveryMethodSelector';
import type { AllergyInfo, DeliveryDetails, DeliveryMethod, DishAddon } from '../types';
import { getKitchen, getDish } from '../services';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { initiateCashfreePayment, type PaymentMethod } from '../services/payments';
import { useToast } from './ui/Toast';
import { AddressInputModal } from './AddressInputModal';
import { router } from 'expo-router';

/** The real, backend-created order that payment must be charged against. */
type PlacedOrder = { id: string; total?: number; dishName?: string; kitchenName?: string; eta?: string };

interface CheckoutModalProps {
  visible: boolean;
  kitchenId: string;
  dishId: string;
  dishName?: string;
  kitchenName?: string;
  dishPrice?: number;
  consumerSociety: string;
  // Chosen in DishDetailModal before this opens — the real total charged is
  // always computed server-side from these same ids (OrderService
  // .createDirectOrder), this is purely so the displayed preview matches it.
  selectedAddons?: DishAddon[];
  // Also chosen in DishDetailModal — without this, this modal's own
  // quantity stepper silently reset back to 1 regardless of what was picked
  // there.
  initialQuantity?: number;
  onClose: () => void;
  /**
   * Creates the real order in the backend and returns it — must NOT perform
   * payment or navigation itself. CheckoutModal charges Cashfree against the
   * returned order's real id, never a client-generated placeholder, so a
   * payment can never be captured without a corresponding order existing.
   */
  onConfirm: (
    quantity: number,
    pointsUsed: number,
    allergyInfo: AllergyInfo,
    delivery: DeliveryDetails
  ) => Promise<PlacedOrder>;
}

export function CheckoutModal({
  visible,
  kitchenId,
  dishId,
  dishName,
  kitchenName,
  dishPrice,
  consumerSociety,
  selectedAddons,
  initialQuantity,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [quantity, setQuantity]     = useState(initialQuantity || 1);
  useEffect(() => {
    if (visible) setQuantity(initialQuantity || 1);
  }, [visible, initialQuantity]);
  const [usePoints, setUsePoints]   = useState(false);
  const [allergyValue, setAllergyValue] = useState<AllergyValue>({ tags: [], otherText: '' });
  const [allergyError, setAllergyError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY_PARTNER');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { showToast } = useToast();

  const scrollRef = useRef<ScrollView>(null);
  const allergySectionY = useRef(0);

  const { points } = useRewardsStore();

  // Fetch kitchen (including its dishes) from Supabase
  const { data: kitchen, loading: kitchenLoading } = useSupabaseQuery(() => getKitchen(kitchenId), [kitchenId]);

  // Fetch the dish details directly
  const { data: dish, loading: dishLoading } = useSupabaseQuery(() => getDish(dishId), [dishId]);

  const kitchenDish = useMemo(() => {
    if (!kitchen) return null;
    const found = kitchen.dishes.find((d) => d.dishId === dishId);
    if (found) return found;
    if (dish) {
      return {
        dishId: dish.id,
        price: (dish as any).price || dishPrice || 140,
        maxOrders: 10,
        currentOrders: 0,
        available: 'Available',
        leadTimeMinutes: (kitchen as any).defaultLeadTimeMinutes || 30,
      };
    }
    return kitchen.dishes[0] || null;
  }, [kitchen, dish, dishId, dishPrice]);

  const resolvedKitchenName = (kitchenName && kitchenName !== 'Home Kitchen' && kitchenName !== 'Master Kitchen')
    ? kitchenName
    : (kitchenId
      ? kitchenId.replace(/-kitchen$/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + "'s Kitchen"
      : "Home Kitchen");

  const resolvedDishName = (dishName && dishName !== 'Home-cooked Dish' && dishName !== 'Chef Meal' && dishName !== 'Master Dish' && dishName !== 'HomeChef Special')
    ? dishName
    : (dishId
      ? dishId.replace(/^(wd|st|d)-/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : "Home-cooked Special");

  const safeKitchen = kitchen || {
    id: kitchenId || 'k1',
    name: (kitchen as any)?.name || resolvedKitchenName,
    chefName: (kitchen as any)?.chefName || 'Chef',
    society: consumerSociety,
    distanceKm: 0.8,
    rating: 4.8,
    orders: 24,
    dishes: [],
    anonymous: false,
    hygieneBadge: true,
  };

  const safeDish = dish || {
    id: dishId || 'd1',
    name: (dish as any)?.name || resolvedDishName,
    category: 'Main Course',
    foodType: 'Veg' as const,
    suggestedPrice: dishPrice || 140,
    leadTimeMinutes: 30,
    tags: [],
  };

  const safeKitchenDish = kitchenDish || {
    dishId: safeDish.id,
    price: (safeDish as any).price || 140,
    maxOrders: 10,
    currentOrders: 0,
    available: 'Available',
    leadTimeMinutes: 30,
  };

  const sameSociety = safeKitchen ? safeKitchen.society === consumerSociety : false;
  const addonsPricePerUnit = (selectedAddons || []).reduce((sum, a) => sum + a.price, 0);

  const bill = useMemo(() => {
    return calculateBill({
      dishPrice: safeKitchenDish.price + addonsPricePerUnit,
      quantity,
      sameSociety,
      deliveryMethod,
    });
  }, [safeKitchenDish.price, addonsPricePerUnit, quantity, sameSociety, deliveryMethod]);

  const listPrice = bill.listPrice;
  const societyDiscount = bill.discount;
  const deliveryFee = bill.deliveryFee;
  const subtotal = bill.totalPayable;
  // What delivery would cost if chosen — unlike bill.deliveryFee (which is
  // already 0 whenever PICKUP is the currently-selected method), this must
  // stay accurate regardless of the current selection so the Delivery
  // option in the selector below doesn't show ₹0 just because Pickup
  // happens to be picked right now.
  const deliveryOptionFee = listPrice >= FREE_DELIVERY_THRESHOLD ? 0 : (sameSociety ? 10 : 35);

  // Points redemption — cap at subtotal, floor to nearest ₹1
  const canRedeem     = points >= MIN_REDEEM_POINTS;
  const maxPointDiscount = Math.min(pointsValue(points), subtotal);
  const pointDiscount = usePoints && canRedeem ? maxPointDiscount : 0;
  const pointsSpent   = usePoints && canRedeem ? maxPointDiscount * 10 : 0; // 10 pts per ₹1

  const finalTotal    = subtotal - pointDiscount;

  // Points user will earn on this order (1 pt per ₹1 paid)
  const pointsToEarn  = rupeesToPoints(finalTotal);

  const [showAddressModal, setShowAddressModal] = useState(false);

  async function handleConfirm() {
    if (isProcessingPayment) return;

    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.society || currentUser.society.trim() === '' || !currentUser?.flat || currentUser.flat.trim() === '') {
      setShowAddressModal(true);
      return;
    }

    // Validate: if "Other" is selected, otherText must not be empty
    if (allergyValue.tags.includes('Other') && allergyValue.otherText.trim() === '') {
      setAllergyError(t('checkout.specifyAllergy', 'Please specify your allergy.'));
      // Scroll to the AllergySelector so the error is visible
      scrollRef.current?.scrollTo({ y: allergySectionY.current, animated: true });
      return;
    }

    const delivery: DeliveryDetails = {
      method: deliveryMethod,
      fee: deliveryFee,
      pickupLocation: deliveryMethod === 'PICKUP' ? {
        label: "Chef's Kitchen Address",
        address: `${safeKitchen.name}, ${safeKitchen.society}`,
        estimatedReadyTime: `${safeKitchenDish.leadTimeMinutes} min`,
      } : undefined,
      deliveryAddress: deliveryMethod === 'DELIVERY_PARTNER' ? {
        address: (() => {
          const u = useAuthStore.getState().user;
          return u?.address || [u?.society || consumerSociety, u?.tower, u?.flat].filter(Boolean).join(', ') || consumerSociety;
        })(),
        estimatedDeliveryTime: `${safeKitchenDish.leadTimeMinutes} min`,
      } : undefined,
    };

    setIsProcessingPayment(true);

    // 1. Create the real order FIRST. Payment must always be charged against a
    // real, already-existing order id — never a client-generated placeholder —
    // so a customer can never be charged with no order to show for it.
    let placedOrder: PlacedOrder | null = null;
    try {
      placedOrder = await onConfirm(quantity, pointsSpent, { tags: allergyValue.tags, otherText: allergyValue.otherText }, delivery);
      if (!placedOrder?.id) throw new Error('Order could not be created');
    } catch (e: any) {
      setIsProcessingPayment(false);
      showToast(e?.message || t('checkout.orderFailed', 'Could not place this order. Please try again.'), 'error');
      return; // Nothing was charged — safe to just let the user retry.
    }

    // 2. Now charge Cashfree against the real order id.
    let payRes;
    try {
      payRes = await initiateCashfreePayment({
        orderId: placedOrder.id,
        amount: finalTotal,
        method: paymentMethod,
        customerName: currentUser?.displayName || 'Resident',
        customerPhone: currentUser?.phone || '9999999999',
      });
    } catch {
      payRes = null;
    } finally {
      setIsProcessingPayment(false);
    }

    if (!payRes || !payRes.success) {
      // The order already exists (unpaid) — say so plainly rather than implying
      // nothing happened, and send them to My Orders where they can retry payment.
      showToast(
        t('checkout.paymentIncomplete', 'Order placed, but payment did not complete. You can pay again from My Orders.'),
        'error'
      );
      handleClose();
      router.push('/(consumer)/orders');
      return;
    }

    showToast('Paid via Cashfree', 'success');

    // Only now — after a verified payment — award points and notify. Awarding
    // these before payment succeeded would credit a customer for an order they
    // may never have actually paid for.
    if (pointsSpent > 0) useRewardsStore.getState().spendPoints(pointsSpent);
    useRewardsStore.getState().addPoints(pointsToEarn);
    useRewardsStore.getState().completeOrder();
    useNotificationStore.getState().addNotification({
      type: 'order_update',
      title: t('cart.notifBookingConfirmed', 'Booking Confirmed!'),
      body: t('cart.notifBookingBody', {
        defaultValue: 'Your order for {{dish}} from {{kitchen}} is confirmed! ETA: {{eta}}.',
        dish: placedOrder.dishName || safeDish.name,
        kitchen: placedOrder.kitchenName || safeKitchen.name,
        eta: placedOrder.eta || `${safeKitchenDish.leadTimeMinutes} min`,
      }),
      icon: 'bag-check-outline',
      tone: 'green',
      actionRoute: '/(consumer)/orders',
    });

    setAllergyError('');
    handleClose();
    router.push('/(consumer)/orders');
  }

  function handleClose() {
    setQuantity(1);
    setUsePoints(false);
    setAllergyValue({ tags: [], otherText: '' });
    setAllergyError('');
    setDeliveryMethod('DELIVERY_PARTNER');
    onClose();
  }

  function handleAllergyChange(next: AllergyValue) {
    setAllergyValue(next);
    // Clear error when the user starts typing in "Other" or deselects it
    if (allergyError) {
      const otherStillEmpty = next.tags.includes('Other') && next.otherText.trim() === '';
      if (!otherStillEmpty) setAllergyError('');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={styles.sheet}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sheetContent}
        >

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <DishVisual dish={safeDish as any} size="md" />
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t('checkout.secureCheckout', 'Secure checkout')}</Text>
              <Text style={styles.dishName}>{safeDish.name}</Text>
              <Text style={styles.kitchenLine}>{safeKitchen.name} · {safeKitchen.society}</Text>
            </View>
          </View>

          {/* Quantity stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>{t('checkout.quantity', 'Quantity')}</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepperBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperCount}>{quantity}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Delivery Method Selection */}
          <DeliveryMethodSelector
            value={deliveryMethod}
            onChange={setDeliveryMethod}
            deliveryFee={deliveryOptionFee}
          />

          {/* Delivery Address / Location Detail Display */}
          <View style={styles.addressDisplayCard}>
            {deliveryMethod === 'DELIVERY_PARTNER' ? (
              <View style={styles.addressDetailBlock}>
                <View style={styles.addressHeaderRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.primary} />
                  <Text style={styles.addressLabel}>{t('checkout.deliveringTo', 'Delivering to')}</Text>
                </View>
                <Text style={styles.addressValueText} numberOfLines={1}>
                  {(() => {
                    const u = useAuthStore.getState().user;
                    return u?.address || [u?.society || consumerSociety, u?.tower, u?.flat].filter(Boolean).join(', ') || consumerSociety;
                  })()}
                </Text>
                <Text style={styles.addressEstimate}>
                  {t('checkout.estimatedDelivery', { defaultValue: 'Estimated delivery in {{count}} min', count: safeKitchenDish.leadTimeMinutes })}
                </Text>
              </View>
            ) : (
              <View style={styles.addressDetailBlock}>
                <View style={styles.addressHeaderRow}>
                  <Ionicons name="storefront-outline" size={14} color={Colors.primary} />
                  <Text style={styles.addressLabel}>{t('checkout.pickupFromKitchen', 'Pickup from chef kitchen')}</Text>
                </View>
                <Text style={styles.addressValueText} numberOfLines={1}>
                  {safeKitchen.name} · {safeKitchen.society}
                </Text>
                <Text style={styles.addressEstimate}>
                  {t('checkout.readyIn', { defaultValue: 'Ready in {{count}} min', count: safeKitchenDish.leadTimeMinutes })}
                </Text>
              </View>
            )}
          </View>

          {/* ── Points redemption toggle ─────────────────────────────── */}
          <Pressable
            style={[styles.pointsRow, !canRedeem && styles.pointsRowDisabled]}
            onPress={() => canRedeem && setUsePoints((v) => !v)}
            disabled={!canRedeem}
          >
            <View style={styles.pointsLeft}>
              <View style={[styles.pointsIcon, usePoints && canRedeem && styles.pointsIconActive]}>
                <Ionicons name="star" size={14} color={usePoints && canRedeem ? '#fff' : Colors.gold} />
              </View>
              <View>
                <Text style={styles.pointsTitle}>
                  {canRedeem
                    ? t('checkout.usePoints', { defaultValue: 'Use {{points}} points · save {{amount}}', points: Math.round(pointsSpent || points), amount: money(maxPointDiscount) })
                    : t('checkout.needMinToRedeem', { defaultValue: 'You have {{points}} pts · need {{min}} to redeem', points: points, min: MIN_REDEEM_POINTS })}
                </Text>
                <Text style={styles.pointsBalance}>
                  {canRedeem
                    ? t('checkout.pointsBalance', { defaultValue: 'Balance: {{points}} pts', points: points })
                    : t('checkout.pointsBalanceEarnMore', { defaultValue: 'Balance: {{points}} pts · earn {{more}} more', points: points, more: MIN_REDEEM_POINTS - points })}
                </Text>
              </View>
            </View>
            {canRedeem && (
              <Switch
                value={usePoints}
                onValueChange={setUsePoints}
                trackColor={{ false: Colors.border, true: Colors.gold }}
                thumbColor="#fff"
              />
            )}
          </Pressable>

          {/* Bill breakdown */}
          <View style={styles.billBox}>
            <SummaryLine label={t('checkout.listPrice', 'List price')} value={money(listPrice)} />
            {(selectedAddons || []).length > 0 && (
              <SummaryLine
                label={t('checkout.addons', 'Add-ons')}
                value={(selectedAddons || []).map((a) => a.name).join(', ')}
              />
            )}
            {societyDiscount > 0 && (
              <SummaryLine label={t('checkout.societyDiscount', 'Same society discount (10%)')} value={`-${money(societyDiscount)}`} />
            )}
            <SummaryLine
              label={t('cart.deliveryFee', 'Delivery Fee')}
              value={deliveryFee === 0 ? 'FREE' : money(deliveryFee)}
              valueColor={deliveryFee === 0 ? Colors.primary : undefined}
            />
            <SummaryLine
              label={t('checkout.deliveryMethod', 'Delivery method')}
              value={deliveryMethod === 'PICKUP' ? t('checkout.selfPickup', '🚶 Self Pickup') : t('checkout.deliveryByPartner', '🚚 Delivery by Delivery Partner')}
            />
            {pointDiscount > 0 && (
              <SummaryLine label={t('checkout.pointsRedeemed', { defaultValue: 'Points redeemed ({{points}} pts)', points: Math.round(pointsSpent) })} value={`-${money(pointDiscount)}`} />
            )}
            <SummaryLine label={t('checkout.totalPayable', 'Total payable')} value={money(finalTotal)} strong separator />
          </View>

          {/* Allergy / Ingredient Preferences */}
          <View
            onLayout={(e) => { allergySectionY.current = e.nativeEvent.layout.y; }}
          >
            <AllergySelector
              value={allergyValue}
              onChange={handleAllergyChange}
              error={allergyError}
            />
          </View>

          {/* Points earn preview */}
          <View style={styles.earnRow}>
            <Ionicons name="star-outline" size={13} color={Colors.gold} />
            <Text style={styles.earnText}>
              {t('checkout.willEarnPts', { defaultValue: "You'll earn {{points}} pts on this order", points: pointsToEarn })}
            </Text>
          </View>

          {/* Trust line */}
          <View style={styles.trustLine}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={styles.trustText}>{t('checkout.paymentsToRasoHi', 'Payments go to RasoHi, not directly to the chef.')}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button label={t('common.cancel', 'Cancel')} onPress={handleClose} variant="secondary" flex />
            <Button label={t('checkout.payAmount', { defaultValue: 'Pay {{amount}} via RasoHi', amount: money(finalTotal) })} onPress={handleConfirm} variant="primary" flex />
          </View>

        </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Pressable>
      <AddressInputModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSaved={() => {
          setShowAddressModal(false);
          handleConfirm();
        }}
      />
    </Modal>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23,33,28,0.5)' },
  selectionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.greenBadge,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetContent: { padding: 18, paddingBottom: 34 },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 },
  headerCopy: { flex: 1 },
  eyebrow:    { color: Colors.red, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  dishName:   { color: Colors.dark, fontSize: 20, fontWeight: '900', marginTop: 2 },
  kitchenLine:{ color: Colors.muted, fontSize: 13, marginTop: 3 },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginBottom: 12,
  },
  stepperLabel: { color: Colors.dark, fontSize: 15, fontWeight: '900' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.pillInactive, borderRadius: 999, overflow: 'hidden' },
  stepperBtn: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { color: Colors.dark, fontSize: 20, fontWeight: '900' },
  stepperCount: { minWidth: 34, textAlign: 'center', color: Colors.dark, fontWeight: '900', fontSize: 16 },

  // Points
  pointsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.goldBadge, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.gold,
    padding: 12, marginBottom: 12, gap: 10,
  },
  pointsRowDisabled: { backgroundColor: Colors.pillInactive, borderColor: Colors.border, opacity: 0.7 },
  pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pointsIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.goldBadge, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold,
  },
  pointsIconActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pointsTitle:   { fontSize: 13, fontWeight: '800', color: Colors.dark },
  pointsBalance: { fontSize: 11, color: Colors.muted, marginTop: 1 },

  billBox: { backgroundColor: Colors.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 10 },

  // Earn preview
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 8 },
  earnText: { fontSize: 12, color: Colors.muted },
  earnPts:  { color: Colors.gold, fontWeight: '900' },

  trustLine: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 14 },
  trustText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 8 },

  addressDisplayCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 12 },
  addressDetailBlock: { gap: 4 },
  addressHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressLabel: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressValueText: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  addressEstimate: { fontSize: 12, color: Colors.muted },
});
