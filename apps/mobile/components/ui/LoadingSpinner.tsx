import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface LoadingSpinnerProps {
  fullscreen?: boolean;
  label?: string;
}

export function LoadingSpinner({ fullscreen = false, label }: LoadingSpinnerProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator color={Colors.primary} size="large" />
      {label != null && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  label: {
    color: Colors.muted,
    marginTop: 12,
    fontSize: 14,
  },
});
