import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useRewardsStore, pointsValue } from '../../store/useRewardsStore';
import { SupportTicketModal } from '../../components/SupportTicketModal';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { LanguageSelectorRow } from '../../components/LanguageSelectorRow';
import { LocationPicker, LatLng } from '../../components/LocationPicker';
import { getOrders } from '../../services';
import { apiClient } from '../../lib/apiClient';
import { isMockMode } from '../../lib/mockMode';


function getInitials(name?: string): string {
  if (!name) return 'YO';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, clearUser, switchActiveRole, updateUser } = useAuthStore();
  const { points } = useRewardsStore();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [sameSocietyOnly, setSameSocietyOnly]   = useState(true);
  const [notifyFreeDishes, setNotifyFreeDishes] = useState(true);
  const [confirmSignOut, setConfirmSignOut]     = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [avatarUri, setAvatarUri]               = useState<string | null>(user?.avatarUrl || user?.profileImage || null);
  const [heroUri, setHeroUri]                   = useState<string | null>(user?.coverImage || null);
  const [avatarError, setAvatarError]           = useState(false);

  const [userOrders, setUserOrders]             = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading]       = useState(false);

  // Address editing state
  const defaultSociety = (user?.society && user.society !== 'Lotus Heights') ? user.society : '';
  const [addresses, setAddresses] = useState<any[]>(() => {
    const soc = (user?.society && user.society !== 'Lotus Heights') ? user.society : '';
    const flt = (user?.flat && user.flat !== 'Lotus Heights') ? user.flat : '';
    const twr = (user?.tower && user.tower !== 'Lotus Heights') ? user.tower : '';
    if (soc || flt || twr) {
      return [{
        id: '1',
        society: soc,
        tower: twr,
        flat: flt,
        isPrimary: true
      }];
    }
    return [];
  });

  useEffect(() => {
    async function syncProfileFromDb() {
      if (!user?.id) return;
      const { isMockMode } = require('../../lib/mockMode');
      if (isMockMode) return;

      try {
        const { apiClient } = require('../../lib/apiClient');
        const response = await apiClient.get('/auth/profile');
        const p = response?.data;

        if (p) {
          const dbName = p.name || p.display_name;
          const cleanSociety = (p.society && p.society !== 'Lotus Heights') ? p.society : '';
          const cleanFlat = (p.flat && p.flat !== 'Lotus Heights') ? p.flat : '';
          const cleanTower = (p.tower && p.tower !== 'Lotus Heights') ? p.tower : '';

          updateUser({
            displayName: dbName && dbName !== 'Resident' ? dbName : user.displayName,
            society: cleanSociety,
            flat: cleanFlat,
            tower: cleanTower,
            avatarUrl: p.avatar_url || p.profile_image || user.avatarUrl,
            coverImage: p.cover_image || user.coverImage,
          });
          if (p.avatar_url || p.profile_image) setAvatarUri(p.avatar_url || p.profile_image);
          if (p.cover_image) setHeroUri(p.cover_image);

          if (cleanSociety || cleanFlat || cleanTower) {
            setAddresses([
              {
                id: '1',
                society: cleanSociety,
                tower: cleanTower,
                flat: cleanFlat,
                isPrimary: true,
              }
            ]);
          } else {
            setAddresses([]);
          }
        }
      } catch (e) {
        console.warn('Profile sync notice:', e);
      }
    }
    syncProfileFromDb();
  }, [user?.id]);

  // Load user's real orders to compute total, completed, active counts
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (user?.id) {
        setOrdersLoading(true);
        getOrders(user.id)
          .then((data) => {
            if (isMounted) setUserOrders(data || []);
          })
          .catch(() => {
            if (isMounted) setUserOrders([]);
          })
          .finally(() => {
            if (isMounted) setOrdersLoading(false);
          });
      }
      return () => {
        isMounted = false;
      };
    }, [user?.id])
  );

  const totalOrdersCount = userOrders.length;
  const completedOrdersCount = userOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const activeOrdersCount = userOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled').length;

  // Name editing
  const [isEditingName, setIsEditingName]       = useState(false);
  const [nameInput, setNameInput]               = useState('');

  function handleStartEditName() {
    setNameInput(user?.displayName && user.displayName !== 'You' ? user.displayName : '');
    setIsEditingName(true);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      updateUser({ displayName: trimmed });
      const { isMockMode } = require('../../lib/mockMode');
      if (!isMockMode && user?.id) {
        try {
          const { apiClient } = require('../../lib/apiClient');
          await apiClient.patch('/auth/profile', { name: trimmed });
        } catch (e) {
          console.warn('DB profile update notice:', e);
        }
      }
    }
    setIsEditingName(false);
  }

  const [editingId, setEditingId] = useState<string | null>(null);

  // Reported directly: "Add delivery Address button does not do anything."
  // It did set state correctly (editingId -> 'new'), but the resulting form
  // lives inside the Delivery Addresses card further down the page — out of
  // view, with nothing scrolling it into sight, so the tap looked like a
  // no-op. Scrolling there when the top-of-page shortcut is used fixes that
  // without duplicating the actual form.
  const scrollRef = useRef<ScrollView>(null);
  const addressSectionY = useRef(0);

  function openAddDeliveryAddress() {
    openAddressForm('new');
    scrollRef.current?.scrollTo({ y: Math.max(0, addressSectionY.current - 16), animated: true });
  }

  // Temporary state for the form
  const [addrSociety, setAddrSociety] = useState(defaultSociety);
  const [addrTower, setAddrTower]     = useState('');
  const [addrFlat, setAddrFlat]       = useState('');
  const [addrLocation, setAddrLocation] = useState<LatLng | undefined>(undefined);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  function openAddressForm(id: string | null) {
    if (id === 'new') {
      setAddrSociety(user?.society || defaultSociety);
      setAddrTower(user?.tower || '');
      setAddrFlat(user?.flat || '');
      setAddrLocation(undefined);
    } else if (id) {
      const addr = addresses.find(a => a.id === id);
      if (addr) {
        setAddrSociety(addr.society);
        setAddrTower(addr.tower);
        setAddrFlat(addr.flat);
        setAddrLocation(addr.latitude && addr.longitude ? { latitude: addr.latitude, longitude: addr.longitude } : undefined);
      }
    }
    setEditingId(id);
  }

  async function saveAddress() {
    let updatedAddrs: any[] = [];
    if (editingId === 'new') {
      const newId = Date.now().toString();
      const isFirst = addresses.length === 0;
      updatedAddrs = [...addresses, { id: newId, society: addrSociety, tower: addrTower, flat: addrFlat, ...addrLocation, isPrimary: isFirst }];
    } else if (editingId) {
      updatedAddrs = addresses.map(a => a.id === editingId ? { ...a, society: addrSociety, tower: addrTower, flat: addrFlat, ...addrLocation } : a);
    }
    setAddresses(updatedAddrs);
    const fullAddress = [addrSociety, addrTower, addrFlat].filter(Boolean).join(', ');
    updateUser({ society: addrSociety, tower: addrTower, flat: addrFlat, address: fullAddress });
    setEditingId(null);

    const { isMockMode } = require('../../lib/mockMode');
    if (!isMockMode && user?.id) {
      try {
        const { apiClient } = require('../../lib/apiClient');
        // `tower`/`address` have no backing columns on `profiles` (only
        // society/flat/latitude/longitude do) — they stay local-only, same
        // as before this was ever persisted anywhere.
        await apiClient.patch('/auth/profile', {
          society: addrSociety,
          flat: addrFlat,
          latitude: addrLocation?.latitude ?? null,
          longitude: addrLocation?.longitude ?? null,
        });
      } catch (e) {
        console.warn('DB address save notice:', e);
      }
    }
  }

  function makePrimary(id: string) {
    setAddresses(addresses.map(a => ({ ...a, isPrimary: a.id === id })));
  }

  const displayName = user?.displayName ?? 'You';
  const phone       = user?.phone ? `+91 ${user.phone}` : '+91 98765 43210';
  const society     = (user?.society && user.society !== 'Lotus Heights') ? user.society : '';
  const initials    = getInitials(displayName);

  async function doSignOut() {
    setConfirmSignOut(false);

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

  function switchToChef() {
    switchActiveRole('chef');
    // Previously this only updated local Zustand state — nothing told the
    // backend, so AuthService.resolveSessionUser (which now respects
    // profiles.active_role instead of always forcing 'chef' whenever a
    // kitchen exists) would revert back to whatever was last persisted on
    // the very next login or session check. Fire-and-forget: the local
    // switch has already happened for this session regardless of the
    // network result.
    if (!isMockMode) {
      apiClient.patch('/auth/profile', { active_role: 'chef' }).catch((e) => {
        console.warn('switchToChef: failed to persist active_role:', e);
      });
    }
    // Without dismissAll(), replace() only swaps this screen — the consumer
    // tab stack stays buried underneath, so back from the chef dashboard
    // would resurface it instead of exiting cleanly.
    router.dismissAll();
    router.replace('/(chef)/dashboard');
  }

  // ── Image pickers ─────────────────────────────────────────────────────────
  async function pickImage(
    aspect: [number, number],
    onPick: (uri: string) => void,
  ) {
    async function fromGallery() {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted' && Platform.OS !== 'web') {
          Alert.alert(t('profile.permissionNeeded', 'Permission needed'), t('profile.allowLibrary', 'Allow photo library access.'));
          return;
        }
        const r = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect,
          quality: 0.85,
        });
        if (!r.canceled && r.assets[0]?.uri) {
          onPick(r.assets[0].uri);
        }
      } catch (e) {
        console.warn('Gallery pick error:', e);
      }
    }

    async function fromCamera() {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted' && Platform.OS !== 'web') {
          Alert.alert(t('profile.permissionNeeded', 'Permission needed'), t('profile.allowCamera', 'Allow camera access.'));
          return;
        }
        const r = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect,
          quality: 0.85,
        });
        if (!r.canceled && r.assets[0]?.uri) {
          onPick(r.assets[0].uri);
        }
      } catch (e) {
        console.warn('Camera pick error:', e);
      }
    }

    if (Platform.OS === 'web') {
      fromGallery();
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('profile.cancel', 'Cancel'), t('profile.gallery', 'Gallery'), t('profile.camera', 'Camera')], cancelButtonIndex: 0 },
        (i) => { if (i === 1) fromGallery(); else if (i === 2) fromCamera(); },
      );
    } else {
      Alert.alert(t('profile.changePhoto', 'Change photo'), undefined, [
        { text: t('profile.gallery', 'Gallery'), onPress: fromGallery },
        { text: t('profile.camera', 'Camera'),  onPress: fromCamera },
        { text: t('profile.cancel', 'Cancel'),  style: 'cancel' },
      ]);
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
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
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
              marginHorizontal: 16,
              marginTop: 10,
              marginBottom: 6,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.dark} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('profile.back', 'Back')}</Text>
          </Pressable>
        {/* ── Hero image / Blank Cover ───────────────────────────────────── */}
        {heroUri ? (
          <ImageBackground
            source={{ uri: heroUri }}
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(15,30,20,0.45)', 'rgba(15,30,20,0.88)']}
              locations={[0.2, 0.6, 1]}
              style={styles.heroGradient}
            >
              {/* Change cover button */}
              <Pressable
                style={styles.changeCoverBtn}
                onPress={() =>
                  pickImage([16, 9], async (uri) => {
                    setHeroUri(uri);
                    updateUser({ coverImage: uri });
                    const { isMockMode } = require('../../lib/mockMode');
                    if (!isMockMode && user?.id) {
                      try {
                        const { apiClient } = require('../../lib/apiClient');
                        const uploaded = await apiClient.uploadFile('chef-photos', `consumer-covers/${user.id}`, uri);
                        setHeroUri(uploaded.url);
                        updateUser({ coverImage: uploaded.url });
                        await apiClient.patch('/auth/profile', { cover_image: uploaded.url });
                      } catch (e) {
                        console.warn('Cover upload notice:', e);
                      }
                    }
                  })
                }
              >
                <Ionicons name="camera-outline" size={14} color="#fff" />
                <Text style={styles.changeCoverText}>{t('profile.changeCover', 'Change cover')}</Text>
              </Pressable>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={styles.heroBlank}>
            <LinearGradient
              colors={['#F4ECE1', '#E8DACB']}
              style={styles.heroBlankGradient}
            >
              <Pressable
                style={styles.changeCoverBtnBlank}
                onPress={() =>
                  pickImage([16, 9], async (uri) => {
                    setHeroUri(uri);
                    updateUser({ coverImage: uri });
                    const { isMockMode } = require('../../lib/mockMode');
                    if (!isMockMode && user?.id) {
                      try {
                        const { apiClient } = require('../../lib/apiClient');
                        const uploaded = await apiClient.uploadFile('chef-photos', `consumer-covers/${user.id}`, uri);
                        setHeroUri(uploaded.url);
                        updateUser({ coverImage: uploaded.url });
                        await apiClient.patch('/auth/profile', { cover_image: uploaded.url });
                      } catch (e) {
                        console.warn('Cover upload notice:', e);
                      }
                    }
                  })
                }
              >
                <Ionicons name="camera-outline" size={14} color={Colors.primary} />
                <Text style={styles.changeCoverTextBlank}>{t('profile.addCoverPhoto', 'Add cover photo')}</Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* ── Avatar overlapping hero bottom ─────────────────────────────── */}
        <View style={styles.avatarSection}>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => {
              setAvatarError(false);
              pickImage([1, 1], async (uri) => {
                setAvatarUri(uri);
                updateUser({ avatarUrl: uri });
                const { isMockMode } = require('../../lib/mockMode');
                if (!isMockMode && user?.id) {
                  try {
                    const { apiClient } = require('../../lib/apiClient');
                    const uploaded = await apiClient.uploadFile('chef-photos', `consumer-avatars/${user.id}`, uri);
                    setAvatarUri(uploaded.url);
                    updateUser({ avatarUrl: uploaded.url });
                    await apiClient.patch('/auth/profile', { avatar_url: uploaded.url });
                  } catch (e) {
                    console.warn('Avatar upload notice:', e);
                  }
                }
              });
            }}
          >
            {avatarUri && !avatarError ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImg}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarCameraBtn}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </Pressable>

          {isEditingName ? (
            <View style={styles.nameEditWrap}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={t('profile.enterYourName', 'Enter your name')}
                placeholderTextColor={Colors.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                {...({ outlineStyle: 'none' } as any)}
              />
              <Pressable style={styles.nameSaveBtn} onPress={handleSaveName}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </Pressable>
              <Pressable style={styles.nameCancelBtn} onPress={() => setIsEditingName(false)}>
                <Ionicons name="close" size={16} color={Colors.dark} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.nameRow} onPress={handleStartEditName}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.nameEditBadge}>
                <Ionicons name="pencil" size={12} color={Colors.primary} />
              </View>
            </Pressable>
          )}
          <Text style={styles.profilePhone}>{phone}</Text>
          {society ? (
            <View style={styles.societyPill}>
              <Ionicons name="location-outline" size={13} color={Colors.primary} />
              <Text style={styles.societyText}>{society}</Text>
            </View>
          ) : (
            <Pressable style={styles.societyPill} onPress={openAddDeliveryAddress}>
              <Ionicons name="location-outline" size={13} color={Colors.muted} />
              <Text style={[styles.societyText, { color: Colors.muted }]}>{t('profile.addDeliveryAddress', '+ Add Delivery Address')}</Text>
            </Pressable>
          )}
        </View>

        {/* ── Padded content ────────────────────────────────────────────────── */}
        <View style={styles.padded}>

          {/* Switch to Chef mode */}
          {user?.roles?.includes('chef') && (
            <Pressable style={styles.modeSwitchBanner} onPress={switchToChef}>
              <View style={styles.modeSwitchLeft}>
                <View style={styles.modeSwitchIcon}>
                  <Ionicons name="restaurant-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.modeSwitchTitle}>{t('profile.switchToChef', 'Switch to Chef mode')}</Text>
                  <Text style={styles.modeSwitchSub}>{t('profile.manageKitchen', 'Manage your kitchen and orders')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </Pressable>
          )}

          {/* My Wallet / Society Cash */}
          <Card>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => router.push('/(consumer)/wallet')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.goldBadge, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.dark }}>{t('profile.myWallet', 'My Wallet & Cash')}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.muted, marginTop: 2 }}>
                    {t('profile.walletBalanceLine', { defaultValue: 'Balance: ₹{{amount}} ({{points}} pts) · Cashbacks & refunds', amount: pointsValue(points), points })}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </Pressable>
          </Card>

          {/* Delivery addresses */}
          <View onLayout={(e) => { addressSectionY.current = e.nativeEvent.layout.y; }}>
          <Card>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="home-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{t('profile.deliveryAddresses', 'Delivery Addresses')}</Text>
            </View>

            {editingId === null ? (
              /* ── Read mode ── */
              <View style={{ gap: 16 }}>
                {addresses.map(addr => (
                  <View key={addr.id} style={{ padding: 12, borderWidth: 1, borderColor: addr.isPrimary ? Colors.primary : Colors.border, borderRadius: 10, backgroundColor: addr.isPrimary ? Colors.surfaceAlt : Colors.bg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.dark }}>{addr.society}</Text>
                          {addr.isPrimary && (
                            <View style={{ backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{t('common.primary', 'PRIMARY')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: Colors.muted, fontSize: 14 }}>{addr.tower}, {addr.flat}</Text>
                      </View>
                      <Pressable style={{ padding: 4 }} onPress={() => openAddressForm(addr.id)}>
                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                      </Pressable>
                    </View>
                    {!addr.isPrimary && (
                      <Pressable style={{ marginTop: 10 }} onPress={() => makePrimary(addr.id)}>
                        <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>{t('common.makePrimary', 'Make Primary')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed' }}
                  onPress={() => openAddressForm('new')}
                >
                  <Ionicons name="add" size={18} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontWeight: '700' }}>{t('profile.addNewAddress', 'Add new address')}</Text>
                </Pressable>
              </View>
            ) : (
              /* ── Edit mode ── */
              <View style={styles.addrEditWrap}>
                {/* Society Input */}
                <Text style={styles.addrLabel}>{t('profile.societyLabel', 'Housing Society Name *')}</Text>
                <TextInput
                  style={styles.addrInput}
                  value={addrSociety}
                  onChangeText={setAddrSociety}
                  placeholder={t('profile.societyPlaceholder', 'e.g. Lotus Heights, Green Valley')}
                  placeholderTextColor={Colors.muted}
                  {...({ outlineStyle: 'none' } as any)}
                />

                {/* Tower */}
                <Text style={styles.addrLabel}>{t('profile.towerLabel', 'Tower / Block')}</Text>
                <TextInput
                  style={styles.addrInput}
                  value={addrTower}
                  onChangeText={setAddrTower}
                  placeholder={t('profile.towerPlaceholder', 'e.g. Tower A')}
                  placeholderTextColor={Colors.muted}
                  {...({ outlineStyle: 'none' } as any)}
                />

                {/* Flat */}
                <Text style={styles.addrLabel}>{t('profile.flatLabel', 'Flat number')}</Text>
                <TextInput
                  style={styles.addrInput}
                  value={addrFlat}
                  onChangeText={setAddrFlat}
                  placeholder={t('profile.flatPlaceholder', 'e.g. Flat 801')}
                  placeholderTextColor={Colors.muted}
                  {...({ outlineStyle: 'none' } as any)}
                />

                {/* Pin exact delivery location on map */}
                <Text style={styles.addrLabel}>{t('profile.locationLabel', 'Exact location (optional)')}</Text>
                <Pressable
                  style={[styles.addrInput, { justifyContent: 'center' }]}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Text style={{ color: addrLocation ? Colors.textPrimary : Colors.muted }}>
                    {addrLocation
                      ? t('profile.locationSet', 'Location pinned ✓ (tap to change)')
                      : t('profile.locationPh', 'Tap to pin your exact location on the map')}
                  </Text>
                </Pressable>

                {/* Actions */}
                <View style={styles.addrActions}>
                  <Pressable
                    style={styles.addrCancelBtn}
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.addrCancelText}>{t('profile.cancel', 'Cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.addrSaveBtn}
                    onPress={saveAddress}
                  >
                    <Text style={styles.addrSaveText}>{t('profile.saveAddress', 'Save address')}</Text>
                  </Pressable>
                </View>

                <LocationPicker
                  visible={showLocationPicker}
                  initialLocation={addrLocation}
                  onCancel={() => setShowLocationPicker(false)}
                  onLocationSelect={(loc) => {
                    setAddrLocation(loc);
                    setShowLocationPicker(false);
                  }}
                />
              </View>
            )}
          </Card>
          </View>

          {/* Orders summary */}
          <Card>
            <View style={styles.cardTitleRow}>
              <Ionicons name="bag-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>{t('profile.orders', 'Orders')}</Text>
            </View>
            <View style={styles.summaryGrid}>
              <SummaryBlock value={ordersLoading ? '...' : String(totalOrdersCount)} label={t('profile.total', 'Total')} />
              <View style={styles.summaryDivider} />
              <SummaryBlock value={ordersLoading ? '...' : String(completedOrdersCount)} label={t('profile.completed', 'Completed')} />
              <View style={styles.summaryDivider} />
              <SummaryBlock value={ordersLoading ? '...' : String(activeOrdersCount)} label={t('profile.active', 'Active')} />
            </View>
          </Card>

          {/* Preferences */}
          <Card>
            <View style={styles.cardTitleRow}>
              <Ionicons name="options-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>{t('profile.preferences', 'Preferences')}</Text>
            </View>
            <LanguageSelectorRow />
            <View style={styles.prefDivider} />
            <PrefRow label={t('profile.sameSocietyKitchens', 'Show same society kitchens first')} value={sameSocietyOnly} onChange={setSameSocietyOnly} />
            <View style={styles.prefDivider} />
            <PrefRow label={t('profile.notifyFreeDishes', 'Notify when free dishes are available')} value={notifyFreeDishes} onChange={setNotifyFreeDishes} />
            <View style={styles.prefDivider} />
            <ThemePrefRow />
          </Card>

          {/* Account */}
          <Card>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>{t('profile.account', 'Account')}</Text>
            </View>
            <AccountRow label={t('profile.helpSupport', 'Help & support')} onPress={() => setShowSupportModal(true)} />
            <View style={styles.prefDivider} />
            <AccountRow label={t('profile.privacyPolicy', 'Privacy policy')} onPress={() => setShowPrivacyModal(true)} />
            <View style={styles.prefDivider} />
            {confirmSignOut ? (
              <View style={styles.signOutConfirm}>
                <Text style={styles.signOutConfirmLabel}>{t('profile.confirmSignOut', 'Sign out of RasoHi?')}</Text>
                <View style={styles.signOutBtns}>
                  <Pressable style={styles.cancelBtn} onPress={() => setConfirmSignOut(false)}>
                    <Text style={styles.cancelBtnText}>{t('profile.cancel', 'Cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.confirmBtn} onPress={doSignOut}>
                    <Text style={styles.confirmBtnText}>{t('profile.yesSignOut', 'Yes, sign out')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.accountRow} onPress={() => setConfirmSignOut(true)}>
                <Text style={styles.signOutText}>{t('profile.signOut', 'Sign out')}</Text>
                <Ionicons name="log-out-outline" size={16} color={Colors.red} />
              </Pressable>
            )}
            <View style={styles.prefDivider} />
            <Pressable
              style={styles.accountRow}
              onPress={() => {
                Alert.alert(
                  t('profile.deleteAccount', 'Delete Account'),
                  t('profile.deleteAccountConfirmBody', 'Are you sure you want to permanently delete your account? All your personal profile details, cart items, order history, and wallet rewards points will be erased immediately.'),
                  [
                    { text: t('profile.cancel', 'Cancel'), style: 'cancel' },
                    {
                      text: t('profile.deleteAccount', 'Delete Account'),
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
              <Text style={[styles.signOutText, { color: Colors.red }]}>{t('profile.deleteAccount', 'Delete Account')}</Text>
              <Ionicons name="trash-outline" size={16} color={Colors.red} />
            </Pressable>
          </Card>

          <Text style={styles.versionText}>{t('profile.version', 'RasoHi v1.0.0')}</Text>
        </View>
      </ScrollView>
      </ImageBackground>

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
function SummaryBlock({ value, label }: { value: string; label: string }) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  return (
    <View style={styles.summaryBlock}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PrefRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor="#fff" />
    </View>
  );
}

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
        {options.map(opt => (
          <Pressable 
            key={opt.key}
            style={[styles.themePill, mode === opt.key && styles.themePillActive]}
            onPress={() => setMode(opt.key)}
          >
            <Text style={[styles.themePillText, mode === opt.key && styles.themePillTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  flex:        { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  padded:      { paddingHorizontal: 16, gap: 14 },

  // Hero
  hero:      { width: '100%', height: 220 },
  heroImage: {},
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 14,
  },
  heroBlank: {
    width: '100%',
    height: 180,
  },
  heroBlankGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 14,
  },
  changeCoverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  changeCoverText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  changeCoverBtnBlank: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  changeCoverTextBlank: { color: Colors.primary, fontSize: 12, fontWeight: '800' },

  // Avatar
  avatarSection: { alignItems: 'center', marginTop: -48, marginBottom: 16 },
  avatarWrap:    { position: 'relative', marginBottom: 12 },
  avatarImg: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: Colors.surface,
  },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primaryDeep,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.surface,
  },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '900' },
  avatarCameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  profileName:  { fontSize: 22, fontWeight: '900', color: Colors.dark },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  nameEditBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameEditWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    minWidth: 160,
    textAlign: 'center',
  },
  nameSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhone: { fontSize: 14, color: Colors.muted, fontWeight: '600', marginTop: 3, marginBottom: 10 },
  societyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.greenBadge, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  societyText: { color: Colors.primary, fontSize: 13, fontWeight: '900' },

  // Card rows
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.greenBadge, alignItems: 'center', justifyContent: 'center' },
  cardRowCopy:  { flex: 1 },
  cardRowTitle: { color: Colors.dark, fontWeight: '900', fontSize: 14, marginBottom: 2 },
  cardRowValue: { color: Colors.muted, fontSize: 13, lineHeight: 18 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.pillInactive, borderRadius: 8 },
  changeBtnText: { color: Colors.primary, fontWeight: '900', fontSize: 13 },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { color: Colors.dark, fontSize: 16, fontWeight: '900' },

  summaryGrid:    { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryBlock:   { alignItems: 'center', flex: 1 },
  summaryValue:   { color: Colors.dark, fontSize: 28, fontWeight: '900', marginBottom: 4 },
  summaryLabel:   { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  prefRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  prefLabel:   { color: Colors.dark, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 12 },
  prefDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  themeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  themeOptions:{ flexDirection: 'row', gap: 6 },
  themePill:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.pillInactive, borderWidth: 1, borderColor: 'transparent' },
  themePillActive: { backgroundColor: Colors.surface, borderColor: Colors.primary },
  themePillText: { fontSize: 13, fontWeight: '800', color: Colors.muted },
  themePillTextActive: { color: Colors.primary },

  accountRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  accountRowText: { color: Colors.dark, fontSize: 15, fontWeight: '700' },
  signOutText:    { color: Colors.red, fontSize: 15, fontWeight: '900' },

  signOutConfirm:      { paddingVertical: 12, gap: 10 },
  signOutConfirmLabel: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  signOutBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn:   { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  confirmBtn:    { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.red, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },

  versionText: { color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 4 },

  // Mode switch banner
  modeSwitchBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.greenBadge, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, padding: 14, gap: 12 },
  modeSwitchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  modeSwitchIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  modeSwitchTitle: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  modeSwitchSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },

  // Address editor
  addrEditWrap: { gap: 4 },
  addrLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 12, marginBottom: 6,
  },
  addrPillRow: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: 8 },
  addrPill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: Colors.pillInactive,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  addrPillActive: { backgroundColor: Colors.surface, borderColor: Colors.primary },
  addrPillText: { fontSize: 13, fontWeight: '800', color: Colors.muted },
  addrPillTextActive: { color: Colors.primary },
  addrInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontWeight: '600', color: Colors.dark,
  },
  addrActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  addrCancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  addrCancelText: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  addrSaveBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  addrSaveText: { fontSize: 14, fontWeight: '900', color: '#fff' },
});
