import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRewardsStore, pointsValue, rupeesToPoints } from '../../store/useRewardsStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { placeOrder } from '../../services';
import { initiateCashfreePayment } from '../../services/payments';
import { FREE_DELIVERY_THRESHOLD } from '../../lib/priceUtils';
import { KITCHENS, DISHES } from '../../constants/data';
import { Card } from '../../components/ui/Card';
import { DishVisual } from '../../components/ui/DishVisual';
import { SummaryLine } from '../../components/ui/SummaryLine';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AddressInputModal } from '../../components/AddressInputModal';
import type { Dish, DeliveryDetails } from '../../types';

export default function CartScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);

  const { items, updateQuantity, removeItem, clearCart, needChangeFor500, setNeedChangeFor500 } = useCartStore();
  const { user } = useAuthStore();
  const { points, spendPoints, addPoints, completeOrder } = useRewardsStore();
  const { addNotification } = useNotificationStore();

  const [useWalletBalance, setUseWalletBalance] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { showToast } = useToast();

  const consumerSociety = user?.society || '';

  // Group cart items by kitchen
  const itemsByKitchen: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!itemsByKitchen[item.kitchenId]) {
      itemsByKitchen[item.kitchenId] = [];
    }
    itemsByKitchen[item.kitchenId].push(item);
  });

  const kitchenIds = Object.keys(itemsByKitchen);

  let overallSubtotal = 0;
  let overallDiscount = 0;
  let overallDelivery = 0;
  let overallGrandTotal = 0;

  const kitchenSummaries = kitchenIds.map((kId) => {
    const firstCartItem = itemsByKitchen[kId]?.[0];
    const staticKitchen = KITCHENS.find((k) => k.id === kId);
    
    let kitchenName = firstCartItem?.kitchenName;
    if (!kitchenName || kitchenName === 'Home Kitchen' || kitchenName === 'Master Kitchen') {
      if (staticKitchen) {
        kitchenName = staticKitchen.name;
      } else if (kId) {
        const formatted = kId.replace(/-kitchen$/i, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        kitchenName = formatted.includes('Kitchen') ? formatted : `${formatted}'s Kitchen`;
      } else {
        kitchenName = "Chef's Kitchen";
      }
    }

    const kitchenSociety = firstCartItem?.societyName || staticKitchen?.society || 'Nearby Society';
    const isSameSociety = kitchenSociety.toLowerCase() === consumerSociety.toLowerCase();
    let subtotal = 0;

    const listItems = itemsByKitchen[kId].map((cartItem) => {
      const kitchenDish = staticKitchen?.dishes.find(
        (d) => d.dishId === cartItem.dishId
      );
      const staticDish = DISHES.find((d) => d.id === cartItem.dishId);
      const price = cartItem.price ?? (kitchenDish ? kitchenDish.price : (staticDish ? staticDish.suggestedPrice : 140));

      let name = cartItem.dishName;
      if (!name || name === 'Chef Meal' || name === 'Master Dish' || name === 'HomeChef Special') {
        if (staticDish) {
          name = staticDish.name;
        } else if (cartItem.dishId) {
          const formatted = cartItem.dishId
            .replace(/^(wd|st|d)-/i, '')
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          name = formatted || 'Home-cooked Special';
        } else {
          name = 'Home-cooked Special';
        }
      }

      const dish: Dish = {
        ...(staticDish || ({
          id: cartItem.dishId,
          name,
          category: 'HomeChef',
          suggestedPrice: price,
          leadTimeMinutes: 30,
          tags: [],
          foodType: 'Veg',
        } as Dish)),
        // The cart previously never looked at cartItem.imageUrl at all, even
        // though CartItem carries it and useCartStore.addItem preserves it —
        // so DishVisual always fell through to its own auto-picked stock
        // photo here, which (before it was made deterministic) could differ
        // from whatever image was actually showing on the screen the item
        // was added from. Prefer the real image that was actually displayed.
        ...(cartItem.imageUrl ? { image: cartItem.imageUrl } : {}),
      };
      subtotal += price * cartItem.quantity;

      return {
        ...cartItem,
        price,
        name,
        dish,
      };
    });

    const societyDiscount = isSameSociety ? Math.round(subtotal * 0.1) : 0;
    // ₹200+ per-kitchen subtotal (before discount) gets free delivery — see
    // lib/priceUtils.ts#FREE_DELIVERY_THRESHOLD. Safe to use the combined
    // subtotal now that checkout below places one order per kitchen (all of
    // that kitchen's items together), matching what actually gets priced
    // server-side — previously checkout split into one order per item, which
    // would have made this preview wrong (see the old fix-then-revert in the
    // git history of this screen).
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (isSameSociety ? 10 : 35);
    const total = subtotal - societyDiscount + deliveryFee;

    overallSubtotal += subtotal;
    overallDiscount += societyDiscount;
    overallDelivery += deliveryFee;
    overallGrandTotal += total;

    return {
      kitchenId: kId,
      kitchenName,
      societyName: kitchenSociety,
      isSameSociety,
      listItems,
      subtotal,
      societyDiscount,
      deliveryFee,
      total,
    };
  });

  // Wallet deduction calculation
  const availableWalletRupees = pointsValue(points); // 180 points = ₹18, 500 pts = ₹50
  const maxWalletDeduction = Math.min(availableWalletRupees, overallGrandTotal);
  const appliedWalletDeduction = (useWalletBalance && availableWalletRupees > 0)
    ? maxWalletDeduction
    : 0;

  const finalPayable = Math.max(0, overallGrandTotal - appliedWalletDeduction);

  async function handleCheckout() {
    if (items.length === 0 || checkingOut) return;

    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.society || currentUser.society.trim() === '' || !currentUser?.flat || currentUser.flat.trim() === '') {
      setShowAddressModal(true);
      return;
    }

    setCheckingOut(true);
    try {
      // 1. Place one combined order per kitchen for all of that kitchen's
      // cart items — previously this called placeOrder() once per line
      // item, so a 2-dish cart from one kitchen silently became 2 separate
      // backend orders, each priced (and delivery-fee'd) independently.
      // Reported directly: "checkout will be single order, why multiple
      // orders." Now also correctly picks up the ₹200+ free-delivery
      // threshold on the real combined total, since the backend prices the
      // whole item array together.
      const placedOrders: { order: any; dishName: string; kitchenName: string }[] = [];
      for (const summary of kitchenSummaries) {
        const delivery: DeliveryDetails = {
          method: 'DELIVERY_PARTNER',
          fee: summary.deliveryFee,
          deliveryAddress: {
            address: (() => {
              const u = useAuthStore.getState().user;
              return u?.address || [u?.society || consumerSociety, u?.tower, u?.flat].filter(Boolean).join(', ') || consumerSociety;
            })(),
            estimatedDeliveryTime: '30 min',
          },
        };

        const order = await placeOrder({
          kitchenId: summary.kitchenId,
          items: summary.listItems.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
          consumerSociety,
          allergyInfo: { tags: [], otherText: '' },
          delivery,
          note: needChangeFor500 ? 'Need change for 500' : undefined,
        });
        const dishSummary = summary.listItems.length > 1
          ? `${summary.listItems[0].name} + ${summary.listItems.length - 1} more`
          : summary.listItems[0].name;
        placedOrders.push({ order, dishName: dishSummary, kitchenName: summary.kitchenName });
      }

      // 2. Execute Real Cashfree Payment Gateway Checkout
      if (finalPayable > 0 && placedOrders.length > 0) {
        const primaryOrderId = placedOrders[0].order.id;
        const associatedOrderIds = placedOrders.map((p) => p.order.id);

        const payRes = await initiateCashfreePayment({
          orderId: primaryOrderId,
          amount: finalPayable,
          associatedOrderIds,
          customerName: currentUser?.displayName || 'Resident',
          customerPhone: currentUser?.phone || '9999999999',
        });

        if (!payRes || !payRes.success) {
          showToast(t('cart.paymentFailed', 'Payment not completed. Orders saved as pending in My Orders.'), 'error');
          router.push('/(consumer)/orders');
          return;
        }
      }

      // 3. Deduct wallet balance if applied
      if (appliedWalletDeduction > 0) {
        const ptsToDeduct = Math.min(points, rupeesToPoints(appliedWalletDeduction));
        spendPoints(ptsToDeduct);
      }

      // 4. Award rewards and notify for each placed order
      for (const { order, dishName, kitchenName } of placedOrders) {
        const earned = rupeesToPoints(order.total);
        addPoints(earned);
        completeOrder();

        addNotification({
          type: 'order_update',
          title: t('cart.notifBookingConfirmed', 'Booking Confirmed!'),
          body: t('cart.notifBookingBody', {
            defaultValue: 'Your order for {{dish}} from {{kitchen}} is confirmed! ETA: {{eta}}.',
            dish: dishName,
            kitchen: kitchenName,
            eta: order.eta,
          }) + (appliedWalletDeduction > 0
            ? t('cart.notifWalletSuffix', { defaultValue: ' (Deducted ₹{{amount}} wallet balance)', amount: appliedWalletDeduction })
            : ''),
          icon: 'bag-check-outline',
          tone: 'green',
          actionRoute: '/(consumer)/orders',
        });
      }

      clearCart();
      router.push('/(consumer)/orders');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('cart.checkoutError', 'Error occurred during checkout');
      showToast(msg, 'error');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.dark} />
            <Text style={styles.backText}>{t('common.back', 'Back')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('cart.title', 'Your Cart')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={Colors.muted} />
            <Text style={styles.emptyTitle}>{t('cart.emptyCart', 'Your cart is empty')}</Text>
            <Text style={styles.emptyBody}>{t('cart.addItemsToCart', 'Add some delicious home-cooked dishes to your cart!')}</Text>
            <Button
              label={t('cart.browseMenu', 'Browse Weekly Menu')}
              onPress={() => router.push('/(consumer)/discover')}
              variant="primary"
            />
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {kitchenSummaries.map((summary) => (
              <Card key={summary.kitchenId} style={styles.kitchenCard}>
                {/* Kitchen info */}
                <View style={styles.kitchenHeader}>
                  <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
                  <View style={styles.kitchenHeaderInfo}>
                    <Text style={styles.kitchenName}>{summary.kitchenName}</Text>
                    <Text style={styles.kitchenSociety}>
                      {summary.societyName}
                      {summary.isSameSociety && ` · ${t('cart.sameSocietyActive', 'Same Society Discount active')}`}
                    </Text>
                  </View>
                </View>

                {/* Items in this kitchen */}
                {summary.listItems.map((item) => (
                  <View key={item.dishId} style={styles.itemRow}>
                    <DishVisual dish={item.dish} size="sm" />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{t('cart.priceEach', { defaultValue: '₹{{price}} each', price: item.price })}</Text>

                      {/* Stepper */}
                      <View style={styles.stepperRow}>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(summary.kitchenId, item.dishId, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={16} color={Colors.dark} />
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(summary.kitchenId, item.dishId, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color={Colors.dark} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Remove button */}
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => removeItem(summary.kitchenId, item.dishId)}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.muted} />
                    </Pressable>
                  </View>
                ))}

                {/* Kitchen cost breakdown */}
                <View style={styles.divider} />
                <SummaryLine label={t('cart.subtotal', 'Subtotal')} value={`₹${summary.subtotal}`} />
                {summary.societyDiscount > 0 && (
                  <SummaryLine
                    label={t('cart.sameSocietyDiscount', 'Same-Society 10% Discount')}
                    value={`-₹${summary.societyDiscount}`}
                  />
                )}
                <SummaryLine label={t('cart.deliveryFee', 'Delivery Fee')} value={`₹${summary.deliveryFee}`} />
                <SummaryLine label={t('cart.kitchenTotal', 'Kitchen Total')} value={`₹${summary.total}`} strong />
              </Card>
            ))}

            {/* WALLET BALANCE DEDUCTION OPTION */}
            <Card style={styles.walletCard}>
              <View style={styles.walletHeaderRow}>
                <View style={styles.walletIconCircle}>
                  <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletTitle}>{t('cart.walletName', 'RasoHi Wallet')}</Text>
                  <Text style={styles.walletSub}>
                    {availableWalletRupees > 0
                      ? t('cart.availableBalance', { defaultValue: 'Available Balance: ₹{{amount}} ({{points}} pts)', amount: availableWalletRupees, points })
                      : t('cart.availableBalanceZero', 'Available Balance: ₹0 (No points balance)')}
                  </Text>
                </View>

                <Pressable
                  style={styles.walletCheckboxBtn}
                  disabled={availableWalletRupees <= 0}
                  onPress={() => setUseWalletBalance(!useWalletBalance)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: useWalletBalance && availableWalletRupees > 0 }}
                >
                  <Ionicons
                    name={useWalletBalance && availableWalletRupees > 0 ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={useWalletBalance && availableWalletRupees > 0 ? Colors.primary : Colors.muted}
                  />
                </Pressable>
              </View>

              {useWalletBalance && appliedWalletDeduction > 0 && (
                <View style={styles.walletAppliedBanner}>
                  <Ionicons name="sparkles" size={14} color={isDark ? '#4ADE80' : '#15803D'} />
                  <Text style={styles.walletAppliedText}>
                    {t('cart.walletDeductionApplied', { defaultValue: '₹{{amount}} wallet deduction applied to your order', amount: appliedWalletDeduction })}
                  </Text>
                </View>
              )}
            </Card>

            {/* Checkout section */}
            <Card style={styles.checkoutSummaryCard}>
              <Text style={styles.summaryTitle}>{t('cart.billDetails', 'Bill Details')}</Text>
              <SummaryLine label={t('cart.totalSubtotal', 'Total Subtotal')} value={`₹${overallSubtotal}`} />
              {overallDiscount > 0 && (
                <SummaryLine label={t('cart.totalDiscount', 'Total Discount')} value={`-₹${overallDiscount}`} />
              )}
              <SummaryLine label={t('cart.totalDeliveryFee', 'Total Delivery Fee')} value={`₹${overallDelivery}`} />
              {appliedWalletDeduction > 0 && (
                <SummaryLine
                  label={t('cart.walletDeduction', 'Wallet Deduction')}
                  value={`-₹${appliedWalletDeduction}`}
                />
              )}
              <View style={styles.divider} />
              <SummaryLine
                label={t('cart.grandTotal', 'Grand Total')}
                value={`₹${finalPayable}`}
                strong
              />

              <View style={{ height: 12 }} />

              <View style={styles.btnWrapper}>
                {checkingOut ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>{t('cart.processingBooking', 'Processing Booking...')}</Text>
                  </View>
                ) : (
                  <Button
                    label={t('cart.confirmBookingPay', { defaultValue: 'Confirm Booking & Pay ₹{{amount}}', amount: finalPayable })}
                    onPress={handleCheckout}
                    variant="primary"
                  />
                )}
              </View>
            </Card>
          </ScrollView>
        )}
      </ImageBackground>
      <AddressInputModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSaved={() => {
          setShowAddressModal(false);
          handleCheckout();
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (Colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 60,
    },
    backText: {
      fontSize: 14,
      color: Colors.dark,
      fontWeight: '700',
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: Colors.dark,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: Colors.dark,
    },
    emptyBody: {
      fontSize: 14,
      color: Colors.muted,
      textAlign: 'center',
      marginBottom: 16,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    kitchenCard: {
      padding: 16,
    },
    kitchenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    kitchenHeaderInfo: {
      flex: 1,
    },
    kitchenName: {
      fontSize: 16,
      fontWeight: '900',
      color: Colors.dark,
    },
    kitchenSociety: {
      fontSize: 12,
      color: Colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    itemDetails: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    itemName: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.dark,
    },
    itemPrice: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 2,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    stepperBtn: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: Colors.pillInactive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityText: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.dark,
    },
    removeBtn: {
      padding: 8,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: 12,
    },

    // WALLET CARD STYLES
    walletCard: {
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(224, 83, 67, 0.3)' : '#FCD34D',
      backgroundColor: isDark ? '#1F1A15' : '#FFFDF5',
    },
    walletHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    walletIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(224, 83, 67, 0.15)' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletInfo: {
      flex: 1,
    },
    walletTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.dark,
    },
    walletSub: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 2,
      fontWeight: '600',
    },
    walletCheckboxBtn: {
      padding: 4,
    },
    walletAppliedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginTop: 12,
    },
    walletAppliedText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#15803D',
    },

    checkoutSummaryCard: {
      padding: 16,
      marginBottom: 24,
    },
    codChangeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      padding: 10,
      backgroundColor: Colors.surfaceAlt,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    codChangeText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.dark,
      flex: 1,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: Colors.dark,
      marginBottom: 12,
    },
    btnWrapper: {
      marginTop: 16,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.dark,
    },
  });
