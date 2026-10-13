import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface SummaryLineProps {
  label: string;
  value: string;
  strong?: boolean;
  separator?: boolean;
  valueColor?: string;
}

export function SummaryLine({ label, value, strong = false, separator = false, valueColor }: SummaryLineProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={[styles.row, separator && styles.rowSeparator]}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.valueStrong, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    color: Colors.muted,
    fontSize: 14,
    flex: 1,
  },
  labelStrong: {
    color: Colors.dark,
    fontSize: 17,
    fontWeight: '900',
  },
  value: {
    color: Colors.dark,
    fontWeight: '900',
    fontSize: 14,
  },
  valueStrong: {
    fontSize: 17,
  },
});
