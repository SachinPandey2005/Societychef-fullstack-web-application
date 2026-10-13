import React, { useRef, useState } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface OtpInputProps {
  length?: number;
  onCodeChanged?: (code: string) => void;
  onCodeFilled?: (code: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  onCodeChanged,
  onCodeFilled,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputsRef = useRef<RNTextInput[]>([]);

  const handleChangeText = (text: string, index: number) => {
    // Keep only last char if pasted
    const cleanText = text.replace(/[^0-9]/g, '');
    const char = cleanText.substring(cleanText.length - 1);
    
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    const fullCode = newCode.join('');
    if (onCodeChanged) onCodeChanged(fullCode);

    // Auto-focus next input
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Call complete callback
    if (fullCode.length === length && onCodeFilled) {
      onCodeFilled(fullCode);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    // Go to previous box on backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => {
          const isFocused = focusedIndex === index;
          return (
            <RNTextInput
              key={index}
              ref={(ref) => {
                if (ref) inputsRef.current[index] = ref;
              }}
              keyboardType="number-pad"
              maxLength={1}
              value={code[index]}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              style={[
                styles.otpBox,
                {
                  width: 50,
                  height: 55,
                  borderRadius: radius.medium,
                  borderColor: isFocused ? colors.primary : code[index] ? colors.secondary : colors.border,
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  color: colors.text,
                  marginHorizontal: spacing.xs,
                  borderWidth: isFocused ? 2 : 1.5,
                },
              ]}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1} of OTP`}
            />
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  otpBox: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default OtpInput;
