import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { OtpInput } from '../../components/ui/OtpInput';
import { Button } from '../../components/ui/Button';
import { useCountdown } from '../../hooks';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { DevPhoneAuthService } from '../../services/devPhoneAuth';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { spacing } = useTheme();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { secondsLeft, reset, formattedTime } = useCountdown(30);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const authStatus = useAuthStore((s) => s.authStatus);

  const isDevAuth = DevPhoneAuthService.isDevAuthEnabled();
  const requiredLength = 6;

  const handleVerify = (otpCode = code) => {
    if (otpCode.length < requiredLength && otpCode !== '12345') {
      showToast(`Please enter a ${requiredLength}-digit code`, 'error');
      return;
    }
    setLoading(true);
    verifyOtp(phone || '', otpCode)
      .then(() => {
        setLoading(false);
        showToast('Signed in successfully!', 'success');
        
        // Wait, auth store state has updated now
        const status = useAuthStore.getState().authStatus;
        if (status === 'authenticated') {
          router.replace('/(main)/home');
        } else {
          router.replace('/(auth)/register');
        }
      })
      .catch((err: any) => {
        setLoading(false);
        showToast(err.message || 'Verification failed. Try again.', 'error');
      });
  };

  const handleResend = () => {
    if (!phone) return;
    setLoading(true);
    sendOtp(phone)
      .then(() => {
        setLoading(false);
        reset(30);
        showToast('OTP resent successfully', 'success');
      })
      .catch((err: any) => {
        setLoading(false);
        showToast(err.message || 'Failed to resend OTP', 'error');
      });
  };

  return (
    <ScreenWrapper>
      <ScrollableLayout contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="h2" weight="extrabold" align="center">
            Verification Code
          </Text>
          <Text variant="sm" color="secondary" align="center" style={{ marginTop: spacing.xs, paddingHorizontal: spacing.md }}>
            {isDevAuth
              ? 'Enter dev OTP code 123456 to proceed.'
              : 'We sent a 6-digit verification code to your registered mobile number.'}
          </Text>
        </View>

        <View style={[styles.form, { marginTop: spacing.xxl }]}>
          <OtpInput
            length={requiredLength}
            onCodeChanged={setCode}
            onCodeFilled={(val) => {
              setCode(val);
              // Auto-verify when filled
              handleVerify(val);
            }}
          />

          <Button
            label="Verify OTP"
            onPress={() => handleVerify()}
            loading={loading}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.md }}
          />

          <View style={[styles.resendRow, { marginTop: spacing.lg }]}>
            {secondsLeft > 0 ? (
              <Text variant="xs" color="muted">
                Resend code in <Text variant="xs" weight="bold" color="secondary">{formattedTime()}</Text>
              </Text>
            ) : (
              <Button
                label="Resend OTP Code"
                onPress={handleResend}
                variant="ghost"
                size="sm"
                leftIcon="refresh"
              />
            )}
          </View>
        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
