import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { getOrder, subscribeToOrder } from '../../../services';
import { useThemeStore } from '../../../store/useThemeStore';
import { ChefIllustration } from '../../../components/ui/ChefIllustration';
import { SupportTicketModal } from '../../../components/SupportTicketModal';

export default function OrderTrackingScreen() {
  const { t } = useTranslation();
  const { order_id } = useLocalSearchParams<{ order_id: string }>();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Previously this fetched via apiClient.get(`/orders/${order_id}`) and read
  // res.data?.data — but apiClient already returns the backend body directly
  // (there's no outer .data wrapper), so that check was always false and this
  // screen silently fell through to a hardcoded fake order ("Chole Bhature",
  // rider "Ramesh Kumar") on every single load, for every real order. It also
  // subscribed to a broadcast channel topic containing Date.now()/Math.random()
  // — unique on every mount, so no other client could ever know that topic
  // name to publish a status/location update to it; the "live update" path was
  // dead code. Using the same getOrder()/subscribeToOrder() pair the order
  // detail screen already uses correctly (services/supabase/index.ts) fixes
  // both: a real, joined order (with kitchen/dish name) on load, and real
  // postgres-level updates when the chef or ops changes its status.
  useEffect(() => {
    if (!order_id) return;
    let isMounted = true;

    getOrder(order_id).then((data) => {
      if (isMounted) {
        setOrder(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    const unsubscribe = subscribeToOrder(order_id, (updated) => {
      if (isMounted) setOrder(updated);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [order_id]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.muted }]}>{t('track.loading', 'Loading order tracking...')}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors.bg }]}>
        <Text style={[styles.errorText, { color: Colors.dark }]}>{t('track.notFound', 'Order not found.')}</Text>
      </View>
    );
  }

  // Calculate current step (0: Order, 1: Preparing, 2: On the Way, 3: Delivered)
  const getStepIndex = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'placed':
      case 'order':
      case 'pending':
        return 0;
      case 'preparing':
      case 'accepted':
      case 'cooking':
        return 1;
      case 'out_for_delivery':
      case 'on the way':
      case 'dispatched':
        return 2;
      case 'delivered':
      case 'completed':
        return 3;
      default:
        return 2;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('track.title', 'Order Tracking')}</Text>
        <Pressable style={styles.headerHelpBtn} onPress={() => setShowSupportModal(true)}>
          <Ionicons name="headset-outline" size={20} color={Colors.primary} />
          <Text style={styles.headerHelpText}>{t('track.help', 'Help')}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Estimated Delivery Card */}
        <View style={styles.etaCard}>
          <View style={styles.etaLeft}>
            <Text style={styles.etaEyebrow}>{t('track.estimatedDelivery', 'Estimated Delivery')}</Text>
            <Text style={styles.etaTime}>{order.eta || '25–30 min'}</Text>
            <Text style={styles.etaStatus}>
              {currentStep === 3 ? t('track.delivered', 'Order has been delivered! 🎉') : t('track.onTheWay', 'Your order is on the way!')}
            </Text>
          </View>
          <View style={styles.etaRight}>
            <ChefIllustration size={110} mode="banner" />
          </View>
        </View>

        {/* Stepper Card */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperTrackRow}>
            {/* Step 1: Order */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 0 && styles.stepCircleCompleted]}>
                <Ionicons
                  name={currentStep >= 0 ? 'checkmark' : 'document-text-outline'}
                  size={16}
                  color={currentStep >= 0 ? '#FFFFFF' : Colors.muted}
                />
              </View>
              <Text style={[styles.stepLabel, currentStep >= 0 && styles.stepLabelActive]}>{t('track.stepOrder', 'Order')}</Text>
            </View>

            {/* Line 1-2 */}
            <View style={[styles.stepConnectorLine, currentStep >= 1 && styles.stepConnectorActive]} />

            {/* Step 2: Preparing */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleCompleted]}>
                <Ionicons
                  name={currentStep >= 1 ? 'restaurant' : 'restaurant-outline'}
                  size={currentStep >= 1 ? 14 : 16}
                  color={currentStep >= 1 ? '#FFFFFF' : Colors.muted}
                />
              </View>
              <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>{t('track.stepPreparing', 'Preparing')}</Text>
            </View>

            {/* Line 2-3 */}
            <View style={[styles.stepConnectorLine, currentStep >= 2 && styles.stepConnectorActive]} />

            {/* Step 3: On the Way */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep === 2 && styles.stepCircleActive,
                  currentStep > 2 && styles.stepCircleCompleted,
                ]}
              >
                <Ionicons
                  name="bicycle"
                  size={18}
                  color={currentStep >= 2 ? '#FFFFFF' : Colors.muted}
                />
              </View>
              <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>{t('track.stepOnTheWay', 'On the Way')}</Text>
            </View>

            {/* Line 3-4 */}
            <View style={[styles.stepConnectorLine, currentStep >= 3 && styles.stepConnectorActive]} />

            {/* Step 4: Delivered */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= 3 ? styles.stepCircleCompleted : styles.stepCircleInactive]}>
                <Ionicons
                  name="gift-outline"
                  size={16}
                  color={currentStep >= 3 ? '#FFFFFF' : Colors.muted}
                />
              </View>
              <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>{t('track.stepDelivered', 'Delivered')}</Text>
            </View>
          </View>
        </View>

        {/* Map Route Card */}
        <View style={styles.mapContainerCard}>
          {/* Visual Route Grid & Path Overlay */}
          <View style={styles.visualMapBackground}>
            <Svg width="100%" height="160" viewBox="0 0 340 160" fill="none">
              {/* Subtle Map Grid lines */}
              <Line x1="0" y1="40" x2="340" y2="40" stroke={Colors.border} strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
              <Line x1="0" y1="90" x2="340" y2="90" stroke={Colors.border} strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
              <Line x1="0" y1="130" x2="340" y2="130" stroke={Colors.border} strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
              <Line x1="90" y1="0" x2="90" y2="160" stroke={Colors.border} strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />
              <Line x1="220" y1="0" x2="220" y2="160" stroke={Colors.border} strokeWidth="1" strokeDasharray="4 4" opacity={0.4} />

              {/* Dotted Route Curve */}
              <Path
                d="M 50 75 Q 170 30 290 75"
                stroke={Colors.primary}
                strokeWidth="3.5"
                strokeDasharray="6 6"
                fill="none"
              />
            </Svg>

            {/* Origin Pin (Left) */}
            <View style={styles.originPinContainer}>
              <View style={styles.pinBadge}>
                <Ionicons name="storefront" size={14} color="#FFF" />
              </View>
              <Text style={styles.pinSubLabel}>{t('track.from', 'From')}</Text>
              <Text style={styles.pinMainLabel}>{order.kitchenName || t('track.nehasKitchen', "Neha's Kitchen")}</Text>
            </View>

            {/* Moving Rider Badge (Center Route) */}
            <View style={styles.riderBadgeContainer}>
              <View style={styles.riderAvatarBorder}>
                <ChefIllustration size={44} mode="avatar" />
              </View>
            </View>

            {/* Destination Pin (Right) */}
            <View style={styles.destPinContainer}>
              <View style={[styles.pinBadge, { backgroundColor: Colors.green || '#51793F' }]}>
                <Ionicons name="home" size={14} color="#FFF" />
              </View>
              <Text style={styles.pinSubLabel}>{t('track.to', 'To')}</Text>
              <Text style={styles.pinMainLabel}>{t('track.yourHome', 'Your Home')}</Text>
            </View>
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderDetailsCard}>
          <View style={styles.orderCardLeft}>
            <Image
              source={{ uri: order.image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80' }}
              style={styles.foodImage}
            />
            <View style={styles.foodInfo}>
              <Text style={styles.orderDetailsHeader}>{t('track.orderDetails', 'Order Details')}</Text>
              <Text style={styles.foodItemLine}>{t('track.dishLine', { defaultValue: '2 x {{dish}}', dish: order.dishName || t('track.choleBhature', 'Chole Bhature') })}</Text>
              {order.extra_item && <Text style={styles.foodItemLine}>{order.extra_item}</Text>}
              <View style={styles.kitchenAttributionRow}>
                <Ionicons name="heart" size={12} color={Colors.primary} />
                <Text style={styles.kitchenAttributionText}>{t('track.fromKitchen', { defaultValue: 'from {{kitchen}}', kitchen: order.kitchenName || t('track.nehasKitchen', "Neha's Kitchen") })}</Text>
              </View>
            </View>
          </View>

          <View style={styles.orderCardRight}>
            <Text style={styles.totalLabel}>{t('track.total', 'Total')}</Text>
            <Text style={styles.totalAmount}>₹{order.total || 210}</Text>

            <Pressable
              style={styles.viewDetailsBtn}
              onPress={() => router.push(`/(consumer)/order/${order.id}` as any)}
            >
              <Text style={styles.viewDetailsText}>{t('track.viewDetails', 'View Details')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Support Chef CTA Banner */}
        <Pressable
          style={styles.supportBanner}
          onPress={() => setShowSupportModal(true)}
        >
          <View style={styles.supportLeft}>
            <Text style={styles.supportTitle}>{t('track.needHelp', 'Need Help?')}</Text>
            <Text style={styles.supportSubtitle}>{t('track.needHelpSub', 'Raise a support ticket or chat with CRM team')}</Text>
          </View>
          <View style={styles.supportRight}>
            <View style={styles.supportAvatarCircle}>
              <ChefIllustration size={42} mode="avatar" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </Pressable>
      </ScrollView>

      <SupportTicketModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        initialOrderId={order?.id || (typeof order_id === 'string' ? order_id : undefined)}
      />
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 16,
      fontWeight: '700',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerBackBtn: {
      padding: 6,
      borderRadius: 20,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.dark,
    },
    headerHelpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: Colors.surfaceAlt,
    },
    headerHelpText: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 40,
    },
    etaCard: {
      backgroundColor: Colors.surface,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      shadowColor: Colors.dark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    etaLeft: {
      flex: 1,
    },
    etaEyebrow: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.muted,
      marginBottom: 4,
    },
    etaTime: {
      fontSize: 28,
      fontWeight: '900',
      color: Colors.primary,
      marginBottom: 4,
    },
    etaStatus: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.dark,
    },
    etaRight: {
      marginLeft: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperCard: {
      backgroundColor: Colors.surface,
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    stepperTrackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepItem: {
      alignItems: 'center',
      width: 68,
    },
    stepCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: Colors.surfaceAlt,
      borderWidth: 2,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    stepCircleCompleted: {
      backgroundColor: Colors.green || '#51793F',
      borderColor: Colors.green || '#51793F',
    },
    stepCircleActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    stepCircleInactive: {
      backgroundColor: Colors.surfaceAlt,
      borderColor: Colors.border,
    },
    stepConnectorLine: {
      flex: 1,
      height: 3,
      backgroundColor: Colors.border,
      marginTop: -18,
    },
    stepConnectorActive: {
      backgroundColor: Colors.green || '#51793F',
    },
    stepLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: Colors.muted,
      textAlign: 'center',
    },
    stepLabelActive: {
      fontWeight: '800',
      color: Colors.dark,
    },
    mapContainerCard: {
      backgroundColor: Colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border,
      height: 170,
    },
    visualMapBackground: {
      flex: 1,
      backgroundColor: '#FAF5ED',
      position: 'relative',
      justifyContent: 'center',
    },
    originPinContainer: {
      position: 'absolute',
      left: 18,
      top: 35,
      alignItems: 'center',
    },
    destPinContainer: {
      position: 'absolute',
      right: 18,
      top: 35,
      alignItems: 'center',
    },
    pinBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 4,
    },
    pinSubLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: Colors.muted,
    },
    pinMainLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: Colors.dark,
    },
    riderBadgeContainer: {
      position: 'absolute',
      left: '45%',
      top: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    riderAvatarBorder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: Colors.orange || '#E87D3E',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 4,
    },
    orderDetailsCard: {
      backgroundColor: Colors.greenBadge || '#EAF2E6',
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    orderCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    foodImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
    },
    foodInfo: {
      flex: 1,
    },
    orderDetailsHeader: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.dark,
      marginBottom: 3,
    },
    foodItemLine: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.dark,
    },
    kitchenAttributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    kitchenAttributionText: {
      fontSize: 11,
      fontWeight: '700',
      color: Colors.primary,
    },
    orderCardRight: {
      alignItems: 'flex-end',
      marginLeft: 10,
    },
    totalLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: Colors.muted,
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: '900',
      color: Colors.dark,
      marginBottom: 8,
    },
    viewDetailsBtn: {
      borderWidth: 1.5,
      borderColor: Colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
      backgroundColor: Colors.surface,
    },
    viewDetailsText: {
      fontSize: 12,
      fontWeight: '800',
      color: Colors.primary,
    },
    supportBanner: {
      backgroundColor: Colors.primaryDeep || '#3E1B15',
      borderRadius: 25,
      paddingVertical: 14,
      paddingHorizontal: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    supportLeft: {},
    supportTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    supportSubtitle: {
      color: Colors.surfaceAlt || '#F0E5CE',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    supportRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    supportAvatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
