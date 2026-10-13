import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

import { Icon } from '../../components/Icon';
// Stores & Repositories
import { useOrderStore } from '../../store/useOrderStore';
import { usePickupStore } from '../../store/usePickupStore';
import { PickupRepository } from '../../repositories/PickupRepository';

// Handover Components
import {
  PickupChecklistModal,
  ChefPinVerifyModal,
} from '../../components/handover';
import { AddressCard, OrderDetailsCard } from '../../components/orders';

export default function PickupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { showToast } = useToast();

  const { activeOrder } = useOrderStore();
  const { isPinVerified, isSubmitting } = usePickupStore();

  const [checklistVisible, setChecklistVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);

  if (!activeOrder) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Icon name="error-outline" size={48} colorType="secondary" />
          <Text variant="sm" weight="bold" style={{ marginTop: spacing.sm }}>
            No Active Order Found for Pickup
          </Text>
          <Button
            label="Back to Orders"
            onPress={() => router.replace('/(main)/orders')}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenWrapper>
    );
  }

  const order = activeOrder;

  const handleChefPinVerify = async (pin: string) => {
    await PickupRepository.verifyChefPin(order.id, pin);
    showToast('Chef Pickup Handover Verified!', 'success');
    router.replace(`/(orders)/navigation?id=${order.id}`);
  };

  return (
    <ScreenWrapper>
      <ScrollableLayout contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.xs }}>
        {/* Title Header */}
        <View style={styles.titleHeader}>
          <Text variant="h2" weight="extrabold">
            Kitchen Food Pickup
          </Text>
          <Text variant="xs" color="primary" weight="bold">
            Order #{order.order_number}
          </Text>
        </View>

        {/* Address & Contact Card */}
        <AddressCard
          kitchenName={order.kitchen?.name}
          chefName={order.kitchen?.chef_name}
          pickupAddress={order.kitchen?.address}
          chefPhone={order.kitchen?.phone}
          onCallChef={() => showToast(`Calling Chef ${order.kitchen?.chef_name}...`, 'info')}
        />

        {/* Item Checklist Preview */}
        <OrderDetailsCard
          items={order.items}
          specialInstructions={order.special_instructions}
          allergyInfo={order.allergy_info}
        />

        {/* Action Buttons */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            label="Open Pickup Checklist"
            onPress={() => setChecklistVisible(true)}
            variant="outline"
            size="lg"
          />

          <Button
            label="Verify Chef Handover PIN"
            onPress={() => setPinModalVisible(true)}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollableLayout>

      {/* Pickup Checklist Modal */}
      <PickupChecklistModal
        visible={checklistVisible}
        onClose={() => setChecklistVisible(false)}
        onConfirmChecklist={() => {
          setChecklistVisible(false);
          PickupRepository.confirmChecklist(order.id);
          showToast('Checklist confirmed with Chef', 'success');
        }}
      />

      {/* Chef Handover PIN Modal */}
      <ChefPinVerifyModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onVerifyPin={handleChefPinVerify}
        isLoading={isSubmitting}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleHeader: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
});
