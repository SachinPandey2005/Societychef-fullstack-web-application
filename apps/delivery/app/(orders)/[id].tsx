import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { Icon } from '../../components/Icon';

// Stores & Repositories
import { useOrderStore, OrderLifecycleStatus } from '../../store/useOrderStore';
import { useDispatchStore } from '../../store/useDispatchStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { OrderRepository } from '../../repositories/OrderRepository';

// Order Components
import {
  OrderTimelineWidget,
  AddressCard,
  CommunicationBar,
  OrderDetailsCard,
  BatchOrderWidget,
  CancellationModal,
  RejectionReasonModal,
  QuickMessageModal,
} from '../../components/orders';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, spacing, radius, shadows } = useTheme();
  const { showToast } = useToast();

  const { activeOrder, isLoading, isUpdating } = useOrderStore();
  const { isBatched, batchStops, currentStopIndex, cancellationNotice, setCancellationNotice } = useDispatchStore();

  const [autoRouteEnabled, setAutoRouteEnabled] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [quickMsgModalVisible, setQuickMsgModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      OrderRepository.fetchOrderDetails(id as string);
      useVehicleStore.getState().loadVehicle().catch(() => {});
    }
  }, [id]);

  if (isLoading && !activeOrder) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text variant="sm" style={{ marginTop: spacing.sm, color: colors.textSecondary }}>
            Loading order details...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!activeOrder) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={48} colorType="secondary" />
          <Text variant="sm" weight="bold" style={{ marginTop: spacing.sm }}>
            Order Not Found
          </Text>
          <Text variant="caption" color="secondary" align="center" style={{ marginTop: 2, marginBottom: spacing.md }}>
            The order might be cancelled or unassigned from you.
          </Text>
          <Button
            label="Back to Orders"
            onPress={() => router.replace('/(main)/orders')}
            variant="primary"
            size="md"
            style={{ backgroundColor: '#059669' }}
          />
        </View>
      </ScreenWrapper>
    );
  }

  const order = activeOrder;
  const deliveryEarnings = order.delivery_fee || 39.95;
  const tipsAmount = 11.50;
  const totalEstEarnings = (deliveryEarnings + tipsAmount).toFixed(2);
  const distance = order.distance_km || 11.3;

  // Status transition logic
  const handleAdvanceStatus = async () => {
    let nextStatus: OrderLifecycleStatus = 'ACCEPTED';
    switch (order.status) {
      case 'ASSIGNED':
        nextStatus = 'ACCEPTED';
        break;
      case 'ACCEPTED':
        nextStatus = 'HEADING_TO_CHEF';
        break;
      case 'HEADING_TO_CHEF':
        nextStatus = 'REACHED_CHEF';
        break;
      case 'REACHED_CHEF':
        nextStatus = 'FOOD_PICKED';
        break;
      case 'FOOD_PICKED':
        nextStatus = 'HEADING_TO_CUSTOMER';
        break;
      case 'HEADING_TO_CUSTOMER':
        nextStatus = 'REACHED_CUSTOMER';
        break;
      case 'REACHED_CUSTOMER':
        nextStatus = 'DELIVERED';
        break;
      case 'DELIVERED':
        router.replace('/(main)/home');
        return;
    }

    if (nextStatus === 'ACCEPTED') {
      const vehicle = useVehicleStore.getState().vehicle;
      const hasVehicle = !!(vehicle && vehicle.vehicle_type && vehicle.vehicle_type !== 'WALKING');
      if (!hasVehicle && (order.priority === 'EXPRESS' || order.distance_km > 2)) {
        showToast('⚠️ Motor vehicle details required for high-priority or long-distance orders.', 'error');
        return;
      }
    }

    try {
      await OrderRepository.updateStatus(order.id, nextStatus);
      showToast(`Order status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Status update error', 'error');
    }
  };

  const getButtonLabel = () => {
    switch (order.status) {
      case 'ASSIGNED':
        return 'Accept Delivery';
      case 'ACCEPTED':
        return 'Go to Kitchen';
      case 'HEADING_TO_CHEF':
        return 'Arrived at Kitchen';
      case 'REACHED_CHEF':
        return 'Pick Up Order';
      case 'FOOD_PICKED':
        return 'Start Delivery';
      case 'HEADING_TO_CUSTOMER':
        return 'Arrived at Customer';
      case 'REACHED_CUSTOMER':
        return 'Complete Delivery';
      case 'DELIVERED':
        return 'Back to Home';
      default:
        return 'Next Step';
    }
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header Matching Image 5 */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text variant="md" weight="extrabold" style={{ color: '#0F172A' }}>
          Orders
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollableLayout contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}>
        
        {/* Location Route Card (Image 5) */}
        <View style={[styles.routeCard, { ...shadows.xs }]}>
          <Text variant="caption" weight="extrabold" style={{ color: '#94A3B8', letterSpacing: 0.5 }}>
            Your location
          </Text>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginTop: 2 }}>
            {order.kitchen?.name || 'Kitchen / Pickup Point'}
          </Text>

          <View style={styles.routeDivider} />

          <Text variant="caption" weight="extrabold" style={{ color: '#94A3B8', letterSpacing: 0.5 }}>
            Delivery location 1
          </Text>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginTop: 2 }}>
            {order.delivery_address || 'Customer Drop Address'}
          </Text>
        </View>

        {/* Financial Metrics List (Image 5) */}
        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <Text variant="xs" style={{ color: '#64748B' }}>
              Delivery earnings
            </Text>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A' }}>
              ₹{deliveryEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text variant="xs" style={{ color: '#64748B' }}>
              Total tips
            </Text>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A' }}>
              ₹{tipsAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text variant="xs" style={{ color: '#64748B' }}>
              Total distance
            </Text>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A' }}>
              {distance} km
            </Text>
          </View>
        </View>

        {/* Dashed Total EST Earnings Box (Image 5) */}
        <View style={styles.dashedBox}>
          <Text variant="xs" weight="extrabold" style={{ color: '#059669' }}>
            Total EST earnings
          </Text>
          <Text variant="h2" weight="extrabold" style={{ color: '#059669', fontSize: 28 }}>
            ₹{totalEstEarnings}
          </Text>
        </View>

        {/* Route Option Switch (Image 5) */}
        <View style={styles.switchRow}>
          <Text variant="xs" style={{ color: '#64748B', flex: 1, paddingRight: 10 }}>
            Always select best route, ignore traffic
          </Text>
          <Switch value={autoRouteEnabled} onValueChange={setAutoRouteEnabled} activeColor="#10B981" />
        </View>

        {/* Stepper Timeline & Order Details */}
        <OrderTimelineWidget status={order.status} />

        {isBatched && <BatchOrderWidget stops={batchStops} currentIndex={currentStopIndex} />}

        <AddressCard
          kitchenName={order.kitchen?.name}
          chefName={order.kitchen?.chef_name}
          pickupAddress={order.kitchen?.address}
          chefPhone={order.kitchen?.phone}
          customerName={order.customer?.full_name}
          dropAddress={order.delivery_address}
          customerPhone={order.customer?.phone}
          onCallChef={() => showToast(`Calling Chef ${order.kitchen?.chef_name}...`, 'info')}
          onCallCustomer={() => showToast(`Calling Customer ${order.customer?.full_name}...`, 'info')}
        />

        <CommunicationBar
          onCallCustomer={() => showToast(`Calling resident ${order.customer?.full_name}...`, 'info')}
          onCallChef={() => showToast(`Calling chef ${order.kitchen?.chef_name}...`, 'info')}
          onOpenQuickMessages={() => setQuickMsgModalVisible(true)}
          onOpenSupport={() => showToast('Connecting to Live Support...', 'info')}
        />

        <OrderDetailsCard
          items={order.items}
          specialInstructions={order.special_instructions}
          allergyInfo={order.allergy_info}
          cookingInstructions={order.cooking_instructions}
          packagingNotes={order.packaging_notes}
        />
      </ScrollableLayout>

      {/* Sticky Bottom Actions Matching Image 5 */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAdvanceStatus}
          disabled={isUpdating}
          style={styles.primaryPillBtn}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="two-wheeler" size={20} color="#FFFFFF" />
              <Text variant="sm" weight="extrabold" style={{ color: '#FFFFFF', marginLeft: 8 }}>
                {getButtonLabel()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setRejectModalVisible(true)}
          style={styles.secondaryOutlineBtn}
        >
          <Text variant="xs" weight="bold" style={{ color: '#64748B' }}>
            No, I'll select orders
          </Text>
        </TouchableOpacity>
      </View>

      <CancellationModal
        visible={!!cancellationNotice}
        orderNumber={cancellationNotice?.orderNumber}
        reason={cancellationNotice?.reason}
        onClose={() => setCancellationNotice(null)}
      />

      <RejectionReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onConfirmReject={async (reason) => {
          setRejectModalVisible(false);
          await useOrderStore.getState().rejectOrder(order.id, reason);
          showToast(`Order rejected (${reason})`, 'info');
          router.replace('/(main)/home');
        }}
      />

      <QuickMessageModal
        visible={quickMsgModalVisible}
        onClose={() => setQuickMsgModalVisible(false)}
        onSelectMessage={(msg) => {
          showToast(`Sent to customer: "${msg}"`, 'success');
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  routeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  metricsList: {
    gap: 10,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
    alignItems: 'center',
  },
  primaryPillBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#10B981',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryOutlineBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
