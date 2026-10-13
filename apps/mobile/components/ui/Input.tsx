import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface InputProps extends TextInputProps {
  label?: string;
  prefix?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, prefix, style, ...props },
  ref,
) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {prefix && (
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          ref={ref}
          style={[styles.input, prefix && styles.inputWithPrefix, style]}
          placeholderTextColor={Colors.muted}
          // Suppress browser default focus ring on web
          {...({ outlineStyle: 'none' } as any)}
          {...props}
        />
      </View>
    </View>
  );
});

const getStyles = (Colors: any) => StyleSheet.create({
  wrap: { width: '100%' },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefixBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.pillInactive,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark,
  },
  inputWithPrefix: {
    paddingHorizontal: 12,
  },
});
