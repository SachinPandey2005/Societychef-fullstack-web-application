import { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/useThemeStore';

const OPTIONS = [
  { key: 'default', label: 'Auto', icon: 'contrast' },
  { key: 'light', label: 'Light', icon: 'sunny' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
] as const;

export function ThemeSwitcher() {
  const insets = useSafeAreaInsets();
  const mode = useThemeStore((s) => s.mode);
  const colors = useThemeStore((s) => s.colors);
  const setMode = useThemeStore((s) => s.setMode);
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.key === mode) ?? OPTIONS[0];

  return (
    <View style={[styles.wrap, { bottom: (insets.bottom || 0) + 90, right: Platform.OS === 'web' ? 24 : 16 }]} pointerEvents="box-none">
      {open && (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.row, mode === opt.key && { backgroundColor: colors.pillInactive }]}
              onPress={() => {
                setMode(opt.key);
                setOpen(false);
              }}
            >
              <Ionicons name={opt.icon as any} size={16} color={colors.textPrimary} style={styles.icon} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.fab, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name={current.icon as any} size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute', 
    right: 20, 
    alignItems: 'flex-end', 
    zIndex: 999 
  },
  fab: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  panel: {
    marginBottom: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 4, minWidth: 120,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  icon: { width: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700' },
});
