import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

type Tone = 'green' | 'gold' | 'blue' | 'red' | 'default';

interface BadgeProps {
  label: string;
  tone?: Tone;
  small?: boolean;
}

export function Badge({ label, tone = 'default', small }: BadgeProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const toneStyles = getToneStyles(Colors);

  return (
    <View style={[styles.badge, toneStyles[tone], small && styles.badgeSmall]}>
      <Text style={[styles.text, small && styles.textSmall]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const getToneStyles = (Colors: any): Record<Tone, object> => ({
  green: { backgroundColor: Colors.greenBadge },
  gold: { backgroundColor: Colors.goldBadge },
  blue: { backgroundColor: Colors.blueBadge },
  red: { backgroundColor: '#fde8e6' },
  default: { backgroundColor: Colors.pillInactive },
});

const getStyles = (Colors: any) => StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 4,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  textSmall: {
    fontSize: 11,
  },
});
