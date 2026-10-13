import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface CardProps {
  children: React.ReactNode;
  featured?: boolean;
  style?: ViewStyle;
}

export function Card({ children, featured = false, style }: CardProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={[styles.card, featured && styles.cardFeatured, style]}>
      {children}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFeatured: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceAlt,
  },
});
