import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../components/LanguageTogglePill';

const LandingColors = {
  bg: '#F3F6F1',
  surface: '#FFFDF9',
  surfaceAlt: '#E8E4D9',
  border: '#D8E3D7',
  primary: '#123524',
  primaryDeep: '#0A2116',
  muted: '#6B6B6B',
  green: '#2F6B4F',
  gold: '#D4AF37',
  goldBorder: '#D4AF37',
  orange: '#E87D3E',
  textPrimary: '#123524',
  textMuted: '#6B6B6B',
  textInverse: '#FFFFFF',
};

const Colors = LandingColors;

import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../lib/apiClient';

type FeaturedKitchen = {
  kitchenId: string;
  chefName: string;
  society: string;
  dishNames: string;
  category: string;
  rating: number;
  imageUrl?: string;
};

export default function LandingScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 992;
  const isMobile = width < 768;

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      const active = user.activeRole ?? user.role;
      if (user.role === 'ops' || user.role === 'admin' || active === 'ops' || active === 'admin') {
        router.replace('/(ops)' as any);
      } else if (active === 'chef') {
        router.replace('/(chef)/dashboard');
      } else {
        router.replace('/(consumer)/discover');
      }
    }
  }, [user]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'clash-display-font';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@700,600,800&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  const [mode, setMode] = useState<'eat' | 'cook'>('eat');

  // "Chefs Cooking Right Now" used to show three fabricated chefs (fake
  // names/ratings/dishes) to every visitor, pre-login, as if they were real
  // active kitchens. GET /dishes/discover is public (no auth required), so
  // real ones can be shown instead — grouped by kitchen, ranked by real
  // rating, capped at 3 to match the original card layout.
  const [featuredKitchens, setFeaturedKitchens] = useState<FeaturedKitchen[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadFeatured() {
      try {
        const response = await apiClient.get('/dishes/discover');
        const dishes: any[] = response?.data || [];

        type KitchenEntry = { kitchen: any; dishNames: string[]; imageUrl?: string; category?: string };
        const byKitchen = new Map<string, KitchenEntry>();
        for (const d of dishes) {
          const k = d.kitchens;
          if (!k?.id) continue;
          const entry: KitchenEntry = byKitchen.get(k.id) || { kitchen: k, dishNames: [], imageUrl: undefined, category: d.category };
          if (entry.dishNames.length < 3) entry.dishNames.push(d.name);
          if (!entry.imageUrl && d.image_url) entry.imageUrl = d.image_url;
          byKitchen.set(k.id, entry);
        }

        const kitchenIds = Array.from(byKitchen.keys());
        let ratings: Record<string, number> = {};
        if (kitchenIds.length > 0) {
          try {
            const statsRes = await apiClient.get(`/kitchens/stats?ids=${kitchenIds.join(',')}`);
            const statsMap = statsRes?.data || {};
            for (const id of kitchenIds) ratings[id] = statsMap[id]?.rating ?? 0;
          } catch {
            // ratings stay 0 — still shown, just unsorted by rating
          }
        }

        const featured: FeaturedKitchen[] = Array.from(byKitchen.values())
          .map(({ kitchen, dishNames, imageUrl, category }) => ({
            kitchenId: kitchen.id,
            chefName: kitchen.chef_name || kitchen.name || 'Chef',
            society: kitchen.address || '',
            dishNames: dishNames.join(', '),
            category: (category || 'Homestyle').toUpperCase(),
            rating: ratings[kitchen.id] || 0,
            imageUrl,
          }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);

        if (!cancelled) setFeaturedKitchens(featured);
      } catch {
        if (!cancelled) setFeaturedKitchens([]);
      }
    }
    loadFeatured();
    return () => { cancelled = true; };
  }, []);

  const handleAuth = () => {
    // Explicitly clear any chef intent a previous, abandoned "Become a
    // Chef" tap may have left set (see handleCookAuth below) — otherwise a
    // completely unrelated later normal sign-in would incorrectly redirect
    // into chef-register too.
    const { useAuthStore } = require('../store/useAuthStore');
    useAuthStore.getState().setPendingChefSignup(false);
    router.push('/(auth)/phone');
  };

  const handleCookAuth = () => {
    // Used to go straight to chef-register with no login step at all, so its
    // final submit always failed with "You must be logged in to register as
    // a chef" (reported directly by a developer testing this exact button) —
    // every real registration call needs an authenticated session, which
    // this path never created. Routes through phone/OTP first instead, same
    // as the main login flow.
    //
    // This used to carry the chef intent as a `?intent=chef` URL param
    // threaded through phone.tsx into otp.tsx, which otp.tsx's completeLogin
    // read from local route-param state to decide where to send the user
    // after verifying — reported directly as still landing on consumer
    // Discover regardless. Set directly on the persisted auth store instead:
    // a single source of truth every step (completeLogin, and the splash
    // screen's routing on a cold start/restart) reads the same way, with no
    // param-forwarding through two screens for it to go missing from.
    const { useAuthStore } = require('../store/useAuthStore');
    useAuthStore.getState().setPendingChefSignup(true);
    router.push('/(auth)/phone');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 1. TOP HEADER NAVBAR */}
          <View style={[styles.header, isLargeScreen && styles.contentContainer, { paddingVertical: 4, paddingLeft: 4, paddingRight: 16 }]}>
            <View style={{ justifyContent: 'center', marginLeft: -14 }}>
              <Image
                source={require('../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
                style={{ width: isMobile ? 150 : 200, height: isMobile ? 55 : 70 }}
                resizeMode="contain"
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
              <LanguageTogglePill />
              <Pressable onPress={handleCookAuth}>
                <Text style={{ fontSize: isMobile ? 12 : 14, fontWeight: '700', color: Colors.muted }}>{t('landing.cookAndSell', 'Cook & Sell')}</Text>
              </Pressable>
              <Pressable style={[styles.signInBtn, isMobile && { paddingHorizontal: 12, paddingVertical: 6 }]} onPress={handleAuth}>
                <Text style={[styles.signInText, isMobile && { fontSize: 12 }]}>{t('landing.signIn', 'Sign In')}</Text>
              </Pressable>
            </View>
          </View>

          {/* 2. HERO SECTION */}
          <View style={[styles.heroSection, isLargeScreen && styles.contentContainer, isMobile && { paddingHorizontal: 16, paddingTop: 16 }]}>
            <View style={styles.togglePill}>
              <Pressable
                style={mode === 'eat' ? styles.activeToggle : styles.inactiveToggle}
                onPress={() => setMode('eat')}
              >
                <Ionicons name="restaurant-outline" size={15} color={mode === 'eat' ? '#FFFDF9' : '#C89B3C'} style={{ marginRight: 5 }} />
                <Text style={mode === 'eat' ? styles.activeToggleText : styles.inactiveToggleText} numberOfLines={1}>
                  {t('landing.orderFood', 'Order Food')}
                </Text>
              </Pressable>
              <Pressable
                style={mode === 'cook' ? styles.activeToggle : styles.inactiveToggle}
                onPress={() => setMode('cook')}
              >
                <MaterialCommunityIcons name="chef-hat" size={16} color={mode === 'cook' ? '#FFFDF9' : '#C89B3C'} style={{ marginRight: 5 }} />
                <Text style={mode === 'cook' ? styles.activeToggleText : styles.inactiveToggleText} numberOfLines={1}>
                  {t('landing.joinAsChef', 'Join as Chef')}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={[
                    styles.heroHeadline,
                    !isLargeScreen && {
                      fontSize: isMobile ? 24 : 36,
                      lineHeight: isMobile ? 30 : 42,
                      marginBottom: 10,
                    },
                  ]}
                >
                  {mode === 'eat' ? (
                    <>
                      {t('landing.heroEat1', 'Authentic Home Meals')}{'\n'}
                      <Text style={styles.heroHeadlineGold}>{t('landing.heroEat2', 'Made Next Door')}</Text>
                    </>
                  ) : (
                    <>
                      {t('landing.heroCook1', 'Turn Your Cooking')}{'\n'}
                      <Text style={styles.heroHeadlineGold}>{t('landing.heroCook2', 'Into Income & Pride')}</Text>
                    </>
                  )}
                </Text>

                <Text style={[styles.heroDescription, !isLargeScreen && { fontSize: isMobile ? 13 : 15, lineHeight: 20, marginBottom: 16 }]}>
                  {mode === 'eat'
                    ? t('landing.heroDescEat', 'From browsing kitchen to a hot meal at your door. Cooked with love by verified home chefs in your society.')
                    : t('landing.heroDescCook', 'Start your home kitchen on RasoHi. Share authentic recipes, cook on your own schedule, and earn from home.')}
                </Text>
              </View>

              <View style={{ marginTop: 2, marginLeft: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={require('../assets/steaming_pot.png')}
                  style={{
                    width: isMobile ? 120 : 155,
                    height: isMobile ? 110 : 140,
                    resizeMode: 'contain',
                  }}
                />
              </View>
            </View>

            {/* Action CTA — changes based on mode */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 20 }}>
              {mode === 'eat' ? (
                <Pressable
                  style={[styles.primaryAction, isMobile && { flex: 1, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' }]}
                  onPress={handleAuth}
                >
                  <Ionicons name="location" size={18} color="#D4AF37" style={{ marginRight: 8 }} />
                  <Text style={[styles.primaryActionText, isMobile && { fontSize: 13, flex: 1 }]} numberOfLines={1}>
                    {t('landing.findChef', 'Find a RasoHi Chef near you')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFDF9" style={{ marginLeft: 4 }} />
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.chefCtaAction, isMobile && { flex: 1, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' }]}
                  onPress={handleCookAuth}
                >
                  <MaterialCommunityIcons name="chef-hat" size={18} color="#D4AF37" style={{ marginRight: 8 }} />
                  <Text style={[styles.chefCtaActionText, isMobile && { fontSize: 13, flex: 1 }]} numberOfLines={1}>
                    {t('landing.createKitchen', 'Create your kitchen')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFDF9" style={{ marginLeft: 4 }} />
                </Pressable>
              )}
            </View>

            {/* Mode Cards: Regular Menu | Party Mode | Weekly Planner */}
            <View style={styles.valuePropsCard}>
              <Pressable style={styles.valuePropCol} onPress={handleAuth}>
                <Ionicons name="restaurant-outline" size={22} color="#123524" />
                <Text style={styles.valuePropTitle}>{t('landing.regularMenu', 'Regular\nMenu')}</Text>
              </Pressable>
              <View style={styles.valuePropDivider} />
              <Pressable style={styles.valuePropCol} onPress={handleAuth}>
                <MaterialCommunityIcons name="party-popper" size={22} color="#C89B3C" />
                <Text style={styles.valuePropTitle}>{t('landing.partyModeCard', 'Party\nMode')}</Text>
              </Pressable>
              <View style={styles.valuePropDivider} />
              <Pressable style={styles.valuePropCol} onPress={handleAuth}>
                <Ionicons name="calendar-outline" size={22} color="#123524" />
                <Text style={styles.valuePropTitle}>{t('landing.weeklyPlannerCard', 'Weekly\nPlanner')}</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. WHY EATERS LOVE RASOHI */}
          <View style={[styles.sectionPadding, isMobile && { paddingVertical: 20, paddingHorizontal: 16 }]}>
            <View style={[isLargeScreen && styles.contentContainer]}>
              <Text style={[styles.sectionHeadline, { marginBottom: 14 }]}>
                {t('landing.whyEatersLove', 'Why Eaters Love Rasohi')}
              </Text>

              <View style={styles.eaterLoveStack}>
                {/* Card 1 */}
                <View style={styles.eaterLoveCard}>
                  <View style={[styles.eaterIconCircle, { backgroundColor: '#E4F2E9' }]}>
                    <MaterialCommunityIcons name="pot-steam-outline" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eaterCardTitle}>{t('landing.feat1Title', 'Home Cooked')}</Text>
                    <Text style={styles.eaterCardSub}>{t('landing.feat1Sub', 'Real ingredients, no artificial preservatives')}</Text>
                  </View>
                </View>

                {/* Card 2 */}
                <View style={styles.eaterLoveCard}>
                  <View style={[styles.eaterIconCircle, { backgroundColor: '#FDF2E3' }]}>
                    <MaterialCommunityIcons name="chef-hat" size={22} color="#D4AF37" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eaterCardTitle}>{t('landing.feat2Title', 'Verified Chefs')}</Text>
                    <Text style={styles.eaterCardSub}>{t('landing.feat2Sub', 'Tested kitchens right inside your building')}</Text>
                  </View>
                </View>

                {/* Card 3 */}
                <View style={styles.eaterLoveCard}>
                  <View style={[styles.eaterIconCircle, { backgroundColor: '#E4F2E9' }]}>
                    <MaterialCommunityIcons name="moped" size={22} color={Colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eaterCardTitle}>{t('landing.feat3Title', 'Fresh & Fast')}</Text>
                    <Text style={styles.eaterCardSub}>{t('landing.feat3Sub', 'Hot doorstep delivery in minutes')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 4. FROM BROWSING KITCHENS TO A HOT MEAL AT YOUR DOOR */}
          <View style={[styles.sectionPadding, isMobile && { paddingVertical: 20, paddingHorizontal: 0 }]}>
            <View style={[isLargeScreen && styles.contentContainer]}>
              <Text
                style={[
                  styles.sectionHeadline,
                  { paddingHorizontal: 20, marginBottom: 16, fontSize: isMobile ? 22 : 28, lineHeight: isMobile ? 28 : 34 },
                ]}
              >
                {t('landing.howItWorks', 'From browsing kitchens to a\nhot meal at your door')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {/* Step 1 */}
                <View style={{ width: isMobile ? 260 : 280, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }}>
                  <View style={{ position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                    <Image source={require('../assets/step1_browse.png')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    <View style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFDF9', fontWeight: '800', fontSize: 15 }}>1</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 4 }}>{t('landing.step1Title', 'Browse')}</Text>
                  <Text style={{ fontSize: 13, color: Colors.muted, lineHeight: 18 }}>{t('landing.step1Sub', 'Explore home kitchens in your society')}</Text>
                </View>

                {/* Step 2 */}
                <View style={{ width: isMobile ? 260 : 280, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }}>
                  <View style={{ position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                    <Image source={require('../assets/step2_meal.png')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    <View style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFDF9', fontWeight: '800', fontSize: 15 }}>2</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 4 }}>{t('landing.step2Title', 'Choose Your Meal')}</Text>
                  <Text style={{ fontSize: 13, color: Colors.muted, lineHeight: 18 }}>{t('landing.step2Sub', 'Pick your favorite dishes and place the order')}</Text>
                </View>

                {/* Step 3 */}
                <View style={{ width: isMobile ? 260 : 280, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }}>
                  <View style={{ position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                    <Image source={require('../assets/step3_chef.png')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    <View style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFDF9', fontWeight: '800', fontSize: 15 }}>3</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 4 }}>{t('landing.step3Title', 'Chef Cooks')}</Text>
                  <Text style={{ fontSize: 13, color: Colors.muted, lineHeight: 18 }}>{t('landing.step3Sub', 'Your order is freshly prepared with love')}</Text>
                </View>

                {/* Step 4 */}
                <View style={{ width: isMobile ? 260 : 280, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }}>
                  <View style={{ position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                    <Image source={require('../assets/step4_delivery.png')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    <View style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFDF9', fontWeight: '800', fontSize: 15 }}>4</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 4 }}>{t('landing.step4Title', 'Delivered to You')}</Text>
                  <Text style={{ fontSize: 13, color: Colors.muted, lineHeight: 18 }}>{t('landing.step4Sub', 'Hot, hygienic, and on time- at your doorstep')}</Text>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* 4. CHEFS COOKING RIGHT NOW — real kitchens from the public discover
              feed, ranked by real rating. Hidden entirely once there's
              nothing real to show, rather than falling back to fabricated
              chefs. */}
          {featuredKitchens.length > 0 && (
            <View style={[styles.sectionPadding, isMobile && { paddingVertical: 20, paddingHorizontal: 0 }]}>
              <View style={[isLargeScreen && styles.contentContainer, !isLargeScreen && { width: '100%', alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
                  <Text style={[styles.sectionHeadline, !isLargeScreen && { fontSize: isMobile ? 20 : 24 }]}>
                    {t('landing.chefsCookingNow', 'Chefs Cooking Right Now')}
                  </Text>
                  <Pressable onPress={handleAuth} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.gold }}>{t('landing.seeAll', 'See All')}</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.gold} />
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ width: '100%' }}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                >
                  {featuredKitchens.map((fk) => (
                    <View key={fk.kitchenId} style={[styles.chefCard, { width: 250 }]}>
                      <View style={[styles.chefImageWrap, { height: 135 }]}>
                        {fk.imageUrl ? (
                          <Image source={{ uri: fk.imageUrl }} style={styles.chefImage} />
                        ) : (
                          <View style={[styles.chefImage, { backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="restaurant-outline" size={28} color={Colors.muted} />
                          </View>
                        )}
                        <View style={[styles.chefCategoryBadge, { backgroundColor: Colors.primary }]}>
                          <Text style={styles.chefCategoryBadgeText}>{fk.category}</Text>
                        </View>
                      </View>
                      <View style={styles.chefCardBody}>
                        <Text style={styles.chefName}>{fk.chefName}</Text>
                        <Text style={styles.chefMeta}>{fk.society}</Text>
                        <Text style={styles.chefDishes}>{fk.dishNames}</Text>
                        <View style={styles.chefFooter}>
                          {fk.rating > 0 && (
                            <View style={styles.ratingRow}>
                              <Ionicons name="star" size={14} color={Colors.gold} />
                              <Text style={styles.chefRatingText}>{fk.rating.toFixed(1)}</Text>
                            </View>
                          )}
                          <Pressable style={styles.viewMenuBtn} onPress={handleAuth}>
                            <Text style={styles.viewMenuText}>{t('landing.viewMenu', 'View Menu')}</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* 5. JOIN AS CHEF PROMO CARD (GREEN & GOLD THEME COLORS) */}
          <View style={[styles.darkSectionOuter, isMobile && { paddingHorizontal: 16, paddingVertical: 16 }]}>
            <View style={[styles.darkSectionCardSpec, isMobile && { padding: 18 }]}>
              <View style={styles.darkTopSectionRow}>
                <View style={[styles.darkTopLeftContent, isMobile && { width: '60%', paddingRight: 4 }]}>
                  <Text style={[styles.headingFirstLine, isMobile && { fontSize: 18 }]}>{t('landing.promoTitle1', 'Ghar ka swaad,')}</Text>
                  <Text style={[styles.headingNextLines, isMobile && { fontSize: 20, lineHeight: 25 }]}>{t('landing.promoTitle2', 'ab aapke darwaaze tak!')}</Text>
                  <Text style={[styles.darkTopDescText, isMobile && { fontSize: 11, lineHeight: 15, marginTop: 4 }]}>
                    {t('landing.promoDesc', 'Cooking talent ko pehchaan dijiye aur ghar baithe kamaai kijiye.')}
                  </Text>
                </View>
                <View style={[styles.darkTopRightChefWrap, isMobile && { width: '40%', height: 120 }]}>
                  <Image source={require('../assets/chef_banner_full.jpg')} style={styles.darkChefImageCutoutSpec} resizeMode="cover" />
                </View>
              </View>

              <Pressable style={[styles.darkCtaFullWidthBtn, { marginTop: 14 }]} onPress={handleCookAuth}>
                <Text style={styles.darkCtaFullWidthBtnText}>{t('landing.joinAsChefCta', 'Join as a Chef  →')}</Text>
              </Pressable>
            </View>
          </View>

          {/* 6. CLEAN FOOTER */}
          <View style={styles.footerSection}>
            <View style={[isLargeScreen && styles.contentContainer, { alignItems: 'center' }]}>
              <Image
                source={require('../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
                style={{ width: 220, height: 75 }}
                resizeMode="contain"
              />
              <Text style={[styles.footerBrandDesc, { textAlign: 'center', marginTop: 8 }]}>
                {t('landing.footerTagline', 'Real home cooking, from real homes near you.')}
              </Text>
            </View>
          </View>

        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInText: {
    color: '#FFFDF9',
    fontSize: 13,
    fontWeight: '700',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: '#E8E4D9',
    padding: 3,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inactiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeToggleText: {
    color: '#FFFDF9',
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveToggleText: {
    color: '#123524',
    fontSize: 13,
    fontWeight: '600',
  },
  heroHeadline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  heroHeadlineGold: {
    color: Colors.gold,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.muted,
    marginTop: 6,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFDF9',
  },
  chefCtaAction: {
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chefCtaActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFDF9',
  },
  valuePropsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  valuePropCol: {
    alignItems: 'center',
    flex: 1,
  },
  valuePropTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  valuePropDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E4D9',
  },
  sectionPadding: {
    paddingVertical: 24,
  },
  sectionHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  eaterLoveStack: {
    gap: 10,
  },
  eaterLoveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  eaterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eaterCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  eaterCardSub: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  chefCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E4D9',
  },
  chefImageWrap: {
    width: '100%',
    position: 'relative',
  },
  chefImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  chefCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chefCategoryBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chefCardBody: {
    padding: 12,
  },
  chefName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  chefMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  chefDishes: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 6,
    lineHeight: 16,
  },
  chefFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chefRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewMenuBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewMenuText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  darkSectionOuter: {
    width: '100%',
  },
  darkSectionCardSpec: {
    backgroundColor: '#123524',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  darkTopSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkTopLeftContent: {},
  headingFirstLine: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '700',
  },
  headingNextLines: {
    color: '#FFFDF9',
    fontSize: 22,
    fontWeight: '800',
  },
  darkTopDescText: {
    color: '#E8E4D9',
    fontSize: 12,
  },
  darkTopRightChefWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  darkChefImageCutoutSpec: {
    width: '100%',
    height: '100%',
  },
  darkCtaFullWidthBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCtaFullWidthBtnText: {
    color: '#123524',
    fontSize: 14,
    fontWeight: '800',
  },
  footerSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.primaryDeep,
    marginTop: 20,
  },
  footerBrandDesc: {
    color: '#A3B899',
    fontSize: 12,
  },
});
