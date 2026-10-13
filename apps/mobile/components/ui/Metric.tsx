import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface MetricProps {
  value: string;
  label: string;
  inverse?: boolean;
}

export function Metric({ value, label, inverse = false }: MetricProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={[styles.container, inverse && styles.containerInverse]}>
      <Text style={[styles.value, inverse && styles.valueInverse]}>{value}</Text>
      <Text style={[styles.label, inverse && styles.labelInverse]}>{label}</Text>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 12,
  },
  containerInverse: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.blue,
  },
  valueInverse: {
    color: '#ffffff',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.muted,
    marginTop: 2,
  },
  labelInverse: {
    color: 'rgba(255,255,255,0.76)',
  },
});
