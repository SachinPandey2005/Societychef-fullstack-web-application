import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { TextInput } from '../ui/TextInput';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { useOTPStore } from '../../store/useOTPStore';

interface OtpInputWidgetProps {
  onVerifyOtp: (otp: string) => Promise<void>;
  isLoading?: boolean;
}

export const OtpInputWidget: React.FC<OtpInputWidgetProps> = ({ onVerifyOtp, isLoading = false }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { enteredOtp, setEnteredOtp, isOtpVerified, attemptCount, maxAttempts, isRateLimited, errorMsg } = useOTPStore();

  const handleVerify = async () => {
    if (enteredOtp.length !== 4) return;
    try {
      await onVerifyOtp(enteredOtp);
    } catch {
      // Error handled by store/repo
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.large,
          padding: spacing.md,
          marginTop: spacing.md,
          borderColor: isOtpVerified ? colors.success : colors.border,
          borderWidth: isOtpVerified ? 2 : 1,
          ...shadows.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="lock" size={20} colorType={isOtpVerified ? 'success' : 'primary'} />
          <Text variant="sm" weight="extrabold" style={{ marginLeft: spacing.xs }}>
            Customer Delivery OTP
          </Text>
        </View>

        {isOtpVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
            <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF' }}>
              OTP VERIFIED
            </Text>
          </View>
        )}
      </View>

      {!isOtpVerified ? (
        <>
          <Text variant="xs" color="secondary" style={{ marginTop: 4 }}>
            Ask resident for 4-digit handover OTP code. (Attempts: {attemptCount}/{maxAttempts})
          </Text>

          <View style={[styles.inputRow, { marginTop: spacing.sm }]}>
            <TextInput
              value={enteredOtp}
              onChangeText={setEnteredOtp}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="Enter 4-digit OTP"
              error={errorMsg || undefined}
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button
              label="Verify OTP"
              onPress={handleVerify}
              loading={isLoading}
              disabled={enteredOtp.length !== 4 || isRateLimited}
              variant="primary"
              size="md"
              style={{ marginLeft: spacing.xs }}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEnteredOtp('6543')}
            style={{ marginTop: 6, alignSelf: 'flex-start' }}
          >
            <Text variant="caption" color="info" weight="bold">
              Demo Shortcut: Auto-Fill Customer OTP (6543)
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={[styles.successBox, { backgroundColor: colors.successContainer, marginTop: spacing.xs }]}>
          <Icon name="check-circle" size={18} colorType="success" />
          <Text variant="xs" weight="bold" color="success" style={{ marginLeft: 6 }}>
            Handover OTP validated successfully. You may now complete delivery.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
});

export default OtpInputWidget;
