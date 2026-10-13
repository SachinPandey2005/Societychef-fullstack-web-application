import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
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
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { LocationPicker, LatLng } from '../../components/LocationPicker';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const CUISINES = [
  { id: 'north_indian', label: 'North Indian', icon: 'restaurant-outline' },
  { id: 'south_indian', label: 'South Indian', icon: 'nutrition-outline' },
  { id: 'chinese', label: 'Chinese', icon: 'fast-food-outline' },
  { id: 'thali', label: 'Thali', icon: 'grid-outline' },
  { id: 'snacks', label: 'Snacks', icon: 'pizza-outline' },
  { id: 'desserts', label: 'Desserts', icon: 'ice-cream-outline' },
  { id: 'healthy', label: 'Healthy & Diet', icon: 'leaf-outline' },
  { id: 'other', label: 'Other Specialities', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function ChefRegisterScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const cuisineLabel = (id: string) => t(`chefRegister.cuisine.${id}`, id);

  const [step, setStep] = useState<Step>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Animated Illustration Floating Hook ─────────────────────────────────────
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -7,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [step]);

  // ── Step 1: Personal Info ──────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Pre-fill from the now-completed OTP login (landing.tsx's "Become a
  // Chef" button routes through phone/OTP before reaching this screen) so
  // the user isn't asked to type the same number twice.
  useEffect(() => {
    const authedPhone = useAuthStore.getState().user?.phone;
    if (authedPhone) setPhone(authedPhone.replace(/\D/g, '').slice(-10));
  }, []);

  // ── Step 2: Kitchen Details ────────────────────────────────────────────────
  const [kitchenName, setKitchenName] = useState('');
  const [society, setSociety] = useState('');
  const [flat, setFlat] = useState('');
  const [kitchenLocation, setKitchenLocation] = useState<LatLng | undefined>(undefined);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // ── Step 3: Cuisine Specialty & Bio ────────────────────────────────────────
  const [specialties, setSpecialties] = useState<string[]>(['North Indian']);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [bio, setBio] = useState('');

  function toggleSpecialty(label: string) {
    setSpecialties((prev) => {
      if (prev.includes(label)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== label);
      } else {
        return [...prev, label];
      }
    });
    if (error) setError('');
  }

  // ── Step 4: Verification & Photos ─────────────────────────────────────────
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarImageFront, setAadhaarImageFront] = useState<string | null>(null);
  const [aadhaarImageBack, setAadhaarImageBack] = useState<string | null>(null);
  const [panImage, setPanImage] = useState<string | null>(null);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [kitchenPhotos, setKitchenPhotos] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // ── Image Picker ───────────────────────────────────────────────────────────
  async function pickImage(onResult: (uri: string) => void, multiple = false) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chefRegister.permTitle', 'Permission needed'), t('chefRegister.permBody', 'Please allow photo library access.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: !multiple,
      allowsMultipleSelection: multiple,
      quality: 0.8,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      if (multiple && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setKitchenPhotos((prev) => [...prev, ...uris].slice(0, 6));
      } else if (result.assets?.[0]) {
        onResult(result.assets[0].uri);
      }
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateStep1() {
    if (!name.trim()) return t('chefRegister.err.step1Name', 'Full name is required');
    if (phone.replace(/\D/g, '').length !== 10) return t('chefRegister.err.step1Phone', 'Enter a valid 10-digit mobile number');
    return '';
  }

  function validateStep2() {
    if (!kitchenName.trim()) return t('chefRegister.err.step2Kitchen', 'Kitchen name is required');
    if (!society.trim()) return t('chefRegister.err.step2Society', 'Society / colony name is required');
    if (!flat.trim()) return t('chefRegister.err.step2Flat', 'Flat / house number is required');
    return '';
  }

  function validateStep3() {
    if (!specialties || specialties.length === 0) return t('chefRegister.err.step3Cuisine', 'Please select at least one cuisine specialty');
    return '';
  }

  function validateStep4() {
    const digits = aadhaarNumber.replace(/\D/g, '');
    if (digits.length !== 12) return t('chefRegister.err.step4Aadhaar', 'Enter a valid 12-digit Aadhaar number');
    if (!aadhaarImageFront) return t('chefRegister.err.step4Front', 'Please upload Aadhaar front photo');
    if (!aadhaarImageBack) return t('chefRegister.err.step4Back', 'Please upload Aadhaar back photo');
    return '';
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function handleNext() {
    setError('');
    let err = '';
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();
    if (step === 4) err = validateStep4();

    if (err) {
      setError(err);
      return;
    }

    if (step === 5) {
      handleFinalSubmit();
      return;
    }

    setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setError('');
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/landing');
      }
    }
  }

  // ── Final Submit ───────────────────────────────────────────────────────────
  async function handleFinalSubmit() {
    setIsLoading(true);
    setError('');
    try {
      const selectedCuisineList = specialties.map((s) => (s === 'Other' && customSpecialty.trim() ? customSpecialty.trim() : s));
      const selectedCuisine = selectedCuisineList.join(', ');

      if (isMockMode) {
        const { createMockKitchen } = require('../../services');
        const newKitchenId = `mock_kitchen_${Date.now()}`;

        await createMockKitchen({
          id: newKitchenId,
          name: kitchenName,
          chefName: name,
          society: society,
          tower: '',
          flat: flat,
          distanceKm: 0.5,
          rating: 5.0,
          orders: 0,
          anonymous: false,
          hygieneBadge: false,
          isLive: true,
          coverImage: kitchenPhotos.length > 0 ? kitchenPhotos[0] : (profilePhoto || undefined),
          profileImage: profilePhoto || (kitchenPhotos.length > 0 ? kitchenPhotos[0] : undefined),
          storyPrompts: [],
          gallery: kitchenPhotos.map((url, i) => ({
            id: `k_${i}`,
            type: 'image',
            url,
            caption: '',
            createdAt: new Date().toISOString(),
          })),
          videos: [],
          hygieneDetails: [],
          hygienePhotos: [],
          hygieneVideos: [],
          trustBadges: [],
          kitchenInfo: {
            cuisine: selectedCuisine || 'Varied',
            experience: 'New',
            prepTime: '1 hr',
            deliveryTime: '45 mins',
            operatingHours: '9 AM - 9 PM',
            languages: 'English',
            society: society,
          },
          stats: { ordersCompleted: 0, responseTime: '15 mins' },
          dishes: [],
        });

        const authState = useAuthStore.getState();
        const currentUser = authState.user;
        authState.setUser({
          id: currentUser?.id || `user_${Date.now()}`,
          displayName: name || currentUser?.displayName || 'Chef',
          phone: phone || currentUser?.phone || '',
          society: society || currentUser?.society || 'Lotus Heights',
          flat: flat || currentUser?.flat,
          role: 'chef',
          roles: Array.from(new Set([...(currentUser?.roles || ['consumer']), 'chef'])),
          activeRole: 'chef',
          chefProfileId: newKitchenId,
        });
        authState.setPendingChefSignup(false);

        await new Promise((r) => setTimeout(r, 600));
        // Collapses landing/phone/otp/role/chef-register from the stack —
        // see the matching comment in otp.tsx.
        router.dismissAll();
        router.replace('/(chef)/onboarding');
        return;
      }

      // ── Backend-authenticated user id ─────────────────────────────────────
      // Registration only ever happens after a real backend login (see
      // (auth)/otp.tsx) — the logged-in profile's id is the only id that
      // belongs here. No fallback to a locally-minted id: without a real
      // session there's no token to authenticate the calls below with.
      const userId = useAuthStore.getState().user?.id;
      if (!userId || userId.length !== 36) {
        throw new Error('You must be logged in to register as a chef.');
      }

      // Upload photos
      const uploadedPhotoUrls: string[] = [];
      for (const uri of kitchenPhotos) {
        try {
          const uploaded = await apiClient.uploadFile('chef-photos', `kitchens/${userId}`, uri);
          uploadedPhotoUrls.push(uploaded.url);
        } catch (e: any) {
          console.warn('Kitchen photo upload warning:', e?.message);
        }
      }

      let profilePhotoUrl: string | undefined;
      if (profilePhoto) {
        try {
          const uploaded = await apiClient.uploadFile('chef-photos', `profiles/${userId}`, profilePhoto);
          profilePhotoUrl = uploaded.url;
        } catch (e: any) {
          console.warn('Profile photo upload warning:', e?.message);
        }
      }

      // Phone is already set from the real OTP login — only the fields this
      // form actually collects get updated.
      await apiClient.patch('/auth/profile', { name, society, flat });

      // POST /kitchens is also the self-service "become a chef" endpoint —
      // it force-overwrites chef_user_id to the caller's own id for any
      // non-admin, so chef_user_id is only included here to satisfy the
      // schema's required field, never trusted as the real owner.
      const kitchenResponse = await apiClient.post('/kitchens', {
        chef_user_id: userId,
        name: kitchenName,
        chef_name: name,
        address: `${flat}, ${society}`,
        is_verified: false,
        is_top_rated: false,
        // Column defaults to false — a newly registered kitchen should start
        // accepting orders, matching the chef dashboard's default toggle state.
        is_live: true,
        bio,
        specialty: selectedCuisine,
        kitchen_info: {
          chefName: name,
          gallery: uploadedPhotoUrls,
          profileImage: profilePhotoUrl,
          coverImage: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null,
          // No dedicated latitude/longitude columns on `kitchens` yet, so the
          // pinned location is kept here alongside the other display fields.
          location: kitchenLocation || null,
        },
      });
      const kitchen = kitchenResponse?.data;

      const authState = useAuthStore.getState();
      authState.setUser({
        id: userId,
        displayName: name || authState.user?.displayName || 'Chef',
        phone: phone || authState.user?.phone || '',
        society: society || authState.user?.society || '',
        role: 'chef',
        roles: ['consumer', 'chef'],
        activeRole: 'chef',
        chefProfileId: kitchen?.id,
      });
      authState.setPendingChefSignup(false);

      router.dismissAll();
      router.replace('/(chef)/onboarding');
    } catch (e: any) {
      setError(e?.message || t('chefRegister.err.submit', 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={styles.bgContainer}
        imageStyle={{ opacity: 0.05, resizeMode: 'repeat' }}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Main Top Header */}
          <View style={styles.topBar}>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: '#F3E5D8',
                borderWidth: 1,
                borderColor: '#E5D6C5',
              }}
              onPress={handleBack}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={18} color="#2C1D17" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#2C1D17' }}>{t('chefRegister.back', 'Back')}</Text>
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

          {/* Top Progress Bar (Steps 1 to 5) */}
          {step > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                {[1, 2, 3, 4, 5].map((sIndex) => {
                  const isCompleted = sIndex < step;
                  const isCurrent = sIndex === step;
                  return (
                    <React.Fragment key={sIndex}>
                      {sIndex > 1 && (
                        <View
                          style={[
                            styles.progressLine,
                            isCompleted && styles.progressLineActive,
                          ]}
                        />
                      )}
                      <Pressable
                        style={[
                          styles.stepDot,
                          isCompleted && styles.stepDotCompleted,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                        onPress={() => {
                          if (sIndex < step) setStep(sIndex as Step);
                        }}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={13} color="#9E3322" />
                        ) : isCurrent ? (
                          <Ionicons
                            name={
                              sIndex === 1
                                ? 'person'
                                : sIndex === 2
                                ? 'home'
                                : sIndex === 3
                                ? 'restaurant'
                                : sIndex === 4
                                ? 'camera'
                                : 'checkmark-done'
                            }
                            size={14}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={styles.stepDotText}>{sIndex}</Text>
                        )}
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── STEP 0: Welcome / Landing ─────────────────────────────────── */}
            {step === 0 && (
              <View style={styles.heroCard}>
                <Animated.View style={[styles.heroImageWrap, { transform: [{ translateY }] }]}>
                  <Image
                    source={require('../../assets/login_chef_hero.png')}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </Animated.View>

                <Text style={styles.heroHeadline}>
                  {t('chefRegister.hero.headline1', 'Turn your love')}{'\n'}
                  <Text style={styles.heroHeadlineAccent}>{t('chefRegister.hero.headline2', 'for cooking into')}</Text>{'\n'}
                  {t('chefRegister.hero.headline3', 'something special.')}
                </Text>

                <Text style={styles.heroSubheadline}>
                  {t('chefRegister.hero.sub', 'Join thousands of home chefs in your society. ♡')}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.primaryBtnText}>{t('chefRegister.hero.begin', "Let's Begin  →")}</Text>
                </Pressable>

                <Pressable
                  style={styles.loginLink}
                  onPress={() => router.push('/(auth)/phone')}
                >
                  <Text style={styles.loginLinkText}>
                    {t('chefRegister.hero.alreadyChef', 'Already a chef? ')}<Text style={styles.loginLinkBold}>{t('chefRegister.hero.login', 'Login')}</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP 1: Tell us about yourself ───────────────────────────── */}
            {step === 1 && (
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderTextWrap}>
                    <Text style={styles.stepBadge}>{t('chefRegister.stepOf', { defaultValue: 'Step {{n}} of 5', n: 1 })}</Text>
                    <Text style={styles.stepTitle}>{t('chefRegister.s1.title', 'Tell us about yourself ♡')}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t('chefRegister.s1.sub', 'We just need a few basic details to get started.')}
                    </Text>
                  </View>

                  {/* Animated Step Illustration */}
                  <Animated.View style={[styles.stepHeaderImgWrap, { transform: [{ translateY }] }]}>
                    <Image
                      source={require('../../assets/step1_about_me.png')}
                      style={styles.stepHeaderImg}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* Field: Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s1.nameLabel', 'Full Name *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="person-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s1.namePh', 'e.g. Meena Sharma')}
                      placeholderTextColor="#A3938A"
                      value={name}
                      onChangeText={(v) => {
                        setName(v);
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Field: Phone Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s1.phoneLabel', 'Phone Number *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.prefixBox}>
                      <Ionicons name="call-outline" size={16} color="#76645A" style={{ marginRight: 4 }} />
                      <Text style={styles.prefixText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s1.phonePh', '10-digit mobile number')}
                      placeholderTextColor="#A3938A"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v.replace(/\D/g, ''));
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Security Note Box */}
                <View style={styles.securityBox}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9E3322" />
                  <Text style={styles.securityText}>
                    {t('chefRegister.s1.securityNote', 'Your number is safe with us and never shared publicly.')}
                  </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.primaryBtnText}>{t('chefRegister.continue', 'Continue  →')}</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP 2: Tell us about your kitchen ───────────────────────── */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderTextWrap}>
                    <Text style={styles.stepBadge}>{t('chefRegister.stepOf', { defaultValue: 'Step {{n}} of 5', n: 2 })}</Text>
                    <Text style={styles.stepTitle}>{t('chefRegister.s2.title', 'Tell us about your kitchen ♡')}</Text>
                    <Text style={styles.stepSubtitle}>{t('chefRegister.s2.sub', 'Where do you cook from?')}</Text>
                  </View>

                  {/* Animated Step Illustration */}
                  <Animated.View style={[styles.stepHeaderImgWrap, { transform: [{ translateY }] }]}>
                    <Image
                      source={require('../../assets/step2_kitchen_house.png')}
                      style={styles.stepHeaderImg}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* Field: Kitchen Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s2.kitchenLabel', 'Kitchen Name *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="restaurant-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s2.kitchenPh', "e.g. Meena's Punjabi Rasoi")}
                      placeholderTextColor="#A3938A"
                      value={kitchenName}
                      onChangeText={(v) => {
                        setKitchenName(v);
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Field: Society / Colony */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s2.societyLabel', 'Society / Colony *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="business-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s2.societyPh', 'e.g. Green Valley Society, Sector 12')}
                      placeholderTextColor="#A3938A"
                      value={society}
                      onChangeText={(v) => {
                        setSociety(v);
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Field: Flat / House Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s2.flatLabel', 'Flat / House Number *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="location-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s2.flatPh', 'e.g. Flat 402, B Wing')}
                      placeholderTextColor="#A3938A"
                      value={flat}
                      onChangeText={(v) => {
                        setFlat(v);
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Field: Pin exact kitchen location on map */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s2.locationLabel', 'Kitchen Location (optional)')}</Text>
                  <Pressable
                    style={styles.inputRow}
                    onPress={() => setShowLocationPicker(true)}
                  >
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="pin-outline" size={18} color="#76645A" />
                    </View>
                    <Text style={[styles.input, { paddingVertical: 12, color: kitchenLocation ? '#3A2E28' : '#A3938A' }]}>
                      {kitchenLocation
                        ? t('chefRegister.s2.locationSet', 'Location pinned ✓ (tap to change)')
                        : t('chefRegister.s2.locationPh', 'Tap to pin your kitchen on the map')}
                    </Text>
                  </Pressable>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.primaryBtnText}>{t('chefRegister.continue', 'Continue  →')}</Text>
                </Pressable>

                <LocationPicker
                  visible={showLocationPicker}
                  initialLocation={kitchenLocation}
                  onCancel={() => setShowLocationPicker(false)}
                  onLocationSelect={(loc) => {
                    setKitchenLocation(loc);
                    setShowLocationPicker(false);
                  }}
                />
              </View>
            )}

            {/* ── STEP 3: Cuisine Specialty ────────────────────────────────── */}
            {step === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderTextWrap}>
                    <Text style={styles.stepBadge}>{t('chefRegister.stepOf', { defaultValue: 'Step {{n}} of 5', n: 3 })}</Text>
                    <Text style={styles.stepTitle}>{t('chefRegister.s3.title', "What's your cuisine specialty? ♡")}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t('chefRegister.s3.sub', 'Select the types of food you love cooking.')}
                    </Text>
                  </View>

                  {/* Animated Step Illustration */}
                  <Animated.View style={[styles.stepHeaderImgWrap, { transform: [{ translateY }] }]}>
                    <Image
                      source={require('../../assets/step3_chef.png')}
                      style={styles.stepHeaderImg}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* Cuisine Pill Grid */}
                <View style={styles.cuisineGrid}>
                  {CUISINES.map((item) => {
                    const itemValue = item.id === 'other' ? 'Other' : item.label;
                    const isSelected = specialties.includes(itemValue);
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.cuisineCard,
                          isSelected && styles.cuisineCardSelected,
                        ]}
                        onPress={() => toggleSpecialty(itemValue)}
                      >
                        <View style={styles.cuisineIconWrap}>
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color={isSelected ? '#9E3322' : '#76645A'}
                          />
                        </View>
                        <Text
                          style={[
                            styles.cuisineLabel,
                            isSelected && styles.cuisineLabelSelected,
                          ]}
                        >
                          {cuisineLabel(item.id)}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#9E3322" style={styles.cuisineCheck} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Specialty input if 'Other' selected */}
                {specialties.includes('Other') && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t('chefRegister.s3.specifyLabel', 'Specify Your Specialty')}</Text>
                    <TextInput
                      style={styles.inputSingle}
                      placeholder={t('chefRegister.s3.specifyPh', 'e.g. Kashmiri, Bakery, Bengali Sweets')}
                      placeholderTextColor="#A3938A"
                      value={customSpecialty}
                      onChangeText={setCustomSpecialty}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                )}

                {/* Kitchen Bio / Story */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s3.bioLabel', 'About Your Kitchen / Story (Optional)')}</Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder={t('chefRegister.s3.bioPh', 'Tell your neighbors what makes your cooking special...')}
                    placeholderTextColor="#A3938A"
                    multiline
                    numberOfLines={3}
                    value={bio}
                    onChangeText={setBio}
                    textAlignVertical="top"
                    {...({ outlineStyle: 'none' } as any)}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.primaryBtnText}>{t('chefRegister.continue', 'Continue  →')}</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP 4: Verification & Photos ────────────────────────────── */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderTextWrap}>
                    <Text style={styles.stepBadge}>{t('chefRegister.stepOf', { defaultValue: 'Step {{n}} of 5', n: 4 })}</Text>
                    <Text style={styles.stepTitle}>{t('chefRegister.s4.title', 'Share a glimpse & Verification ♡')}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t('chefRegister.s4.sub', 'Help customers know your space & upload verification docs.')}
                    </Text>
                  </View>

                  {/* Animated Step Illustration */}
                  <Animated.View style={[styles.stepHeaderImgWrap, { transform: [{ translateY }] }]}>
                    <Image
                      source={require('../../assets/step4_kitchen_shelf.png')}
                      style={styles.stepHeaderImg}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* ID Verification Banner */}
                <View style={styles.securityBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#9E3322" />
                  <Text style={styles.securityText}>
                    {t('chefRegister.s4.idNote', 'Your ID documents are encrypted & used only for one-time verification.')}
                  </Text>
                </View>

                {/* Field: Aadhaar Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s4.aadhaarLabel', 'Aadhaar Number *')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="card-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s4.aadhaarPh', 'XXXX XXXX XXXX')}
                      placeholderTextColor="#A3938A"
                      keyboardType="number-pad"
                      maxLength={14}
                      value={aadhaarNumber}
                      onChangeText={(v) => {
                        const clean = v.replace(/\D/g, '').slice(0, 12);
                        const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setAadhaarNumber(formatted);
                        if (error) setError('');
                      }}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Aadhaar Uploads */}
                <Text style={styles.fieldLabel}>{t('chefRegister.s4.aadhaarFrontLabel', 'Aadhaar Front Photo *')}</Text>
                <UploadBox
                  uri={aadhaarImageFront}
                  placeholder={t('chefRegister.s4.aadhaarFrontUpload', 'Tap to upload Aadhaar Front')}
                  onPress={() => pickImage(setAadhaarImageFront)}
                />

                <Text style={styles.fieldLabel}>{t('chefRegister.s4.aadhaarBackLabel', 'Aadhaar Back Photo *')}</Text>
                <UploadBox
                  uri={aadhaarImageBack}
                  placeholder={t('chefRegister.s4.aadhaarBackUpload', 'Tap to upload Aadhaar Back')}
                  onPress={() => pickImage(setAadhaarImageBack)}
                />

                {/* Field: PAN Card (Optional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s4.panLabel', 'PAN Card Number (Optional)')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="document-text-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s4.panPh', 'ABCDE1234F')}
                      placeholderTextColor="#A3938A"
                      autoCapitalize="characters"
                      maxLength={10}
                      value={panNumber}
                      onChangeText={setPanNumber}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                <UploadBox
                  uri={panImage}
                  placeholder={t('chefRegister.s4.panUpload', 'Tap to upload PAN Card Photo (Optional)')}
                  onPress={() => pickImage(setPanImage)}
                />

                {/* Field: FSSAI License (Optional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('chefRegister.s4.fssaiLabel', 'FSSAI License No. (Optional)')}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="ribbon-outline" size={18} color="#76645A" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('chefRegister.s4.fssaiPh', 'e.g. 11222334445678')}
                      placeholderTextColor="#A3938A"
                      keyboardType="number-pad"
                      maxLength={14}
                      value={fssaiNumber}
                      onChangeText={setFssaiNumber}
                      {...({ outlineStyle: 'none' } as any)}
                    />
                  </View>
                </View>

                {/* Kitchen Photo Upload */}
                <Text style={styles.fieldLabel}>{t('chefRegister.s4.kitchenPhotoLabel', 'Upload Kitchen Photo')}</Text>
                <Pressable
                  style={styles.uploadBigBox}
                  onPress={() => pickImage(() => {}, true)}
                >
                  <Animated.View style={[styles.uploadBigCircle, { transform: [{ translateY }] }]}>
                    <Ionicons name="camera" size={24} color="#9E3322" />
                  </Animated.View>
                  <Text style={styles.uploadBigTitle}>{t('chefRegister.s4.kitchenPhotoLabel', 'Upload Kitchen Photo')}</Text>
                  <Text style={styles.uploadBigSubtitle}>
                    {t('chefRegister.s4.kitchenPhotoSub', 'Tap to upload or drag and drop photos of your kitchen')}
                  </Text>
                </Pressable>

                {/* Kitchen Photos Preview */}
                {kitchenPhotos.length > 0 && (
                  <View style={styles.photoPreviewGrid}>
                    {kitchenPhotos.map((url, i) => (
                      <View key={i} style={styles.photoPreviewWrap}>
                        <Image source={{ uri: url }} style={styles.photoPreviewImage} />
                        <Pressable
                          style={styles.photoRemoveBtn}
                          onPress={() => setKitchenPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.primaryBtnText}>{t('chefRegister.continue', 'Continue  →')}</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP 5: Almost there, chef! 🎉 ──────────────────────────── */}
            {step === 5 && (
              <View style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderTextWrap}>
                    <Text style={styles.stepBadge}>{t('chefRegister.stepOf', { defaultValue: 'Step {{n}} of 5', n: 5 })}</Text>
                    <Text style={styles.stepTitle}>{t('chefRegister.s5.title', 'Almost there, chef! 🎉 ♡')}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t('chefRegister.s5.sub', "Review your details and let's get you started.")}
                    </Text>
                  </View>

                  {/* Animated Celebration Icon */}
                  <Animated.View style={[styles.summaryPartyIcon, { transform: [{ translateY }] }]}>
                    <Ionicons name="sparkles" size={28} color="#9E3322" />
                  </Animated.View>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  {/* Item: Name */}
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconWrap}>
                      <Ionicons name="person-outline" size={16} color="#9E3322" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>{t('chefRegister.s5.name', 'Name')}</Text>
                      <Text style={styles.summaryValue}>{name || 'Meena Sharma'}</Text>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setStep(1)}>
                      <Ionicons name="pencil" size={12} color="#9E3322" />
                      <Text style={styles.editText}>{t('chefRegister.s5.edit', 'Edit')}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* Item: Phone */}
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconWrap}>
                      <Ionicons name="call-outline" size={16} color="#9E3322" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>{t('chefRegister.s5.phone', 'Phone')}</Text>
                      <Text style={styles.summaryValue}>+91 {phone || '9876543210'}</Text>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setStep(1)}>
                      <Ionicons name="pencil" size={12} color="#9E3322" />
                      <Text style={styles.editText}>{t('chefRegister.s5.edit', 'Edit')}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* Item: Kitchen */}
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconWrap}>
                      <Ionicons name="restaurant-outline" size={16} color="#9E3322" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>{t('chefRegister.s5.kitchen', 'Kitchen')}</Text>
                      <Text style={styles.summaryValue}>{kitchenName || "Meena's Punjabi Rasoi"}</Text>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setStep(2)}>
                      <Ionicons name="pencil" size={12} color="#9E3322" />
                      <Text style={styles.editText}>{t('chefRegister.s5.edit', 'Edit')}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* Item: Location */}
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconWrap}>
                      <Ionicons name="location-outline" size={16} color="#9E3322" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>{t('chefRegister.s5.location', 'Location')}</Text>
                      <Text style={styles.summaryValue}>
                        {society || 'Green Valley Society'}, {flat || 'Flat 402'}
                      </Text>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setStep(2)}>
                      <Ionicons name="pencil" size={12} color="#9E3322" />
                      <Text style={styles.editText}>{t('chefRegister.s5.edit', 'Edit')}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* Item: Cuisine */}
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIconWrap}>
                      <Ionicons name="nutrition-outline" size={16} color="#9E3322" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>{t('chefRegister.s5.cuisine', 'Cuisine')}</Text>
                      <Text style={styles.summaryValue}>
                        {specialties.map((s) => {
                          if (s === 'Other') return customSpecialty || s;
                          const match = CUISINES.find((c) => c.label === s);
                          return match ? cuisineLabel(match.id) : s;
                        }).join(', ')}
                      </Text>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setStep(3)}>
                      <Ionicons name="pencil" size={12} color="#9E3322" />
                      <Text style={styles.editText}>{t('chefRegister.s5.edit', 'Edit')}</Text>
                    </Pressable>
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    isLoading && styles.btnDisabled,
                    pressed && !isLoading && styles.primaryBtnPressed,
                  ]}
                  onPress={handleFinalSubmit}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryBtnText}>
                    {isLoading ? t('chefRegister.s5.completing', 'Completing Registration...') : t('chefRegister.s5.complete', 'Complete Registration  →')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Bottom Trust Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#9E3322" />
                <Text style={styles.statLabel}>{t('chefRegister.trust.verified', 'Verified Home Chefs')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={18} color="#9E3322" />
                <Text style={styles.statLabel}>{t('chefRegister.trust.love', 'Made with Love')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={18} color="#9E3322" />
                <Text style={styles.statLabel}>{t('chefRegister.trust.families', 'Trusted by 10,000+ families')}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Terracotta Accent Bar */}
          <View style={styles.bottomAccentBar} />
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ── Upload Box Component ──────────────────────────────────────────────────────
function UploadBox({
  uri,
  placeholder,
  onPress,
}: {
  uri: string | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={uploadStyles.box} onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={uploadStyles.image} />
      ) : (
        <View style={uploadStyles.placeholderWrap}>
          <Ionicons name="cloud-upload-outline" size={20} color="#9E3322" />
          <Text style={uploadStyles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </Pressable>
  );
}

const uploadStyles = StyleSheet.create({
  box: {
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6DBCB',
    borderStyle: 'dashed',
    backgroundColor: '#FAF5EE',
    overflow: 'hidden',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#76645A',
  },
});

const getStyles = (Colors: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#FAF5EE',
    },
    bgContainer: {
      flex: 1,
      backgroundColor: '#FAF5EE',
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
      maxWidth: 580,
      width: '100%',
      alignSelf: 'center',
    },
    backBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: '#F3E5D8',
    },
    brandGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#F3E5D8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: '#2C1D17',
      letterSpacing: -0.3,
    },
    headerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    headerTagline: {
      fontSize: 12,
      fontWeight: '600',
      color: '#76645A',
    },
    progressContainer: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      maxWidth: 580,
      width: '100%',
      alignSelf: 'center',
    },
    progressTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressLine: {
      flex: 1,
      height: 2,
      backgroundColor: '#D8E3D7',
      marginHorizontal: 4,
    },
    progressLineActive: {
      backgroundColor: '#123524',
    },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFDF9',
      borderWidth: 1.5,
      borderColor: '#D8E3D7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotCompleted: {
      backgroundColor: '#FAF1DF',
      borderColor: '#123524',
    },
    stepDotCurrent: {
      backgroundColor: '#123524',
      borderColor: '#D4AF37',
    },
    stepDotText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#6B6B6B',
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 24,
      maxWidth: 580,
      width: '100%',
      alignSelf: 'center',
    },
    heroCard: {
      backgroundColor: '#FFFDF9',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      marginTop: 8,
      marginBottom: 20,
      alignItems: 'center',
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
    heroImageWrap: {
      width: '100%',
      height: 200,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: '#FAF1DF',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroHeadline: {
      fontSize: 24,
      fontWeight: '900',
      color: '#123524',
      textAlign: 'center',
      lineHeight: 30,
      marginBottom: 8,
    },
    heroHeadlineAccent: {
      color: '#D4AF37',
      fontStyle: 'italic',
    },
    heroSubheadline: {
      fontSize: 14,
      color: '#76645A',
      textAlign: 'center',
      marginBottom: 20,
    },
    loginLink: {
      marginTop: 14,
      alignItems: 'center',
    },
    loginLinkText: {
      fontSize: 13,
      color: '#6B6B6B',
    },
    loginLinkBold: {
      fontWeight: '800',
      color: '#C89B3C',
    },
    stepCard: {
      backgroundColor: '#FFFDF9',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      marginTop: 8,
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
    stepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    stepHeaderTextWrap: {
      flex: 1,
      paddingRight: 10,
    },
    stepHeaderImgWrap: {
      width: 75,
      height: 65,
      borderRadius: 12,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepHeaderImg: {
      width: '100%',
      height: '100%',
    },
    summaryPartyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FAF1DF',
      borderWidth: 1,
      borderColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadge: {
      fontSize: 12,
      fontWeight: '800',
      color: '#C89B3C',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    stepTitle: {
      fontSize: 19,
      fontWeight: '900',
      color: '#123524',
      marginBottom: 4,
    },
    stepSubtitle: {
      fontSize: 13,
      color: '#6B6B6B',
      lineHeight: 18,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#123524',
      marginBottom: 6,
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
    },
    inputIconWrap: {
      width: 76,
      alignSelf: 'stretch',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FAF1DF',
      borderRightWidth: 1,
      borderRightColor: '#D8E3D7',
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
      fontSize: 15,
      fontWeight: '800',
      color: '#123524',
    },
    input: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 14,
      fontSize: 15,
      fontWeight: '700',
      color: '#123524',
    },
    inputSingle: {
      borderWidth: 1,
      borderColor: '#D8E3D7',
      borderRadius: 14,
      backgroundColor: '#FFFDF9',
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      fontWeight: '700',
      color: '#123524',
    },
    multilineInput: {
      borderWidth: 1,
      borderColor: '#D8E3D7',
      borderRadius: 14,
      backgroundColor: '#FFFDF9',
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: '#123524',
      minHeight: 80,
    },
    securityBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#FAF1DF',
      borderWidth: 1,
      borderColor: '#D4AF37',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    securityText: {
      flex: 1,
      fontSize: 12,
      color: '#6B6B6B',
      lineHeight: 16,
    },
    cuisineGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    cuisineCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: '#FFFDF9',
      borderWidth: 1,
      borderColor: '#D8E3D7',
      gap: 8,
    },
    cuisineCardSelected: {
      backgroundColor: '#FAF1DF',
      borderColor: '#123524',
    },
    cuisineIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: '#FAF1DF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cuisineLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#123524',
      flex: 1,
    },
    cuisineLabelSelected: {
      color: '#123524',
      fontWeight: '800',
    },
    cuisineCheck: {
      marginLeft: 'auto',
    },
    uploadBigBox: {
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: '#D4AF37',
      borderStyle: 'dashed',
      backgroundColor: '#FFFDF9',
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    uploadBigCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FAF1DF',
      borderWidth: 1,
      borderColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    uploadBigTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#123524',
      marginBottom: 4,
    },
    uploadBigSubtitle: {
      fontSize: 12,
      color: '#6B6B6B',
      textAlign: 'center',
    },
    photoPreviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    photoPreviewWrap: {
      width: 70,
      height: 70,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    },
    photoPreviewImage: {
      width: '100%',
      height: '100%',
    },
    photoRemoveBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryCard: {
      backgroundColor: '#FFFDF9',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      padding: 14,
      marginBottom: 18,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    summaryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#FAF1DF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryContent: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#6B6B6B',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '800',
      color: '#123524',
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: '#FAF1DF',
    },
    editText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#123524',
    },
    summaryDivider: {
      height: 1,
      backgroundColor: '#D8E3D7',
      marginVertical: 10,
    },
    errorText: {
      color: '#C94737',
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 12,
    },
    primaryBtn: {
      backgroundColor: '#123524',
      borderRadius: 14,
      paddingVertical: 16,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#D4AF37',
    },
    primaryBtnPressed: {
      backgroundColor: '#0B2317',
    },
    btnDisabled: {
      opacity: 0.65,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      backgroundColor: '#FFFDF9',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: '#D8E3D7',
      gap: 6,
      width: '100%',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
      flexShrink: 1,
      paddingVertical: 2,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#123524',
      flexShrink: 1,
      lineHeight: 14,
    },
    statDivider: {
      width: 1,
      height: 18,
      backgroundColor: '#D8E3D7',
    },
    bottomAccentBar: {
      height: 6,
      backgroundColor: '#123524',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
  });
