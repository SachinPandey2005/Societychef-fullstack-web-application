import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { KitchenDish, ChefDish } from '../../types';
import { DishVisual } from '../ui/DishVisual';
import { Badge } from '../ui/Badge';
import { money } from '../../lib/format';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// This is a read-only preview of the chef's own live menu, shown on their own
// profile screen — not a consumer-facing browsing surface. It previously had
// an "Order" button labeled "Popular Dishes" (copied from a consumer-style
// carousel), which let a chef "order" from their own kitchen — a no-op that
// only showed an alert — and mislabeled their own menu, which isn't actually
// ranked by popularity, as if it were.
interface DishCarouselProps {
  kitchenDishes: KitchenDish[];
  dishesMap: Record<string, ChefDish>;
}

export function DishCarousel({ kitchenDishes, dishesMap }: DishCarouselProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  if (kitchenDishes.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('dishCarousel.yourMenu', 'Your Menu')}</Text>
      <FlatList
        data={kitchenDishes}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        keyExtractor={d => d.dishId}
        renderItem={({ item: kitchenDish }) => {
          const dish = dishesMap[kitchenDish.dishId];
          if (!dish) return null;

          const leadMin = kitchenDish.leadTimeMinutes;
          const leadLabel =
            leadMin < 60
              ? t('kitchenDetail.leadMin', { defaultValue: '{{count}} min', count: leadMin })
              : t('kitchenDetail.leadHr', { defaultValue: '{{count}} hr', count: Math.round(leadMin / 60) });

          return (
            <View style={styles.card}>
              <View style={styles.dishRow}>
                <DishVisual dish={dish} size="md" />
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                  <Text style={styles.dishCategory}>{dish.category}</Text>

                  <View style={styles.dishMeta}>
                    <Text style={styles.dishPrice}>{money(kitchenDish.price)}</Text>
                  </View>

                  <Text style={styles.dishLead}>{t('kitchenDetail.readyIn', { defaultValue: 'Ready in {{time}}', time: leadLabel })}</Text>
                </View>
              </View>

              <View style={styles.dishBadges}>
                {kitchenDish.sample && <Badge label={t('kitchenDetail.freeSample', 'Free sample')} tone="gold" small />}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dishRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  dishCategory: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  dishLead: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  dishBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
});
