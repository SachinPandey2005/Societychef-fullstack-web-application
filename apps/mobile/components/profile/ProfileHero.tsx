import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { Kitchen } from '../../types';

interface ProfileHeroProps {
  kitchen: Kitchen;
  avgRating: number;
  isEditable?: boolean;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
  onEditAddress?: () => void;
  liveDishesCount?: number;
  weeklyFreeCount?: number;
  samplesCount?: number;
}

export function ProfileHero({
  kitchen,
  avgRating,
  isEditable,
  onEditCover,
  onEditAvatar,
  onEditAddress,
  liveDishesCount,
  weeklyFreeCount,
  samplesCount,
}: ProfileHeroProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const displayName = kitchen.anonymous ? t('profileHero.privateChef', 'Private Chef') : kitchen.chefName;
  const cover = kitchen.coverImage;
  const profile = kitchen.profileImage;

  return (
    <View style={styles.container}>
      <Pressable onPress={isEditable ? onEditCover : undefined} style={[styles.coverImage, !cover && { backgroundColor: '#EBE7E0' }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.coverImage} />
        ) : null}
        {isEditable && (
          <View style={styles.editCoverBadge}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        )}
      </Pressable>

      <View style={styles.overlay}>
        <Pressable onPress={isEditable ? onEditAvatar : undefined} style={styles.avatarWrapper}>
          {profile ? (
            <Image source={{ uri: profile }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: Colors.pillInactive, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person-outline" size={28} color={Colors.muted} />
            </View>
          )}
          {isEditable && (
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          )}
        </Pressable>

        <Text style={styles.kitchenName}>{kitchen.name}</Text>
        <Text style={styles.chefName}>{t('profileHero.byChef', { defaultValue: 'by {{name}}', name: displayName })}</Text>

        <Pressable
          onPress={isEditable ? onEditAddress : undefined}
          style={styles.addressRow}
          disabled={!isEditable}
        >
          <Ionicons name="location-outline" size={14} color={Colors.primary} />
          <Text style={styles.society}>
            {kitchen.address || kitchen.kitchenInfo?.society || kitchen.society || t('profileHero.addAddress', 'Add address')}
          </Text>
          {isEditable && (
            <Ionicons name="pencil-outline" size={12} color={Colors.primary} style={{ marginLeft: 2 }} />
          )}
        </Pressable>
        
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="star" size={14} color={Colors.gold} />
            <Text style={styles.statText}>{avgRating > 0 ? avgRating.toFixed(1) : kitchen.rating}</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="restaurant-outline" size={14} color={Colors.secondary} />
            <Text style={styles.statText}>{t('profileHero.live', { defaultValue: '{{count}} Live', count: liveDishesCount ?? 0 })}</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="flask-outline" size={14} color={Colors.gold} />
            <Text style={styles.statText}>{t('profileHero.samples', { defaultValue: '{{count}} Samples', count: samplesCount ?? 0 })}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  coverImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  editCoverBadge: {
    position: 'absolute',
    bottom: 56, // above overlay
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  avatarWrapper: {
    marginTop: -40,
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  kitchenName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.dark,
    textAlign: 'center',
  },
  chefName: {
    fontSize: 16,
    color: Colors.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.bg,
  },
  society: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
});
