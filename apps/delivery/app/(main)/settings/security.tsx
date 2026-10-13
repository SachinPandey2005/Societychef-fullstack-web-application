import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { useSecurityStore } from '../../../store/useSecurityStore';
import { SecurityRepository } from '../../../repositories/SecurityRepository';
import { useToast } from '../../../components/ui/Toast';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();
  const {
    biometricsAvailable,
    biometricsEnabled,
    failedAttempts,
    isLocked,
    lockoutTimeRemaining,
  } = useSecurityStore();

  useEffect(() => {
    SecurityRepository.checkBiometricsSupport();
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      // Prompt biometrics scan to confirm enrollment verification
      const success = await SecurityRepository.authenticateBiometrics('Confirm biometric enrollment');
      if (success) {
        SecurityRepository.toggleBiometrics(true);
        showToast('Biometric login enabled!', 'success');
      } else {
        showToast('Authentication failed. Cannot enable.', 'error');
      }
    } else {
      SecurityRepository.toggleBiometrics(false);
      showToast('Biometric login disabled.', 'info');
    }
  };

  const handleResetLockout = () => {
    useSecurityStore.getState().resetFailedAttempts();
    showToast('Failed attempts counter reset.', 'success');
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Biometrics & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Hardened Locks Notice Banner */}
          {isLocked && (
            <Card style={{ backgroundColor: colors.dangerContainer, padding: spacing.md, borderColor: 'transparent' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="lock" size={20} color={colors.danger} />
                <Text variant="caption" weight="extrabold" color="danger" style={{ marginLeft: 6 }}>
                  Security Lockout Active
                </Text>
              </View>
              <Text variant="caption" color="danger" style={{ marginTop: 4, fontSize: 10 }}>
                This account has been locked due to {failedAttempts} consecutive authentication failures. Try again in {lockoutTimeRemaining} seconds, or use standard OTP login fallback.
              </Text>
            </Card>
          )}

          {/* Biometrics Enroll Toggles */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Biometric Authentication</Text>
            <Card style={{ padding: spacing.md }}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text variant="caption" weight="bold">Enable Face / Fingerprint Login</Text>
                  <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                    {biometricsAvailable
                      ? 'Securely log in to RasoHi Delivery using platform biometrics instead of SMS OTP.'
                      : 'Biometric hardware is not enrolled or supported on this device. Fallback to OTP is active.'}
                  </Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={!biometricsAvailable || isLocked}
                  trackColor={{ false: colors.outline, true: colors.primary }}
                />
              </View>
            </Card>
          </View>

          {/* Lockout details */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Brute-Force Protection</Text>
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <View style={styles.statRow}>
                <Text variant="caption">Consecutive Failed Attempts</Text>
                <Text variant="caption" weight="bold" color={failedAttempts >= 3 ? 'danger' : 'default'}>
                  {failedAttempts} / 5
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              <View style={styles.statRow}>
                <Text variant="caption">OTP Verification Fallback</Text>
                <Text variant="caption" weight="bold" color="success">ACTIVE</Text>
              </View>

              {failedAttempts > 0 && (
                <Button
                  label="Reset Attempts (Diagnostics)"
                  onPress={handleResetLockout}
                  variant="outline"
                  size="sm"
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                />
              )}
            </Card>
          </View>

        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
