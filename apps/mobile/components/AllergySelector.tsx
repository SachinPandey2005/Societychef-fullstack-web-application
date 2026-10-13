import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  LayoutAnimationConfig,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALLERGY_TAGS = [
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
  'Other',
] as const;

const OTHER_TAG = 'Other';

// Ensure 44px min touch target — chips have 10px paddingVertical (≈34px tall)
// so 5px hitSlop top/bottom adds the remaining 10px
const CHIP_HIT_SLOP = { top: 5, bottom: 5, left: 4, right: 4 };

// Custom LayoutAnimation config: 225ms ease for height and opacity transitions
const EXPAND_ANIMATION: LayoutAnimationConfig = {
  duration: 225,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

// ── Types ────────────────────────────────────────────────────────────────────

export type AllergyValue = {
  tags: string[];
  otherText: string;
};

type AllergySelectorProps = {
  value: AllergyValue;
  onChange: (value: AllergyValue) => void;
  error?: string;
};

// ── Component ────────────────────────────────────────────────────────────────

export function AllergySelector({ value, onChange, error }: AllergySelectorProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const otherInputRef = useRef<TextInput>(null);

  const isOtherSelected = value.tags.includes(OTHER_TAG);

  function toggleTag(tag: string) {
LayoutAnimation.configureNext(EXPAND_ANIMATION);

    const isSelected = value.tags.includes(tag);

    if (isSelected) {
      const nextTags = value.tags.filter((x) => x !== tag);
      // If un-selecting "Other", clear otherText immediately so
      // the parent can reactively clear any related validation error
      const nextOther = tag === OTHER_TAG ? '' : value.otherText;
      onChange({ tags: nextTags, otherText: nextOther });
    } else {
      const nextTags = [...value.tags, tag];
      onChange({ tags: nextTags, otherText: value.otherText });
      // Auto-focus the text input when "Other" is tapped
      if (tag === OTHER_TAG) {
        setTimeout(() => otherInputRef.current?.focus(), 250);
      }
    }
  }

  function handleOtherTextChange(text: string) {
onChange({ tags: value.tags, otherText: text });
  }

  return (
    <View style={styles.container}>
      {/* 1. Heading */}
      <Text style={styles.heading}>{t('allergy.heading', 'Allergy Information')}</Text>

      {/* 2. Subtext */}
      <Text style={styles.subtext}>
        {t('allergy.subtext', 'Mention if you are allergic to any of these ingredients.')}
      </Text>

      {/* 3. Chip group */}
      <View style={styles.chipRow}>
        {ALLERGY_TAGS.map((tag) => {
          const active = value.tags.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleTag(tag)}
              hitSlop={CHIP_HIT_SLOP}
            >
              {active && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(`allergy.tag.${tag}`, tag)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4. Conditional "Other" TextInput — fade + height animated via LayoutAnimation */}
      {isOtherSelected && (
        <View style={styles.otherInputWrap}>
          <TextInput
            ref={otherInputRef}
            style={styles.otherInput}
            value={value.otherText}
            onChangeText={handleOtherTextChange}
            placeholder={t('allergy.otherPlaceholder', 'Please mention your allergy...')}
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            {...({ outlineStyle: 'none' } as any)}
          />
        </View>
      )}

      {/* 5. Conditional error text */}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    // no outer margin — parent controls placement
  },

  // Matches cardTitle from profile.tsx (fontSize 16, fontWeight 900)
  heading: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 4,
  },

  // Secondary muted text, consistent with profile subtext patterns
  subtext: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: 14,
  },

  // Matches FilterChips container (flexDirection row, flexWrap wrap, gap 10)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Matches FilterChips chip styling; paddingVertical bumped to 10 so
  // visual height ≈ 34px, + hitSlop reaches 44px touch target
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Matches FilterChips text styling
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },

  chipTextActive: {
    color: '#fff',
  },

  // Matches profile.tsx addrInput styling (bg, border, radius, padding, font)
  otherInputWrap: {
    marginTop: 12,
  },

  otherInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark,
    minHeight: 52,
  },

  // Error text using the existing red token
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.red,
    marginTop: 8,
  },
});
