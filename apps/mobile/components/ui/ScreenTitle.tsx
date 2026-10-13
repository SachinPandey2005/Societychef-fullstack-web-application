import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface ScreenTitleProps {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}

export function ScreenTitle({ eyebrow, title, action }: ScreenTitleProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  if (action != null) {
    return (
      <View style={[styles.container, styles.row]}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View>{action}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  eyebrow: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.dark,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 4,
  },
});
