import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';

export default function DishCardSkeleton() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.card, { opacity: anim }]}>
      {/* name + badges placeholder */}
      <View style={styles.topRow}>
        <View style={styles.namePlaceholder} />
        <View style={styles.badgePlaceholder} />
      </View>
      {/* meta line */}
      <View style={styles.metaPlaceholder} />
      {/* close time */}
      <View style={styles.timePlaceholder} />
      {/* action row */}
      <View style={styles.actionRow}>
        <View style={styles.actionChip} />
        <View style={styles.actionChip} />
        <View style={styles.actionChip} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  namePlaceholder:  { height: 16, width: '55%', borderRadius: 8, backgroundColor: '#CBD5E1' },
  badgePlaceholder: { height: 22, width: 80,    borderRadius: 11, backgroundColor: '#CBD5E1' },
  metaPlaceholder:  { height: 13, width: '40%', borderRadius: 6,  backgroundColor: '#CBD5E1', marginBottom: 8 },
  timePlaceholder:  { height: 11, width: '55%', borderRadius: 5,  backgroundColor: '#CBD5E1', marginBottom: 12 },
  actionRow:        { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 10 },
  actionChip:       { height: 12, width: 48, borderRadius: 6, backgroundColor: '#CBD5E1' },
});
