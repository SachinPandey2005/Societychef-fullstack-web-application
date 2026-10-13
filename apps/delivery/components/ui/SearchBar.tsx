import React from 'react';
import { View, TextInput, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../Icon';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  style,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.large,
          backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Icon name="search" size={20} colorType="textSecondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            paddingLeft: spacing.xs,
          },
        ]}
        accessibilityRole="search"
        accessibilityLabel="Search input field"
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search input"
          style={styles.clearButton}
        >
          <Icon name="close" size={18} colorType="textSecondary" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'System',
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;
