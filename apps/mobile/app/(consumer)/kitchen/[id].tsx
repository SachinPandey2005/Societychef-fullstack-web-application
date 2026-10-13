import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../store/useThemeStore';
import { DISHES } from '../../../constants/data';
import { money } from '../../../lib/format';
import { placeOrder, getWeeklyMenu, getKitchen } from '../../../services';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DishVisual } from '../../../components/ui/DishVisual';
import { ScreenTitle } from '../../../components/ui/ScreenTitle';
import { CheckoutModal } from '../../../components/CheckoutModal';
import { DishDetailModal } from '../../../components/DishDetailModal';
import { useReviewStore, reviewsForKitchen, averageRating } from '../../../store/useReviewStore';
import { useFavoritesStore } from '../../../store/useFavoritesStore';
import { useCartStore, selectCartCount } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import type { Kitchen, WeeklyMenu, DeliveryDetails, DishAddon } from '../../../types';

// Profile components
import { ProfileHero } from '../../../components/profile/ProfileHero';
import { ProfilePromptCard } from '../../../components/profile/ProfilePromptCard';
import { MediaCarousel } from '../../../components/profile/MediaCarousel';
import { HygieneCard } from '../../../components/profile/HygieneCard';
import { InfoCard } from '../../../components/profile/InfoCard';
import { TrustCard } from '../../../components/profile/TrustCard';

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={14}
        color="#f5a623"
      />
    );
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
}

