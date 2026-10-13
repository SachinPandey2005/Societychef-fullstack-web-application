import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InfoCard } from '../../components/ui/InfoCard';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/useAuthStore';
import { usePartnerStore } from '../../store/usePartnerStore';
import { DeliveryRiderIllustration } from '../../illustrations';

export default function RegisterScreen() {
  const router = useRouter();
  const { spacing, colors, radius } = useTheme();
  const { showToast } = useToast();
  
  const { logout } = useAuthStore();
  const { partner, profile, loadProfile } = usePartnerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile().catch(err => console.warn('Failed to load profile details:', err));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await loadProfile();
      showToast('KYC audit status refreshed', 'info');
      
      if (data.partner.kyc_status === 'APPROVED') {
        router.replace('/(main)/home');
      }
    } catch (e: any) {
      showToast(e.message || 'Refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const kycStatus = partner?.kyc_status || 'PENDING';
  const rejectionReason = partner?.rejection_reason || 'Document validation failed';

  return (
    <ScreenWrapper>
      <ScrollableLayout contentContainerStyle={styles.scrollCenter}>
        
        {/* Verification Status - UNDER REVIEW */}
        {kycStatus === 'UNDER_REVIEW' && (
          <View style={styles.contentCol}>
            <DeliveryRiderIllustration size={180} />
            
            <Text variant="h2" weight="extrabold" align="center" style={{ marginTop: spacing.md }}>
              KYC Under Review
            </Text>
            
            <Text variant="sm" color="secondary" align="center" style={{ marginTop: spacing.xs, paddingHorizontal: spacing.lg }}>
              Welcome, {profile?.name || 'Partner'}! Our operations desk is currently auditing your identity documents and vehicle registrations.
            </Text>

            <InfoCard
              type="info"
              title="Audit Verification"
              description="Aadhaar, PAN, and bank accounts are undergoing security validation. Review completes in 2-4 hours."
              style={{ marginTop: spacing.lg }}
            />

            <View style={[styles.buttonRow, { marginTop: spacing.xl }]}>
              <Button
                label="Refresh Status"
                onPress={handleRefresh}
                loading={refreshing}
                variant="primary"
                size="md"
                leftIcon="refresh"
              />
              <Button
                label="Log Out"
                onPress={logout}
                variant="outline"
                size="md"
                leftIcon="logout"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        )}

        {/* Verification Status - REJECTED */}
        {kycStatus === 'REJECTED' && (
          <View style={styles.contentCol}>
            <Icon name="cancel" size={80} color={colors.danger} />
            
            <Text variant="h2" weight="extrabold" align="center" style={{ marginTop: spacing.md, color: colors.danger }}>
              KYC Rejected
            </Text>
            
            <Text variant="sm" color="secondary" align="center" style={{ marginTop: spacing.xs, paddingHorizontal: spacing.lg }}>
              Your onboarding application was rejected during our document review checks. Please see details below.
            </Text>

            <Card
              variant="flat"
              style={[
                styles.reasonCard,
                {
                  backgroundColor: colors.dangerContainer,
                  borderColor: colors.danger,
                  borderRadius: radius.medium,
                  marginTop: spacing.md,
                },
              ]}
            >
              <Text variant="xs" weight="bold" color="danger">
                Rejection Reason:
              </Text>
              <Text variant="sm" color="secondary" style={{ marginTop: 2 }}>
                {rejectionReason}
              </Text>
            </Card>

            <View style={[styles.buttonRow, { marginTop: spacing.xl }]}>
              <Button
                label="Edit & Re-Submit KYC"
                onPress={() => router.push('/(auth)/onboarding')}
                variant="primary"
                size="md"
                leftIcon="edit"
              />
              <Button
                label="Log Out"
                onPress={logout}
                variant="outline"
                size="md"
                leftIcon="logout"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        )}

        {/* Default Fallback (Pending or not started) */}
        {(kycStatus === 'PENDING' || kycStatus === 'EXPIRED') && (
          <View style={styles.contentCol}>
            <Icon name="assignment" size={80} color={colors.primary} />
            <Text variant="h2" weight="extrabold" align="center" style={{ marginTop: spacing.md }}>
              Registration Pending
            </Text>
            <Text variant="sm" color="secondary" align="center" style={{ marginTop: spacing.xs, paddingHorizontal: spacing.lg }}>
              You have not submitted your KYC profile details yet.
            </Text>

            <View style={[styles.buttonRow, { marginTop: spacing.xl }]}>
              <Button
                label="Go to Onboarding Stepper"
                onPress={() => router.push('/(auth)/onboarding')}
                variant="primary"
                size="md"
                leftIcon="arrow-forward"
              />
              <Button
                label="Log Out"
                onPress={logout}
                variant="ghost"
                size="sm"
                style={{ marginTop: spacing.md }}
              />
            </View>
          </View>
        )}

      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  contentCol: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  reasonCard: {
    width: '100%',
    padding: 12,
    borderWidth: 1.5,
  },
  buttonRow: {
    width: '100%',
    maxWidth: 300,
  },
});
