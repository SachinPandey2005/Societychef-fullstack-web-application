import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getSupplies, placeSupplyOrder } from '../../services';
import { money } from '../../lib/format';
import type { Supply } from '../../types';

export default function SuppliesScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [cart, setCart]         = useState<Record<string, number>>({}); // id → qty
  const [isLoading, setIsLoading] = useState(true);
  const [ordering, setOrdering]   = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getSupplies().then((data) => { setSupplies(data); setIsLoading(false); });
  }, []);

  function increment(id: string) {
setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }
  function decrement(id: string) {
setCart((prev) => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  }

  const cartItems   = Object.entries(cart).filter(([, qty]) => qty > 0);
  const cartCount   = cartItems.reduce((s, [, q]) => s + q, 0);
  const cartTotal   = cartItems.reduce((s, [id, q]) => {
    return s + (supplies.find((su) => su.id === id)?.price ?? 0) * q;
  }, 0);

  async function handleCheckout() {
    if (cartCount === 0) return;
    setOrdering(true);
    try {
      await placeSupplyOrder(cartItems.map(([supply_item_id, quantity]) => ({ supply_item_id, quantity })));
      setCart({});
      Alert.alert(t('supplies.orderPlacedTitle', 'Order placed!'), t('supplies.orderPlacedBody', 'Packing supplies will be delivered to your kitchen within 2 days.'));
    } catch (err: any) {
      Alert.alert(t('supplies.orderFailedTitle', 'Order failed'), err?.message || t('supplies.orderFailedBody', 'Could not place this order. Please try again.'));
    } finally {
      setOrdering(false);
    }
  }

  if (isLoading) return <LoadingSpinner fullscreen label={t('supplies.loading', 'Loading supplies...')} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Gradient header ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#7c3d00', '#b85c10', '#d97706']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.headerEyebrow}>{t('supplies.eyebrow', 'KITCHEN STORE')}</Text>
              <Text style={styles.headerTitle}>{t('supplies.title', 'Packing supplies')}</Text>
            </View>
            <LanguageTogglePill darkBg />
          </View>
          <Text style={styles.headerSub}>{t('supplies.subtitle', 'Containers · foil · labels · cutlery · bags')}</Text>

          {/* Cart pill in header */}
          {cartCount > 0 && (
            <View style={styles.headerCartPill}>
              <Ionicons name="bag-outline" size={14} color={Colors.dark} />
              <Text style={styles.headerCartText}>{t('supplies.cartPill', { count: cartCount, total: money(cartTotal) })}</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── 2-column product grid ────────────────────────────────────────── */}
        <View style={styles.grid}>
          {supplies.map((supply) => {
            const qty     = cart[supply.id] ?? 0;
            const inCart  = qty > 0;
            const imgFailed = imgErrors[supply.id];

            return (
              <View key={supply.id} style={styles.gridItem}>
                <View style={[styles.productCard, inCart && styles.productCardActive]}>

                  {/* Product photo */}
                  <View style={styles.photoWrap}>
                    {supply.image && !imgFailed ? (
                      <Image
                        source={{ uri: supply.image }}
                        style={styles.photo}
                        resizeMode="cover"
                        onError={() => setImgErrors((e) => ({ ...e, [supply.id]: true }))}
                      />
                    ) : (
                      <View style={styles.photoFallback}>
                        <Text style={styles.photoFallbackText}>{supply.iconText}</Text>
                      </View>
                    )}

                    {/* In-cart badge */}
                    {inCart && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{qty}</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{supply.name}</Text>
                    <Text style={styles.productUnit}>{supply.unit}</Text>
                    <Text style={styles.productPrice}>{money(supply.price)}</Text>
                  </View>

                  {/* Add / stepper */}
                  {inCart ? (
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepperBtn} onPress={() => decrement(supply.id)}>
                        <Ionicons name="remove" size={16} color={Colors.primary} />
                      </Pressable>
                      <Text style={styles.stepperQty}>{qty}</Text>
                      <Pressable style={styles.stepperBtn} onPress={() => increment(supply.id)}>
                        <Ionicons name="add" size={16} color={Colors.primary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.addBtn} onPress={() => increment(supply.id)}>
                      <Ionicons name="add" size={15} color="#fff" />
                      <Text style={styles.addBtnText}>{t('supplies.add', 'Add')}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Sticky checkout bar ──────────────────────────────────────────── */}
        {cartCount > 0 && (
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutBarLeft}>
              <Text style={styles.checkoutBarCount}>{t('supplies.itemCount', { count: cartCount })}</Text>
              <Text style={styles.checkoutBarTotal}>{money(cartTotal)}</Text>
            </View>
            <Button
              label={ordering ? t('supplies.placingOrder', 'Placing order…') : t('supplies.checkout', 'Checkout')}
              variant="primary"
              onPress={handleCheckout}
              loading={ordering}
              disabled={ordering}
            />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Header
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 28 },
  headerEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle:   { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  headerSub:     { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 4, marginBottom: 14 },
  headerCartPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.gold, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  headerCartText: { color: Colors.dark, fontSize: 12, fontWeight: '900' },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingTop: 16, gap: 12,
  },
  gridItem: { width: '47%' },

  // Product card
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
    overflow: 'hidden',
  },
  productCardActive: {
    borderColor: Colors.primary,
  },

  // Photo
  photoWrap: { position: 'relative', width: '100%', aspectRatio: 1 },
  photo:     { width: '100%', height: '100%' },
  photoFallback: {
    width: '100%', height: '100%',
    backgroundColor: Colors.goldBadge,
    alignItems: 'center', justifyContent: 'center',
  },
  photoFallbackText: { fontSize: 28, fontWeight: '900', color: '#7c5400' },
  cartBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Info
  productInfo: { padding: 10, gap: 2 },
  productName:  { fontSize: 13, fontWeight: '800', color: Colors.dark, lineHeight: 18 },
  productUnit:  { fontSize: 11, color: Colors.muted },
  productPrice: { fontSize: 16, fontWeight: '900', color: Colors.primary, marginTop: 4 },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    margin: 10, marginTop: 0, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Stepper (when in cart)
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 10, marginTop: 0,
    backgroundColor: Colors.greenBadge, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primary, overflow: 'hidden',
  },
  stepperBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', width: 36 },
  stepperQty: { fontSize: 15, fontWeight: '900', color: Colors.primary, flex: 1, textAlign: 'center' },

  // Checkout bar
  checkoutBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  checkoutBarLeft: { gap: 1 },
  checkoutBarCount: { fontSize: 12, color: Colors.muted, fontWeight: '700' },
  checkoutBarTotal: { fontSize: 20, fontWeight: '900', color: Colors.primary },
});
