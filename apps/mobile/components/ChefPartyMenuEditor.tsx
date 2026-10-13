import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import type { PartyMenu, PartyPackage, PartyDish, PartyDishCategory } from '../types';
import { getPartyMenu, savePartyMenu } from '../services';

type ChefPartyMenuEditorProps = {
  kitchenId: string;
};

export function ChefPartyMenuEditor({ kitchenId }: ChefPartyMenuEditorProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const catLabel = (c: string) => t(`chefPartyEditor.cat.${c}`, c);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [minGuests, setMinGuests] = useState('8');
  const [advanceHours, setAdvanceHours] = useState('48');
  const [packages, setPackages] = useState<PartyPackage[]>([
    {
      id: 'dawaat',
      name: 'DAWAAT',
      pricePerHead: 280,
      categoryCaps: { starters: 2, mains: 3, breads: 1, sweets: 1 },
      description: 'Standard gathering pack',
    },
    {
      id: 'jalsa',
      name: 'JALSA',
      pricePerHead: 450,
      isPopular: true,
      categoryCaps: { starters: 3, mains: 4, breads: 1, sweets: 2 },
      description: 'Premium feast pack',
    },
  ]);
  const [dishes, setDishes] = useState<PartyDish[]>([
    { id: 'p1', name: 'Paneer tikka', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p2', name: 'Corn seekh kebab', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p3', name: 'Chicken malai tikka', category: 'Starters', extraChargePerHead: 40, isAvailable: true, isVeg: false },
    { id: 'p5', name: 'Dal Makhani', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p6', name: 'Paneer Butter Masala', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p9', name: 'Butter Naan', category: 'Breads', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p11', name: 'Gulab jamun', category: 'Sweets', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p12', name: 'Rasmalai', category: 'Sweets', extraChargePerHead: 20, isAvailable: true, isVeg: true },
  ]);

  // Form for adding new party dish
  const [newDishName, setNewDishName] = useState('');
  const [newDishCat, setNewDishCat] = useState<PartyDishCategory>('Starters');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishExtra, setNewDishExtra] = useState('0');

  const [kidsMenuPrice, setKidsMenuPrice] = useState<string>('120');
  const [partyTags, setPartyTags] = useState<string[]>(['veg', 'jain', 'punjabi']);

  useEffect(() => {
    getPartyMenu(kitchenId).then((pm) => {
      if (pm) {
        setIsEnabled(pm.isEnabled);
        setMinGuests(String(pm.minGuests || 4));
        setAdvanceHours(String(pm.advanceNoticeHours || 24));
        if (pm.kidsMenuPricePerHead) setKidsMenuPrice(String(pm.kidsMenuPricePerHead));
        if (pm.packages && pm.packages.length > 0) setPackages(pm.packages);
        if (pm.dishes && pm.dishes.length > 0) setDishes(pm.dishes);
        if ((pm as any).partyTags && Array.isArray((pm as any).partyTags)) setPartyTags((pm as any).partyTags);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [kitchenId]);

  function updatePackagePrice(packId: string, newPriceStr: string) {
    const newPrice = parseInt(newPriceStr, 10) || 0;
    setPackages((prev) =>
      prev.map((p) => (p.id === packId ? { ...p, pricePerHead: newPrice } : p))
    );
  }

  function handleAddDish() {
    if (!newDishName.trim()) {
      Alert.alert(t('chefPartyEditor.missingNameTitle', 'Missing name'), t('chefPartyEditor.missingNameBody', 'Please enter dish name.'));
      return;
    }
    const extra = parseInt(newDishExtra, 10) || 0;
    const newDishItem: PartyDish = {
      id: `custom_p_${Date.now()}`,
      name: newDishName.trim(),
      category: newDishCat,
      extraChargePerHead: extra,
      isAvailable: true,
      isVeg: newDishIsVeg,
      foodType: newDishIsVeg ? 'Veg' : 'NonVeg',
    };
    setDishes((prev) => [...prev, newDishItem]);
    setNewDishName('');
    setNewDishExtra('0');
  }

  function toggleDishAvailable(id: string) {
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isAvailable: !d.isAvailable } : d))
    );
  }

  function removeDish(id: string) {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSave() {
    const minG = parseInt(minGuests, 10) || 8;
    const advH = Math.max(24, parseInt(advanceHours, 10) || 24);
    const kidsP = parseInt(kidsMenuPrice, 10) || 120;

    setIsSaving(true);
    try {
      await savePartyMenu(kitchenId, {
        kitchenId,
        isEnabled,
        minGuests: minG,
        advanceNoticeHours: advH,
        kidsMenuPricePerHead: kidsP,
        packages,
        dishes,
        partyTags,
      } as any);
      Alert.alert(t('chefPartyEditor.savedTitle', 'Saved!'), t('chefPartyEditor.savedBody', 'Party menu settings updated successfully.'));
    } catch (err: any) {
      Alert.alert(t('chefPartyEditor.errorTitle', 'Error'), err.message || t('chefPartyEditor.errorBody', 'Failed to save party menu.'));
    } finally {
      setIsSaving(false);
    }
  }

  const categories: PartyDishCategory[] = ['Starters', 'Mains', 'Breads', 'Sweets', 'Kids'];

  if (isLoading) {
    return <Text style={{ padding: 20, color: Colors.muted }}>{t('chefPartyEditor.loading', 'Loading Party Menu configuration...')}</Text>;
  }

  const isPublished = isEnabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Published Banner & Status Card */}
      <View style={[styles.switchRow, isPublished && { borderColor: '#16A34A', backgroundColor: '#F0FDF4' }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name={isPublished ? "checkmark-circle" : "ellipse-outline"} size={20} color={isPublished ? "#16A34A" : Colors.muted} />
            <Text style={[styles.switchTitle, { flex: 1 }, isPublished && { color: '#15803D', fontWeight: '800' }]} numberOfLines={1}>
              {isPublished ? t('chefPartyEditor.statusLiveTitle', 'Party Mode Live & Published 🎉') : t('chefPartyEditor.statusEnableTitle', 'Enable Party Mode')}
            </Text>
          </View>
          <Text style={styles.switchSub}>
            {isPublished
              ? t('chefPartyEditor.statusLiveSub', 'Your party kitchen is live on the Consumer app. You can update booking rules, prices, or dishes below.')
              : t('chefPartyEditor.statusEnableSub', 'Allow consumers to pre-book bulk orders from your kitchen')}
          </Text>
        </View>
        <Switch value={isEnabled} onValueChange={setIsEnabled} trackColor={{ true: '#16A34A', false: '#D1D5DB' }} />
      </View>

      {/* Party Dietary & Cuisine Filter Tags */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('chefPartyEditor.tagsTitle', 'Party Kitchen Dietary & Cuisine Tags')}</Text>
        <Text style={styles.cardSub}>{t('chefPartyEditor.tagsSub', 'Select all tags that apply so consumers searching for Veg, Jain, or regional party kitchens can find you')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {[
            { id: 'veg', label: t('chefPartyEditor.tag.veg', '100% Veg') },
            { id: 'non-veg', label: t('chefPartyEditor.tag.non-veg', 'Non-veg') },
            { id: 'jain', label: t('chefPartyEditor.tag.jain', 'Jain-friendly') },
            { id: 'bengali', label: t('chefPartyEditor.tag.bengali', 'Bengali') },
            { id: 'punjabi', label: t('chefPartyEditor.tag.punjabi', 'Punjabi') },
            { id: 'south-indian', label: t('chefPartyEditor.tag.south-indian', 'South Indian') },
            { id: 'continental', label: t('chefPartyEditor.tag.continental', 'Continental') },
          ].map((tag) => {
            const isSelected = partyTags.includes(tag.id);

            return (
              <Pressable
                key={tag.id}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D97724', backgroundColor: '#FFF' },
                  isSelected && { backgroundColor: '#2C1B14', borderColor: '#2C1B14' },
                ]}
                onPress={() => {
                  setPartyTags((prev) =>
                    prev.includes(tag.id) ? prev.filter((x) => x !== tag.id) : [...prev, tag.id]
                  );
                }}
              >
                <Text style={[{ fontSize: 12, fontWeight: '700', color: '#D97724' }, isSelected && { color: '#FFF' }]}>
                  {tag.label} {isSelected ? '✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Constraints */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('chefPartyEditor.rulesTitle', 'Booking Rules')}</Text>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelFixedHeader}>
              <Text style={styles.inputLabel}>{t('chefPartyEditor.minGuests', 'Min Guests')}</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TextInput
                style={styles.stepperInput}
                keyboardType="number-pad"
                value={minGuests}
                onChangeText={setMinGuests}
              />
              <View style={styles.stepperArrows}>
                <Pressable
                  style={styles.arrowBtn}
                  onPress={() => {
                    const current = parseInt(minGuests, 10) || 1;
                    setMinGuests(String(current + 1));
                  }}
                >
                  <Ionicons name="chevron-up" size={14} color="#5C4E46" />
                </Pressable>
                <Pressable
                  style={styles.arrowBtn}
                  onPress={() => {
                    const current = parseInt(minGuests, 10) || 1;
                    setMinGuests(String(Math.max(1, current - 1)));
                  }}
                >
                  <Ionicons name="chevron-down" size={14} color="#5C4E46" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.labelFixedHeader}>
              <Text style={styles.inputLabel}>{t('chefPartyEditor.advanceNotice', 'Advance Notice (hrs, min 48)')}</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TextInput
                style={styles.stepperInput}
                keyboardType="number-pad"
                value={advanceHours}
                onChangeText={setAdvanceHours}
              />
              <View style={styles.stepperArrows}>
                <Pressable
                  style={styles.arrowBtn}
                  onPress={() => {
                    const current = parseInt(advanceHours, 10) || 48;
                    setAdvanceHours(String(current + 1));
                  }}
                >
                  <Ionicons name="chevron-up" size={14} color="#5C4E46" />
                </Pressable>
                <Pressable
                  style={styles.arrowBtn}
                  onPress={() => {
                    const current = parseInt(advanceHours, 10) || 48;
                    setAdvanceHours(String(Math.max(1, current - 1)));
                  }}
                >
                  <Ionicons name="chevron-down" size={14} color="#5C4E46" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Packages & Chef Custom Per-Head Pricing */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('chefPartyEditor.pkgPricesTitle', 'Configure Package Prices (Per Head)')}</Text>
        <Text style={styles.cardSub}>{t('chefPartyEditor.pkgPricesSub', 'Set your custom price per guest for each party pack')}</Text>

        {packages.map((pack) => (
          <View key={pack.id} style={styles.packEditRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.packName}>{t('chefPartyEditor.packName', { defaultValue: '{{name}} Pack', name: pack.name })}</Text>
              <Text style={styles.packDesc}>{pack.description}</Text>
            </View>
            <View style={styles.priceInputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="number-pad"
                value={String(pack.pricePerHead)}
                onChangeText={(val) => updatePackagePrice(pack.id, val)}
              />
              <Text style={styles.headSuffix}>{t('chefPartyEditor.perHead', '/head')}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.packEditRow, { borderTopWidth: 1, borderTopColor: '#E8E1D9', paddingTop: 12, marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.packName}>{t('chefPartyEditor.kidsAddon', '🧒 Kids Menu Add-on')}</Text>
            <Text style={styles.packDesc}>{t('chefPartyEditor.kidsAddonDesc', 'Lighter portions, mild spice for children')}</Text>
          </View>
          <View style={styles.priceInputWrap}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="number-pad"
              value={kidsMenuPrice}
              onChangeText={setKidsMenuPrice}
            />
            <Text style={styles.headSuffix}>{t('chefPartyEditor.perKid', '/kid')}</Text>
          </View>
        </View>
      </View>

      {/* Dishes Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('chefPartyEditor.dishesTitle', 'Party Dishes & Extra Charges')}</Text>

        {/* Add New Dish */}
        <View style={styles.addDishBox}>
          <Text style={styles.addDishHeading}>{t('chefPartyEditor.addItemHeading', 'Add Party Item')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('chefPartyEditor.itemNamePh', 'Item name (e.g. Paneer Tikka)')}
            placeholderTextColor="#A0938A"
            value={newDishName}
            onChangeText={setNewDishName}
          />
          {/* Veg / Non-Veg Selector & Category Selector */}
          <View style={styles.vegToggleRow}>
            <Pressable
              style={[styles.vegBtn, newDishIsVeg && styles.vegBtnActive]}
              onPress={() => setNewDishIsVeg(true)}
            >
              <View style={[styles.vegDotBorder, { borderColor: '#2E7D32' }]}>
                <View style={[styles.vegDotInner, { backgroundColor: '#2E7D32' }]} />
              </View>
              <Text style={[styles.vegBtnText, newDishIsVeg && styles.vegBtnTextActive]}>{t('chefPartyEditor.veg', 'Veg')}</Text>
            </Pressable>

            <Pressable
              style={[styles.nonVegBtn, !newDishIsVeg && styles.nonVegBtnActive]}
              onPress={() => setNewDishIsVeg(false)}
            >
              <View style={[styles.vegDotBorder, { borderColor: '#C62828' }]}>
                <View style={[styles.vegDotInner, { backgroundColor: '#C62828' }]} />
              </View>
              <Text style={[styles.nonVegBtnText, !newDishIsVeg && styles.nonVegBtnTextActive]}>{t('chefPartyEditor.nonVeg', 'Non-Veg')}</Text>
            </Pressable>
          </View>

          <View style={styles.catPillRow}>
            {categories.map((c) => (
              <Pressable
                key={c}
                style={[styles.catPill, newDishCat === c && styles.catPillActive]}
                onPress={() => setNewDishCat(c)}
              >
                <Text style={[styles.catPillText, newDishCat === c && styles.catPillTextActive]}>{catLabel(c)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabelSingle}>{t('chefPartyEditor.extraChargeLabel', 'Extra charge/head (optional)')}</Text>
            <View style={styles.extraInputWrapFull}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.extraInput}
                placeholder="0"
                placeholderTextColor="#A0938A"
                keyboardType="number-pad"
                value={newDishExtra}
                onChangeText={setNewDishExtra}
              />
            </View>
          </View>
          <Pressable style={styles.addBtnFull} onPress={handleAddDish}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnTextFull}>{t('chefPartyEditor.addPartyDish', 'Add Party Dish')}</Text>
          </Pressable>
        </View>

        {/* Existing Dishes list by category */}
        {categories.map((cat) => {
          const catDishes = dishes.filter((d) => d.category === cat);
          if (catDishes.length === 0) return null;
          return (
            <View key={cat} style={{ marginTop: 12 }}>
              <Text style={styles.catGroupTitle}>{catLabel(cat)}</Text>
              {catDishes.map((dish) => {
                const isVeg = dish.isVeg !== false && dish.foodType !== 'NonVeg';
                return (
                  <View key={dish.id} style={styles.dishRow}>
                    <View style={styles.dishNameContainer}>
                      <View style={[styles.vegBadgeIcon, { borderColor: isVeg ? '#2E7D32' : '#C62828' }]}>
                        <View style={[styles.vegBadgeDot, { backgroundColor: isVeg ? '#2E7D32' : '#C62828' }]} />
                      </View>
                      <Text style={styles.dishNameText}>
                        {dish.name}
                        {dish.extraChargePerHead ? (
                          <Text style={{ color: '#D97724', fontWeight: '700' }}>{t('chefPartyEditor.extraPerHead', { defaultValue: ' (+₹{{amount}}/head)', amount: dish.extraChargePerHead })}</Text>
                        ) : null}
                      </Text>
                    </View>
                    <Switch
                      value={dish.isAvailable}
                      onValueChange={() => toggleDishAvailable(dish.id)}
                      trackColor={{ true: '#2C1B14' }}
                    />
                    <Pressable style={{ marginLeft: 8 }} onPress={() => removeDish(dish.id)}>
                      <Ionicons name="trash-outline" size={18} color="#C62828" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Save / Edit Button */}
      <Pressable
        style={[styles.saveBtn, isSaving && { opacity: 0.6 }, isPublished && { backgroundColor: '#15803D' }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveBtnText}>
          {isSaving ? t('chefPartyEditor.savingChanges', 'Saving Changes...') : (isPublished ? t('chefPartyEditor.updatePublished', 'Update Published Party Menu') : t('chefPartyEditor.publishMenu', 'Publish Party Menu'))}
        </Text>
      </Pressable>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F3EE',
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    switchRow: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5DFD7',
      marginBottom: 16,
    },
    switchTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: '#2C1B14',
    },
    switchSub: {
      fontSize: 12,
      color: '#8A7A70',
      marginTop: 2,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E5DFD7',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2C1B14',
    },
    cardSub: {
      fontSize: 12,
      color: '#8A7A70',
      marginTop: 2,
      marginBottom: 12,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    labelFixedHeader: {
      minHeight: 32,
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
    },
    inputLabelSingle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
      marginBottom: 4,
    },
    textInput: {
      backgroundColor: '#F2ECE4',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: '#2C1B14',
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2ECE4',
      borderRadius: 10,
      paddingLeft: 12,
      paddingRight: 4,
      height: 42,
      overflow: 'hidden',
    },
    stepperInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#2C1B14',
      paddingVertical: 0,
    },
    stepperArrows: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    arrowBtn: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    packEditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F0E8DF',
    },
    packName: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2C1B14',
    },
    packDesc: {
      fontSize: 11,
      color: '#8A7A70',
    },
    priceInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2ECE4',
      borderRadius: 10,
      paddingHorizontal: 8,
    },
    rupeePrefix: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2C1B14',
    },
    priceInput: {
      width: 50,
      paddingVertical: 6,
      paddingHorizontal: 4,
      fontSize: 14,
      fontWeight: '700',
      color: '#2C1B14',
      textAlign: 'center',
    },
    headSuffix: {
      fontSize: 11,
      color: '#8A7A70',
    },
    addDishBox: {
      backgroundColor: '#F7F3EE',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    addDishHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: '#2C1B14',
      marginBottom: 8,
    },
    vegToggleRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    vegBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#EAE3DA',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    vegBtnActive: {
      backgroundColor: '#E8F5E9',
      borderColor: '#2E7D32',
    },
    vegBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
    },
    vegBtnTextActive: {
      color: '#2E7D32',
      fontWeight: '700',
    },
    nonVegBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#EAE3DA',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    nonVegBtnActive: {
      backgroundColor: '#FFEBEE',
      borderColor: '#C62828',
    },
    nonVegBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
    },
    nonVegBtnTextActive: {
      color: '#C62828',
      fontWeight: '700',
    },
    vegDotBorder: {
      width: 14,
      height: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vegDotInner: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    dishNameContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    vegBadgeIcon: {
      width: 14,
      height: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vegBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    catPillRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
    },
    catPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: '#EAE3DA',
    },
    catPillActive: {
      backgroundColor: '#2C1B14',
    },
    catPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#5C4E46',
    },
    catPillTextActive: {
      color: '#FFFFFF',
    },
    extraInputWrapFull: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2ECE4',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
    },
    extraInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: '#2C1B14',
      padding: 0,
      marginLeft: 4,
    },
    addBtnFull: {
      backgroundColor: '#D97724',
      borderRadius: 10,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
    },
    addBtnTextFull: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    catGroupTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#8A7A70',
      marginBottom: 6,
      marginTop: 4,
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F0E8DF',
    },
    dishNameText: {
      fontSize: 14,
      color: '#2C1B14',
      fontWeight: '600',
    },
    saveBtn: {
      backgroundColor: '#2C1B14',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });
