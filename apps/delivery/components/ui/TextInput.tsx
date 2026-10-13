import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

  // Resolve borders
  let borderColor = colors.border;
  if (error) {
    borderColor = colors.danger;
  } else if (isFocused) {
    borderColor = colors.primary;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="xs" weight="medium" color={error ? 'danger' : 'secondary'} style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderRadius: radius.medium,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.iconLeft}>
            <Icon name={leftIcon} size={20} colorType="textSecondary" />
          </View>
        )}

        <RNTextInput
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              paddingVertical: spacing.sm,
            },
            inputStyle,
          ]}
          {...props}
        />

        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide information' : 'Show information'}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
          >
            <Icon name={isPasswordVisible ? 'visibility-off' : 'visibility'} size={20} colorType="textSecondary" />
          </Pressable>
        ) : rightIcon ? (
          <Pressable disabled={!onRightIconPress} onPress={onRightIconPress} style={styles.iconRight}>
            <Icon name={rightIcon} size={20} colorType="textSecondary" />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="muted" style={styles.feedback}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'System',
    paddingHorizontal: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
    padding: 4,
  },
  feedback: {
    marginTop: 4,
  },
});

export default TextInput;
