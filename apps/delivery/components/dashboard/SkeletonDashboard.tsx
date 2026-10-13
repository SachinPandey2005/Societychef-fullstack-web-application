import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SkeletonLoader } from '../ui/SkeletonLoader';

export const SkeletonDashboard: React.FC = () => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.md }]}>
      {/* Header skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.large, padding: spacing.md }]}>
        <View style={styles.row}>
          <SkeletonLoader width={54} height={54} shape="circle" />
          <View style={{ marginLeft: spacing.md, flex: 1, gap: 6 }}>
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width="40%" height={12} />
          </View>
        </View>
      </View>

      {/* Duty card skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.large, padding: spacing.md, marginTop: spacing.md }]}>
        <View style={styles.rowBetween}>
          <SkeletonLoader width="40%" height={18} />
          <SkeletonLoader width={50} height={24} shape="square" />
        </View>
        <SkeletonLoader width="90%" height={12} style={{ marginTop: 8 }} />
      </View>

      {/* Shift skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.large, padding: spacing.md, marginTop: spacing.md }]}>
        <SkeletonLoader width="50%" height={16} />
        <View style={[styles.rowBetween, { marginTop: 12 }]}>
          <SkeletonLoader width="30%" height={24} />
          <SkeletonLoader width="30%" height={24} />
          <SkeletonLoader width="30%" height={24} />
        </View>
      </View>

      {/* Grid skeleton */}
      <View style={[styles.grid, { marginTop: spacing.md }]}>
        <SkeletonLoader width="48%" height={70} shape="square" />
        <SkeletonLoader width="48%" height={70} shape="square" />
        <SkeletonLoader width="48%" height={70} shape="square" />
        <SkeletonLoader width="48%" height={70} shape="square" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default SkeletonDashboard;
