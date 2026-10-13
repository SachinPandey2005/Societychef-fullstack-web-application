import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/useThemeStore';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { DishVisual } from './ui/DishVisual';
import { money } from '../lib/format';
import { getDishAddons } from '../services';
import type { Dish, DishAddon } from '../types';
import type { ConsumerDishItem } from './ConsumerDishCard';

export type AddonOption = DishAddon;

type DishDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  dish: Dish | ConsumerDishItem | any;
  kitchen?: {
    id: string;
    name: string;
    society?: string;
  };
  onOrderNow?: (dish: any, quantity: number, selectedAddons: AddonOption[]) => void;
};

export function DishDetailModal({
  visible,
  onClose,
  dish,
  kitchen,
  onOrderNow,
}: DishDetailModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark, insets.bottom);

  const addItem = useCartStore((s) => s.addItem);
  const { isDishFavorite, toggleDishFavorite } = useFavoritesStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [realAddons, setRealAddons] = useState<AddonOption[]>([]);

  const openDishId = dish?.id || dish?.dishId;

  // Reset state when opening a new dish
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSelectedAddons([]);
      setCopied(false);
    }
  }, [visible, dish]);

  // Previously this showed a hardcoded, category-keyed fake list ("Extra
  // Mint Chutney") no chef ever set — and selecting one didn't even reach
  // checkout, so the inflated total shown here never matched what was
  // actually charged. Now fetched per dish from the chef's own real
  // add-ons (GET /dishes/:id/addons).
  useEffect(() => {
    if (!visible || !openDishId) {
      setRealAddons([]);
      return;
    }
    let cancelled = false;
    getDishAddons(openDishId)
      .then((addons) => { if (!cancelled) setRealAddons(addons); })
      .catch(() => { if (!cancelled) setRealAddons([]); });
    return () => { cancelled = true; };
  }, [visible, openDishId]);

  if (!dish) return null;

  const dishId = dish.id || dish.dishId || 'dish';
  const dishName = dish.dishName || dish.name || t('dishModal.dishItem', 'Dish Item');
  const rawPrice = dish.price ?? dish.suggestedPrice ?? 140;
  const isVeg =
    dish.category?.toLowerCase() === 'veg' ||
    dish.foodType === 'Veg' ||
    !(
      dishName.toLowerCase().includes('chicken') ||
      dishName.toLowerCase().includes('mutton') ||
      dishName.toLowerCase().includes('egg') ||
      dishName.toLowerCase().includes('fish')
    );

  const descriptionText =
    dish.description ||
    (dishName.toLowerCase().includes('biryani')
      ? t('dishModal.descBiryani', 'Fragrant long-grain basmati rice cooked on dum with seasonal vegetables, aromatic spices, fresh mint, and saffron. Served with cucumber mint raita. Allergens - Milk, Dairy, Nuts.')
      : dishName.toLowerCase().includes('cake')
      ? t('dishModal.descCake', 'A delectable combination of melted chocolate and truffles, crafted to delight chocolate enthusiasts. Allergens - Cereals, Milk, Soy.')
      : t('dishModal.descDefault', 'Freshly prepared homestyle dish prepared with pure ingredients, authentic home recipes, and extreme hygiene.'));

  const isFav = isDishFavorite(dishId);

  const availableAddons: AddonOption[] = realAddons;

  function toggleAddon(addonId: string) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  }

  // Calculate total price including add-ons
  const addonsCost = availableAddons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const unitPrice = rawPrice + addonsCost;
  const totalPrice = unitPrice * quantity;

  function handleShare() {
    Alert.alert(
      t('dishModal.shareTitle', 'Share Dish 📲'),
      t('dishModal.shareBody', { defaultValue: 'Check out "{{dish}}" from {{kitchen}} on RasoHi!', dish: dishName, kitchen: kitchen?.name || t('dishModal.homeChef', 'HomeChef') }),
      [{ text: t('dishModal.ok', 'OK') }]
    );
  }

  function handleAddToCart() {
    const kitchenId = kitchen?.id || dish?.chefId || dish?.kitchenId || 'sakshi-kitchen';
    const kitchenName = kitchen?.name || dish?.kitchenName || 'Home Kitchen';
    const dishName = dish?.name || dish?.dishName || 'HomeChef Dish';
    const price = dish?.price || dish?.suggestedPrice || 140;

    if (onOrderNow) {
      // The shared multi-item cart (useCartStore) has no concept of a
      // dish's selected add-ons — merging by kitchenId+dishId alone would
      // either lose the selection or wrongly conflate it with a
      // plain/differently-customized copy of the same dish already in the
      // cart. onOrderNow goes straight to a single-dish checkout instead,
      // so the cart is intentionally left untouched here.
      const chosenAddons = availableAddons.filter((a) => selectedAddons.includes(a.id));
      onOrderNow(dish, quantity, chosenAddons);
    } else {
      addItem({
        kitchenId,
        dishId,
        quantity,
        dishName,
        kitchenName,
        price,
        societyName: kitchen?.society || dish?.societyName,
        imageUrl: (dish as any)?.image || (dish as any)?.imageUrl,
      });
      Alert.alert(
        t('dishModal.addedTitle', 'Added to Cart! 🛒'),
        t('dishModal.addedBody', { defaultValue: '{{count}}x {{dish}} has been added to your cart.', count: quantity, dish: dishName })
      );
    }
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          {/* Floating Close Button at top */}
          <Pressable style={styles.floatingCloseBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dish details">
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* HERO IMAGE CONTAINER */}
            <View style={styles.imageContainer}>
              {dish.image || dish.image_url ? (
                <Image
                  source={{ uri: dish.image || dish.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.dishVisualWrap}>
                  <DishVisual dish={{ ...dish, name: dishName }} size="md" />
                </View>
              )}
            </View>

            {/* MAIN DISH DETAILS SHEET */}
            <View style={styles.detailsBody}>
              
              {/* Veg / Non-Veg Tag */}
              <View style={styles.badgeRow}>
                <View style={[styles.vegSquare, isVeg ? styles.vegSquareGreen : styles.vegSquareRed]}>
                  <View style={[styles.vegCircle, isVeg ? styles.vegCircleGreen : styles.vegCircleRed]} />
                </View>
              </View>

              {/* Title + Action Buttons Row */}
              <View style={styles.titleRow}>
                <Text style={styles.dishTitle}>{dishName}</Text>

                <View style={styles.iconActions}>
                  {/* Bookmark Button */}
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => toggleDishFavorite(dishId)}
                  >
                    <Ionicons
                      name={isFav ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={isFav ? Colors.primary : Colors.muted}
                    />
                  </Pressable>

                  {/* Share Button */}
                  <Pressable style={styles.iconBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color={Colors.muted} />
                  </Pressable>
                </View>
              </View>

              {/* Highlight Tag Pill */}
              <View style={styles.highlightPill}>
                <Ionicons name="sparkles" size={13} color={isDark ? '#4ADE80' : '#15803D'} />
                <Text style={styles.highlightText}>
                  {dishName.toLowerCase().includes('biryani') ? t('dishModal.highlyReordered', 'Highly reordered') : t('dishModal.freshToday', 'Fresh Today')}
                </Text>
              </View>

              {/* Chef Description */}
              <Text style={styles.descriptionText}>{descriptionText}</Text>

              {/* Separator Divider */}
              <View style={styles.divider} />

              {/* CUSTOMIZATIONS / ADD-ONS SECTION */}
              {availableAddons.length > 0 && (
                <View style={styles.addonsSection}>
                  <View style={styles.addonsHeaderRow}>
                    <Text style={styles.addonsTitle}>{t('dishModal.addonsTitle', 'Add-ons / Customizations')}</Text>
                    <Text style={styles.addonsSub}>{t('dishModal.addonsSub', 'Select options to customize your meal')}</Text>
                  </View>

                  {availableAddons.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <Pressable
                        key={addon.id}
                        style={[styles.addonRow, isSelected && styles.addonRowSelected]}
                        onPress={() => toggleAddon(addon.id)}
                      >
                        <View style={styles.addonLeft}>
                          <View style={styles.addonIconPlaceholder}>
                            <Ionicons name="restaurant" size={14} color={Colors.primary} />
                          </View>
                          <Text style={styles.addonName}>{addon.name}</Text>
                        </View>

                        <View style={styles.addonRight}>
                          <Text style={styles.addonPrice}>{money(addon.price)}</Text>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* STICKY BOTTOM ACTION BAR */}
          <View style={styles.bottomBar}>
            {/* Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </Pressable>
              <Text style={styles.stepperQty}>{quantity}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>

            {/* Add Item Button */}
            <Pressable
              style={styles.addMainBtn}
              onPress={handleAddToCart}
              accessibilityRole="button"
              accessibilityLabel={`Add item for ${money(totalPrice)}`}
            >
              <Text style={styles.addMainBtnText}>
                {onOrderNow
                  ? t('dishModal.proceedToOrder', { defaultValue: 'Proceed to order - {{price}}', price: money(totalPrice) })
                  : t('dishModal.addItem', { defaultValue: 'Add item - {{price}}', price: money(totalPrice) })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any, isDark: boolean, safeBottom: number = 0) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    floatingCloseBtn: {
      position: 'absolute',
      top: 14,
      alignSelf: 'center',
      zIndex: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(0, 0, 0, 0.6)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollBody: {
      paddingBottom: 20,
    },
    imageContainer: {
      width: '100%',
      height: 240,
      backgroundColor: isDark ? '#18181B' : '#FFF3E0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    dishVisualWrap: {
      transform: [{ scale: 1.2 }],
    },
    detailsBody: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    badgeRow: {
      marginBottom: 8,
    },
    vegSquare: {
      width: 18,
      height: 18,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },
    vegSquareGreen: { borderColor: '#16A34A' },
    vegSquareRed: { borderColor: '#DC2626' },
    vegCircle: { width: 8, height: 8, borderRadius: 4 },
    vegCircleGreen: { backgroundColor: '#16A34A' },
    vegCircleRed: { backgroundColor: '#DC2626' },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    dishTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1C1917',
      flex: 1,
      marginRight: 12,
      lineHeight: 26,
    },
    iconActions: {
      flexDirection: 'row',
      gap: 10,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginBottom: 12,
    },
    highlightText: {
      color: isDark ? '#4ADE80' : '#15803D',
      fontSize: 12,
      fontWeight: '700',
    },
    descriptionText: {
      fontSize: 14,
      color: isDark ? '#D4D4D8' : '#4B5563',
      lineHeight: 20,
      marginBottom: 16,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
      marginVertical: 12,
    },
    addonsSection: {
      marginTop: 4,
      marginBottom: 16,
    },
    addonsHeaderRow: {
      marginBottom: 12,
    },
    addonsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1C1917',
      marginBottom: 2,
    },
    addonsSub: {
      fontSize: 12,
      color: isDark ? '#A1A1AA' : '#6B7280',
    },
    addonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? 'transparent' : '#E5E7EB',
    },
    addonRowSelected: {
      borderColor: Colors.primary,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
    },
    addonLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    addonImage: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    addonIconPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addonName: {
      fontSize: 14,
      color: isDark ? '#F4F4F5' : '#1F2937',
      fontWeight: '600',
      flex: 1,
    },
    addonRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    addonPrice: {
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#111827',
      fontWeight: '700',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: isDark ? '#71717A' : '#9CA3AF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Math.max(14, safeBottom + 8),
      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
      borderTopWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 14,
    },
    stepperBtn: {
      paddingHorizontal: 6,
    },
    stepperBtnText: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.primary,
    },
    stepperQty: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1F2937',
    },
    addMainBtn: {
      flex: 1,
      backgroundColor: Colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMainBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
  });
