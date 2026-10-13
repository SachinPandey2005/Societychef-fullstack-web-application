import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface NavigationHeaderProps {
  currentInstruction?: string;
  distanceMeters?: number;
  speedKmh?: number;
  headingAngle?: number;
  onExit?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentInstruction = 'Turn right on Green Meadows Rd',
  distanceMeters = 1200,
  onExit,
}) => {
  const router = useRouter();
  const { spacing, radius, shadows } = useTheme();

  const distanceText = distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: radius.xxlarge,
          padding: spacing.md,
          ...shadows.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.turnIconBox}>
          <Icon name="turn-right" size={26} color="#FFFFFF" />
        </View>

        <View style={styles.instructionTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A' }}>
              ↱ {distanceText}
            </Text>
          </View>

          <Text variant="xs" weight="bold" style={{ color: '#0B4F3A', marginTop: 2 }}>
            {currentInstruction}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onExit || (() => router.back())}
          style={styles.exitBtn}
        >
          <Icon name="close" size={18} color="#0B4F3A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0B4F3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  exitBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E2ECE7',
  },
});

export default NavigationHeader;
