import { View, Text, StyleSheet, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/useThemeStore';
import { Kitchen } from '../types';
import { Badge } from './ui/Badge';
import { MediaGrid } from './MediaGrid';
import { HygieneBadgeList } from './HygieneBadgeList';

interface ProfileCardStackProps {
  kitchen: Kitchen;
  avgRating: number;
  sameSociety: boolean;
  leadTimeRange: string;
}

export function ProfileCardStack({ kitchen, avgRating, sameSociety, leadTimeRange }: ProfileCardStackProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const heroMedia = kitchen.gallery?.find(m => m.type === 'image');
  const heroUrl = kitchen.coverImage || (heroMedia ? heroMedia.url : 'https://images.unsplash.com/photo-1556911220-bff31c812dba');

  const kitchenMedia = [...(kitchen.gallery || []), ...(kitchen.videos || [])];
  const hygieneMedia = [...(kitchen.hygienePhotos || []), ...(kitchen.hygieneVideos || [])];

  const displayName = kitchen.anonymous ? "Private Chef" : kitchen.chefName;

  return (
    <View style={styles.container}>
      {/* 1. Hero Card */}
      <View style={styles.heroCard}>
        <Image source={{ uri: heroUrl }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroName}>{kitchen.name}</Text>
          <Text style={styles.heroChef}>by {displayName}</Text>
          <Text style={styles.heroSociety}>{kitchen.society}</Text>
          
          <View style={styles.heroStatsRow}>
            <Ionicons name="star" size={16} color={Colors.gold} />
            <Text style={styles.heroRating}>{avgRating > 0 ? avgRating.toFixed(1) : kitchen.rating}</Text>
            <Text style={styles.heroOrders}>• {kitchen.orders} orders</Text>
          </View>
        </View>
      </View>

      {/* 2. Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About this kitchen</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Lead time</Text>
            <Text style={styles.infoValue}>{leadTimeRange}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="bicycle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>{sameSociety ? '₹10 · Free above ₹200' : '₹35 · Free above ₹200'}</Text>
          </View>
        </View>
        {sameSociety && (
          <View style={styles.badgeRow}>
            <Badge label="Same-society discount" tone="green" small />
          </View>
        )}
      </View>

      {/* 3. Hygiene & Kitchen Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hygiene & Kitchen Tour</Text>
        
        <HygieneBadgeList checklist={kitchen.hygieneDetails?.map(h => ({ label: h.title, confirmed: h.confirmed }))} />

        {kitchenMedia.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>Kitchen Space</Text>
            <MediaGrid media={kitchenMedia} />
          </View>
        )}

        {hygieneMedia.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>Hygiene Proof</Text>
            <MediaGrid media={hygieneMedia} />
          </View>
        )}
        
        {(kitchenMedia.length === 0 && hygieneMedia.length === 0) && (
          <Text style={styles.emptyText}>No photos available yet.</Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  heroOverlay: {
    padding: 20,
    backgroundColor: Colors.surface,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.dark,
  },
  heroChef: {
    fontSize: 16,
    color: Colors.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  heroSociety: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  heroRating: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  heroOrders: {
    fontSize: 14,
    color: Colors.muted,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 4,
  },
  badgeRow: {
    marginTop: 16,
    flexDirection: 'row',
  },
  mediaSection: {
    marginTop: 20,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  }
});
