import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/useThemeStore';

interface HygieneBadgeListProps {
  checklist?: { label: string; confirmed: boolean }[];
}

export function HygieneBadgeList({ checklist }: HygieneBadgeListProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  if (!checklist || checklist.length === 0) return null;
  
  const confirmed = checklist.filter(c => c.confirmed);
  
  if (confirmed.length === 0) {
    return <Text style={styles.emptyText}>No hygiene details provided.</Text>;
  }

  return (
    <View style={styles.container}>
      {confirmed.map((item, i) => (
        <View key={i} style={styles.badge}>
          <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          <Text style={styles.badgeText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
    fontStyle: 'italic',
  }
});
