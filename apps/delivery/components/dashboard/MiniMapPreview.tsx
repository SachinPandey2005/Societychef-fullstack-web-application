import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface MiniMapPreviewProps {
  societyName?: string;
  hasActiveDelivery?: boolean;
  onPressViewMap?: () => void;
}

export const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({
  societyName = 'Green Meadows Society',
  onPressViewMap,
}) => {
  const { colors, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Side: Coverage Zone Metadata */}
        <View style={styles.leftCol}>
          <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', fontSize: 13 }}>
            Coverage Zone
          </Text>

          {/* Row 1: Building Icon + Society Name */}
          <View style={[styles.metaRow, { marginTop: 10 }]}>
            <View style={styles.iconCircleGreen}>
              <Icon name="business" size={14} color="#059669" />
            </View>
            <Text variant="xs" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
              {societyName}
            </Text>
          </View>

          {/* Row 2: Pin Icon + Subtitle */}
          <View style={styles.metaRow}>
            <Icon name="place" size={14} color="#94A3B8" />
            <Text variant="caption" style={{ color: '#64748B', marginLeft: 6, fontSize: 11 }}>
              All Towers • Core Campus
            </Text>
          </View>

          {/* Row 3: Check Mark + Inside Zone Status */}
          <View style={styles.metaRow}>
            <Icon name="check-circle" size={14} color="#10B981" />
            <Text variant="caption" weight="bold" style={{ color: '#059669', marginLeft: 6, fontSize: 11 }}>
              You're inside your zone
            </Text>
          </View>
        </View>

        {/* Right Side: Styled Map Viewport with Polygon & Floating Pill */}
        <View style={styles.mapContainer}>
          <View style={styles.mapViewport}>
            <View style={styles.roadH} />
            <View style={styles.roadV} />
            <View style={styles.zonePolygon}>
              <View style={styles.centerDot} />
            </View>
          </View>

          {/* Floating View Map Button Overlay */}
          <TouchableOpacity activeOpacity={0.8} onPress={onPressViewMap} style={styles.floatingViewMapBtn}>
            <Text variant="caption" weight="bold" style={{ color: '#0F172A', fontSize: 10 }}>
              View Map ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconCircleGreen: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    width: 140,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewport: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ECFDF5',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    top: '45%',
    backgroundColor: '#FFFFFF',
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    left: '55%',
    backgroundColor: '#FFFFFF',
  },
  zonePolygon: {
    width: 90,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  floatingViewMapBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default MiniMapPreview;
