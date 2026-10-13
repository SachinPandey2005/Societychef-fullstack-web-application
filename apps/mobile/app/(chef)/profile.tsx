import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text, Modal, Platform, Alert, TextInput, KeyboardAvoidingView, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { KITCHENS } from '../../constants/data';
import { getKitchen, getChefDishes, updateKitchenProfile } from '../../services';
import { useReviewStore, reviewsForKitchen, averageRating } from '../../store/useReviewStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import * as ImagePicker from 'expo-image-picker';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
// Components
import { ProfileHero } from '../../components/profile/ProfileHero';
import { ProfilePromptCard } from '../../components/profile/ProfilePromptCard';
import { MediaCarousel } from '../../components/profile/MediaCarousel';
import { HygieneCard } from '../../components/profile/HygieneCard';
import { InfoCard } from '../../components/profile/InfoCard';
import { TrustCard } from '../../components/profile/TrustCard';
import { DishCarousel } from '../../components/profile/DishCarousel';
import type { Kitchen, KitchenMedia, ChefDish } from '../../types';
import { SupportTicketModal } from '../../components/SupportTicketModal';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { LanguageSelectorRow } from '../../components/LanguageSelectorRow';

function ThemePrefRow() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const options = [
    { key: 'default', label: t('profile.themeAuto', 'Auto') },
    { key: 'light', label: t('profile.themeLight', 'Light') },
    { key: 'dark', label: t('profile.themeDark', 'Dark') },
  ] as const;

  return (
    <View style={styles.themeRow}>
      <Text style={styles.prefLabel}>{t('profile.appTheme', 'App Theme')}</Text>
      <View style={styles.themeOptions}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.themePill, mode === opt.key && styles.themePillActive]}
            onPress={() => setMode(opt.key)}
          >
            <Text style={[styles.themePillText, mode === opt.key && styles.themePillTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ChefProfileScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { user, clearUser, switchActiveRole } = useAuthStore();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isKitchenTourExpanded, setIsKitchenTourExpanded] = useState(false);
  const [isHygieneProofExpanded, setIsHygieneProofExpanded] = useState(false);

  // Edit Address state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editSociety, setEditSociety] = useState('');
  const [editFlat, setEditFlat] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Edit Prompt state
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptAnswer, setEditingPromptAnswer] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // Dynamically load the chef's kitchen from Supabase
  const chefProfileId = user?.chefProfileId || '';
  const { data: liveKitchen } = useSupabaseQuery(
    () => getKitchen(chefProfileId),
    [chefProfileId]
  );

  const [kitchenState, setKitchenState] = useState<any>(null);
  const fallbackKitchen: Kitchen = {
    id: user?.chefProfileId || user?.id || 'new_chef',
    name: user?.displayName ? t('chefDash.kitchenNameDefault', { defaultValue: "{{name}}'s Kitchen", name: user.displayName }) : t('chefDash.myKitchen', 'My Kitchen'),
    chefName: user?.displayName || t('chefDash.chef', 'Chef'),
    society: user?.society || t('chefProfile.yourSociety', 'Your Society'),
    tower: user?.tower || '',
    flat: user?.flat || '',
    address: `${user?.flat ? user.flat + ', ' : ''}${user?.society || ''}`,
    distanceKm: 0.5,
    rating: 5.0,
    orders: 0,
    anonymous: false,
    hygieneBadge: true,
    isLive: true,
    coverImage: undefined,
    profileImage: undefined,
    storyPrompts: [],
    gallery: [],
    videos: [],
    hygieneDetails: [],
    hygienePhotos: [],
    hygieneVideos: [],
    trustBadges: [],
    kitchenInfo: {
      cuisine: '',
      experience: '',
      prepTime: '',
      deliveryTime: '',
      operatingHours: '',
      languages: '',
      society: user?.society || '',
    },
    stats: { ordersCompleted: 0, responseTime: '15 mins' },
    dishes: [],
  };
  const kitchen = kitchenState || liveKitchen || fallbackKitchen;

  const { reviews, loadReviewsForKitchen } = useReviewStore();
  const kitchenReviews = reviewsForKitchen(kitchen.id, reviews);

  useEffect(() => {
    if (kitchen.id) loadReviewsForKitchen(kitchen.id);
  }, [kitchen.id]);
  const avgRating = averageRating(kitchenReviews);

  const { data: chefDishes } = useSupabaseQuery(() => getChefDishes(), []);
  // getChefDishes() keys its record by both a dish's id AND its name-slug, so
  // the same dish object appears twice in Object.values() — every count
  // below was silently doubled (2 real dishes showed as "4 live"). Dedup by
  // name, same pattern already used in (chef)/dashboard.tsx and planner.tsx
  // for this exact reason.
  const dishesList = chefDishes
    ? Object.values(
        Object.values(chefDishes).reduce((acc: Record<string, ChefDish>, d) => {
          const key = d.name ? d.name.toLowerCase().trim() : d.id;
          if (!acc[key] || d.enabled) acc[key] = d;
          return acc;
        }, {})
      )
    : [];
  const liveDishesCount = dishesList.filter((d) => d.enabled).length;
  const weeklyFreeCount = dishesList.filter((d) => d.weeklyFree).length;
  const samplesCount = dishesList.filter((d) => d.sample).length;

  async function doSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setShowSignOutDialog(false);

    // 1. Immediately clear user session and navigate away for instant UX
    clearUser();
    router.replace('/landing');

    // 2. Perform backend sign-out asynchronously in background with max 1s timeout
    try {
      const { isMockMode } = require('../../lib/mockMode');
      if (!isMockMode) {
        const performSignOut = async () => {
          const { apiClient } = require('../../lib/apiClient');
          await apiClient.post('/auth/logout', {}).catch(() => {});
        };
        const timeout = new Promise((res) => setTimeout(res, 1000));
        Promise.race([performSignOut(), timeout]).catch(() => {});
      }
    } catch {}
  }

  function switchToConsumer() {
    switchActiveRole('consumer');
    // See the matching comment in (consumer)/profile.tsx#switchToChef — this
    // must be persisted server-side too, or resolveSessionUser reverts back
    // to chef mode (since this account still owns a kitchen) on the very
    // next login.
    if (!isMockMode) {
      apiClient.patch('/auth/profile', { active_role: 'consumer' }).catch((e) => {
        console.warn('switchToConsumer: failed to persist active_role:', e);
      });
    }
    router.dismissAll();
    router.replace('/(consumer)/discover');
  }

  function handleEditPrompt(id: string) {
    const active = kitchenState || kitchen;
    const existing = (active?.storyPrompts || []).find((p: any) => p.id === id);
    setEditingPromptAnswer(existing?.answer || '');
    setEditingPromptId(id);
  }

  async function handleSavePrompt() {
    if (!editingPromptId) return;
    try {
      setIsSavingPrompt(true);
      const active = kitchenState || kitchen;
      const updatedPrompts = (active?.storyPrompts || []).map((p: any) =>
        p.id === editingPromptId ? { ...p, answer: editingPromptAnswer } : p
      );
      const updatedKitchen = await updateKitchenProfile(chefProfileId, { storyPrompts: updatedPrompts });
      setKitchenState(updatedKitchen);
      setEditingPromptId(null);
    } catch (e: any) {
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.promptSaveFailed', 'Failed to save. Please try again.'));
    } finally {
      setIsSavingPrompt(false);
    }
  }

  async function handleToggleHygiene(id: string) {
    // Previously this only updated local kitchenState — it never called
    // updateKitchenProfile (unlike the sibling handleSavePrompt above), and
    // updateKitchenProfile had no hygieneDetails branch at all, so even a
    // correct call here would have silently no-op'd. Consumers read this
    // field as a trust signal on the kitchen detail page, so it needs to
    // actually reach the server.
    const active = kitchenState || kitchen;
    const updatedDetails = active?.hygieneDetails?.map((h: any) =>
      h.id === id ? { ...h, confirmed: !h.confirmed } : h
    );
    if (!updatedDetails) return;
    const previous = active;
    setKitchenState({ ...active, hygieneDetails: updatedDetails });
    try {
      const updatedKitchen = await updateKitchenProfile(chefProfileId, { hygieneDetails: updatedDetails } as any);
      setKitchenState(updatedKitchen);
    } catch (e: any) {
      setKitchenState(previous);
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.hygieneSaveFailed', 'Failed to save. Please try again.'));
    }
  }

  async function handlePickAndUploadImage(type: 'avatar' | 'cover') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chefProfile.permissionNeeded', 'Permission needed'), t('chefProfile.allowLibraryProfile', 'Please allow photo library access to upload a profile photo.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
    });

    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;

    // 1. Instant optimistic UI update for instant feedback
    setKitchenState((prev: any) => {
      const active = prev || kitchen;
      return {
        ...active,
        ...(type === 'avatar' ? { profileImage: uri } : { coverImage: uri }),
      };
    });

    try {
      if (isMockMode) {
        const updatedKitchen = await updateKitchenProfile(chefProfileId, {
          ...(type === 'avatar' ? { profileImage: uri } : { coverImage: uri }),
        });
        setKitchenState(updatedKitchen);
        return;
      }

      const userId = user?.id;
      const uploaded = await apiClient.uploadFile('chef-photos', `${type}s/${userId ?? 'unknown'}`, uri);
      const publicUrl = uploaded.url;

      // Save persistent URL to kitchens table
      const updatedKitchen = await updateKitchenProfile(chefProfileId, {
        ...(type === 'avatar' ? { profileImage: publicUrl } : { coverImage: publicUrl }),
      });

      // Also persist avatar to user profiles table for persistent login state.
      // `profile_image` was never a real column on `profiles` (only
      // `avatar_url` is) — dropped, same fix as the consumer profile screen.
      if (type === 'avatar' && userId) {
        await apiClient.patch('/auth/profile', { avatar_url: publicUrl });
        useAuthStore.getState().setUser({
          ...user!,
          avatarUrl: publicUrl,
        });
      }

      if (updatedKitchen) {
        setKitchenState(updatedKitchen);
      }
    } catch (e: any) {
      console.warn('Image upload notice:', e?.message);
    }
  }

  async function handlePickAndUploadMedia(field: 'gallery' | 'videos' | 'hygienePhotos' | 'hygieneVideos', mediaType: 'Images' | 'Videos') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chefProfile.permissionNeeded', 'Permission needed'), t('chefProfile.allowLibraryMedia', 'Please allow photo library access to upload media.'));
      return;
    }

    const isVideo = mediaType === 'Videos';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      // allowsEditing forces a single-photo crop UI and is mutually exclusive
      // with allowsMultipleSelection on both platforms, so photos skip
      // editing in exchange for being able to pick several at once.
      allowsEditing: isVideo,
      allowsMultipleSelection: !isVideo,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (result.canceled || !result.assets?.length) return;
    const uris = result.assets.map((a) => a.uri);

    const makeMedia = (uri: string) => ({
      id: Math.random().toString(36).slice(2),
      type: isVideo ? 'video' : 'image',
      url: uri,
      caption: '',
      createdAt: new Date().toISOString(),
    });

    try {
      if (isMockMode) {
        const active = kitchenState || kitchen;
        const updatedKitchen = await updateKitchenProfile(chefProfileId, {
          [field]: [...(active[field] || []), ...uris.map(makeMedia)],
        });
        setKitchenState(updatedKitchen);
        Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.mediaUploadedMock', 'Media uploaded (Mock mode).'));
        return;
      }

      const userId = user?.id;
      const newMediaList = [];
      for (const uri of uris) {
        const uploaded = await apiClient.uploadFile('chef-photos', `${field}/${userId ?? 'unknown'}`, uri);
        newMediaList.push({ ...makeMedia(uri), url: uploaded.url });
      }

      const active = kitchenState || kitchen;
      const updatedKitchen = await updateKitchenProfile(chefProfileId, {
        [field]: [...(active[field] || []), ...newMediaList],
      });

      setKitchenState(updatedKitchen);
      Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.mediaUploadedSuccess', 'Media uploaded successfully!'));
    } catch (e: any) {
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.mediaUploadFailed', 'Failed to upload media.'));
    }
  }

  async function handleDeleteMedia(field: 'gallery' | 'videos' | 'hygienePhotos' | 'hygieneVideos', media: KitchenMedia) {
    try {
      if (isMockMode) {
        const active = kitchenState || kitchen;
        const updatedMediaList = (active[field] || []).filter((m: any) => m.id !== media.id);
        const updatedKitchen = await updateKitchenProfile(chefProfileId, {
          [field]: updatedMediaList,
        });
        setKitchenState(updatedKitchen);
        Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.mediaDeletedMock', 'Media deleted (Mock mode).'));
        return;
      }

      // Live mode - delete the physical file via the backend (still Supabase
      // Storage under the hood, but no longer a direct client write).
      try {
        const urlParts = media.url.split('chef-photos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await apiClient.deleteFile('chef-photos', filePath);
        }
      } catch (err) {
        console.log('Failed to remove physical file:', err);
      }

      const active = kitchenState || kitchen;
      const updatedMediaList = (active[field] || []).filter((m: any) => m.id !== media.id);
      const updatedKitchen = await updateKitchenProfile(chefProfileId, {
        [field]: updatedMediaList,
      });

      setKitchenState(updatedKitchen);
      Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.mediaDeletedSuccess', 'Media deleted successfully!'));
    } catch (e: any) {
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.mediaDeleteFailed', 'Failed to delete media.'));
    }
  }

  function openAddressModal() {
    setEditSociety(kitchen.society || user?.society || '');
    setEditFlat(kitchen.flat || user?.flat || '');
    setEditAddress(kitchen.address || (user?.society ? `${user?.flat ? user.flat + ', ' : ''}${user.society}` : ''));
    setIsAddressModalOpen(true);
  }

  async function handleSaveAddress() {
    try {
      setIsSavingAddress(true);
      const fullAddress = editAddress.trim() || (editFlat ? `${editFlat}, ${editSociety}` : editSociety);

      // 1. Update Kitchen profile in database
      const updatedKitchen = await updateKitchenProfile(chefProfileId, {
        address: fullAddress,
        society: editSociety,
      });

      // 2. Update the user's own profile record
      if (user?.id) {
        await apiClient.patch('/auth/profile', {
          society: editSociety,
          flat: editFlat,
        });
      }

      // 3. Update Auth Store State
      const authState = useAuthStore.getState();
      if (authState.user) {
        authState.setUser({
          ...authState.user,
          society: editSociety,
          flat: editFlat,
          address: fullAddress,
        });
      }

      setKitchenState(updatedKitchen);
      setIsAddressModalOpen(false);
      Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.addressUpdatedSuccess', 'Kitchen address updated successfully!'));
    } catch (e: any) {
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.addressUpdateFailed', 'Failed to update address.'));
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleSaveKitchenDetails(newInfo: any) {
    try {
      const updatedKitchen = await updateKitchenProfile(chefProfileId, {
        kitchenInfo: newInfo,
        specialty: newInfo.cuisine,
      });
      setKitchenState(updatedKitchen);
      Alert.alert(t('chefProfile.success', 'Success'), t('chefProfile.kitchenDetailsUpdatedSuccess', 'Kitchen details updated successfully!'));
    } catch (e: any) {
      Alert.alert(t('chefProfile.error', 'Error'), e?.message || t('chefProfile.kitchenDetailsUpdateFailed', 'Failed to update kitchen details.'));
    }
  }

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
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
              marginBottom: 12,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.dark} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('chefProfile.back', 'Back')}</Text>
          </Pressable>

        <ProfileHero
          kitchen={kitchen}
          avgRating={avgRating}
          isEditable
          onEditAvatar={() => handlePickAndUploadImage('avatar')}
          onEditCover={() => handlePickAndUploadImage('cover')}
          onEditAddress={openAddressModal}
          liveDishesCount={liveDishesCount}
          weeklyFreeCount={weeklyFreeCount}
          samplesCount={samplesCount}
        />

        {/* Switch to Consumer mode — switchToConsumer existed but was never
            wired to anything in this screen, so a chef account had no way at
            all to get back to consumer mode from here (the consumer profile
            screen's matching "Switch to Chef mode" banner is the only
            direction that worked). Mirrors that banner exactly. */}
        <Pressable style={styles.modeSwitchBanner} onPress={switchToConsumer}>
          <View style={styles.modeSwitchLeft}>
            <View style={styles.modeSwitchIcon}>
              <Ionicons name="fast-food-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.modeSwitchTitle}>{t('chefProfile.switchToConsumer', 'Switch to Consumer mode')}</Text>
              <Text style={styles.modeSwitchSub}>{t('chefProfile.orderFromOthers', 'Browse and order from other kitchens')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </Pressable>

        {/* ── Pay & Settlements Card ────────────────────────────────────── */}
        <View style={styles.payCardWrapper}>
          <Pressable
            style={styles.payCard}
            onPress={() => router.push('/(chef)/settlements')}
          >
            <View style={styles.payCardLeft}>
              <View style={styles.payCardIcon}>
                <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payCardTitle}>{t('chefProfile.payAndSettlements', 'Pay & Settlements')}</Text>
                <Text style={styles.payCardSub}>{t('chefProfile.paySettlementsSub', 'Track earnings, payouts & bank details')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </Pressable>
        </View>

        {kitchen.storyPrompts?.map((prompt: any) => (
          <ProfilePromptCard
            key={prompt.id}
            prompt={prompt.prompt}
            answer={prompt.answer}
            isEditable
            onEdit={() => handleEditPrompt(prompt.id)}
          />
        ))}

        {/* ── Kitchen Tour Collapsible Section ───────────────────────────── */}
        <View style={styles.payCardWrapper}>
          <Pressable
            style={styles.payCard}
            onPress={() => setIsKitchenTourExpanded(!isKitchenTourExpanded)}
          >
            <View style={styles.payCardLeft}>
              <View style={[styles.payCardIcon, { backgroundColor: Colors.goldBadge }]}>
                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payCardTitle}>{t('chefProfile.kitchenTour', 'Kitchen Tour')}</Text>
                <Text style={styles.payCardSub}>
                  {((kitchen.gallery?.length || 0) + (kitchen.videos?.length || 0)) > 0
                    ? t('chefProfile.itemsManagePhotos', { defaultValue: '{{count}} items · Manage photos & videos', count: (kitchen.gallery?.length || 0) + (kitchen.videos?.length || 0) })
                    : t('chefProfile.addPhotosVideos', 'Add photos & videos of your kitchen')}
                </Text>
              </View>
            </View>
            <Ionicons
              name={isKitchenTourExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {isKitchenTourExpanded && (
            <View style={styles.expandedMediaBox}>
              <Text style={styles.expandedSubText}>
                {t('chefProfile.kitchenTourHint', 'Upload photos and short videos of your clean kitchen to build trust with customers.')}
              </Text>

              {/* Upload Action Buttons */}
              <View style={styles.mediaActionRow}>
                <Pressable
                  style={styles.addPhotoBtn}
                  onPress={() => handlePickAndUploadMedia('gallery', 'Images')}
                >
                  <Ionicons name="image-outline" size={18} color="#ffffff" />
                  <Text style={styles.addPhotoBtnText}>{t('chefProfile.addPhoto', '+ Add Photo')}</Text>
                </Pressable>

                <Pressable
                  style={styles.addVideoBtn}
                  onPress={() => handlePickAndUploadMedia('videos', 'Videos')}
                >
                  <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
                  <Text style={styles.addVideoBtnText}>{t('chefProfile.addVideo', '+ Add Video')}</Text>
                </Pressable>
              </View>

              {/* Photos Carousel */}
              <MediaCarousel
                title={t('chefProfile.kitchenPhotos', 'Kitchen Photos')}
                media={kitchen.gallery || []}
                isEditable
                onAddMedia={() => handlePickAndUploadMedia('gallery', 'Images')}
                onDeleteMedia={(media) => handleDeleteMedia('gallery', media)}
                mediaTypeLabel={t('chefProfile.photo', 'Photo')}
                hideAddCardIfMediaPresent
              />

              {/* Videos Carousel */}
              <MediaCarousel
                title={t('chefProfile.kitchenVideos', 'Kitchen Videos')}
                media={kitchen.videos || []}
                isEditable
                onAddMedia={() => handlePickAndUploadMedia('videos', 'Videos')}
                onDeleteMedia={(media) => handleDeleteMedia('videos', media)}
                mediaTypeLabel={t('chefProfile.video', 'Video')}
                hideAddCardIfMediaPresent
              />
            </View>
          )}
        </View>

        {kitchen.hygieneDetails?.map((detail: any) => (
          <HygieneCard
            key={detail.id}
            title={detail.title}
            description={detail.description}
            confirmed={detail.confirmed}
            icon={detail.icon as any}
            isEditable
            onToggle={() => handleToggleHygiene(detail.id)}
          />
        ))}

        {/* ── Hygiene Proof Collapsible Section ───────────────────────────── */}
        <View style={styles.payCardWrapper}>
          <Pressable
            style={styles.payCard}
            onPress={() => setIsHygieneProofExpanded(!isHygieneProofExpanded)}
          >
            <View style={styles.payCardLeft}>
              <View style={[styles.payCardIcon, { backgroundColor: Colors.greenBadge }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payCardTitle}>{t('chefProfile.hygieneProof', 'Hygiene Proof')}</Text>
                <Text style={styles.payCardSub}>
                  {((kitchen.hygienePhotos?.length || 0) + (kitchen.hygieneVideos?.length || 0)) > 0
                    ? t('chefProfile.itemsManageHygiene', { defaultValue: '{{count}} items · Manage hygiene proofs', count: (kitchen.hygienePhotos?.length || 0) + (kitchen.hygieneVideos?.length || 0) })
                    : t('chefProfile.addHygieneCerts', 'Add hygiene certificates & photos')}
                </Text>
              </View>
            </View>
            <Ionicons
              name={isHygieneProofExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {isHygieneProofExpanded && (
            <View style={styles.expandedMediaBox}>
              <Text style={styles.expandedSubText}>
                {t('chefProfile.hygieneProofHint', 'Upload hygiene proof, certifications, and kitchen sanitization photos to verify your kitchen.')}
              </Text>

              {/* Upload Action Buttons */}
              <View style={styles.mediaActionRow}>
                <Pressable
                  style={styles.addPhotoBtn}
                  onPress={() => handlePickAndUploadMedia('hygienePhotos', 'Images')}
                >
                  <Ionicons name="image-outline" size={18} color="#ffffff" />
                  <Text style={styles.addPhotoBtnText}>{t('chefProfile.addPhoto', '+ Add Photo')}</Text>
                </Pressable>

                <Pressable
                  style={styles.addVideoBtn}
                  onPress={() => handlePickAndUploadMedia('hygieneVideos', 'Videos')}
                >
                  <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
                  <Text style={styles.addVideoBtnText}>{t('chefProfile.addVideo', '+ Add Video')}</Text>
                </Pressable>
              </View>

              {/* Hygiene Photos Carousel */}
              <MediaCarousel
                title={t('chefProfile.hygienePhotosCerts', 'Hygiene Photos & Certificates')}
                media={kitchen.hygienePhotos || []}
                isEditable
                onAddMedia={() => handlePickAndUploadMedia('hygienePhotos', 'Images')}
                onDeleteMedia={(media) => handleDeleteMedia('hygienePhotos', media)}
                mediaTypeLabel={t('chefProfile.photo', 'Photo')}
                hideAddCardIfMediaPresent
              />

              {/* Hygiene Videos Carousel */}
              <MediaCarousel
                title={t('chefProfile.hygieneVideos', 'Hygiene Videos')}
                media={kitchen.hygieneVideos || []}
                isEditable
                onAddMedia={() => handlePickAndUploadMedia('hygieneVideos', 'Videos')}
                onDeleteMedia={(media) => handleDeleteMedia('hygieneVideos', media)}
                mediaTypeLabel={t('chefProfile.video', 'Video')}
                hideAddCardIfMediaPresent
              />
            </View>
          )}
        </View>

        {kitchen.kitchenInfo && (
          <InfoCard
            info={kitchen.kitchenInfo}
            isEditable
            onSaveDetails={handleSaveKitchenDetails}
          />
        )}

        {kitchen.trustBadges && <TrustCard badges={kitchen.trustBadges} />}

        <DishCarousel
          kitchenDishes={kitchen.dishes}
          dishesMap={chefDishes || {}}
        />

        {/* App Theme Preferences */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="color-palette-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>{t('chefProfile.appAppearance', 'App Appearance')}</Text>
          </View>
          <LanguageSelectorRow />
          <View style={styles.prefDivider} />
          <ThemePrefRow />
        </View>

        {/* Account Settings */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>{t('chefProfile.account', 'Account')}</Text>
          </View>
          <AccountRow label={t('profile.helpSupport', 'Help & support')} onPress={() => setShowSupportModal(true)} />
          <View style={styles.prefDivider} />
          <AccountRow label={t('profile.privacyPolicy', 'Privacy policy')} onPress={() => setShowPrivacyModal(true)} />
          <View style={styles.prefDivider} />
          <Pressable style={styles.accountRow} onPress={() => setShowSignOutDialog(true)}>
            <View style={styles.signOutRowLeft}>
              <View style={styles.signOutIconWrap}>
                <Ionicons name="log-out-outline" size={18} color={Colors.red} />
              </View>
              <View style={styles.cardRowCopy}>
                <Text style={styles.signOutText}>{t('chefProfile.signOut', 'Sign Out')}</Text>
                <Text style={styles.signOutSubtext}>{t('chefProfile.signOutSub', 'Log out from your account')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={Colors.red} />
          </Pressable>
          <View style={styles.prefDivider} />
          <Pressable
            style={styles.accountRow}
            onPress={() => {
              Alert.alert(
                t('chefProfile.deleteKitchenTitle', 'Delete Kitchen Account'),
                t('chefProfile.deleteKitchenBody', 'Are you sure you want to permanently delete your kitchen account? All your published dishes, active menus, kitchen details, and profile data will be permanently erased.'),
                [
                  { text: t('chefProfile.cancel', 'Cancel'), style: 'cancel' },
                  {
                    text: t('chefProfile.deletePermanently', 'Delete Permanently'),
                    style: 'destructive',
                    onPress: async () => {
                      await useAuthStore.getState().deleteAccount();
                      router.replace('/landing');
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.signOutRowLeft}>
              <View style={[styles.signOutIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="trash-outline" size={18} color={Colors.red} />
              </View>
              <View style={styles.cardRowCopy}>
                <Text style={[styles.signOutText, { color: Colors.red }]}>{t('chefProfile.deleteAccount', 'Delete Account')}</Text>
                <Text style={styles.signOutSubtext}>{t('chefProfile.deleteAccountSub', 'Permanently delete kitchen profile & dishes')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={Colors.red} />
          </Pressable>
        </View>

        <Text style={styles.versionText}>{t('profile.version', 'RasoHi v1.0.0')}</Text>
      </ScrollView>
      </ImageBackground>

      {/* ── Sign-out confirmation modal ───────────────────────────────── */}
      <Modal
        visible={showSignOutDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutDialog(false)}
      >
        <Pressable
          style={styles.dialogOverlay}
          onPress={() => setShowSignOutDialog(false)}
        >
          <Pressable style={styles.dialogBox} onPress={() => {/* prevent dismiss */ }}>
            <View style={styles.dialogIconRow}>
              <View style={styles.dialogIconCircle}>
                <Ionicons name="log-out-outline" size={24} color={Colors.red} />
              </View>
            </View>
            <Text style={styles.dialogTitle}>{t('chefProfile.signOut', 'Sign Out')}</Text>
            <Text style={styles.dialogMessage}>{t('chefProfile.signOutConfirm', 'Are you sure you want to sign out?')}</Text>
            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogCancelBtn}
                onPress={() => setShowSignOutDialog(false)}
              >
                <Text style={styles.dialogCancelText}>{t('chefProfile.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable style={styles.dialogConfirmBtn} onPress={doSignOut} disabled={isSigningOut}>
                <Text style={styles.dialogConfirmText}>{t('chefProfile.signOut', 'Sign Out')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Edit Address Modal ────────────────────────────────────────── */}
      <Modal
        visible={isAddressModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.dialogOverlay}
        >
          <View style={styles.addressModalContent}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>{t('chefProfile.editKitchenAddress', 'Edit Kitchen Address')}</Text>
              <Pressable onPress={() => setIsAddressModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.dark} />
              </Pressable>
            </View>

            <View style={styles.addressFormGroup}>
              <Text style={styles.addressInputLabel}>{t('chefProfile.fullAddressLabel', 'Full Address / Landmark')}</Text>
              <TextInput
                style={styles.addressInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder={t('chefProfile.fullAddressPlaceholder', 'e.g. hno-174 hapur')}
                placeholderTextColor={Colors.muted}
              />
            </View>

            <View style={styles.addressFormGroup}>
              <Text style={styles.addressInputLabel}>{t('chefProfile.societyLabel', 'Society / Colony Name')}</Text>
              <TextInput
                style={styles.addressInput}
                value={editSociety}
                onChangeText={setEditSociety}
                placeholder={t('chefProfile.societyPlaceholder', 'e.g. Hapur / Lotus Heights')}
                placeholderTextColor={Colors.muted}
              />
            </View>

            <View style={styles.addressFormGroup}>
              <Text style={styles.addressInputLabel}>{t('chefProfile.flatLabel', 'House / Flat / Tower No.')}</Text>
              <TextInput
                style={styles.addressInput}
                value={editFlat}
                onChangeText={setEditFlat}
                placeholder={t('chefProfile.flatPlaceholder', 'e.g. House No. 174 / B-1204')}
                placeholderTextColor={Colors.muted}
              />
            </View>

            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogCancelBtn}
                onPress={() => setIsAddressModalOpen(false)}
              >
                <Text style={styles.dialogCancelText}>{t('chefProfile.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.saveAddressConfirmBtn}
                onPress={handleSaveAddress}
                disabled={isSavingAddress}
              >
                {isSavingAddress ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dialogConfirmText}>{t('chefProfile.saveAddress', 'Save Address')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Prompt Modal ─────────────────────────────────────────── */}
      <Modal
        visible={!!editingPromptId}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingPromptId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.dialogOverlay}
        >
          <View style={styles.addressModalContent}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>
                {(kitchenState || kitchen)?.storyPrompts?.find((p: any) => p.id === editingPromptId)?.prompt || t('chefProfile.editPrompt', 'Edit Prompt')}
              </Text>
              <Pressable onPress={() => setEditingPromptId(null)}>
                <Ionicons name="close" size={24} color={Colors.dark} />
              </Pressable>
            </View>

            <View style={styles.addressFormGroup}>
              <TextInput
                style={[styles.addressInput, { minHeight: 100, textAlignVertical: 'top' }]}
                value={editingPromptAnswer}
                onChangeText={setEditingPromptAnswer}
                placeholder={t('chefProfile.promptAnswerPlaceholder', 'Your answer...')}
                placeholderTextColor={Colors.muted}
                multiline
              />
            </View>

            <View style={styles.dialogBtns}>
              <Pressable
                style={styles.dialogCancelBtn}
                onPress={() => setEditingPromptId(null)}
              >
                <Text style={styles.dialogCancelText}>{t('chefProfile.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.saveAddressConfirmBtn}
                onPress={handleSavePrompt}
                disabled={isSavingPrompt}
              >
                {isSavingPrompt ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dialogConfirmText}>{t('chefProfile.save', 'Save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SupportTicketModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AccountRow({ label, onPress }: { label: string; onPress?: () => void }) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Pressable style={styles.accountRow} onPress={onPress}>
      <Text style={styles.accountRowText}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={16} color={Colors.muted} />
    </Pressable>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  segmentedControl: { flexDirection: 'row', backgroundColor: Colors.pillInactive, borderRadius: 8, padding: 4, marginTop: 10 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: Colors.surface },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  segmentTextActive: { color: Colors.textPrimary },
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  modeSwitchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modeSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeSwitchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSwitchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  modeSwitchSub: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },

  // Account Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '900',
  },
  cardRowCopy: {
    flex: 1,
  },
  prefDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  accountRowText: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '700',
  },

  // Sign-out list item
  signOutRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  signOutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fdecea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: Colors.red,
    fontSize: 14,
    fontWeight: '900',
  },
  signOutSubtext: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 1,
  },

  // Sign-out confirmation dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
      },
    }),
  },
  dialogIconRow: {
    marginBottom: 14,
  },
  dialogIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fdecea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 6,
  },
  dialogMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.red,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  addressModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 480,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
  },
  addressFormGroup: {
    gap: 6,
  },
  addressInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
  addressInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark,
    fontWeight: '600',
  },
  saveAddressConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.pillInactive,
  },
  themePillActive: {
    backgroundColor: Colors.primary,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  themePillTextActive: {
    color: '#FFF',
  },
  versionText: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  tourSectionWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  payCardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  payCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  payCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.goldBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  payCardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    marginTop: 2,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceAlt,
  },
  tourHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tourTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.dark,
  },
  mediaCountBadge: {
    backgroundColor: Colors.pillInactive,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mediaCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
  },
  tourHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tourActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  expandedMediaBox: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandedSubText: {
    fontSize: 13,
    color: Colors.muted,
    paddingHorizontal: 16,
    marginBottom: 14,
    lineHeight: 18,
  },
  mediaActionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addPhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addPhotoBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  addVideoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addVideoBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  collapsedMediaBox: {
    paddingVertical: 8,
  },
  cleanTourPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cleanTourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cleanTourText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
});
