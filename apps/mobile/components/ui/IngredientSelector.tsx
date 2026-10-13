import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const INGREDIENTS = [
  'Onion',
  'Garlic',
  'Butter',
  'Cheese',
  'Milk',
  'Ghee',
  'Peanut',
  'Cashew',
  'Mushroom',
  'Green Chilli',
];

type Props = {
  selected: string[];
  onChange: (items: string[]) => void;
};

export default function IngredientSelector({
  selected,
  onChange,
}: Props) {
  const { t } = useTranslation();

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <View style={styles.container}>
      {INGREDIENTS.map(item => (
        <Pressable
          key={item}
          style={[
            styles.chip,
            selected.includes(item) && styles.activeChip,
          ]}
          onPress={() => toggle(item)}
        >
          <Text
            style={[
              styles.text,
              selected.includes(item) && styles.activeText,
            ]}
          >
            {t(`allergy.tag.${item}`, item)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },

  activeChip: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },

  text: {
    color: '#333',
  },

  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
});