export default function KitchenDetailScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  // Previously hardcoded to a single society, so discounts/order labels were
  // wrong for any consumer not literally in "Lotus Heights".
  const { user } = useAuthStore();
  const CONSUMER_SOCIETY = user?.society ?? 'Lotus Heights';

  const { items: cartItems, addItem, updateQuantity } = useCartStore();
  const totalCartCount = useCartStore(selectCartCount);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [checkoutDishId, setCheckoutDishId] = useState<string | null>(null);
  const [checkoutAddons, setCheckoutAddons] = useState<DishAddon[]>([]);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [selectedDishDetail, setSelectedDishDetail] = useState<any | null>(null);
  const [placing, setPlacing] = useState(false);
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [kitchenLoading, setKitchenLoading] = useState(true);
  const [showFullProfile, setShowFullProfile] = useState(false);

  const { isKitchenFavorite, toggleKitchenFavorite } = useFavoritesStore();
  const isFav = isKitchenFavorite(id || '');

  useEffect(() => {
    if (!id) return;
    setKitchenLoading(true);
    // A failed/empty lookup used to silently fall back to a hardcoded mock
    // kitchen (defaulting to KITCHENS[0] if nothing even loosely matched) —
    // the user would see a completely different, fake kitchen with no
    // indication anything went wrong. Now surfaces the existing "Kitchen not
    // found" state below instead.
    getKitchen(id)
      .then((k) => setKitchen(k || null))
      .catch(() => setKitchen(null))
      .finally(() => setKitchenLoading(false));

    getWeeklyMenu(id).then(setWeeklyMenus).catch(() => {});
  }, [id]);

  const { reviews, loadReviewsForKitchen } = useReviewStore();

  useEffect(() => {
    if (id) loadReviewsForKitchen(id);
  }, [id]);

  const kitchenReviews = reviewsForKitchen(id, reviews);
  const avgRating = averageRating(kitchenReviews);

  if (kitchenLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!kitchen) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('kitchenDetail.notFound', 'Kitchen not found.')}</Text>
          <Button
            label={t('kitchenDetail.goBack', 'Go back')}
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const sameSociety = kitchen.society === CONSUMER_SOCIETY;
  const liveDishesCount = kitchen.dishes?.filter((d) => d.isEnabled !== false).length || 0;
  const weeklyFreeCount = kitchen.dishes?.filter((d) => d.weeklyFree).length || 0;
  const samplesCount = kitchen.dishes?.filter((d) => d.sample).length || 0;

  // Only creates the order and returns it — CheckoutModal charges Cashfree
  // against the real id this returns, and only navigates/clears state once
  // payment is actually confirmed. See app/(consumer)/discover.tsx's
  // handleConfirmOrder for why this must not take payment or navigate itself.
  async function handleConfirmOrder(
    quantity: number,
    _pointsUsed: number,
    allergyInfo: { tags: string[]; otherText: string },
    delivery: DeliveryDetails,
  ) {
    if (!checkoutDishId || !kitchen) throw new Error('Missing dish or kitchen selection');
    setPlacing(true);
    try {
      const order = await placeOrder({
        kitchenId: kitchen.id,
        items: [{ dishId: checkoutDishId, quantity, addonIds: checkoutAddons.map((a) => a.id) }],
        consumerSociety: CONSUMER_SOCIETY,
        allergyInfo,
        delivery,
      });
      setCheckoutDishId(null);
      setCheckoutAddons([]);
      return order;
    } finally {
      setPlacing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button header */}
      <View style={styles.backRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.dark} />
          <Text style={styles.backLabel}>{t('kitchenDetail.back', 'Back')}</Text>
        </Pressable>
        <Pressable onPress={() => toggleKitchenFavorite(id || '')} style={styles.favBtn}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? Colors.primary : Colors.dark} />
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert(
              t('kitchenDetail.reportBlockTitle', 'Report / Block Kitchen'),
              t('kitchenDetail.reportBlockBody', 'Report inappropriate content or block this kitchen profile?'),
              [
                { text: t('kitchenDetail.cancel', 'Cancel'), style: 'cancel' },
                {
                  text: t('kitchenDetail.reportKitchen', 'Report Kitchen'),
                  onPress: () => {
                    Alert.alert(t('kitchenDetail.reportSubmittedTitle', 'Report Submitted'), t('kitchenDetail.reportSubmittedBody', 'Thank you. Our moderation team will review this kitchen within 24 hours.'));
                  },
                },
                {
                  text: t('kitchenDetail.blockKitchen', 'Block Kitchen'),
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(t('kitchenDetail.kitchenBlockedTitle', 'Kitchen Blocked'), t('kitchenDetail.kitchenBlockedBody', 'You will no longer see dishes or messages from this kitchen.'));
                  },
                },
              ]
            );
          }}
          style={styles.favBtn}
        >
          <Ionicons name="flag-outline" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Hero with Cover & Profile Photo */}
        <ProfileHero
          kitchen={kitchen}
          avgRating={avgRating > 0 ? avgRating : kitchen.rating}
          isEditable={false}
          liveDishesCount={liveDishesCount}
          weeklyFreeCount={weeklyFreeCount}
          samplesCount={samplesCount}
        />

        {/* 2. AVAILABLE DISHES / MENU SECTION (Primary Focus) */}
        <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 12 }}>
          <ScreenTitle eyebrow={t('kitchenDetail.chefMenu', 'Chef Menu')} title={t('kitchenDetail.availableDishes', 'Available dishes')} />
        </View>

        {kitchen.dishes.filter((d) => d.isEnabled !== false).map((kitchenDish) => {
          // DISHES (the static demo catalog) is intentionally empty now, so
          // this always missed — falling back to deriving a "name" from the
          // dish's raw UUID (hyphens -> spaces, capitalized) instead of
          // using the kitchen's own real dish name, which was sitting right
          // there on kitchenDish all along once mapDbKitchenDish was fixed
          // to actually include it.
          const dish = DISHES.find((d) => d.id === kitchenDish.dishId) || {
            id: kitchenDish.dishId,
            name: kitchenDish.name,
            category: 'Special',
            foodType: 'Veg' as const,
            suggestedPrice: kitchenDish.price,
            leadTimeMinutes: kitchenDish.leadTimeMinutes,
            tags: [],
          };

          const leadMin = kitchenDish.leadTimeMinutes;
          const leadLabel =
            leadMin < 60
              ? t('kitchenDetail.leadMin', { defaultValue: '{{count}} min', count: leadMin })
              : t('kitchenDetail.leadHr', { defaultValue: '{{count}} hr', count: Math.round(leadMin / 60) });

          const effectivePrice =
            sameSociety && !kitchenDish.weeklyFree
              ? kitchenDish.price * 0.9
              : kitchenDish.price;

          return (
            <View key={kitchenDish.dishId} style={styles.dishCardWrapper}>
              <Card>
                <Pressable onPress={() => setSelectedDishDetail(dish)} accessibilityRole="button" accessibilityLabel={`View details for ${dish.name}`}>
                  <View style={styles.dishRow}>
                    <DishVisual dish={dish} size="sm" />
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishCategory}>{dish.category}</Text>

                      <View style={styles.dishMeta}>
                        <Text style={styles.dishPrice}>
                          {kitchenDish.weeklyFree ? t('kitchenDetail.free', 'FREE') : money(effectivePrice)}
                        </Text>
                        {sameSociety && !kitchenDish.weeklyFree && (
                          <Text style={styles.dishOriginalPrice}>
                            {money(kitchenDish.price)}
                          </Text>
                        )}
                      </View>

                      <Text style={styles.dishAvail}>{kitchenDish.available}</Text>
                      <Text style={styles.dishLead}>{t('kitchenDetail.readyIn', { defaultValue: 'Ready in {{time}}', time: leadLabel })}</Text>

                      <View style={styles.dishBadges}>
                        {kitchenDish.weeklyFree && (
                          <Badge label={t('kitchenDetail.weeklyFree', 'Weekly free')} tone="green" small />
                        )}
                        {kitchenDish.sample && (
                          <Badge label={t('kitchenDetail.freeSample', 'Free sample')} tone="gold" small />
                        )}
                        {!kitchenDish.available && (
                          <Badge label={t('kitchenDetail.unavailable', 'Unavailable')} tone="default" small />
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.orderBtnRow}>
                  {(() => {
                    const cartItem = cartItems.find((i) => i.kitchenId === kitchen.id && i.dishId === kitchenDish.dishId);
                    const qty = cartItem?.quantity || 0;

                    if (qty === 0) {
                      return (
                        <Pressable
                          style={styles.addDishBtn}
                          onPress={() => addItem({
                            kitchenId: kitchen.id,
                            dishId: kitchenDish.dishId,
                            quantity: 1,
                            dishName: dish.name,
                            kitchenName: kitchen.name,
                            price: effectivePrice,
                            societyName: kitchen.society,
                            imageUrl: dish.image,
                          })}
                        >
                          <Ionicons name="add" size={16} color="#FFF" />
                          <Text style={styles.addDishBtnText}>{t('kitchenDetail.addToCart', 'ADD TO CART')}</Text>
                        </Pressable>
                      );
                    }

                    return (
                      <View style={styles.dishStepperWrap}>
                        <Pressable
                          style={styles.dishStepperBtn}
                          onPress={() => updateQuantity(kitchen.id, kitchenDish.dishId, qty - 1)}
                        >
                          <Ionicons name="remove" size={16} color={Colors.primary} />
                        </Pressable>
                        <Text style={styles.dishStepperQty}>{qty}</Text>
                        <Pressable
                          style={styles.dishStepperBtn}
                          onPress={() => updateQuantity(kitchen.id, kitchenDish.dishId, qty + 1)}
                        >
                          <Ionicons name="add" size={16} color={Colors.primary} />
                        </Pressable>
                      </View>
                    );
                  })()}
                </View>
              </Card>
            </View>
          );
        })}

        {/* 3. EXPLORE CHEF PROFILE & KITCHEN STORY BUTTON */}
        <Pressable
          style={styles.exploreProfileBanner}
          onPress={() => setShowFullProfile(!showFullProfile)}
        >
          <View style={styles.exploreProfileLeft}>
            <View style={styles.exploreProfileIconCircle}>
              <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exploreProfileTitle}>{t('kitchenDetail.exploreProfile', 'Explore Chef Profile & Kitchen Story')}</Text>
              <Text style={styles.exploreProfileSub}>
                {showFullProfile ? t('kitchenDetail.tapToHide', 'Tap to hide chef details') : t('kitchenDetail.seeChefBio', 'See chef bio, kitchen photos & hygiene proof')}
              </Text>
            </View>
          </View>
          <Ionicons
            name={showFullProfile ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.primary}
          />
        </Pressable>

        {/* 4. EXPANDABLE CHEF PROFILE & STORY SECTIONS */}
        {showFullProfile && (
          <View style={styles.chefStoryContainer}>
            {/* Story Prompts / About Chef */}
            {(() => {
              const storyPrompts = (kitchen.storyPrompts && kitchen.storyPrompts.length > 0)
                ? kitchen.storyPrompts
                : [
                    {
                      id: 'sp-bio',
                      prompt: t('kitchenDetail.aboutChefPrompt', '❤️ About Chef & Kitchen'),
                      answer: kitchen.bio || t('kitchenDetail.aboutChefAnswer', { defaultValue: 'Welcome to {{name}}! We prepare fresh, delicious home-style meals using high quality ingredients with love and strict hygiene.', name: kitchen.name }),
                    },
                    {
                      id: 'sp-philosophy',
                      prompt: t('kitchenDetail.freshIngredientsPrompt', '🌿 Fresh Ingredients & Hygiene'),
                      answer: t('kitchenDetail.freshIngredientsAnswer', 'All meals are cooked fresh in a clean, sanitized kitchen station right before delivery to your doorstep.'),
                    },
                  ];

              return (
                <View style={styles.sectionWrap}>
                  {storyPrompts.map((prompt: any) => (
                    <ProfilePromptCard
                      key={prompt.id}
                      prompt={prompt.prompt}
                      answer={prompt.answer}
                      isEditable={false}
                    />
                  ))}
                </View>
              );
            })()}

            {/* Kitchen Tour (Photos) */}
            {kitchen.gallery && kitchen.gallery.length > 0 && (
              <MediaCarousel
                title={t('kitchenDetail.kitchenTourPhotos', 'Kitchen Tour (Uploaded Photos)')}
                media={kitchen.gallery}
                isEditable={false}
                mediaTypeLabel={t('chefProfile.photo', 'Photo')}
              />
            )}

            {/* Kitchen Videos */}
            {kitchen.videos && kitchen.videos.length > 0 && (
              <MediaCarousel
                title={t('kitchenDetail.kitchenVideoTour', 'Kitchen Video Tour')}
                media={kitchen.videos}
                isEditable={false}
                mediaTypeLabel={t('chefProfile.video', 'Video')}
              />
            )}

            {/* Hygiene Assurances */}
            {kitchen.hygieneDetails && kitchen.hygieneDetails.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeaderTitle}>{t('kitchenDetail.hygieneAssurances', 'Hygiene Assurances')}</Text>
                {kitchen.hygieneDetails.map((detail: any) => (
                  <HygieneCard
                    key={detail.id}
                    title={detail.title}
                    description={detail.description}
                    confirmed={detail.confirmed}
                    icon={detail.icon as any}
                    isEditable={false}
                  />
                ))}
              </View>
            )}

            {kitchen.hygienePhotos && kitchen.hygienePhotos.length > 0 && (
              <MediaCarousel
                title={t('kitchenDetail.hygieneProofPhotos', 'Hygiene Proof (Photos)')}
                media={kitchen.hygienePhotos}
                isEditable={false}
                mediaTypeLabel={t('chefProfile.photo', 'Photo')}
              />
            )}

            {kitchen.hygieneVideos && kitchen.hygieneVideos.length > 0 && (
              <MediaCarousel
                title={t('kitchenDetail.hygieneProofVideos', 'Hygiene Proof (Videos)')}
                media={kitchen.hygieneVideos}
                isEditable={false}
                mediaTypeLabel={t('chefProfile.video', 'Video')}
              />
            )}

            {/* Kitchen Info */}
            {kitchen.kitchenInfo && (
              <InfoCard
                info={kitchen.kitchenInfo}
                isEditable={false}
              />
            )}

            {/* Trust Badges */}
            {kitchen.trustBadges && kitchen.trustBadges.length > 0 && (
              <TrustCard badges={kitchen.trustBadges} />
            )}
          </View>
        )}

        {/* 9. Reviews Section */}
        <View style={[styles.section, { marginHorizontal: 16, marginTop: 12 }]}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>{t('kitchenDetail.customerReviews', 'Customer Reviews')}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.gold} />
              <Text style={styles.ratingBadgeText}>
                {kitchenReviews.length > 0 ? avgRating.toFixed(1) : t('kitchenDetail.noReviewsYet', 'No reviews yet')}
              </Text>
            </View>
          </View>

          {kitchenReviews.length === 0 ? (
            <Text style={styles.noReviews}>{t('kitchenDetail.beFirstToReview', 'Be the first to review this kitchen.')}</Text>
          ) : (
            kitchenReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= review.rating ? 'star' : 'star-outline'}
                        size={13}
                        color={Colors.gold}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDish}>{review.dishName}</Text>
                  <Text style={styles.reviewTime}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: totalCartCount > 0 ? 80 : 40 }} />
      </ScrollView>

      {/* Zomato/Swiggy style Floating Cart Banner */}
      {totalCartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.floatingCartLeft}>
            <Ionicons name="cart" size={20} color="#FFF" />
            <Text style={styles.floatingCartTitle}>
              {t('kitchenDetail.itemsInCart', { count: totalCartCount })}
            </Text>
          </View>
          <Pressable style={styles.viewCartBtn} onPress={() => router.push('/(consumer)/cart')}>
            <Text style={styles.viewCartBtnText}>{t('kitchenDetail.viewCart', 'View Cart')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </Pressable>
        </View>
      )}

      {/* Dish Detail Modal (Zomato-style picture 1 popup) */}
      <DishDetailModal
        visible={selectedDishDetail !== null}
        onClose={() => setSelectedDishDetail(null)}
        dish={selectedDishDetail}
        kitchen={kitchen}
        onOrderNow={(d, q, addons) => {
          setSelectedDishDetail(null);
          setCheckoutAddons(addons);
          setCheckoutQuantity(q);
          setCheckoutDishId(d.id || d.dishId);
        }}
      />

      {/* Checkout modal */}
      <CheckoutModal
        visible={checkoutDishId !== null}
        kitchenId={kitchen.id}
        dishId={checkoutDishId ?? ''}
        consumerSociety={CONSUMER_SOCIETY}
        selectedAddons={checkoutAddons}
        initialQuantity={checkoutQuantity}
        onClose={() => { setCheckoutDishId(null); setCheckoutAddons([]); }}
        onConfirm={handleConfirmOrder}
      />
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: Colors.bg,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    backLabel: {
      color: Colors.dark,
      fontSize: 16,
      fontWeight: '700',
    },
    favBtn: {
      padding: 6,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 40,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
    },
    errorText: {
      color: Colors.muted,
      fontSize: 16,
    },
    sectionWrap: {
      marginBottom: 8,
    },
    sectionHeaderTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: Colors.dark,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    dishCardWrapper: {
      marginHorizontal: 16,
      marginBottom: 16,
    },

    // Dish card
    dishRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    dishInfo: {
      flex: 1,
    },
    dishName: {
      color: Colors.dark,
      fontSize: 16,
      fontWeight: '900',
    },
    dishCategory: {
      color: Colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    dishMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    dishPrice: {
      color: Colors.primary,
      fontSize: 15,
      fontWeight: '900',
    },
    dishOriginalPrice: {
      color: Colors.muted,
      fontSize: 13,
      textDecorationLine: 'line-through',
    },
    dishAvail: {
      color: Colors.muted,
      fontSize: 12,
      marginTop: 4,
    },
    dishLead: {
      color: Colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    dishBadges: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    orderBtnRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
    addDishBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
    },
    addDishBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFF',
      letterSpacing: 0.5,
    },
    dishStepperWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: `${Colors.primary}12`,
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 6,
    },
    dishStepperBtn: {
      padding: 4,
    },
    dishStepperQty: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.primary,
    },

    // Floating Zomato/Swiggy Cart Bar
    floatingCartBar: {
      position: 'absolute',
      bottom: 12,
      left: 16,
      right: 16,
      backgroundColor: Colors.dark,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    floatingCartLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    floatingCartTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFF',
    },
    viewCartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    viewCartBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFF',
    },

    // Explore Chef Profile Banner
    exploreProfileBanner: {
      marginHorizontal: 16,
      marginVertical: 14,
      padding: 14,
      backgroundColor: Colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    exploreProfileLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    exploreProfileIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${Colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exploreProfileTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.dark,
    },
    exploreProfileSub: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 2,
    },
    chefStoryContainer: {
      marginTop: 4,
    },

    // Reviews section
    section: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '900',
      color: Colors.dark,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    reviewsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.goldBadge,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    ratingBadgeText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#7c5400',
    },
    noReviews: {
      fontSize: 13,
      color: Colors.muted,
      fontStyle: 'italic',
    },
    reviewCard: {
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    reviewTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 5,
    },
    reviewStars: {
      flexDirection: 'row',
      gap: 1,
    },
    reviewDish: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: Colors.textMuted,
    },
    reviewTime: {
      fontSize: 11,
      color: Colors.muted,
    },
    reviewComment: {
      fontSize: 13,
      color: Colors.dark,
      lineHeight: 19,
    },
  });
