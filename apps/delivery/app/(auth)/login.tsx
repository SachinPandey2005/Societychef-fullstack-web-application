import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { Icon } from '../../components/Icon';
import { useAuthStore } from '../../store/useAuthStore';

// Helper component for background dot matrix grids
function DotMatrixGrid({ rows = 5, cols = 4, style }: { rows?: number; cols?: number; style?: any }) {
  return (
    <View style={[styles.dotGridContainer, style]}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.dotRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <View key={c} style={styles.dot} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sendOtp = useAuthStore((s) => s.sendOtp);

  const handleSendOtp = () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    const formattedPhone = `+91${phone}`;

    sendOtp(formattedPhone)
      .then(() => {
        setLoading(false);
        router.push({ pathname: '/(auth)/otp', params: { phone: formattedPhone } });
      })
      .catch((err: any) => {
        setLoading(false);
        setError(err.message || 'Failed to send OTP. Please try again.');
      });
  };

  return (
    <ScreenWrapper style={{ backgroundColor: '#F1F9F5' }}>
      {/* Background Decorative Dot Grids */}
      <DotMatrixGrid rows={6} cols={5} style={styles.dotGridTopLeft} />
      <DotMatrixGrid rows={5} cols={4} style={styles.dotGridTopRight} />
      <DotMatrixGrid rows={6} cols={5} style={styles.dotGridBottomLeft} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* 1. Centered Header Section (Exact match for img 1) */}
        <View style={styles.headerSection}>
          {/* Centered Brand Title: SocietyChef */}
          <View style={styles.logoRow}>
            <Text style={styles.brandSocietyText}>Society</Text>
            <View style={styles.brandChefRow}>
              <Text style={styles.brandChefText}>Chef</Text>
              <View style={styles.leafOnChef}>
                <Icon name="eco" size={18} color="#0D7855" />
              </View>
            </View>
          </View>

          {/* Centered Portal Badge Pill */}
          <View style={styles.portalBadgePill}>
            <View style={styles.goldDot} />
            <Text style={styles.portalBadgeText}>Delivery Partner Portal</Text>
            <View style={styles.goldDot} />
          </View>

          {/* Centered Tagline */}
          <View style={styles.taglineBox}>
            <View style={styles.taglineRow1}>
              <Text style={{ fontSize: 15, marginRight: 4 }}>🍃</Text>
              <Text style={styles.taglineText}>Delivering happiness,</Text>
            </View>
            <View style={styles.taglineRow2}>
              <Text style={styles.taglineText}>one order at a time</Text>
              <Text style={{ fontSize: 15, marginLeft: 4 }}>💚</Text>
            </View>
          </View>
        </View>

        {/* 2. Floating Login Form Card (Exact match for img 1) */}
        <View style={styles.loginCard}>
          {/* Header Row: Greeting & Security Shield */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.greetingCol}>
              <View style={styles.welcomeRow}>
                <Text style={{ fontSize: 24, marginRight: 6 }}>👋</Text>
                <Text variant="h2" weight="extrabold" style={styles.welcomeTitle}>
                  Welcome Back!
                </Text>
              </View>
              <Text variant="sm" style={styles.welcomeSubtitle}>
                Enter your mobile number to receive a secure OTP code.
              </Text>
            </View>

            {/* Shield Graphic Badge */}
            <View style={styles.shieldGraphicWrapper}>
              <View style={styles.sparkleTopRight}>
                <Icon name="auto-awesome" size={10} color="#0D7855" />
              </View>
              <View style={styles.sparkleBottomLeft}>
                <Icon name="auto-awesome" size={8} color="#0D7855" />
              </View>
              <View style={styles.shieldCircleBg}>
                <Icon name="verified-user" size={24} color="#0D7855" />
                <View style={styles.lockIconOverlay}>
                  <Icon name="lock" size={9} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>

          {/* Mobile Number Field */}
          <View style={styles.formGroup}>
            <Text variant="xs" weight="bold" style={styles.inputLabel}>
              Mobile Number
            </Text>

            <View style={[styles.inputBox, error ? { borderColor: '#EF4444' } : null]}>
              <View style={styles.countryCodeCol}>
                <Text style={{ fontSize: 18, marginRight: 4 }}>🇮🇳</Text>
                <Text variant="sm" weight="extrabold" style={styles.countryCodeText}>
                  +91
                </Text>
                <Icon name="keyboard-arrow-down" size={16} color="#64748B" containerStyle={{ marginLeft: 2 }} />
              </View>

              <View style={styles.verticalDivider} />

              <Icon name="phone-android" size={18} color="#0D7855" containerStyle={{ marginRight: 8 }} />

              <RNTextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  if (error) setError('');
                }}
              />
            </View>

            {error ? (
              <Text variant="caption" style={styles.errorText}>
                {error}
              </Text>
            ) : null}
          </View>

          {/* Main Action Button: Get OTP Code */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSendOtp}
            disabled={loading}
            style={styles.getOtpBtn}
          >
            <Text variant="sm" weight="extrabold" style={styles.getOtpBtnText}>
              {loading ? 'Sending OTP...' : 'Get OTP Code'}
            </Text>

            <View style={styles.arrowCircleRight}>
              <Icon name="arrow-forward" size={18} color="#0D7855" />
            </View>
          </TouchableOpacity>

          {/* Sub-Text Disclaimer below button */}
          <View style={styles.privacyNoticeRow}>
            <Icon name="verified-user" size={14} color="#64748B" containerStyle={{ marginRight: 6 }} />
            <Text variant="xs" style={styles.privacyNoticeText}>
              We never share your number with anyone
            </Text>
          </View>

        </View>

        {/* 3. Bottom Safe Data Footer */}
        <View style={styles.bottomFooterCol}>
          <View style={styles.safeDataRow}>
            <Text style={{ fontSize: 14, color: '#0D7855', marginRight: 4 }}>🍃</Text>
            <Text variant="xs" weight="extrabold" style={styles.safeDataText}>
              Your data is safe with us
            </Text>
            <Text style={{ fontSize: 14, color: '#0D7855', marginLeft: 4 }}>🍃</Text>
          </View>
          <Text variant="caption" style={styles.versionText}>
            v1.0.0
          </Text>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 30,
    paddingTop: 30,
  },
  dotGridContainer: {
    position: 'absolute',
    opacity: 0.25,
  },
  dotRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D7855',
    marginRight: 6,
  },
  dotGridTopLeft: {
    top: 30,
    left: 20,
  },
  dotGridTopRight: {
    top: 140,
    right: 16,
  },
  dotGridBottomLeft: {
    bottom: 120,
    left: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSocietyText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandChefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  brandChefText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D7855',
    letterSpacing: -0.5,
  },
  leafOnChef: {
    marginLeft: -2,
    marginTop: -14,
  },
  portalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D7855',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  goldDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  portalBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  taglineBox: {
    alignItems: 'center',
    marginTop: 16,
  },
  taglineRow1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taglineText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    marginTop: 28,
    padding: 22,
    shadowColor: '#073B29',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingCol: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  shieldGraphicWrapper: {
    position: 'relative',
    padding: 4,
  },
  shieldCircleBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEFBF5',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#0D7855',
    borderRadius: 8,
    padding: 2.5,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: -1,
    right: -1,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: -1,
    left: -1,
  },
  formGroup: {
    marginTop: 22,
  },
  inputLabel: {
    color: '#0D7855',
    fontSize: 12,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#0D7855',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  countryCodeCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    color: '#0F172A',
    fontSize: 15,
  },
  verticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 6,
    fontSize: 11,
  },
  getOtpBtn: {
    backgroundColor: '#0D7855',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    position: 'relative',
    shadowColor: '#0D7855',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  getOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  arrowCircleRight: {
    position: 'absolute',
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  privacyNoticeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomFooterCol: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 10,
  },
  safeDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeDataText: {
    color: '#0D7855',
    fontSize: 13,
  },
  versionText: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 11,
  },
});
