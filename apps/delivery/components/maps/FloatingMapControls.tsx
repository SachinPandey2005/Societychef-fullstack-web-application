import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../Icon';
import { useMapStore, MapStyleType } from '../../store/useMapStore';

interface FloatingMapControlsProps {
  onRecenter: () => void;
}

export const FloatingMapControls: React.FC<FloatingMapControlsProps> = ({ onRecenter }) => {
  const { colors, radius, shadows } = useTheme();
  const { mapStyle, showTraffic, setMapStyle, toggleTraffic } = useMapStore();

  const cycleMapStyle = () => {
    const nextStyle: Record<MapStyleType, MapStyleType> = {
      LIGHT: 'DARK',
      DARK: 'SATELLITE',
      SATELLITE: 'LIGHT',
    };
    setMapStyle(nextStyle[mapStyle]);
  };

  return (
    <View style={styles.floatingControlsContainer}>
      {/* Recenter Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRecenter}
        style={[styles.controlBtn, { backgroundColor: colors.surface, borderRadius: radius.medium, ...shadows.md }]}
      >
        <Icon name="my-location" size={20} colorType="primary" />
      </TouchableOpacity>

      {/* Traffic Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleTraffic}
        style={[
          styles.controlBtn,
          {
            backgroundColor: showTraffic ? colors.primary : colors.surface,
            borderRadius: radius.medium,
            ...shadows.md,
          },
        ]}
      >
        <Icon name="traffic" size={20} color={showTraffic ? '#FFFFFF' : colors.textSecondary} />
      </TouchableOpacity>

      {/* Map Style Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={cycleMapStyle}
        style={[styles.controlBtn, { backgroundColor: colors.surface, borderRadius: radius.medium, ...shadows.md }]}
      >
        <Icon name="layers" size={20} colorType="secondary" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingControlsContainer: {
    position: 'absolute',
    right: 14,
    bottom: 220,
    gap: 10,
    zIndex: 20,
  },
  controlBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingMapControls;
