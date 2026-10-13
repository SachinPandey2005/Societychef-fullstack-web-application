import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '../../store/useThemeStore';
import { getRandomDishImage } from '../../services/dishImageService';
import type { Dish } from '../../types';

type Size = 'sm' | 'md';

interface DishVisualProps {
  dish: Dish;
  size?: Size;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('');
}

export function DishVisual({ dish, size = 'md' }: DishVisualProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const isMd = size === 'md';
  const [imgError, setImgError] = useState(false);

  const displayName = (dish as any).dishName ?? dish.name ?? '';
  const autoResult = getRandomDishImage(displayName);
  const imageSource = dish.image && !imgError
    ? (typeof dish.image === 'string' ? { uri: dish.image } : dish.image)
    : autoResult.image;

  return (
    <View style={[styles.container, isMd ? styles.containerMd : styles.containerSm]}>
      <Image
        source={imageSource}
        style={[styles.photo, isMd ? styles.photoMd : styles.photoSm]}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setImgError(true)}
      />
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  containerMd: {
    width: 92,
    height: 104,
  },
  containerSm: {
    width: 72,
    height: 80,
  },
  // Photo fills the container edge-to-edge
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  photoMd: {
    width: 92,
    height: 104,
  },
  photoSm: {
    width: 72,
    height: 80,
  },
  // Initials fallback
  plate: {
    borderRadius: 999,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.gold,
  },
  plateMd: { width: 58, height: 58, borderWidth: 6 },
  plateSm: { width: 44, height: 44, borderWidth: 4 },
  initials: { color: Colors.primary, fontWeight: '900' },
  initialsMd: { fontSize: 17 },
  initialsSm: { fontSize: 13 },
  tag: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
