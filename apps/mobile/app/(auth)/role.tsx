import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import type { Role } from '../../types';

type RoleOption = {
  role: Role;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

import { DEFAULT_ROLE_RIGHTS } from '../../constants/users';

const ROLE_OPTIONS: (Omit<RoleOption, 'title' | 'description'> & { titleKey: string; descKey: string; title: string; description: string })[] = [
  {
    role: 'consumer',
    icon: 'bag-handle-outline',
    iconColor: Colors.primary,
    iconBg: Colors.greenBadge,
    titleKey: 'roleScreen.consumerTitle',
    title: 'Order Food (Consumer)',
    descKey: 'roleScreen.consumerDesc',
    description:
      'Discover home kitchens in your society. Order fresh, home-cooked meals made before they are cooked.',
  },
  {
    role: 'chef',
    icon: 'restaurant-outline',
    iconColor: Colors.gold,
    iconBg: Colors.goldBadge,
    titleKey: 'roleScreen.chefTitle',
    title: 'Start a Kitchen (Chef)',
    descKey: 'roleScreen.chefDesc',
    description:
      'Cook and earn from your home. Publish your menu, set your schedule, and grow your home kitchen.',
  },
  // Platform Admin is intentionally NOT offered as a self-service option here.
  // Admin/ops accounts must be provisioned directly in the database (profiles.role)
  // by someone who already has admin access — letting any user tap a card to grant
  // themselves override access to every order and payout on the platform was a
  // critical authorization bug, not a feature. See app/(ops)/_layout.tsx for the
  // matching server-verified role guard on the ops route group.
];

export default function RoleScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useAuthStore();
  const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  function toggleRole(role: Role) {
    if (isLoading) return;
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }

  function getContinueLabel(): string {
    const hasConsumer = selectedRoles.has('consumer');
    const hasChef = selectedRoles.has('chef');
    if (hasConsumer && hasChef) return t('roleScreen.continueArrow', 'Continue →');
    if (hasConsumer) return t('roleScreen.continueAsConsumer', 'Continue as Consumer');
    if (hasChef) return t('roleScreen.continueAsChef', 'Continue as Chef');
    return t('roleScreen.continue', 'Continue');
  }

  async function handleContinue() {
    if (isLoading || selectedRoles.size === 0) return;
    setIsLoading(true);

    // Only 'consumer' and 'chef' are ever selectable here — admin/ops accounts are
    // provisioned directly in the database, never through self-service role choice.
    const rolesArray = (Array.from(selectedRoles) as Role[]).filter((r) => r === 'consumer' || r === 'chef');
    const primaryRole = rolesArray[0] || 'consumer';
    const activeRole = selectedRoles.has('chef') ? 'chef' : 'consumer';
    const existingUser = useAuthStore.getState().user;

    const userObj = {
      ...(existingUser as any),
      id: existingUser?.id ?? `USR-${activeRole.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      phone: phone ?? existingUser?.phone ?? '+919999900000',
      displayName: existingUser?.displayName ?? (activeRole === 'chef' ? 'Chef' : 'Resident'),
      role: primaryRole,
      roles: rolesArray,
      activeRole,
      rights: DEFAULT_ROLE_RIGHTS[activeRole],
    };

    try {
      const { isMockMode } = require('../../lib/mockMode');
      if (!isMockMode && existingUser?.id) {
        const { apiClient } = require('../../lib/apiClient');
        await apiClient.patch('/auth/profile', { role: activeRole, roles: rolesArray, active_role: activeRole });
      }
      setUser(userObj);
    } catch (e) {
      console.warn('Failed to save role selection to backend:', e);
      setUser(userObj);
    } finally {
      setIsLoading(false);
    }

    if (selectedRoles.has('chef')) {
      router.replace('/(auth)/chef-register');
    } else {
      // Collapses landing/phone/otp/role from the stack — see the matching
      // comment in otp.tsx for why replace() alone isn't enough here.
      router.dismissAll();
      router.replace('/(consumer)/discover');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('roleScreen.back', '← Back')}</Text>
          </Pressable>
          <LanguageTogglePill />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('roleScreen.welcome', 'WELCOME')}</Text>
          <Text style={styles.title}>{t('roleScreen.title', 'How will you use Rasohi?')}</Text>
          <Text style={styles.subtitle}>
            {t('roleScreen.subtitle', 'Choose your role to get started. You can select both and switch anytime.')}
          </Text>
        </View>

        {/* Role cards */}
        <View style={styles.cardsContainer}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = selectedRoles.has(option.role);
            return (
              <Pressable
                key={option.role}
                style={({ pressed }) => [
                  styles.roleCard,
                  isSelected && styles.roleCardSelected,
                  pressed && !isLoading && styles.roleCardPressed,
                ]}
                onPress={() => toggleRole(option.role)}
                disabled={isLoading}
              >
                <View style={[styles.iconCircle, { backgroundColor: option.iconBg }]}>
                  <Ionicons name={option.icon} size={30} color={option.iconColor} />
                </View>
                <View style={styles.roleTextBlock}>
                  <Text style={styles.roleTitle}>{t(option.titleKey, option.title)}</Text>
                  <Text style={styles.roleDesc}>{t(option.descKey, option.description)}</Text>
                </View>
                <View style={[
                  styles.checkOuter,
                  isSelected && styles.checkOuterSelected,
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Continue button */}
        <Pressable
          style={[
            styles.continueBtn,
            selectedRoles.size === 0 && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedRoles.size === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueBtnText}>{getContinueLabel()}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  back: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  header: {
    marginTop: 12,
    marginBottom: 28,
  },
  eyebrow: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: Colors.dark,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  cardsContainer: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(23,33,28,0.05)' },
      default: {
        shadowColor: '#17211c',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  roleCardSelected: {
    borderColor: '#123524',
    backgroundColor: '#FAF1DF',
  },
  roleCardPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleTextBlock: {
    flex: 1,
  },
  roleTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  roleDesc: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  checkOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  continueBtn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
