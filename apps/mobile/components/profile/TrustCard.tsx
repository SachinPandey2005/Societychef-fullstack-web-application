import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';

interface TrustCardProps {
  badges: { id: string; label: string; icon: string }[];
}

export function TrustCard({ badges }: TrustCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  if (badges.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.headerTitle}>{t('trustCard.trustAndSafety', 'Trust & Safety')}</Text>
      {badges.map((badge, index) => (
        <View key={badge.id} style={[styles.row, index === badges.length - 1 && styles.lastRow]}>
          <Ionicons name={badge.icon as any} size={22} color={Colors.primary} />
          <Text style={styles.label}>{badge.label}</Text>
          <Ionicons name="checkmark" size={20} color={Colors.green} style={styles.check} />
        </View>
      ))}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginLeft: 12,
    flex: 1,
  },
  check: {
    marginLeft: 12,
  }
});
