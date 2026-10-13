import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { DISHES } from '../../constants/data';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DishVisual } from '../../components/ui/DishVisual';
import { Pill } from '../../components/ui/Pill';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { money } from '../../lib/format';
import { updateKitchenProfile, saveChefDishes, getKitchen } from '../../services';
import { useToast } from '../../components/ui/Toast';
import type { ChefDish, Dish } from '../../types';

// const SOCIETIES = ['Lotus Heights', 'Green Valley', 'Palm Residency', 'Maple Gardens'];
const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);

  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [step, setStep] = useState(1);
  const [loadingKitchen, setLoadingKitchen] = useState(true);

  // Step 1
  const [kitchenName, setKitchenName] = useState('My Kitchen');
  const [chefName, setChefName] = useState(user?.displayName ?? '');

  // Step 2
  const [society, setSociety] = useState(user?.society ?? '');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');

  // Step 3
  const [hideIdentity, setHideIdentity] = useState(false);
  const [hideFlatNumber, setHideFlatNumber] = useState(false);

  // Step 4
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set());
  const [customDishes, setCustomDishes] = useState<Dish[]>([]);

  // Step 5
  const [bankHolder, setBankHolder] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Steps 1 and 2 ask for kitchen name / society / flat — exactly what
  // app/(auth)/chef-register.tsx already collected and saved moments earlier
  // for anyone arriving here right after registration. This screen used to
  // always start blank (kitchenName defaulted to the placeholder "My
  // Kitchen", tower/flat defaulted to '') regardless of what was already on
  // file, so a newly registered chef saw what looked like the same questions
  // again with none of their answers carried over. Fetch the real kitchen
  // record and pre-fill everything; if the name/society/flat are already all
  // set, skip straight past the redundant steps to the two things this
  // screen actually adds (privacy toggle, dish picks, bank details).
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const kitchen = await getKitchen(user?.chefProfileId || user?.id || '');
        if (!isMounted || !kitchen) return;

        const hasName = kitchen.name && kitchen.name !== 'My Kitchen';
        const hasSociety = !!kitchen.society;
        const hasFlat = !!kitchen.flat;

        if (kitchen.name && hasName) setKitchenName(kitchen.name);
        if (kitchen.chefName) setChefName(kitchen.chefName);
        if (kitchen.society) setSociety(kitchen.society);
        if (kitchen.tower) setTower(kitchen.tower);
        if (kitchen.flat) setFlat(kitchen.flat);
        setHideIdentity(!!kitchen.anonymous);

        if (hasName && hasSociety && hasFlat) {
          setStep(3);
        }
      } catch (e) {
        console.warn('[onboarding] Failed to pre-fill from existing kitchen:', e);
      } finally {
        if (isMounted) setLoadingKitchen(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user?.chefProfileId, user?.id]);

  function toggleDish(id: string) {
    setSelectedDishes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleContinue() {
    if (isSaving) return;
    if (step === 1) {
      if (!kitchenName.trim()) {
        Alert.alert(t('chefOnboard.kitchenNameRequiredTitle', 'Kitchen name required'), t('chefOnboard.kitchenNameRequiredBody', 'Please enter a name for your kitchen.'));
        return;
      }
    }
    if (step === 2) {
      if (!society.trim()) {
        Alert.alert(t('chefOnboard.societyRequiredTitle', 'Society required'), t('chefOnboard.societyRequiredBody', 'Please enter your society name.'));
        return;
      }
    }
    if (step === 4) {
      if (selectedDishes.size === 0) {
        Alert.alert(t('chefOnboard.selectDishTitle', 'Select at least one dish'), t('chefOnboard.selectDishBody', 'Please pick at least one dish for your menu.'));
        return;
      }
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    const kitchenId = user?.chefProfileId || user?.id || '';

    setIsSaving(true);
    try {
      await updateKitchenProfile(kitchenId, {
        name: kitchenName.trim(),
        address: `${flat}, ${society.trim()}`.trim(),
        anonymous: hideIdentity,
        kitchenInfo: {
          hideFlatNumber,
          bankDetails: bankAccount
            ? { holder: bankHolder, ifsc: bankIfsc, account: bankAccount }
            : undefined,
        },
      } as any);

      const dishesPayload: Record<string, ChefDish> = {};
      selectedDishes.forEach((id) => {
        const template = DISHES.find((d) => d.id === id) || customDishes.find((d) => d.id === id);
        if (!template) return;
        dishesPayload[id] = {
          ...template,
          enabled: true,
          price: template.suggestedPrice,
          weeklyFree: false,
          sample: false,
        };
      });
      if (Object.keys(dishesPayload).length > 0) {
        await saveChefDishes(dishesPayload);
      }

      setUser({
        ...user!,
        role: 'chef',
        roles: user?.roles?.includes('chef') ? user.roles : [...(user?.roles ?? []), 'chef'],
        activeRole: 'chef',
        chefProfileId: kitchenId,
        displayName: chefName.trim() || kitchenName.trim(),
        society: society.trim(),
      });
      router.replace('/(chef)/dashboard');
    } catch (e: any) {
      showToast(e?.message || t('chefOnboard.saveError', 'Could not save your kitchen setup. Please try again.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingKitchen) {
    return <LoadingSpinner fullscreen label={t('chefOnboard.loading', 'Loading your kitchen...')} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Row with Back Button & Brand Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.dark} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('chefOnboard.back', 'Back')}</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
              style={{ width: 110, height: 36 }}
              resizeMode="contain"
            />
          </View>

          <LanguageTogglePill />
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i + 1 <= step ? styles.stepDotFilled : styles.stepDotEmpty,
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Step1
              kitchenName={kitchenName}
              setKitchenName={setKitchenName}
              chefName={chefName}
              setChefName={setChefName}
            />
          )}
          {step === 2 && (
            <Step2
              society={society}
              setSociety={setSociety}
              tower={tower}
              setTower={setTower}
              flat={flat}
              setFlat={setFlat}
            />
          )}
          {step === 3 && (
            <Step3
              hideIdentity={hideIdentity}
              setHideIdentity={setHideIdentity}
              hideFlatNumber={hideFlatNumber}
              setHideFlatNumber={setHideFlatNumber}
            />
          )}
          {step === 4 && (
            <Step4
              selectedDishes={selectedDishes}
              toggleDish={toggleDish}
              customDishes={customDishes}
              setCustomDishes={setCustomDishes}
            />
          )}
          {step === 5 && (
            <Step5
              bankHolder={bankHolder}
              setBankHolder={setBankHolder}
              bankIfsc={bankIfsc}
              setBankIfsc={setBankIfsc}
              bankAccount={bankAccount}
              setBankAccount={setBankAccount}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backBtnText}>{t('chefOnboard.back', 'Back')}</Text>
            </Pressable>
          )}
          <View style={styles.continueWrap}>
            <Button
              label={isSaving ? t('chefOnboard.saving', 'Saving...') : step === TOTAL_STEPS ? t('chefOnboard.finishSetup', 'Finish Setup') : t('chefOnboard.continue', 'Continue')}
              onPress={handleContinue}
              disabled={isSaving}
              flex
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({
  kitchenName,
  setKitchenName,
  chefName,
  setChefName,
}: {
  kitchenName: string;
  setKitchenName: (v: string) => void;
  chefName: string;
  setChefName: (v: string) => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);

  return (
    <View>
      <Text style={styles.stepTitle}>{t('chefOnboard.s1.title', 'Name your kitchen')}</Text>
      <Text style={styles.stepBody}>{t('chefOnboard.s1.body', 'This is your brand that customers see.')}</Text>

      <Text style={styles.inputLabel}>{t('chefOnboard.s1.kitchenName', 'Kitchen name')}</Text>
      <TextInput
        style={styles.input}
        value={kitchenName}
        onChangeText={setKitchenName}
        placeholder={t('chefOnboard.s1.kitchenNamePh', "e.g., Priya's Kitchen")}
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>{t('chefOnboard.s1.yourName', 'Your name')}</Text>
      <TextInput
        style={styles.input}
        value={chefName}
        onChangeText={setChefName}
        placeholder={t('chefOnboard.s1.yourNamePh', 'e.g., Priya Sharma')}
        placeholderTextColor={Colors.muted}
        returnKeyType="done"
      />

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          {t('chefOnboard.s1.note', 'Your name can be hidden from consumers if you prefer privacy.')}
        </Text>
      </View>
    </View>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({
  society,
  setSociety,
  tower,
  setTower,
  flat,
  setFlat,
}: {
  society: string;
  setSociety: (v: string) => void;
  tower: string;
  setTower: (v: string) => void;
  flat: string;
  setFlat: (v: string) => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View>
      <Text style={styles.stepTitle}>{t('chefOnboard.s2.title', 'Where is your kitchen?')}</Text>
      <Text style={styles.stepBody}>{t('chefOnboard.s2.body', 'Used for delivery routing and society matching.')}</Text>

      <Text style={styles.inputLabel}>{t('chefOnboard.s2.society', 'Society')}</Text>
      <TextInput
        style={styles.input}
        value={society}
        onChangeText={setSociety}
        placeholder={t('chefOnboard.s2.societyPh', 'e.g., Lotus Heights')}
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>{t('chefOnboard.s2.tower', 'Tower / Block')}</Text>
      <TextInput
        style={styles.input}
        value={tower}
        onChangeText={setTower}
        placeholder={t('chefOnboard.s2.towerPh', 'e.g., Tower B')}
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>{t('chefOnboard.s2.flat', 'Flat number')}</Text>
      <TextInput
        style={styles.input}
        value={flat}
        onChangeText={setFlat}
        placeholder={t('chefOnboard.s2.flatPh', 'e.g., B-1204')}
        placeholderTextColor={Colors.muted}
        returnKeyType="done"
      />
    </View>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({
  hideIdentity,
  setHideIdentity,
  hideFlatNumber,
  setHideFlatNumber,
}: {
  hideIdentity: boolean;
  setHideIdentity: (v: boolean) => void;
  hideFlatNumber: boolean;
  setHideFlatNumber: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const isAnonymous = hideIdentity || hideFlatNumber;

  return (
    <View>
      <Text style={styles.stepTitle}>{t('chefOnboard.s3.title', 'Control your privacy')}</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>{t('chefOnboard.s3.hideName', 'Hide your name from consumers')}</Text>
        </View>
        <Switch
          value={hideIdentity}
          onValueChange={setHideIdentity}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.toggleRow, styles.toggleRowBorder]}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>{t('chefOnboard.s3.hideFlat', 'Hide your flat number')}</Text>
        </View>
        <Switch
          value={hideFlatNumber}
          onValueChange={setHideFlatNumber}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      <Text style={styles.stepBody}>
        {t('chefOnboard.s3.body', 'Your kitchen brand, society, and dish details are always visible. Name and flat stay private if you enable this.')}
      </Text>

      <View style={styles.badgeRow}>
        {isAnonymous ? (
          <Badge label={t('chefOnboard.s3.anonymous', 'Anonymous')} tone="gold" />
        ) : (
          <Badge label={t('chefOnboard.s3.public', 'Public')} tone="blue" />
        )}
      </View>
    </View>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4({
  selectedDishes,
  toggleDish,
  customDishes,
  setCustomDishes,
}: {
  selectedDishes: Set<string>;
  toggleDish: (id: string) => void;
  customDishes: Dish[];
  setCustomDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const catLabel = (c: string) => t(`chefOnboard.s4.cat.${c}`, c);

  const [showAddForm, setShowAddForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('North Indian');
  const [price, setPrice] = useState('');
  const [foodType, setFoodType] = useState<'Veg' | 'NonVeg'>('Veg');

  const CATEGORY_OPTIONS = ['North Indian', 'South Indian', 'Homestyle', 'Biryani', 'Snacks', 'Dessert', 'Other'];

  function handleAddDish() {
    if (!dishName.trim()) {
      Alert.alert(t('chefOnboard.s4.dishNameRequiredTitle', 'Dish name required'), t('chefOnboard.s4.dishNameRequiredBody', 'Please enter a name for your dish.'));
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert(t('chefOnboard.s4.invalidPriceTitle', 'Invalid price'), t('chefOnboard.s4.invalidPriceBody', 'Please enter a valid price for your dish.'));
      return;
    }

    const newId = `custom-${Date.now()}`;
    const newDish: Dish = {
      id: newId,
      name: dishName.trim(),
      category: category,
      foodType: foodType,
      suggestedPrice: numPrice,
      leadTimeMinutes: 60,
      tags: ['Custom'],
      description: 'Homemade specialty dish',
    };

    setCustomDishes((prev) => [...prev, newDish]);
    if (!selectedDishes.has(newId)) {
      toggleDish(newId);
    }

    setDishName('');
    setPrice('');
    setShowAddForm(false);
  }

  const allDishes = [...DISHES, ...customDishes];

  return (
    <View>
      <Text style={styles.stepTitle}>{t('chefOnboard.s4.title', 'Select dishes for your menu')}</Text>
      <Text style={styles.stepBody}>
        {t('chefOnboard.s4.body', 'Pick from our starter list or enter your dishes manually below.')}
      </Text>

      {allDishes.map((dish) => {
        const isSelected = selectedDishes.has(dish.id);
        return (
          <Pressable
            key={dish.id}
            style={[styles.dishRow, isSelected && styles.dishRowSelected]}
            onPress={() => toggleDish(dish.id)}
          >
            <DishVisual dish={dish} size="sm" />
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{dish.name}</Text>
              <Text style={styles.dishMeta}>
                {catLabel(dish.category)} · {money(dish.suggestedPrice)}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {!showAddForm ? (
        <Pressable style={styles.addCustomBtn} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addCustomBtnText}>{t('chefOnboard.s4.enterManually', '+ Enter Dish Manually')}</Text>
        </Pressable>
      ) : (
        <View style={styles.customFormCard}>
          <Text style={styles.customFormTitle}>{t('chefOnboard.s4.addCustom', 'Add Custom Dish')}</Text>

          <Text style={styles.inputLabel}>{t('chefOnboard.s4.dishName', 'Dish Name')}</Text>
          <TextInput
            style={styles.input}
            value={dishName}
            onChangeText={setDishName}
            placeholder={t('chefOnboard.s4.dishNamePh', 'e.g., Special Butter Chicken')}
            placeholderTextColor={Colors.muted}
          />

          <Text style={styles.inputLabel}>{t('chefOnboard.s4.category', 'Category')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {CATEGORY_OPTIONS.map((cat) => (
              <Pill
                key={cat}
                label={catLabel(cat)}
                active={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>{t('chefOnboard.s4.type', 'Type')}</Text>
          <View style={styles.typeRow}>
            <Pill
              label={t('chefOnboard.s4.veg', '🌱 Veg')}
              active={foodType === 'Veg'}
              onPress={() => setFoodType('Veg')}
            />
            <Pill
              label={t('chefOnboard.s4.nonVeg', '🍗 Non-Veg')}
              active={foodType === 'NonVeg'}
              onPress={() => setFoodType('NonVeg')}
            />
          </View>

          <Text style={styles.inputLabel}>{t('chefOnboard.s4.price', 'Price (₹)')}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder={t('chefOnboard.s4.pricePh', 'e.g., 150')}
            placeholderTextColor={Colors.muted}
            keyboardType="number-pad"
          />

          <View style={styles.customFormActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelBtnText}>{t('chefOnboard.s4.cancel', 'Cancel')}</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={handleAddDish}>
              <Text style={styles.addBtnText}>{t('chefOnboard.s4.addDish', 'Add Dish')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5({
  bankHolder,
  setBankHolder,
  bankIfsc,
  setBankIfsc,
  bankAccount,
  setBankAccount,
}: {
  bankHolder: string;
  setBankHolder: (v: string) => void;
  bankIfsc: string;
  setBankIfsc: (v: string) => void;
  bankAccount: string;
  setBankAccount: (v: string) => void;
}) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View>
      <Text style={styles.stepTitle}>{t('chefOnboard.s5.title', 'Set up your payout')}</Text>
      <Text style={styles.stepBody}>
        {t('chefOnboard.s5.body', 'Your earnings will be settled weekly after platform and gateway fees.')}
      </Text>

      <View style={styles.feeCard}>
        <Text style={styles.feeCardText}>{t('chefOnboard.s5.fee', 'Platform 10% · Gateway 2% · You receive ~88%')}</Text>
      </View>

      <Text style={styles.inputLabel}>{t('chefOnboard.s5.holder', 'Account holder name')}</Text>
      <TextInput
        style={styles.input}
        value={bankHolder}
        onChangeText={setBankHolder}
        placeholder={t('chefOnboard.s5.holderPh', 'e.g., Kavita Sharma')}
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>{t('chefOnboard.s5.ifsc', 'IFSC code')}</Text>
      <TextInput
        style={styles.input}
        value={bankIfsc}
        onChangeText={setBankIfsc}
        placeholder={t('chefOnboard.s5.ifscPh', 'e.g., HDFC0001234')}
        placeholderTextColor={Colors.muted}
        autoCapitalize="characters"
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>{t('chefOnboard.s5.account', 'Account number')}</Text>
      <TextInput
        style={styles.input}
        value={bankAccount}
        onChangeText={setBankAccount}
        placeholder={t('chefOnboard.s5.accountPh', 'Enter account number')}
        placeholderTextColor={Colors.muted}
        secureTextEntry
        keyboardType="number-pad"
        returnKeyType="done"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any, isDark?: boolean) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotFilled: {
    backgroundColor: Colors.primary,
  },
  stepDotEmpty: {
    backgroundColor: Colors.border,
    borderWidth: 1,
    borderColor: Colors.muted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 8,
  },
  stepBody: {
    fontSize: 14,
    color: isDark ? Colors.muted : '#5C4D3C',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#FAF6F0' : '#2B2118',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  noteBox: {
    marginTop: 16,
    backgroundColor: isDark ? 'rgba(245,190,79,0.15)' : '#FFF6DF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,190,79,0.3)' : '#F5D8A0',
    borderRadius: 10,
    padding: 12,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#F5BE4F' : '#734E0E',
    lineHeight: 20,
  },
  pillScroll: {
    marginBottom: 4,
  },
  pillScrollContent: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 16,
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  badgeRow: {
    marginTop: 8,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  dishRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FAF1DF',
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  dishMeta: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  addCustomBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    backgroundColor: isDark ? 'rgba(18, 53, 36, 0.15)' : '#FAF1DF',
  },
  addCustomBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  customFormCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  customFormTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  customFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.muted,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  feeCard: {
    backgroundColor: Colors.blueBadge,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  feeCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.blue,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.muted,
  },
  continueWrap: {
    flex: 1,
  },
});
