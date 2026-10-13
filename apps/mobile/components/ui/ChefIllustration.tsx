import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface ChefIllustrationProps {
  size?: number;
  mode?: 'cooking' | 'avatar' | 'banner';
  imageSource?: any;
}

export const ChefIllustration: React.FC<ChefIllustrationProps> = ({
  size = 140,
  mode = 'cooking',
  imageSource,
}) => {
  const Colors = useThemeStore((s) => s.colors);

  if (mode === 'avatar') {
    return (
      <View
        style={[
          styles.avatarWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: Colors.gold || Colors.primary,
          },
        ]}
      >
        <Image
          source={imageSource || require('../../assets/anjalis_roti_avatar.png')}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  const source = imageSource || require('../../assets/home_chef_cooking.png');

  const width = mode === 'banner' ? '100%' : size * 1.15;
  const height = mode === 'banner' ? '100%' : size;

  return (
    <View style={[styles.imageContainer, { width, height, backgroundColor: 'transparent' }]}>
      <Image
        source={source}
        style={[styles.heroImage, { width: '100%', height: '100%' }]}
        resizeMode={mode === 'banner' ? 'cover' : 'contain'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    borderRadius: 16,
  },
});
