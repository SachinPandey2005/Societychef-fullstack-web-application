import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

interface StarRatingProps {
  rating: number;
}

export function StarRating({ rating }: StarRatingProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.starRow}>
      <Ionicons name="star" size={14} color={Colors.gold} />
      <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
});
