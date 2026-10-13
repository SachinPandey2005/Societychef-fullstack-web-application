import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  body: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action != null && (
        <View style={styles.actionWrap}>
          <Button label={action.label} onPress={action.onPress} variant="primary" />
        </View>
      )}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  body: {
    color: Colors.muted,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  actionWrap: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
});
