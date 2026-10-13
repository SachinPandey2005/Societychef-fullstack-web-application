import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

type Filter = 'All' | 'Veg' | 'NonVeg' | 'Gym';

type Props = {
  selected: Filter;
  onSelect: (filter: Filter) => void;
};

const FILTERS: Filter[] = ['All', 'Veg', 'NonVeg', 'Gym'];

export function FilterChips({ selected, onSelect }: Props) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.chip,
            selected === filter && styles.activeChip,
          ]}
          onPress={() => onSelect(filter)}
        >
          <Text
            style={[
              styles.text,
              selected === filter && styles.activeText,
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  activeChip: {
    backgroundColor: Colors.primary,
  },

  text: {
    color: Colors.dark,
    fontWeight: '700',
  },

  activeText: {
    color: '#fff',
  },
});