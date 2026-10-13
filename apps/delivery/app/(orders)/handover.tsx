import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

// Stores & Repositories
import { useOrderStore } from '../../store/useOrderStore';
import { useDeliveryStore } from '../../store/useDeliveryStore';
import { useOTPStore } from '../../store/useOTPStore';
import { useProofStore } from '../../store/useProofStore';
import { useIssueStore } from '../../store/useIssueStore';

import { DeliveryRepository } from '../../repositories/DeliveryRepository';
import { OTPRepository } from '../../repositories/OTPRepository';
import { ProofRepository } from '../../repositories/ProofRepository';
import { IssueRepository } from '../../repositories/IssueRepository';

// Handover Components
import {
  ExecutionTimelineWidget,
  OtpInputWidget,
  ProofOfDeliveryModal,
  ExceptionReportModal,
  SafetySosModal,
  DeliverySuccessAnimation,
} from '../../components/handover';
import { AddressCard, CommunicationBar } from '../../components/orders';

export default function HandoverScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const { activeOrder } = useOrderStore();
  const { currentStep, isSubmitting } = useDeliveryStore();
  const { isOtpVerified } = useOTPStore();
  const { isUploaded } = useProofStore();

  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [successAnimationVisible, setSuccessAnimationVisible] = useState(false);

  if (!activeOrder) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Icon name="error-outline" size={48} colorType="secondary" />
          <Text variant="sm" weight="bold" style={{ marginTop: spacing.sm }}>
            No Active Order Found for Handover
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

  const handleVerifyOtp = async (otp: string) => {
    await OTPRepository.verifyCustomerOtp(order.id, otp);
    showToast('Delivery OTP Verified!', 'success');
  };

  const handleCompleteHandover = async () => {
    if (!isOtpVerified) {
      showToast('Please verify customer OTP before completing delivery', 'error');
      return;
    }

    try {
      await DeliveryRepository.completeDelivery(order.id, 19.1245, 72.9120);
      setSuccessAnimationVisible(true);
    } catch (e: any) {
      showToast(e.message || 'Delivery completion failed', 'error');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollableLayout contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.xs }}>
        {/* Step-by-Step Execution Timeline */}
        <ExecutionTimelineWidget currentStep={currentStep} />

        {/* Resident Destination Block */}
        <AddressCard
          customerName={order.customer?.full_name}
          dropAddress={order.delivery_address}
          customerPhone={order.customer?.phone}
          kitchenName={order.kitchen?.name}
          chefPhone={order.kitchen?.phone}
          onCallCustomer={() => showToast(`Calling resident ${order.customer?.full_name}...`, 'info')}
        />

        {/* Customer 4-Digit OTP Pin Pad */}
        <OtpInputWidget onVerifyOtp={handleVerifyOtp} isLoading={isSubmitting} />

        {/* Proof of Delivery Card Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setProofModalVisible(true)}
          style={[
            styles.podBtnCard,
            {
              backgroundColor: isUploaded ? colors.successContainer : colors.surfaceElevated,
              borderColor: isUploaded ? colors.success : colors.border,
              borderRadius: radius.medium,
              padding: spacing.sm,
              marginTop: spacing.md,
            },
          ]}
        >
          <Icon name="assignment-turned-in" size={20} colorType={isUploaded ? 'success' : 'primary'} />
          <View style={{ marginLeft: spacing.xs, flex: 1 }}>
            <Text variant="xs" weight="bold">
              {isUploaded ? 'Proof of Delivery Attached' : 'Attach Proof of Delivery (Optional Signature / Photo)'}
            </Text>

            <Text variant="caption" color="secondary">
              {isUploaded ? 'Signature/Photo verified' : 'Tap to record signature or photo proof'}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} colorType="secondary" />
        </TouchableOpacity>

        {/* Communication & Exception Bar */}
        <CommunicationBar
          onCallCustomer={() => showToast(`Calling resident ${order.customer?.full_name}...`, 'info')}
          onCallChef={() => showToast(`Calling chef ${order.kitchen?.chef_name}...`, 'info')}
          onOpenQuickMessages={() => showToast('Opening quick preset messages...', 'info')}
          onOpenSupport={() => setIssueModalVisible(true)}
        />

        {/* Exceptions & Safety Action Bar */}
        <View style={[styles.exceptionBar, { marginTop: spacing.md }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIssueModalVisible(true)}
            style={[styles.excBtn, { backgroundColor: colors.warningContainer, borderRadius: radius.medium }]}
          >
            <Icon name="report-problem" size={16} colorType="warning" />
            <Text variant="caption" weight="bold" color="warning" style={{ marginLeft: 4 }}>
              Report Issue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSosModalVisible(true)}
            style={[styles.excBtn, { backgroundColor: colors.dangerContainer, borderRadius: radius.medium }]}
          >
            <Icon name="warning" size={16} colorType="danger" />
            <Text variant="caption" weight="bold" color="danger" style={{ marginLeft: 4 }}>
              Safety SOS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Complete Delivery Primary CTA */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            label="Complete Order Delivery"
            onPress={handleCompleteHandover}
            loading={isSubmitting}
            disabled={!isOtpVerified}
            variant="primary"
            size="lg"
          />
        </View>
      </ScrollableLayout>

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        visible={proofModalVisible}
        onClose={() => setProofModalVisible(false)}
        onSubmitProof={async () => {
          await ProofRepository.submitProof(order.id);
          showToast('Proof of delivery attached', 'success');
        }}
      />

      {/* Exception Issue Report Modal */}
      <ExceptionReportModal
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
        onSubmitIssue={async (issueType, notes) => {
          await IssueRepository.reportIssue(order.id, issueType, notes);
          showToast(`Issue ticket submitted (${issueType})`, 'warning');
        }}
      />

      {/* Safety Emergency SOS Modal */}
      <SafetySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onTriggerSos={async () => {
          await IssueRepository.triggerEmergencySos(order.id);
          showToast('Emergency SOS Alert Dispatched to Ops CRM!', 'error');
        }}
        onCallOps={() => showToast('Connecting to RasoHi Ops Support...', 'info')}
        onCallPolice={() => showToast('Calling Helpline 112...', 'error')}
      />

      {/* Animated Success Overlay */}
      <DeliverySuccessAnimation
        visible={successAnimationVisible}
        orderNumber={order.order_number}
        earningsFee={order.delivery_fee}
        onDone={() => {
          setSuccessAnimationVisible(false);
          router.replace('/(main)/home');
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  podBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  exceptionBar: {
    flexDirection: 'row',
    gap: 8,
  },
  excBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
