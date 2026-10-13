import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  BackHandler,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';

import { NotificationBell } from '../../components/NotificationBell';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DishVisual } from '../../components/ui/DishVisual';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { getChefDishes, getChefOrders, getKitchen, updateKitchenProfile, subscribeToLiveDishes, subscribeToChefOrders } from '../../services';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { money, timeAgo } from '../../lib/format';
import type { ChefDish, ChefOrder, Kitchen } from '../../types';

const DEFAULT_COVER_ILLUSTRATION = require('../../assets/bottom_banner_chef.png');

export default function ChefDashboard() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const { user } = useAuthStore();

  const [chefDishes, setChefDishes] = useState<Record<string, ChefDish>>({});
  const [chefOrders, setChefOrders] = useState<ChefOrder[]>([]);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hideIdentity, setHideIdentity] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const kitchenName = kitchen?.name || (user?.displayName ? t('chefDash.kitchenNameDefault', { defaultValue: "{{name}}'s Kitchen", name: user.displayName }) : t('chefDash.myKitchen', 'My Kitchen'));
  const chefName    = kitchen?.chefName || user?.displayName || t('chefDash.chef', 'Chef');
  const society     = kitchen?.society || user?.society || '';
  const address     = kitchen?.address || (user?.society ? `${user?.flat ? user.flat + ', ' : ''}${user.society}` : '');

  // Dashboard is this stack's post-login landing screen — see the matching
  // comment on (consumer)/discover.tsx's identical interceptor for why this
  // exists (hardware back reportedly reaching the public landing/sign-in
  // page after login, despite otp.tsx/chef-register.tsx's dismissAll()+
  // replace() being meant to prevent exactly that).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      async function load() {
        try {
          const [dishes, orders, kData] = await Promise.all([
            getChefDishes(),
            getChefOrders(),
            getKitchen(user?.chefProfileId || user?.id || ''),
          ]);
          if (isActive) {
            setChefDishes(dishes);
            setChefOrders(orders);
            if (kData) {
              setKitchen(kData);
              if (kData.coverImage) setHeroImage(kData.coverImage);
            }
          }
        } finally {
          if (isActive) setIsLoading(false);
        }
      }
      load();

      const unSubLive = subscribeToLiveDishes(() => { if (isActive) load(); });
      const chefId = user?.chefProfileId || user?.id || '';
      const unSubOrders = subscribeToChefOrders(chefId, () => { if (isActive) load(); });

      return () => {
        isActive = false;
        unSubLive();
        unSubOrders();
      };
    }, [user])
  );

  useEffect(() => {
    if (kitchen?.coverImage) {
      setHeroImage(kitchen.coverImage);
    } else if (user?.coverImage) {
      setHeroImage(user.coverImage);
    }
  }, [kitchen?.coverImage, user?.coverImage]);

  // Both toggles below used to be pure local UI state — useState(false) /
  // useState(true) that never read the kitchen's real saved value and never
  // wrote a change back anywhere. A chef toggling "Paused" or "Hide identity"
  // saw the label change and nothing else: it reset on every reopen, and
  // nothing downstream (consumer-facing listings) ever checked it. Initialize
  // from the loaded kitchen once it's available.
  useEffect(() => {
    if (kitchen) {
      setHideIdentity(!!kitchen.anonymous);
      setIsLive(kitchen.isLive !== false);
    }
  }, [kitchen?.anonymous, kitchen?.isLive]);

  async function handleToggleLive() {
    const next = !isLive;
    setIsLive(next); // optimistic
    const chefProfileId = user?.chefProfileId || user?.id || '';
    try {
      const updated = await updateKitchenProfile(chefProfileId, { isLive: next } as any);
      if (updated) setKitchen(updated);
    } catch (e) {
      console.warn('Failed to update live status:', e);
      setIsLive(!next); // revert on failure
      Alert.alert(t('chefDash.error', 'Error'), t('chefDash.liveToggleFailed', 'Could not update your kitchen status. Please try again.'));
    }
  }

  async function handleToggleHideIdentity(next: boolean) {
    setHideIdentity(next); // optimistic
    const chefProfileId = user?.chefProfileId || user?.id || '';
    try {
      const updated = await updateKitchenProfile(chefProfileId, { anonymous: next } as any);
      if (updated) setKitchen(updated);
    } catch (e) {
      console.warn('Failed to update identity visibility:', e);
      setHideIdentity(!next); // revert on failure
      Alert.alert(t('chefDash.error', 'Error'), t('chefDash.identityToggleFailed', 'Could not update this setting. Please try again.'));
    }
  }

  async function pickAndUploadCoverImage(useCamera = false) {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('chefDash.permissionNeeded', 'Permission needed'), t('chefDash.cameraPermission', 'Allow camera access to take a kitchen cover photo.'));
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('chefDash.permissionNeeded', 'Permission needed'), t('chefDash.libraryPermission', 'Allow photo library access to change your kitchen cover photo.'));
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.85 });

      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;

      // 1. Update UI state immediately
      setHeroImage(uri);

      // 2. Persist in Database / Mock storage
      const chefProfileId = user?.chefProfileId || user?.id || 'kavita';

      if (isMockMode) {
        const updated = await updateKitchenProfile(chefProfileId, { coverImage: uri });
        if (updated) setKitchen(updated);
        Alert.alert(t('chefDash.success', 'Success'), t('chefDash.coverUpdated', 'Cover photo updated!'));
        return;
      }

      // Live upload via the backend (Supabase Storage itself still backs this
      // server-side — see apps/backend/src/controllers/media.controller.ts —
      // only the client-side RLS-dependent write is gone).
      const uploaded = await apiClient.uploadFile('chef-photos', `covers/${user?.id ?? 'unknown'}`, uri);

      setHeroImage(uploaded.url);
      const updated = await updateKitchenProfile(chefProfileId, { coverImage: uploaded.url });
      if (updated) setKitchen(updated);
      Alert.alert(t('chefDash.success', 'Success'), t('chefDash.coverUpdatedSuccess', 'Cover photo updated successfully!'));
    } catch (e: any) {
      console.warn('Cover upload error:', e);
      Alert.alert(t('chefDash.error', 'Error'), e?.message || t('chefDash.coverUpdateFailed', 'Failed to update cover photo. Please try again.'));
    }
  }

  function handleChangeHero() {
    if (Platform.OS === 'web') {
      pickAndUploadCoverImage(false);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('chefDash.cancel', 'Cancel'), t('chefDash.chooseFromGallery', 'Choose from gallery'), t('chefDash.takeAPhoto', 'Take a photo'), t('chefDash.removeCoverPhoto', 'Remove cover photo')], cancelButtonIndex: 0, destructiveButtonIndex: 3 },
        (idx) => {
          if (idx === 1) pickAndUploadCoverImage(false);
          else if (idx === 2) pickAndUploadCoverImage(true);
          else if (idx === 3) {
            setHeroImage(null);
            const chefProfileId = user?.chefProfileId || user?.id || '';
            updateKitchenProfile(chefProfileId, { coverImage: '' });
          }
        },
      );
    } else {
      Alert.alert(t('chefDash.changeCoverPhoto', 'Change cover photo'), undefined, [
        { text: t('chefDash.gallery', 'Gallery'), onPress: () => pickAndUploadCoverImage(false) },
        { text: t('chefDash.camera', 'Camera'),  onPress: () => pickAndUploadCoverImage(true) },
        { text: t('chefDash.remove', 'Remove'),  onPress: () => {
            setHeroImage(null);
            const chefProfileId = user?.chefProfileId || user?.id || '';
            updateKitchenProfile(chefProfileId, { coverImage: '' });
          }, style: 'destructive' },
        { text: t('chefDash.cancel', 'Cancel'),  style: 'cancel' },
      ]);
    }
  }

  const uniqueChefDishes = Object.values(
    Object.values(chefDishes).reduce((acc: Record<string, ChefDish>, d) => {
      const key = d.name ? d.name.toLowerCase().trim() : d.id;
      if (!acc[key] || d.enabled) {
        acc[key] = d;
      }
      return acc;
    }, {})
  );

  const liveDishes  = uniqueChefDishes.filter((d) => d.enabled).length;
  const gross       = chefOrders.reduce((sum, o) => sum + o.amount, 0);
  const freeDishes  = uniqueChefDishes.filter((d) => d.weeklyFree).length;
  const samples     = uniqueChefDishes.filter((d) => d.sample).length;
  const openOrders  = chefOrders.filter((o) => o.status !== 'Delivered').length;

  const isOtpVerified = true;
  const isAddressCaptured = !!address;
  const isWeeklyFreeDishSet = freeDishes > 0;
  const isPhotosBrandingSet = !!(
    kitchen?.profileImage ||
    kitchen?.coverImage ||
    (kitchen?.gallery && kitchen.gallery.length > 0) ||
    user?.avatarUrl ||
    user?.coverImage
  );
  const hasBankDetails = !!(
    // Saved via onboarding (kitchenInfo.bankDetails)
    (kitchen as any)?.kitchenInfo?.bankDetails?.account ||
    (kitchen as any)?.kitchenInfo?.bankDetails?.holder ||
    // Saved via settlements modal (kitchenInfo.kitchenDetails.bankDetails)
    (kitchen as any)?.kitchenInfo?.kitchenDetails?.bankDetails?.account ||
    // Top-level bankDetails (some service shapes)
    (kitchen as any)?.bankDetails?.account ||
    (kitchen as any)?.bankDetails?.holder ||
    // DB column bank_details
    (kitchen as any)?.bank_details?.account ||
    (kitchen as any)?.bank_details?.holder ||
    // Status flags
    kitchen?.bankStatus === 'verified' ||
    kitchen?.bankStatus === 'completed' ||
    kitchen?.bankStatus === 'added'
  );
  const isBankVerified = hasBankDetails;
  // There was previously no readiness step (or any other prompt on this
  // screen) pointing a new chef at the Menu tab at all — the only way to
  // discover "add dishes" was to notice the bottom tab bar unprompted.
  const isMenuPublished = liveDishes > 0;

  const isReadinessComplete =
    isOtpVerified &&
    isAddressCaptured &&
    isPhotosBrandingSet &&
    isBankVerified &&
    isMenuPublished;

  if (isLoading) return <LoadingSpinner fullscreen label={t('chefDash.loading', 'Loading kitchen...')} />;

  const renderHeroContent = () => (
    <LinearGradient
      colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
      locations={[0.1, 0.55, 1]}
      style={styles.heroGradient}
    >
      {/* Top row: RasoHi brand logo + Notification + Change Cover + Live toggle pill */}
      <View style={styles.heroTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF9', paddingHorizontal: 8, height: 30, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }}>
          <Image
            source={require('../../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
            style={{ width: 92, height: 26 }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.heroTopRight}>
          <LanguageTogglePill darkBg />
          <NotificationBell route="/(chef)/notifications" inverse />

          <Pressable
            style={[styles.heroLivePill, isLive ? styles.livePillOn : styles.livePillOff]}
            onPress={handleToggleLive}
          >
            <View style={[styles.liveDot, isLive ? styles.liveDotOn : styles.liveDotOff]} />
            <Text style={styles.livePillText}>{isLive ? t('chefDash.acceptingOrders', 'Accepting orders') : t('chefDash.paused', 'Paused')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Kitchen avatar + name — tapping it opens the chef's own Profile tab,
          the conventional "tap your name/avatar" pattern this screen was
          missing entirely (it rendered as a plain, non-interactive View). */}
      <Pressable style={styles.heroBottom} onPress={() => router.push('/(chef)/profile')}>
        <View style={styles.kitchenAvatar}>
          <Text style={styles.kitchenAvatarText}>
            {(kitchenName || 'My Kitchen').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroKitchenName}>{kitchenName}</Text>
          <Text style={styles.heroChefLine}>
            {hideIdentity ? t('chefDash.anonymousMode', 'Anonymous mode') : chefName}
            {' · '}{society}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={{ marginLeft: 'auto', opacity: 0.8 }} />
      </Pressable>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >


          {/* ── Hero banner ──────────────────────────────────────────── */}
          <ImageBackground
            source={require('../../assets/ChatGPT Image Sep 7, 2026, 10_44_26 AM.png')}
            style={styles.heroBg}
            imageStyle={styles.heroBgImage}
            resizeMode="cover"
          >
            {renderHeroContent()}
          </ImageBackground>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <StatTile icon="restaurant-outline"  value={String(liveDishes)} label={t('chefDash.liveDishes', 'Live dishes')} onPress={() => router.push('/(chef)/menu')} />
          <View style={styles.statDivider} />
          <StatTile icon="bag-handle-outline"  value={String(openOrders)} label={t('chefDash.openOrders', 'Open orders')}  accent={openOrders > 0} />
          <View style={styles.statDivider} />
          <StatTile icon="cash-outline"        value={money(gross)}       label={t('chefDash.todaysGross', "Today's gross")} />
        </View>

        {/* ── Padded content below the full-bleed hero ─────────────────── */}
        <View style={[styles.padded, isLargeScreen && { maxWidth: 900, alignSelf: 'center', width: '100%' }]}>

        {/* ── Kitchen readiness (hidden once all 5 steps are complete) ────── */}
        {!isReadinessComplete && (() => {
          // Resolve bank details from whichever path they were saved
          const bankInfo =
            (kitchen as any)?.kitchenInfo?.bankDetails ||
            (kitchen as any)?.kitchenInfo?.kitchenDetails?.bankDetails ||
            (kitchen as any)?.bankDetails ||
            (kitchen as any)?.bank_details ||
            null;
          const bankBody = isBankVerified && bankInfo
            ? t('chefDash.bankAccountMasked', { defaultValue: '{{holder}}A/C ****{{last4}}', holder: bankInfo.holder ? bankInfo.holder + ' · ' : '', last4: String(bankInfo.account || '').slice(-4) })
            : isBankVerified
            ? t('chefDash.bankAddedVerified', 'Bank details added and verified.')
            : t('chefDash.addBankForSettlements', 'Add bank details to receive settlements.');

          return (
          <>
            <ScreenTitle eyebrow={t('chefDash.setup', 'Setup')} title={t('chefDash.kitchenReadiness', 'Kitchen readiness')} />
            <Card style={{ marginBottom: 16 }}>
              <ReadinessItem
                done={isOtpVerified}
                title={t('chefDash.otpVerified', 'OTP verified')}
                body={user?.phone ? t('chefDash.phoneConfirmedWith', { defaultValue: 'Phone number ({{phone}}) confirmed.', phone: user.phone }) : t('chefDash.phoneConfirmed', 'Phone number confirmed.')}
              />
              <ReadinessItem
                done={isAddressCaptured}
                title={t('chefDash.addressCaptured', 'Address captured')}
                body={address || t('chefDash.addressCapturedBody', 'Address captured during registration.')}
                onPress={() => router.push('/(chef)/profile')}
              />
              <ReadinessItem
                done={isPhotosBrandingSet}
                title={t('chefDash.photosBranding', 'Kitchen photos & branding')}
                body={kitchen?.profileImage || kitchen?.coverImage ? t('chefDash.photosUpdated', 'Profile & cover photo updated.') : t('chefDash.addPhotos', 'Add profile picture & kitchen photos.')}
                onPress={() => router.push('/(chef)/profile')}
              />
              <ReadinessItem
                done={isBankVerified}
                title={t('chefDash.bankAccount', 'Bank account')}
                body={bankBody}
                onPress={() => router.push('/(chef)/settlements')}
              />
              <ReadinessItem
                done={isMenuPublished}
                title={t('chefDash.menuPublished', 'Menu published')}
                body={isMenuPublished
                  ? t('chefDash.menuPublishedBody', { defaultValue: '{{count}} dish(es) live on your menu.', count: liveDishes })
                  : t('chefDash.addDishesBody', 'Add dishes so customers can order from you.')}
                onPress={() => router.push('/(chef)/menu')}
                last
              />
            </Card>
            <View style={styles.actionRow}>
              <Button
                flex
                label={t('chefDash.editProfile', 'Edit Profile')}
                variant="secondary"
                onPress={() => router.push("/(chef)/profile")}
              />
              <Button
                flex
                label={t('chefDash.payments', 'Payments')}
                variant="secondary"
                onPress={() => router.push("/(chef)/settlements")}
              />
            </View>
          </>
          );
        })()}
             
       {/* ── Chef profile ────────────────────────────────────────────────── */}
        <Card style={styles.gap}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('chefDash.kitchenProfile', 'Kitchen profile')}</Text>
            <Badge label={hideIdentity ? t('chefDash.anonymous', 'Anonymous') : t('chefDash.public', 'Public')} tone={hideIdentity ? 'gold' : 'blue'} small />
          </View>
          <Text style={styles.profileKitchen}>{kitchenName}</Text>
          <Text style={styles.profileChef}>{hideIdentity ? t('chefDash.identityHidden', 'Identity hidden from consumers') : chefName}</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Ionicons name="eye-off-outline" size={16} color={Colors.muted} />
              <Text style={styles.toggleLabel}>{t('chefDash.hideIdentity', 'Hide identity from consumers')}</Text>
            </View>
            <Switch
              value={hideIdentity}
              onValueChange={handleToggleHideIdentity}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* ── Growth tools ────────────────────────────────────────────────── */}
        <Card style={styles.gap}>
          <Text style={styles.cardTitle}>{t('chefDash.growthThisWeek', 'Growth this week')}</Text>
          <View style={[styles.growthGrid, isLargeScreen && { flexDirection: 'row', flexWrap: 'wrap' }]}>
            <View style={isLargeScreen && { width: '48%' }}>
              <GrowthTile icon="gift-outline"      value={`${freeDishes}`} label={t('chefDash.freeDishes', 'Free dishes')}    tone="green" />
            </View>
            <View style={isLargeScreen && { width: '48%' }}>
              <GrowthTile icon="flask-outline"     value={`${samples}`}    label={t('chefDash.samples', 'Samples')}        tone="gold" />
            </View>
            <View style={isLargeScreen && { width: '48%' }}>
              <GrowthTile icon="pricetag-outline"  value="10%"             label={t('chefDash.sameSocietyDiscount', 'Same-society discount')} tone="blue" />
            </View>
          </View>
        </Card>

        {/* ── Recent orders ────────────────────────────────────────────────── */}
        <ScreenTitle
          eyebrow={t('chefDash.activity', 'Activity')}
          title={t('chefDash.recentOrders', 'Recent orders')}
          action={
            <Pressable onPress={() => router.push('/(chef)/orders')}>
              <Text style={styles.viewAll}>{t('chefDash.viewAll', 'View all →')}</Text>
            </Pressable>
          }
        />
        {(Array.isArray(chefOrders) ? chefOrders : []).slice(0, 3).map((order) => (
          <OrderRow key={order.id} order={order} dishesMap={chefDishes} />
        ))}

        <View style={{ height: 24 }} />
        </View>{/* end padded */}
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({ icon, value, label, accent, onPress }: { icon: string; value: string; label: string; accent?: boolean; onPress?: () => void }) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const content = (
    <>
      <Ionicons name={icon as any} size={18} color={accent ? Colors.gold : Colors.primary} />
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return <Pressable style={styles.statTile} onPress={onPress}>{content}</Pressable>;
  }
  return <View style={styles.statTile}>{content}</View>;
}

function GrowthTile({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: 'green' | 'gold' | 'blue' }) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const bg = tone === 'green' ? Colors.greenBadge : tone === 'gold' ? Colors.goldBadge : Colors.blueBadge;
  const fg = tone === 'green' ? Colors.primary    : tone === 'gold' ? '#7c5400'        : Colors.blue;
  return (
    <View style={[styles.growthTile, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={20} color={fg} />
      <Text style={[styles.growthValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.growthLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

function ReadinessItem({
  done,
  title,
  body,
  onPress,
  last = false,
}: {
  done: boolean;
  title: string;
  body: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Pressable
      style={[styles.readinessRow, !last && styles.readinessBorder]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.readinessDot, done ? styles.dotDone : styles.dotPending]}>
        {done && <Ionicons name="checkmark" size={10} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.readinessTitle, done && styles.readinessTitleDone]}>{title}</Text>
        <Text style={styles.readinessBody}>{body}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} style={{ marginTop: 4 }} />
      )}
    </Pressable>
  );
}

function OrderRow({ order, dishesMap }: { order: ChefOrder; dishesMap: Record<string, ChefDish> }) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const dish = dishesMap[order.dishId];
  const tone = (): 'gold' | 'blue' | 'green' | 'default' => {
    if (order.status === 'Placed')    return 'default';
    if (order.status === 'Accepted')  return 'blue';
    if (order.status === 'Preparing') return 'gold';
    return 'green';
  };
  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderRow}>
        {dish && <DishVisual dish={dish} size="sm" />}
        <View style={styles.orderInfo}>
          <Text style={styles.orderEyebrow}>{order.orderCode || order.id}</Text>
          <Text style={styles.orderDish}>{order.dish}</Text>
          <Text style={styles.orderMeta}>{t('chefDash.flatAndSociety', { defaultValue: 'Flat {{flat}} · {{society}}', flat: order.customer, society: order.society })}</Text>
          <Text style={styles.orderTime}>{timeAgo(new Date(order.createdAt))}</Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>{money(order.amount)}</Text>
          <Badge label={t(`chefDash.ostatus.${order.status}`, order.status)} tone={tone()} small />
        </View>
      </View>
    </Card>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  gap: { marginTop: 4 },
  padded: { paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },

  // Hero
  heroBg: { width: '100%', height: 280 },
  heroBgImage: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  heroGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  heroLivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  livePillOn: { backgroundColor: 'rgba(22, 101, 52, 0.75)', borderColor: '#22c55e' },
  livePillOff: { backgroundColor: 'rgba(127, 29, 29, 0.75)', borderColor: '#ef4444' },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveDotOn:  { backgroundColor: '#4ade80' },
  liveDotOff: { backgroundColor: '#f87171' },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  heroTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  changePhotoBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },

  heroBottom: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kitchenAvatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  kitchenAvatarText: { fontSize: 20, fontWeight: '900', color: Colors.primaryDeep },
  heroTextBlock: { flex: 1 },
  heroKitchenName: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  heroChefLine: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 3 },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 20,
  },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  statValue: { fontSize: 17, fontWeight: '900', color: Colors.dark },
  statValueAccent: { color: Colors.gold },
  statLabel: { fontSize: 11, color: Colors.muted, fontWeight: '700' },

  // Readiness
  readinessRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  readinessBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  readinessDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  dotDone:    { backgroundColor: Colors.primary },
  dotPending: { borderWidth: 2, borderColor: Colors.border },
  readinessTitle:     { fontSize: 14, fontWeight: '800', color: Colors.dark },
  readinessTitleDone: { color: Colors.primary },
  readinessBody: { fontSize: 13, color: Colors.muted, marginTop: 2 },

  // Card sections
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle:     { fontSize: 15, fontWeight: '900', color: Colors.dark },
  profileKitchen: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  profileChef:    { fontSize: 13, color: Colors.muted, marginTop: 2, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  toggleLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: Colors.dark, flex: 1 },

  // Growth
  growthGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  growthTile: { flex: 1, borderRadius: 10, padding: 12, gap: 4, alignItems: 'flex-start' },
  growthValue: { fontSize: 18, fontWeight: '900' },
  growthLabel: { fontSize: 11, fontWeight: '700', lineHeight: 16 },

  // View all
  viewAll: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  // Orders
  orderCard: { marginBottom: 10, paddingHorizontal: 16 },
  orderRow:  { flexDirection: 'row', gap: 12, alignItems: 'center' },
  orderInfo: { flex: 1 },
  orderEyebrow: { fontSize: 11, fontWeight: '900', color: Colors.red, letterSpacing: 0.5, marginBottom: 1 },
  orderDish:    { fontSize: 14, fontWeight: '800', color: Colors.dark },
  orderMeta:    { fontSize: 12, color: Colors.muted, marginTop: 2 },
  orderTime:    { fontSize: 11, color: Colors.muted, marginTop: 1 },
  orderRight:   { alignItems: 'flex-end', gap: 5 },
  orderAmount:  { fontSize: 15, fontWeight: '900', color: Colors.primary },
});
