import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

interface CategoryGraphicProps {
  type: string;
  isSelected?: boolean;
  size?: number;
}

export const CategoryGraphic: React.FC<CategoryGraphicProps> = ({
  type,
  isSelected = false,
  size = 48,
}) => {
  const Colors = useThemeStore((s) => s.colors);

  let imageSrc = null;
  const lower = type.toLowerCase();

  if (lower === 'lunch') {
    imageSrc = require('../../assets/image copy.png');
  } else if (lower === 'dinner') {
    imageSrc = require('../../assets/image copy 2.png');
  } else if (lower === 'breakfast') {
    imageSrc = require('../../assets/image copy 3.png');
  } else if (lower === 'snacks') {
    imageSrc = require('../../assets/image copy 4.png');
  } else if (lower === 'desserts') {
    imageSrc = require('../../assets/image copy 5.png');
  }

  if (imageSrc) {
    return (
      <Image
        source={imageSrc}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="contain"
      />
    );
  }

  // Fallback for 'more' or unknown category
  return (
    <Ionicons
      name="ellipsis-horizontal"
      size={size * 0.55}
      color={isSelected ? (Colors.orange || '#E87D3E') : '#64748B'}
    />
  );
};

