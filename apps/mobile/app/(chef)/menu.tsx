import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { DISHES } from '../../constants/data';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DishVisual } from '../../components/ui/DishVisual';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pill } from '../../components/ui/Pill';
import { getChefDishes, saveChefDishes, deleteChefDish, getDishAddons, createDishAddon, deleteDishAddon, subscribeToLiveDishes, findDishByName, getRandomDishImage } from '../../services';
import { money } from '../../lib/format';
import type { ChefDish, Dish, DishAddon } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
import ChefPlannerScreen from './planner';
import { ChefPartyMenuEditor } from '../../components/ChefPartyMenuEditor';
const CATEGORIES = [
  'North Indian', 'South Indian', 'Biryani', 'Breakfast',
  'Homestyle', 'Bakery', 'Snacks', 'Dessert', 'Drinks', 'Other',
];
const DEFAULT_LEAD_OPTIONS = [30, 60, 90, 120, 180, 240];

function generateId(name: string): string {
  return (
    name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    + '-' + Date.now().toString(36)
  );
}

// ── Image source type ─────────────────────────────────────────────────────────
type ImageSource = 'local' | 'url';

export default function MenuScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const catLabel = (c: string) => t(`chefMenu.cat.${c}`, c);
  const { user } = useAuthStore();

  const [chefDishes, setChefDishes] = useState<Record<string, ChefDish>>({});
  const [customDishes, setCustomDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'planner' | 'party'>('catalog');

  // Chef-authored per-dish add-ons/customizations — keyed by the dish's real
  // (UUID) id, fetched once a dish has one (saveChefDishes assigns it on
  // first sync). Only one dish's "add new add-on" inline form is open at a
  // time, across the whole screen.
  const [dishAddons, setDishAddons] = useState<Record<string, DishAddon[]>>({});
  const [addingAddonFor, setAddingAddonFor] = useState<string | null>(null);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [savingAddon, setSavingAddon] = useState(false);

  // form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('North Indian');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLeadTime, setFormLeadTime] = useState(60);
  const [formImageSource, setFormImageSource] = useState<ImageSource>('local');
  const [formImageUri, setFormImageUri] = useState<string>('');   // local file uri
  const [formImageUrl, setFormImageUrl] = useState<string>('');   // web/bucket url
  const [formError, setFormError] = useState('');
  const [isSavingDish, setIsSavingDish] = useState(false);

  // Dish matching & auto-image selection states
  const [matchedDish, setMatchedDish] = useState<any>(null);
  const [selectedAutoImage, setSelectedAutoImage] = useState<any>(null);
  const [isFallbackImage, setIsFallbackImage] = useState<boolean>(false);
  const [showManualUpload, setShowManualUpload] = useState<boolean>(false);

  useEffect(() => {
    const name = formName.trim();
    if (!name) {
      setMatchedDish(null);
      setSelectedAutoImage(null);
      setIsFallbackImage(false);
      return;
    }

    const match = findDishByName(name);
    // Re-select image only if matched dish ID changes or transitions between match / no-match
    if (match?.id !== matchedDish?.id || (!match && matchedDish !== null)) {
      setMatchedDish(match);
      const result = getRandomDishImage(name);
      setSelectedAutoImage(result.image);
      setIsFallbackImage(result.isFallback);
    }
  }, [formName]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      getChefDishes().then((dishes) => {
        setChefDishes(dishes);
        const fetchedCustoms: Dish[] = Object.values(dishes)
          .filter((cd, idx, arr) => arr.findIndex((x) => x.id === cd.id) === idx)
          .map((cd) => ({
            id: cd.id,
            name: cd.name,
            category: cd.category || 'Homestyle',
            suggestedPrice: cd.price || cd.suggestedPrice || 100,
            leadTimeMinutes: cd.leadTimeMinutes || 60,
            tags: cd.tags || ['custom'],
            foodType: cd.foodType || 'Veg',
            description: cd.description,
            image: cd.image,
          }));
        setCustomDishes(fetchedCustoms);
        setIsLoading(false);
      });
      const unsubscribe = subscribeToLiveDishes(() => {
        if (isSavingRef.current || saveTimer.current) return;
        getChefDishes().then((dishes) => {
          setChefDishes(dishes);
          const fetchedCustoms: Dish[] = Object.values(dishes)
            .filter((cd, idx, arr) => arr.findIndex((x) => x.id === cd.id) === idx)
            .map((cd) => ({
              id: cd.id,
              name: cd.name,
              category: cd.category || 'Homestyle',
              suggestedPrice: cd.price || cd.suggestedPrice || 100,
              leadTimeMinutes: cd.leadTimeMinutes || 60,
              tags: cd.tags || ['custom'],
              foodType: cd.foodType || 'Veg',
              description: cd.description,
              image: cd.image,
            }));
          setCustomDishes(fetchedCustoms);
        });
      });
      return () => {
        unsubscribe();
      };
    }, [])
  );

  // ── Save helpers ────────────────────────────────────────────────────────────
  function getDishSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function getDishConfig(dish: Dish): ChefDish | undefined {
    return chefDishes[dish.id] || chefDishes[getDishSlug(dish.name)];
  }

  function isUuidLike(str: string | undefined): str is string {
    return !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  }

  // Add-ons can only attach to a dish that's actually been saved server-side
  // (a brand-new custom dish's id is a local placeholder until its first
  // save completes) — fetched once per real dish id seen in chefDishes.
  useEffect(() => {
    const realIds = Array.from(new Set(Object.values(chefDishes).map((d) => d.id).filter(isUuidLike)));
    const missingIds = realIds.filter((id) => !(id in dishAddons));
    if (missingIds.length === 0) return;
    Promise.all(
      missingIds.map(async (id): Promise<[string, DishAddon[]]> => {
        try {
          return [id, await getDishAddons(id)];
        } catch {
          return [id, []];
        }
      })
    ).then((results) => {
      setDishAddons((prev) => {
        const next = { ...prev };
        for (const [id, addons] of results) next[id] = addons;
        return next;
      });
    });
  }, [chefDishes]);

  async function handleAddAddon(dishRealId: string) {
    const trimmedName = newAddonName.trim();
    const parsedPrice = parseInt(newAddonPrice.replace(/[^0-9]/g, ''), 10);
    if (!trimmedName) return;
    setSavingAddon(true);
    try {
      const created = await createDishAddon(dishRealId, { name: trimmedName, price: isNaN(parsedPrice) ? 0 : parsedPrice });
      setDishAddons((prev) => ({ ...prev, [dishRealId]: [...(prev[dishRealId] || []), created] }));
      setNewAddonName('');
      setNewAddonPrice('');
      setAddingAddonFor(null);
    } catch (err) {
      console.error('Add add-on failed:', err);
      Alert.alert(t('chefMenu.addonSaveFailedTitle', 'Could not save add-on'), t('chefMenu.addonSaveFailedBody', 'Please try again.'));
    } finally {
      setSavingAddon(false);
    }
  }

  async function handleDeleteAddon(dishRealId: string, addonId: string) {
    const previous = dishAddons[dishRealId] || [];
    setDishAddons((prev) => ({ ...prev, [dishRealId]: previous.filter((a) => a.id !== addonId) }));
    try {
      await deleteDishAddon(dishRealId, addonId);
    } catch (err) {
      console.error('Delete add-on failed:', err);
      setDishAddons((prev) => ({ ...prev, [dishRealId]: previous }));
      Alert.alert(t('chefMenu.addonDeleteFailedTitle', 'Could not delete add-on'), t('chefMenu.addonDeleteFailedBody', 'Please try again.'));
    }
  }

  async function performSave(updated: Record<string, ChefDish>) {
    setSaving(true);
    isSavingRef.current = true;
    try {
      await saveChefDishes(updated);
      const latestDishes = await getChefDishes();
      setChefDishes(latestDishes);
    } catch (err) {
      console.error('Save chef dishes failed:', err);
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1500);
    }
  }

  function scheduleSave(updated: Record<string, ChefDish>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      performSave(updated);
    }, 100);
  }

  function updateDish(dish: Dish, patch: Partial<ChefDish>) {
    // Must update both the id- and slug-keyed entries, same as toggleEnabled
    // below — getChefDishes() returns each dish keyed by both its UUID and a
    // slug of its name, both originally pointing at the same object. Patching
    // only one key let them diverge: a toggle would update, say, chefDishes[id]
    // while chefDishes[slug] kept the pre-toggle value, and whichever one the
    // next render/save read back from would "snap back" to the old state.
    const id = dish.id;
    const slug = getDishSlug(dish.name);
    setChefDishes((prev) => {
      const existing = prev[id] || prev[slug] || { enabled: false, price: 0, leadTimeMinutes: 60, weeklyFree: false, sample: false };
      const updated = { ...prev, [id]: { ...existing, ...patch }, [slug]: { ...existing, ...patch } };
      scheduleSave(updated);
      return updated;
    });
  }

  function toggleEnabled(id: string, dish: Dish) {
    const current = getDishConfig(dish);
    const nextEnabled = !current?.enabled;
    const patch = {
      name: dish.name,
      enabled: nextEnabled,
      price: current?.price || dish.suggestedPrice,
      leadTimeMinutes: current?.leadTimeMinutes || dish.leadTimeMinutes,
    };
    const slug = getDishSlug(dish.name);
    setChefDishes((prev) => {
      const existing = prev[id] || prev[slug] || { enabled: false, price: 0, leadTimeMinutes: 60, weeklyFree: false, sample: false };
      const updated = { ...prev, [id]: { ...existing, ...patch }, [slug]: { ...existing, ...patch } };
      performSave(updated);
      return updated;
    });
  }

  function toggleSample(dish: Dish) {
    const current = getDishConfig(dish);
    if (!current) return;
    updateDish(dish, { sample: !current.sample });
  }

  function toggleWeeklyFree(dish: Dish) {
    const current = getDishConfig(dish);
    if (!current) return;
    updateDish(dish, { weeklyFree: !current.weeklyFree });
  }

  function updatePrice(dish: Dish, text: string) {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    updateDish(dish, { price: isNaN(parsed) ? 0 : parsed });
  }

  function updateDiscountPercent(dish: Dish, text: string) {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    const validDiscount = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    updateDish(dish, { discountPercent: validDiscount });
  }

  // ── Image picker ────────────────────────────────────────────────────────────
  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chefMenu.permissionNeeded', 'Permission needed'), t('chefMenu.allowLibrary', 'Allow access to your photo library to upload a dish photo.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFormImageUri(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chefMenu.permissionNeeded', 'Permission needed'), t('chefMenu.allowCamera', 'Allow camera access to take a dish photo.'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFormImageUri(result.assets[0].uri);
    }
  }

  // ── Modal open/close ────────────────────────────────────────────────────────
  function openAddModal() {
    setFormName(''); setFormCategory('North Indian'); setFormPrice('');
    setFormDescription(''); setFormLeadTime(60); setFormImageSource('local');
    setFormImageUri(''); setFormImageUrl(''); setFormError('');
    setMatchedDish(null); setSelectedAutoImage(null);
    setIsFallbackImage(false); setShowManualUpload(false);
    setShowAddModal(true);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleAddDish() {
    const trimmedName = formName.trim();
    if (!trimmedName) { setFormError(t('chefMenu.nameRequired', 'Dish name is required.')); return; }
    const parsedPrice = parseInt(formPrice.replace(/[^0-9]/g, ''), 10);
    if (!parsedPrice || parsedPrice < 1) { setFormError(t('chefMenu.validPrice', 'Enter a valid price (minimum ₹1).')); return; }

    setIsSavingDish(true);
    setFormError('');

    // formImageUri is a local device file (file://...) from the camera/gallery
    // picker — it isn't reachable from the database or any other device, so
    // it must be uploaded to storage first. This used to be skipped entirely:
    // the local URI (or nothing) was saved straight onto the in-memory dish
    // object, and saveChefDishes() never wrote any image field to the
    // database at all, so a chef's uploaded dish photo was silently dropped
    // every time.
    let savedImage = formImageUrl.trim() || selectedAutoImage;
    if (formImageUri) {
      try {
        savedImage = await uploadDishPhoto(formImageUri);
      } catch (e) {
        console.warn('[menu] Dish photo upload failed, falling back to auto image:', e);
        setFormError(t('chefMenu.photoUploadFailed', "Couldn't upload the photo — saved with a default image instead."));
      }
    }

    const newId = generateId(trimmedName);

    const newDish: Dish = {
      id: newId,
      name: trimmedName,
      category: formCategory,
      suggestedPrice: parsedPrice,
      leadTimeMinutes: formLeadTime,
      tags: ['custom'],
      foodType: 'Veg',
      description: formDescription.trim() || undefined,
      ...(savedImage ? { image: savedImage } : {}),
    };

    setCustomDishes((prev) => [...prev, newDish]);
    setChefDishes((prev) => {
      const newChefDish: ChefDish = {
        ...newDish,
        enabled: true,
        price: parsedPrice,
        leadTimeMinutes: formLeadTime,
        weeklyFree: false,
        sample: false,
      };
      const updated: Record<string, ChefDish> = { ...prev, [newId]: newChefDish, [getDishSlug(trimmedName)]: newChefDish };
      scheduleSave(updated);
      return updated;
    });
    setIsSavingDish(false);
    setShowAddModal(false);
  }

  /** Uploads a locally-picked dish photo to storage and returns its public URL. */
  async function uploadDishPhoto(localUri: string): Promise<string> {
    if (isMockMode) return localUri; // nothing to upload against in mock mode
    const uploaded = await apiClient.uploadFile('chef-photos', `dishes/${user?.id ?? 'unknown'}`, localUri);
    return uploaded.url;
  }

  function handleDeleteDish(dish: Dish) {
    Alert.alert(
      t('chefMenu.deleteDishTitle', 'Delete this dish?'),
      t('chefMenu.deleteDishBody', { defaultValue: '"{{name}}" will be removed from your menu for good.', name: dish.name }),
      [
        { text: t('chefMenu.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('chefMenu.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            // Previously this only removed dish.id from local state — the
            // dish's server row (and its weekly_dishes rows) were never
            // deleted, and the slug-keyed copy of the same dish (see the
            // comment on updateDish above) was left behind too, so the next
            // unrelated save would silently re-PUT and resurrect it, and
            // reopening the app would re-fetch it from the backend as if it
            // was never deleted at all.
            try {
              await deleteChefDish(dish);
            } catch (err) {
              console.error('Delete dish failed:', err);
              Alert.alert(t('chefMenu.deleteFailedTitle', 'Delete failed'), t('chefMenu.deleteFailedBody', 'Could not delete this dish. Please try again.'));
              return;
            }
            const slug = getDishSlug(dish.name);
            setCustomDishes((prev) => prev.filter((d) => d.id !== dish.id));
            setChefDishes((prev) => {
              const updated = { ...prev };
              delete updated[dish.id];
              delete updated[slug];
              return updated;
            });
          },
        },
      ]
    );
  }

  const allDishes: Dish[] = [...DISHES, ...customDishes];
  const liveCount = allDishes.filter((d) => Boolean(getDishConfig(d)?.enabled)).length;

  if (isLoading) return <LoadingSpinner fullscreen label={t('chefMenu.loading', 'Loading menu...')} />;

  // resolved preview URI for the form
  const previewUri = formImageSource === 'local' ? formImageUri : formImageUrl.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header bar with title and language selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.primary }}>
            {t('chefMenu.title', 'Manage Menu')}
          </Text>
          <LanguageTogglePill />
        </View>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'catalog' && styles.activeTabButton]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'catalog' && styles.activeTabButtonText]}>
              {t('nav.menu', 'Menu')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'planner' && styles.activeTabButton]}
            onPress={() => setActiveTab('planner')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'planner' && styles.activeTabButtonText]}>
              {t('chef.weeklyPlanner', 'Weekly Planner')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'party' && styles.activeTabButton]}
            onPress={() => setActiveTab('party')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'party' && styles.activeTabButtonText]}>
              {t('chefMenu.partyMode', 'Party Mode 🎉')}
            </Text>
          </Pressable>
        </View>

        {activeTab === 'planner' ? (
          <ChefPlannerScreen />
        ) : activeTab === 'party' ? (
          <ChefPartyMenuEditor kitchenId={user?.chefProfileId || user?.id || ''} />
        ) : (
          <>
            {/* Publish bar */}
            <Card style={styles.publishBar}>
              <View style={styles.publishBarInner}>
                <View style={styles.flex}>
                  <Text style={styles.publishTitle}>{t('chefMenu.thisWeeksMenu', "This week's menu")}</Text>
                  <Text style={styles.publishSub}>{t('chefMenu.priceGuidance', 'Suggested prices are guidance. Your price is what consumers pay.')}</Text>
                </View>
                <Badge label={t('chefMenu.liveCount', { defaultValue: '{{count}} live', count: liveCount })} tone="green" small />
              </View>
              {saving && <Text style={styles.savingText}>{t('chefMenu.saving', 'Saving…')}</Text>}
            </Card>

          {allDishes.map((dish) => {
            const cd = getDishConfig(dish);
            const isEnabled = Boolean(cd?.enabled);
            const isCustom = dish.tags.includes('custom');
            return (
              <View key={dish.id}>
                <Card featured={isEnabled}>
                  <View style={styles.dishRow}>
                    <DishVisual dish={dish} size="sm" />
                    <View style={styles.dishInfo}>
                      <View style={styles.dishNameRow}>
                        <Text style={styles.dishName}>{dish.name}</Text>
                        {isCustom && <Badge label={t('chefMenu.custom', 'Custom')} tone="gold" small />}
                      </View>
                      <Text style={styles.dishMeta}>{t('chefMenu.dishMeta', { defaultValue: '{{category}} · {{price}} suggested · {{mins}} min', category: catLabel(dish.category), price: money(dish.suggestedPrice), mins: dish.leadTimeMinutes })}</Text>
                    </View>
                    <View style={styles.actionContainer}>
                      <Pressable
                        style={[styles.toggleBtn, isEnabled ? styles.toggleBtnOn : styles.toggleBtnOff]}
                        onPress={() => toggleEnabled(dish.id, dish)}
                      >
                        <Text style={[styles.toggleBtnText, isEnabled ? styles.toggleBtnTextOn : styles.toggleBtnTextOff]}>
                          {isEnabled ? t('chefMenu.live', 'Live') : t('chefMenu.off', 'Off')}
                        </Text>
                      </Pressable>
                      {isCustom && (
                        <Pressable
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteDish(dish)}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.red} />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {isEnabled && cd && (
                    <View style={styles.expandedSection}>
                      <View style={styles.priceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.fieldLabel}>{t('chefMenu.yourPrice', 'Your price (₹)')}</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={cd.price > 0 ? String(cd.price) : ''}
                            onChangeText={(t) => updatePrice(dish, t)}
                            keyboardType="number-pad"
                            returnKeyType="done"
                            placeholder={String(dish.suggestedPrice)}
                            placeholderTextColor={Colors.muted}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fieldLabel}>{t('chefMenu.discount', 'Discount (%)')}</Text>
                          <TextInput
                            style={[styles.priceInput, (cd.discountPercent || 0) > 0 && { borderColor: Colors.primary, backgroundColor: 'rgba(27, 67, 50, 0.05)' }]}
                            value={(cd.discountPercent || 0) > 0 ? String(cd.discountPercent) : ''}
                            onChangeText={(t) => updateDiscountPercent(dish, t)}
                            keyboardType="number-pad"
                            returnKeyType="done"
                            placeholder={t('chefMenu.discountPlaceholder', 'e.g. 15%')}
                            placeholderTextColor={Colors.muted}
                          />
                        </View>
                      </View>
                      <View style={styles.leadRow}>
                        <Text style={styles.leadLabel}>{t('chefMenu.leadTime', 'Lead time')}</Text>
                        <Text style={styles.leadValue}>
                          {cd.leadTimeMinutes < 60 ? t('chefMenu.leadMin', { defaultValue: '{{count}} min', count: cd.leadTimeMinutes }) : t('chefMenu.leadHr', { defaultValue: '{{count}} hr', count: Math.round(cd.leadTimeMinutes / 60) })}
                        </Text>
                      </View>
                      <View style={styles.pillRow}>
                        <Pill label={t('chefMenu.freeSample', '🎁 Free Sample')} active={cd.sample} onPress={() => toggleSample(dish)} />
                        <Pill label={t('chefMenu.freeWeekly', '⭐ Free Weekly Offer')} active={cd.weeklyFree} onPress={() => toggleWeeklyFree(dish)} />
                      </View>

                      {isUuidLike(cd.id) && (
                        <View style={styles.addonsSection}>
                          <Text style={styles.fieldLabel}>{t('chefMenu.addonsTitle', 'Add-ons / Customizations')}</Text>
                          {(dishAddons[cd.id] || []).map((addon) => (
                            <View key={addon.id} style={styles.addonChefRow}>
                              <Text style={styles.addonChefName} numberOfLines={1}>{addon.name}</Text>
                              <Text style={styles.addonChefPrice}>{money(addon.price)}</Text>
                              <Pressable onPress={() => handleDeleteAddon(cd.id, addon.id)} hitSlop={8}>
                                <Ionicons name="close-circle" size={18} color={Colors.red} />
                              </Pressable>
                            </View>
                          ))}
                          {addingAddonFor === cd.id ? (
                            <View style={styles.addAddonForm}>
                              <TextInput
                                style={[styles.priceInput, { flex: 1.6 }]}
                                placeholder={t('chefMenu.addonNamePlaceholder', 'Name (e.g. Extra Papad)')}
                                placeholderTextColor={Colors.muted}
                                value={newAddonName}
                                onChangeText={setNewAddonName}
                                autoFocus
                              />
                              <TextInput
                                style={[styles.priceInput, { flex: 0.7, marginLeft: 8 }]}
                                placeholder="₹"
                                placeholderTextColor={Colors.muted}
                                keyboardType="number-pad"
                                value={newAddonPrice}
                                onChangeText={setNewAddonPrice}
                              />
                              <Pressable
                                style={styles.addAddonConfirmBtn}
                                disabled={savingAddon}
                                onPress={() => handleAddAddon(cd.id)}
                              >
                                <Ionicons name="checkmark" size={18} color="#fff" />
                              </Pressable>
                              <Pressable
                                style={styles.addAddonCancelBtn}
                                onPress={() => { setAddingAddonFor(null); setNewAddonName(''); setNewAddonPrice(''); }}
                              >
                                <Ionicons name="close" size={18} color={Colors.muted} />
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable style={styles.addAddonLink} onPress={() => setAddingAddonFor(cd.id)}>
                              <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                              <Text style={styles.addAddonLinkText}>{t('chefMenu.addAddon', '+ Add add-on')}</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              </View>
            );
          })}

          {/* Add custom dish CTA */}
          <Pressable style={styles.addDishBtn} onPress={openAddModal}>
            <Text style={styles.addDishPlus}>+</Text>
            <Text style={styles.addDishText}>{t('chefMenu.addCustomDish', 'Add a custom dish')}</Text>
          </Pressable>
          <View style={styles.bottomPad} />
        </>
        )}
      </ScrollView>
      </ImageBackground>

      {/* ── Add Custom Dish Modal ─────────────────────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={styles.sheetTitle}>{t('chefMenu.addCustomDish', 'Add a custom dish')}</Text>
              <Text style={styles.sheetSub}>{t('chefMenu.addCustomDishSub', 'Create a dish unique to your kitchen, enabled on your menu immediately.')}</Text>

              {/* Dish name */}
              <Text style={styles.fieldLabel}>{t('chefMenu.nameLabel', 'Dish name *')}</Text>
              <TextInput
                style={[styles.textInput, formError && formName.trim() === '' && styles.inputError]}
                placeholder={t('chefMenu.namePlaceholder', 'e.g. Maa ki Dal, Methi Thepla')}
                placeholderTextColor={Colors.muted}
                value={formName}
                onChangeText={(t) => { setFormName(t); setFormError(''); }}
                autoFocus
              />

              {/* Category */}
              <Text style={styles.fieldLabel}>{t('chefMenu.categoryLabel', 'Category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <Pill key={cat} label={catLabel(cat)} active={formCategory === cat} onPress={() => setFormCategory(cat)} />
                ))}
              </ScrollView>

              {/* Price */}
              <Text style={styles.fieldLabel}>{t('chefMenu.priceLabel', 'Your price (₹) *')}</Text>
              <View style={styles.priceInputRow}>
                <View style={styles.pricePrefix}><Text style={styles.pricePrefixText}>₹</Text></View>
                <TextInput
                  style={[styles.priceFieldInput, formError && (!formPrice || parseInt(formPrice) < 1) && styles.inputError]}
                  placeholder={t('chefMenu.pricePlaceholder', 'e.g. 120')}
                  placeholderTextColor={Colors.muted}
                  value={formPrice}
                  onChangeText={(t) => { setFormPrice(t.replace(/[^0-9]/g, '')); setFormError(''); }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>

              {/* Dish description */}
              <Text style={styles.fieldLabel}>{t('chefMenu.descLabel', 'Dish Description & Ingredients')}</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder={t('chefMenu.descPlaceholder', 'e.g. Fragrant basmati rice cooked on dum with spiced vegetables and saffron. Served with raita. Allergens - Milk, Nuts.')}
                placeholderTextColor={Colors.muted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
              />

              {/* Prep time */}
              <Text style={styles.fieldLabel}>{t('chefMenu.prepTime', 'Preparation time')}</Text>
              <View style={styles.leadTimeOptions}>
                {DEFAULT_LEAD_OPTIONS.map((mins) => (
                  <Pressable
                    key={mins}
                    style={[styles.leadTimeChip, formLeadTime === mins && styles.leadTimeChipActive]}
                    onPress={() => setFormLeadTime(mins)}
                  >
                    <Text style={[styles.leadTimeChipText, formLeadTime === mins && styles.leadTimeChipTextActive]}>
                      {mins < 60 ? t('chefMenu.leadMin', { defaultValue: '{{count}} min', count: mins }) : t('chefMenu.leadHr', { defaultValue: '{{count}} hr', count: mins / 60 })}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── Dish photo (auto-selected / fallback) ─────────────────────────────────────────────── */}
              <View style={styles.autoImageCard}>
                <DishVisual
                  dish={{
                    id: 'preview',
                    name: formName || 'Custom Dish',
                    category: formCategory,
                    foodType: 'Veg',
                    suggestedPrice: 0,
                    leadTimeMinutes: 60,
                    tags: ['custom'],
                    image: formImageUri || formImageUrl || selectedAutoImage,
                  }}
                  size="sm"
                />
                <View style={styles.autoImageTextCol}>
                  <Text style={styles.autoImageTitle}>
                    {matchedDish ? t('chefMenu.autoPhotoSelected', 'Photo Auto-Selected ✨') : isFallbackImage ? t('chefMenu.defaultPhotoApplied', 'Default Photo Applied 🍲') : t('chefMenu.photoSelection', 'Photo Selection')}
                  </Text>
                  <Text style={styles.autoImageSub}>
                    {matchedDish
                      ? t('chefMenu.matchedCatalog', { defaultValue: 'Matched "{{name}}" from dish catalog.', name: matchedDish.name })
                      : formName.trim().length > 0
                      ? t('chefMenu.noCatalogMatch', { defaultValue: 'No exact catalog match for "{{name}}". Default food photo applied.', name: formName.trim() })
                      : t('chefMenu.autoPhotoHint', 'Photo is selected automatically based on dish name.')}
                  </Text>

                  {/* Optional Custom Photo Upload toggle for unknown dishes */}
                  {isFallbackImage && (
                    <Pressable
                      style={{ marginTop: 6 }}
                      onPress={() => setShowManualUpload(!showManualUpload)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>
                        {showManualUpload ? t('chefMenu.hidePhotoUpload', '▲ Hide photo upload') : t('chefMenu.optionalUploadPhoto', '📷 Optional: Upload custom photo')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Optional Manual Photo Upload Section */}
              {isFallbackImage && showManualUpload && (
                <View style={{ marginTop: 10, padding: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 12 }}>
                  <Text style={styles.fieldLabel}>{t('chefMenu.customPhotoOptional', 'Custom Photo (Optional)')}</Text>
                  <View style={styles.sourceToggleRow}>
                    <Pressable
                      style={[styles.sourceToggleBtn, formImageSource === 'local' && styles.sourceToggleBtnActive]}
                      onPress={() => setFormImageSource('local')}
                    >
                      <Ionicons name="image-outline" size={14} color={formImageSource === 'local' ? Colors.primary : Colors.muted} />
                      <Text style={[styles.sourceToggleText, formImageSource === 'local' && styles.sourceToggleTextActive]}>{t('chefMenu.device', 'Device')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.sourceToggleBtn, formImageSource === 'url' && styles.sourceToggleBtnActive]}
                      onPress={() => setFormImageSource('url')}
                    >
                      <Ionicons name="link-outline" size={14} color={formImageSource === 'url' ? Colors.primary : Colors.muted} />
                      <Text style={[styles.sourceToggleText, formImageSource === 'url' && styles.sourceToggleTextActive]}>{t('chefMenu.url', 'URL')}</Text>
                    </Pressable>
                  </View>

                  {formImageSource === 'local' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <Pressable style={styles.uploadBtn} onPress={pickFromGallery}>
                        <Ionicons name="images-outline" size={18} color={Colors.primary} />
                        <Text style={styles.uploadBtnTitle}>{t('chefMenu.gallery', 'Gallery')}</Text>
                      </Pressable>
                      <Pressable style={styles.uploadBtn} onPress={pickFromCamera}>
                        <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                        <Text style={styles.uploadBtnTitle}>{t('chefMenu.camera', 'Camera')}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.textInput, { marginTop: 8 }]}
                      placeholder={t('chefMenu.pasteImageUrl', 'Paste image URL...')}
                      placeholderTextColor={Colors.muted}
                      value={formImageUrl}
                      onChangeText={setFormImageUrl}
                    />
                  )}
                </View>
              )}

              {/* Error */}
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              {/* Actions */}
              <View style={styles.sheetActions}>
                <Button label={t('chefMenu.cancel', 'Cancel')} variant="secondary" flex onPress={() => setShowAddModal(false)} disabled={isSavingDish} />
                <Button
                  label={isSavingDish ? t('chefMenu.saving', 'Saving...') : t('chefMenu.addDish', 'Add dish')}
                  variant="primary"
                  flex
                  onPress={handleAddDish}
                  disabled={isSavingDish}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { padding: 16 },

  publishBar: { marginBottom: 16 },
  publishBarInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  publishTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark, marginBottom: 2 },
  publishSub: { fontSize: 12, color: Colors.muted, lineHeight: 18, flexShrink: 1 },
  savingText: { fontSize: 11, color: Colors.muted, marginTop: 6, fontStyle: 'italic' },

  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dishInfo: { flex: 1 },
  dishNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dishName: { fontSize: 15, fontWeight: '800', color: Colors.dark },
  dishMeta: { fontSize: 12, color: Colors.muted, marginTop: 3, flexShrink: 1 },

  actionContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 48, alignItems: 'center' },
  toggleBtnOn: { backgroundColor: Colors.primary },
  toggleBtnOff: { backgroundColor: Colors.pillInactive },
  toggleBtnText: { fontSize: 12, fontWeight: '900' },
  toggleBtnTextOn: { color: '#fff' },
  toggleBtnTextOff: { color: Colors.muted },

  expandedSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, gap: 10 },
  priceRow: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  priceInput: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: Colors.dark, fontWeight: '700' },
  leadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadLabel: { fontSize: 13, color: Colors.muted },
  leadValue: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  pillRow: { flexDirection: 'row', gap: 8 },
  addonsSection: { marginTop: 4 },
  addonChefRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  addonChefName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.dark },
  addonChefPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  addAddonForm: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addAddonConfirmBtn: { backgroundColor: Colors.primary, borderRadius: 8, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  addAddonCancelBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  addAddonLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  addAddonLinkText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  addDishBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, borderStyle: 'dashed', padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4, backgroundColor: Colors.greenBadge },
  addDishPlus: { fontSize: 22, fontWeight: '900', color: Colors.primary, lineHeight: 24 },
  addDishText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  bottomPad: { height: 24 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23,33,28,0.5)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '94%' },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  sheetSub: { fontSize: 13, color: Colors.muted, lineHeight: 19, marginTop: 4 },

  textInput: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.dark, fontWeight: '600' },
  inputError: { borderColor: Colors.red },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingRight: 8 },

  priceInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.bg, overflow: 'hidden' },
  pricePrefix: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.pillInactive, borderRightWidth: 1.5, borderRightColor: Colors.border },
  pricePrefixText: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  priceFieldInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.dark, fontWeight: '700' },

  leadTimeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  leadTimeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.pillInactive, borderWidth: 1.5, borderColor: 'transparent' },
  leadTimeChipActive: { backgroundColor: Colors.greenBadge, borderColor: Colors.primary },
  leadTimeChipText: { fontSize: 13, fontWeight: '800', color: Colors.textMuted },
  leadTimeChipTextActive: { color: Colors.primary },

  // Image source toggle
  sourceToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sourceToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  sourceToggleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.greenBadge },
  sourceToggleText: { fontSize: 13, fontWeight: '800', color: Colors.muted },
  sourceToggleTextActive: { color: Colors.primary },

  // Upload area
  uploadArea: { marginBottom: 4 },
  uploadBtnRow: { flexDirection: 'row', gap: 10 },
  uploadBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 20, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.bg },
  uploadBtnTitle: { fontSize: 13, fontWeight: '900', color: Colors.dark },
  uploadBtnSub: { fontSize: 11, color: Colors.muted },

  uploadPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  uploadPreview: { width: 90, height: 90, borderRadius: 12 },
  uploadPreviewActions: { gap: 8 },
  uploadChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  uploadChangeBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  // URL preview
  urlPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  urlPreview: { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.pillInactive },
  urlPreviewLabel: { fontSize: 12, color: Colors.muted, fontWeight: '700' },

  // Final combined preview
  finalPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, backgroundColor: Colors.pillInactive, borderRadius: 12 },
  finalPreview: { width: 56, height: 56, borderRadius: 10 },
  finalPreviewMeta: { flex: 1 },
  finalPreviewTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  finalPreviewSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  // Auto image preview card
  autoImageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoImageTextCol: { flex: 1 },
  autoImageTitle: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  autoImageSub: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 16 },

  errorText: { color: Colors.red, fontSize: 13, fontWeight: '700', marginTop: 8 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.pillInactive,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },

  activeTabButton: {
    backgroundColor: Colors.surface,
  },

  tabButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.muted,
  },

  activeTabButtonText: {
    color: Colors.primary,
  },
});
