import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { getKitchen, getDish } from '../../services';
import { Card } from '../../components/ui/Card';
import { DishVisual } from '../../components/ui/DishVisual';
import type { Kitchen, Dish } from '../../types';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { favoriteKitchens, favoriteDishes, toggleKitchenFavorite, toggleDishFavorite } = useFavoritesStore();

  // This used to filter the static constants/data.ts sample kitchens/dishes by
  // favorited id. Every real favorite comes from Supabase-backed data with
  // real UUIDs that don't exist in that sample set, so this screen was
  // effectively always empty for anyone using the real app. Fetch the actual
  // favorited kitchens/dishes instead.
  const [favKitchensData, setFavKitchensData] = useState<Kitchen[]>([]);
  const [favDishesData, setFavDishesData] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      setLoading(true);
      Promise.all([
        Promise.all(favoriteKitchens.map((id) => getKitchen(id).catch(() => null))),
        Promise.all(favoriteDishes.map((id) => getDish(id).catch(() => null))),
      ]).then(([kitchens, dishes]) => {
        if (!isMounted) return;
        setFavKitchensData(kitchens.filter((k): k is Kitchen => !!k));
        setFavDishesData(dishes.filter((d): d is Dish => !!d));
        setLoading(false);
      });
      return () => { isMounted = false; };
    }, [favoriteKitchens, favoriteDishes])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.dark} />
          <Text style={styles.backText}>{t('favorites.back', 'Back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('favorites.title', 'Favorites')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        {/* Favorite Dishes */}
        <Text style={styles.sectionTitle}>{t('favorites.favoriteDishes', 'Favorite Dishes')}</Text>
        {!loading && favDishesData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="heart-dislike-outline" size={32} color={Colors.muted} />
            <Text style={styles.emptyText}>{t('favorites.noFavoriteDishes', 'No favorite dishes yet.')}</Text>
          </View>
        ) : (
          favDishesData.map((dish) => (
            <Card key={dish.id}>
              <Pressable
                style={styles.dishRow}
                onPress={() => router.push(`/(consumer)/dish/${dish.id}` as any)}
              >
                <DishVisual dish={dish} size="sm" />
                <View style={styles.dishDetails}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishCategory}>{dish.category}</Text>
                  <Text style={styles.dishPrice}>{t('favorites.suggestedPrice', { defaultValue: 'Suggested Price: ₹{{price}}', price: dish.suggestedPrice })}</Text>
                </View>
                <Pressable
                  onPress={() => toggleDishFavorite(dish.id)}
                  style={styles.favIconBtn}
                >
                  <Ionicons name="heart" size={24} color={Colors.primary} />
                </Pressable>
              </Pressable>
            </Card>
          ))
        )}

        {/* Favorite Kitchens */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('favorites.favoriteKitchens', 'Favorite Kitchens')}</Text>
        {!loading && favKitchensData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={32} color={Colors.muted} />
            <Text style={styles.emptyText}>{t('favorites.noFavoriteKitchens', 'No favorite kitchens yet.')}</Text>
          </View>
        ) : (
          favKitchensData.map((kitchen) => (
            <Card key={kitchen.id}>
              <Pressable
                style={styles.kitchenRow}
                onPress={() => router.push(`/(consumer)/kitchen/${kitchen.id}`)}
              >
                <View style={styles.kitchenDetails}>
                  <Text style={styles.kitchenName}>{kitchen.name}</Text>
                  <Text style={styles.kitchenChef}>{t('favorites.chefName', { defaultValue: 'Chef: {{name}}', name: kitchen.chefName })}</Text>
                  <Text style={styles.kitchenSociety}>
                    {t('favorites.societyRating', { defaultValue: '{{society}} · Rating: {{rating}} ⭐', society: kitchen.society, rating: kitchen.rating })}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleKitchenFavorite(kitchen.id)}
                  style={styles.favIconBtn}
                >
                  <Ionicons name="heart" size={24} color={Colors.primary} />
                </Pressable>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backText: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishDetails: {
    flex: 1,
    marginLeft: 12,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  dishCategory: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  dishPrice: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '600',
    marginTop: 4,
  },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitchenDetails: {
    flex: 1,
  },
  kitchenName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  kitchenChef: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  kitchenSociety: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
  },
  favIconBtn: {
    padding: 8,
  },
});
