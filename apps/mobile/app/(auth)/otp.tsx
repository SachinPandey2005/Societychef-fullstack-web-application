import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
import { registerForPushNotificationsAsync } from '../../lib/pushNotifications';
import { mapBackendUserToAuthUser } from '../../lib/authMapper';
import { useAuthStore } from '../../store/useAuthStore';
import { resetUserSession } from '../../lib/session';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { phone } = useLocalSearchParams<{ phone: string }>();
  // Set directly on the store by landing.tsx's "Become a Chef" button,
  // before it even navigates to phone.tsx — not threaded through a route
  // param (tried that first; reported directly as still landing on
  // consumer Discover regardless, unreliably). See the matching comment on
  // handleCookAuth in landing.tsx.
  const wantsChefSignup = useAuthStore((s) => s.pendingChefSignup);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // A returning user's name is already on file, so the phone screen no
  // longer asks for one up front — only a genuinely first-time signup
  // (backend profile created with the placeholder name 'New User', see
  // AuthService.syncProfile) lands here, after OTP is verified.
  const [needsName, setNeedsName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [pendingRole, setPendingRole] = useState<'chef' | 'consumer'>('consumer');

  // An account that has BOTH roles (owns a kitchen AND can browse as a
  // consumer) gets asked which mode to continue in right after verifying,
  // instead of silently landing on whatever was last used — requested
  // directly: "After login, I should be able to select which role I want."
  // A single-role account skips this entirely and goes straight in.
  const [needsRoleChoice, setNeedsRoleChoice] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, []);

  function handleDigitChange(text: string, index: number) {
    const clean = text.replace(/\D/g, '');
    if (clean.length >= 6) {
      const pDigits = clean.slice(0, 6).split('');
      setDigits(pDigits);
      setError('');
      inputRefs.current[5]?.focus();
      handleVerifyWithCode(pDigits.join(''));
      return;
    }

    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = next.join('');
    if (code.length === OTP_LENGTH) {
      handleVerifyWithCode(code);
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    }
  }

  async function handleVerify() {
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError(t('auth.completeOtp', 'Please enter the complete 6-digit OTP.'));
      return;
    }
    await handleVerifyWithCode(code);
  }

  // dismissAll() collapses the landing/phone/otp frames this flow pushed
  // before replacing — without it, router.replace() only swaps the current
  // frame, leaving the earlier screens stacked underneath, so the hardware
  // back button could walk all the way back through them instead of exiting
  // the app.
  function completeLogin(role: 'chef' | 'consumer') {
    setIsVerifying(false);
    // A "Become a Chef" entry (landing.tsx) carries intent=chef all the way
    // here. `role` already being 'chef' means this account already has a
    // kitchen (resolved from the real backend roles) — log them in normally
    // instead of sending an existing chef back through registration again.
    // Checked BEFORE dismissAll(), matching role.tsx's already-working chef
    // redirect exactly (a plain replace(), no dismissAll() at all) — the
    // combination of dismissAll() immediately followed by a replace() into
    // chef-register was never an exercised path before and reportedly
    // landed on consumer discover instead, straight after OTP.
    if (wantsChefSignup && role !== 'chef') {
      router.replace('/(auth)/chef-register');
      return;
    }
    router.dismissAll();
    router.replace(role === 'chef' ? '/(chef)/dashboard' : '/(consumer)/discover');
  }

  async function handleVerifyWithCode(code: string) {
    if (isVerifying) return;
    setIsVerifying(true);
    setError('');

    // Clear old user session if switching users / numbers
    const currentStoreUser = useAuthStore.getState().user;
    if (currentStoreUser && currentStoreUser.phone !== phone) {
      resetUserSession();
    }

    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 400));
      const authState = useAuthStore.getState();
      const registeredUser = authState.findRegisteredUserByPhone(phone || '');
      const existingUser = authState.user || registeredUser;
      if (existingUser) {
        const isChef = existingUser.role === 'chef' || existingUser.activeRole === 'chef' || !!existingUser.chefProfileId;
        const targetRole = isChef ? 'chef' : (existingUser.activeRole ?? 'consumer');
        authState.setUser({
          ...existingUser,
          role: isChef ? 'chef' : existingUser.role,
          activeRole: targetRole,
        });
        // Already a chef (has a kitchen) — nothing left pending, clear the
        // flag rather than leave it dangling true.
        if (wantsChefSignup && targetRole === 'chef') {
          authState.setPendingChefSignup(false);
        }
        if (existingUser.roles?.includes('consumer') && existingUser.roles?.includes('chef')) {
          setIsVerifying(false);
          setNeedsRoleChoice(true);
        } else {
          completeLogin(targetRole === 'chef' ? 'chef' : 'consumer');
        }
      } else {
        const isChefMock = phone === '9876543210';
        const targetRole: 'chef' | 'consumer' = isChefMock ? 'chef' : 'consumer';

        authState.setUser({
          id: `user_${phone ? phone.replace(/\D/g, '') : Date.now()}`,
          displayName: 'New User',
          phone: phone || '',
          role: targetRole,
          roles: isChefMock ? ['consumer', 'chef'] : ['consumer'],
          activeRole: targetRole,
          chefProfileId: isChefMock ? 'sachin_kitchen' : undefined,
          society: 'Lotus Heights',
        });

        if (wantsChefSignup && targetRole === 'chef') {
          authState.setPendingChefSignup(false);
        }
        setPendingRole(targetRole);
        setNeedsName(true);
        setIsVerifying(false);
      }
      return;
    }

    // ── Real backend OTP verify (MSG91-backed) ──────────────────────────────
    // Previously this called supabase.auth.verifyOtp() but fell through to
    // log the user in regardless of whether that call actually succeeded —
    // anyone who knew a phone number could log in as that user with any
    // 6-digit code. The backend call below throws on a rejected/expired
    // code, and that throw is what now actually stops the login.
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        phone: `+91${phone}`,
        token: code,
      });

      const session = response?.data?.session;
      const backendUser = response?.data?.user;
      if (!session?.access_token || !backendUser) {
        throw new Error(t('auth.verificationFailed', 'Verification failed. Please try again.'));
      }

      useAuthStore.getState().setSession(session.access_token, session.refresh_token);

      const resolvedUser = mapBackendUserToAuthUser(backendUser);
      useAuthStore.getState().setUser(resolvedUser);

      // Already a chef (has a kitchen) — nothing left pending, clear the
      // flag rather than leave it dangling true (it was set by landing.tsx
      // before this screen ever mounted, not here — see the matching
      // comment on pendingChefSignup in useAuthStore.ts).
      if (wantsChefSignup && resolvedUser.activeRole === 'chef') {
        useAuthStore.getState().setPendingChefSignup(false);
      }

      // 'New User' is the placeholder AuthService.syncProfile sets only when
      // it creates a brand-new profile — a returning user's real (or
      // previously-chosen) name will never equal this exactly, so this
      // reliably gates the name prompt to first-time signups only.
      if (resolvedUser.displayName === 'New User') {
        setPendingRole(resolvedUser.activeRole === 'chef' ? 'chef' : 'consumer');
        setNeedsName(true);
        setIsVerifying(false);
        return;
      }

      if (resolvedUser.roles?.includes('consumer') && resolvedUser.roles?.includes('chef')) {
        setIsVerifying(false);
        setNeedsRoleChoice(true);
        return;
      }

      registerForPushNotificationsAsync().catch(() => {});
      completeLogin(resolvedUser.activeRole === 'chef' ? 'chef' : 'consumer');
    } catch (e: any) {
      setError(e?.message || t('auth.verificationFailed', 'Verification failed. Please try again.'));
      setIsVerifying(false);
    }
  }

  async function handleSaveNameAndContinue() {
    const finalName = nameInput.trim() || 'Resident';
    setIsSavingName(true);
    try {
      if (!isMockMode) {
        await apiClient.patch('/auth/profile', { name: finalName });
      }
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.getState().setUser({ ...current, displayName: finalName });
      }
      registerForPushNotificationsAsync().catch(() => {});
    } catch (e: any) {
      console.warn('Profile name save notice:', e);
    } finally {
      setIsSavingName(false);
    }
    completeLogin(pendingRole);
  }

  async function handleChooseRole(role: 'chef' | 'consumer') {
    const current = useAuthStore.getState().user;
    if (current) {
      useAuthStore.getState().setUser({ ...current, activeRole: role });
    }
    if (!isMockMode) {
      apiClient.patch('/auth/profile', { active_role: role }).catch((e) => {
        console.warn('Role choice: failed to persist active_role:', e);
      });
    }
    registerForPushNotificationsAsync().catch(() => {});
    completeLogin(role);
  }

  async function handleResend() {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();

    if (!isMockMode && phone) {
      try {
        await apiClient.post('/auth/send-otp', { phone: `+91${phone}` });
      } catch (e: any) {
        console.warn('Resend OTP notice:', e?.message);
      }
    }

    // Restart countdown
    let c = RESEND_SECONDS;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        setCanResend(true);
        clearInterval(interval);
      }
    }, 1000);
  }

  const displayPhone = phone ? `+91 ${phone}` : 'your number';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable
              style={styles.back}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/landing');
                }
              }}
            >
              <Text style={styles.backText}>← {t('common.back', 'Back')}</Text>
            </Pressable>
            <LanguageTogglePill />
          </View>

          {needsRoleChoice ? (
            <>
              {/* Only shown to accounts with BOTH roles (owns a kitchen and
                  can also browse as a consumer) — a single-role account
                  never sees this and goes straight in. */}
              <View style={styles.header}>
                <Text style={styles.eyebrow}>{t('auth.newUserEyebrow', 'WELCOME')}</Text>
                <Text style={styles.title}>{t('auth.chooseModeTitle', 'How do you want to continue?')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.chooseModeSub', "You can switch anytime from your profile.")}
                </Text>
              </View>

              <Pressable
                style={styles.roleChoiceCard}
                onPress={() => handleChooseRole('consumer')}
              >
                <View style={[styles.roleChoiceIcon, { backgroundColor: Colors.greenBadge }]}>
                  <Ionicons name="bag-handle-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.roleChoiceTitle}>{t('auth.continueAsConsumer', 'Continue as Consumer')}</Text>
                  <Text style={styles.roleChoiceSub}>{t('auth.continueAsConsumerSub', 'Order from home kitchens near you')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
              </Pressable>

              <Pressable
                style={styles.roleChoiceCard}
                onPress={() => handleChooseRole('chef')}
              >
                <View style={[styles.roleChoiceIcon, { backgroundColor: Colors.goldBadge }]}>
                  <Ionicons name="restaurant-outline" size={26} color={Colors.gold} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.roleChoiceTitle}>{t('auth.continueAsChef', 'Continue as Chef')}</Text>
                  <Text style={styles.roleChoiceSub}>{t('auth.continueAsChefSub', 'Manage your kitchen and orders')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
              </Pressable>
            </>
          ) : needsName ? (
            <>
              {/* First-time signup only — a returning user never sees this,
                  since their name is already on file. */}
              <View style={styles.header}>
                <Text style={styles.eyebrow}>{t('auth.newUserEyebrow', 'WELCOME')}</Text>
                <Text style={styles.title}>{t('auth.whatsYourName', "What's your name?")}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.nameSub', "So chefs and the app know what to call you.")}
                </Text>
              </View>

              <TextInput
                style={styles.nameInput}
                placeholder={t('auth.enterName', 'Enter your full name')}
                placeholderTextColor={Colors.muted}
                value={nameInput}
                onChangeText={setNameInput}
                returnKeyType="done"
                autoFocus
                onSubmitEditing={handleSaveNameAndContinue}
                {...({ outlineStyle: 'none' } as any)}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  isSavingName && styles.buttonDisabled,
                  pressed && !isSavingName && styles.buttonPressed,
                ]}
                onPress={handleSaveNameAndContinue}
                disabled={isSavingName}
              >
                <Text style={styles.buttonText}>
                  {isSavingName ? t('auth.saving', 'Saving...') : t('auth.continue', 'Continue')}
                </Text>
              </Pressable>

              {!isSavingName && (
                <Pressable style={styles.resendRow} onPress={handleSaveNameAndContinue}>
                  <Text style={styles.resendActive}>{t('auth.skipForNow', 'Skip for now')}</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.eyebrow}>{t('auth.verification', 'VERIFICATION')}</Text>
                <Text style={styles.title}>{t('auth.verifyTitle', 'Verify your number')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.otpSub', 'Enter the 6-digit OTP sent to')}{' '}
                  <Text style={styles.phoneHighlight}>{displayPhone}</Text>
                </Text>
              </View>

              {/* Demo OTP Notice Banner — mock mode only; a real OTP is required
                  against the live backend, so this must never show there. */}
              {isMockMode && (
                <View style={styles.demoOtpBanner}>
                  <Ionicons name="key-outline" size={16} color={Colors.primary} />
                  <Text style={styles.demoOtpText}>
                    In case you didn't receive the SMS OTP, use code:{' '}
                    <Text style={styles.demoOtpCode}>123456</Text>
                  </Text>
                </View>
              )}

              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { inputRefs.current[i] = ref; }}
                    style={[
                      styles.otpBox,
                      digits[i] ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                    value={digits[i]}
                    onChangeText={(text) => handleDigitChange(text, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    caretHidden
                    textAlign="center"
                    {...({ outlineStyle: 'none' } as any)}
                  />
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {/* Verify button */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  isVerifying && styles.buttonDisabled,
                  pressed && !isVerifying && styles.buttonPressed,
                ]}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                <Text style={styles.buttonText}>
                  {isVerifying ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </Pressable>

              {/* Resend */}
              <View style={styles.resendRow}>
                {canResend ? (
                  <Pressable onPress={handleResend}>
                    <Text style={styles.resendActive}>{t('auth.resendOtp', 'Resend OTP')}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.resendTimer}>
                    Resend OTP in{' '}
                    <Text style={styles.resendCount}>{countdown}s</Text>
                  </Text>
                )}
              </View>

              {isMockMode && (
                <Text style={styles.hint}>
                  For demo purposes, any 6-digit code will work.
                </Text>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  back: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  header: {
    marginTop: 28,
    marginBottom: 32,
  },
  eyebrow: {
    color: '#C89B3C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: Colors.dark,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: Colors.dark,
    fontWeight: '900',
  },
  nameInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 20,
  },
  roleChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  roleChoiceIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChoiceTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  roleChoiceSub: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  otpBox: {
    width: 52,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.dark,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.greenBadge,
  },
  otpBoxError: {
    borderColor: Colors.red,
  },
  error: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: Colors.primaryDeep,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendTimer: {
    color: Colors.muted,
    fontSize: 14,
  },
  resendCount: {
    color: Colors.dark,
    fontWeight: '900',
  },
  resendActive: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  hint: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  demoOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  demoOtpText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '600',
    lineHeight: 18,
  },
  demoOtpCode: {
    fontWeight: '900',
    color: Colors.primary,
    fontSize: 14,
  },
});
