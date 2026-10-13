import { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function validate(): boolean {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError(t('auth.invalidPhone', 'Please enter a valid 10-digit mobile number.'));
      return false;
    }
    setError('');
    return true;
  }

  async function handleSendOtp() {
    if (!validate()) return;
    setIsLoading(true);
    setError('');

    // A returning user's name is already on file — the next screen only asks
    // for a name if the backend tells us this phone number is a brand-new
    // signup, so this no longer needs to be collected (or required) up front.
    // (Chef-signup intent, if any, is read directly off useAuthStore's
    // persisted pendingChefSignup by otp.tsx — not threaded through this URL
    // — see landing.tsx's handleCookAuth for why.)
    const targetUrl = `/(auth)/otp?phone=${encodeURIComponent(phone)}`;

    if (isMockMode) {
      setTimeout(() => {
        setIsLoading(false);
        router.push(targetUrl as any);
      }, 600);
      return;
    }

    try {
      await apiClient.post('/auth/send-otp', { phone: `+91${phone}` });
      router.push(targetUrl as any);
    } catch (e: any) {
      setError(e?.message || t('auth.otpSendFailed', 'Could not send OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/doodle_bg.png')}
      style={styles.bgContainer}
      imageStyle={{ opacity: 0.15 }}
      resizeMode="repeat"
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.85)',
                borderWidth: 1,
                borderColor: '#E8E4D9',
              }}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/landing');
                }
              }}
            >
              <Ionicons name="arrow-back" size={16} color="#123524" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#123524' }}>{t('auth.back', 'Back')}</Text>
            </Pressable>

            <View style={styles.brandGroup}>
              <Image
                source={require('../../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
                style={{ width: 120, height: 38 }}
                resizeMode="contain"
              />
            </View>

            <LanguageTogglePill />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero Illustration */}
            <View style={styles.heroSection}>
              <View style={styles.heroImageContainer}>
                <Image
                  source={require('../../assets/login_chef_hero.png')}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>

              {/* Catchy Headline */}
              <Text style={styles.headline}>
                Ghar Ka Swad,{'\n'}
                <Text style={styles.headlineAccent}>बगल वाले घर से.</Text>
              </Text>
              <Text style={styles.subheadline}>
                Fresh, hygienic home meals prepared with love by verified chefs in your society.
              </Text>
            </View>

            {/* Login Form Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.phoneIconWrap}>
                  <Ionicons name="call" size={18} color="#123524" />
                </View>
                <View style={styles.cardHeaderTexts}>
                  <Text style={styles.cardTitle}>{t('auth.phoneTitle', "Let's get started")}</Text>
                  <Text style={styles.cardSubtitle}>
                    {t('auth.phoneSub', "Enter your mobile number to continue")}
                  </Text>
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+91</Text>
                  <Ionicons name="chevron-down" size={14} color="#6B6B6B" style={{ marginLeft: 2 }} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterMobile', 'Enter mobile number')}
                  placeholderTextColor="#9A9286"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  {...({ outlineStyle: 'none' } as any)}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Action Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  isLoading && styles.buttonDisabled,
                  pressed && !isLoading && styles.buttonPressed,
                ]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending OTP...' : 'Continue  →'}
                </Text>
              </Pressable>

              {/* Trust Badge */}
              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#6B6B6B" />
                <Text style={styles.trustText}>
                  We never share your number with anyone.
                </Text>
              </View>
            </View>

            {/* Bottom Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="restaurant-outline" size={20} color="#C89B3C" />
                <Text style={styles.statNumber}>150+</Text>
                <Text style={styles.statLabel}>{t('auth.homeChefs', 'Home Chefs')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="home-outline" size={20} color="#C89B3C" />
                <Text style={styles.statNumber}>10,000+</Text>
                <Text style={styles.statLabel}>{t('auth.societies', 'Societies')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={20} color="#C89B3C" />
                <Text style={styles.statNumber}>{t('auth.madeWith', 'Made with')}</Text>
                <Text style={styles.statLabel}>{t('auth.love', 'Love')}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Decorative Bottom Accent Bar */}
          <View style={styles.bottomAccentBar} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function getStyles(Colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F7F3EB',
    },
    bgContainer: {
      flex: 1,
      backgroundColor: '#F7F3EB',
    },
    flex: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 12,
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
    },
    brandGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FAF1DF',
      borderWidth: 1.5,
      borderColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: '#123524',
      letterSpacing: -0.3,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 24,
      alignItems: 'stretch',
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
    },
    heroSection: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    heroImageContainer: {
      width: '100%',
      height: 210,
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: '#FFFDF9',
      borderWidth: 1,
      borderColor: '#D8E3D7',
      ...Platform.select({
        web: { boxShadow: '0px 8px 24px rgba(18,53,36,0.08)' },
        default: {
          shadowColor: '#123524',
          shadowOpacity: 0.08,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        },
      }),
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    headline: {
      fontSize: 28,
      fontWeight: '900',
      color: '#123524',
      textAlign: 'center',
      lineHeight: 34,
      marginBottom: 8,
    },
    headlineAccent: {
      color: '#D4AF37',
      fontStyle: 'italic',
    },
    subheadline: {
      fontSize: 14,
      color: '#6B6B6B',
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: '#FFFDF9',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      marginBottom: 20,
      ...Platform.select({
        web: { boxShadow: '0px 10px 30px rgba(18,53,36,0.06)' },
        default: {
          shadowColor: '#123524',
          shadowOpacity: 0.06,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5,
        },
      }),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    phoneIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#FAF1DF',
      borderWidth: 1,
      borderColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderTexts: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#123524',
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 13,
      color: '#6B6B6B',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      borderRadius: 14,
      backgroundColor: '#FFFDF9',
      overflow: 'hidden',
      marginBottom: 14,
    },
    prefixBox: {
      width: 76,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      backgroundColor: '#FAF1DF',
      borderRightWidth: 1,
      borderRightColor: '#D8E3D7',
    },
    prefixText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#123524',
    },
    input: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 14,
      fontSize: 16,
      fontWeight: '700',
      color: '#123524',
    },
    errorText: {
      color: '#C94737',
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 12,
      marginTop: -4,
    },
    button: {
      backgroundColor: '#123524',
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#D4AF37',
    },
    buttonDisabled: {
      opacity: 0.65,
    },
    buttonPressed: {
      backgroundColor: '#0B2317',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    trustText: {
      fontSize: 12,
      color: '#6B6B6B',
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: '#FFFDF9',
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: '#D8E3D7',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 14,
      fontWeight: '800',
      color: '#123524',
      marginTop: 4,
    },
    statLabel: {
      fontSize: 11,
      color: '#6B6B6B',
      fontWeight: '600',
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: '#D8E3D7',
    },
    bottomAccentBar: {
      height: 6,
      backgroundColor: '#123524',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
  });
}
