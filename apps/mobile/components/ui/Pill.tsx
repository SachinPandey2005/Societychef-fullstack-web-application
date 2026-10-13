import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function Pill({ label, active, onPress }: PillProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  pill: {
    borderRadius: 999,
    minHeight: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.pillInactive,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  labelActive: {
    color: '#ffffff',
  },
});
