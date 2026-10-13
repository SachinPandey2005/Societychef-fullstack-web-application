import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { Button } from './ui/Button';
import { DishVisual } from './ui/DishVisual';
import type { Dish, Order } from '../types';

interface RateOrderModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const LABEL_KEYS = ['', 'rateModal.label1', 'rateModal.label2', 'rateModal.label3', 'rateModal.label4', 'rateModal.label5'];
const LABEL_FALLBACKS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
const QUICK_TAG_DEFS = [
  { key: 'rateModal.tagTasty', fallback: 'Tasty food' },
  { key: 'rateModal.tagPortions', fallback: 'Good portions' },
  { key: 'rateModal.tagPacked', fallback: 'Well packed' },
  { key: 'rateModal.tagHot', fallback: 'Hot & fresh' },
  { key: 'rateModal.tagOnTime', fallback: 'On time' },
  { key: 'rateModal.tagHomely', fallback: 'Homely taste' },
  { key: 'rateModal.tagValue', fallback: 'Value for money' },
];

export function RateOrderModal({ visible, order, onClose, onSubmit }: RateOrderModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!order) return null;

  const dish: Dish = {
    id: order.dishId,
    name: order.dishName,
    category: 'Homestyle',
    foodType: 'Veg',
    suggestedPrice: 0,
    leadTimeMinutes: 120,
    tags: [],
  };

  const display = hovered > 0 ? hovered : rating;
  const quickTags = QUICK_TAG_DEFS.map((d) => t(d.key, d.fallback));

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  }

  function handleSubmit() {
    if (rating === 0) return;
    const fullComment = tags.length
      ? [tags.join(' · '), comment].filter(Boolean).join('\n')
      : comment;
    onSubmit(rating, fullComment);
    setRating(0);
    setHovered(0);
    setComment('');
    setTags([]);
  }

  function handleClose() {
    setRating(0);
    setHovered(0);
    setComment('');
    setTags([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            {dish && <DishVisual dish={dish} size="md" />}
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t('rateModal.eyebrow', 'Rate your order')}</Text>
              <Text style={styles.dishName}>{order.dishName}</Text>
              <Text style={styles.kitchenLine}>{order.kitchenName}</Text>
            </View>
          </View>

          {/* Star rating selector */}
          <View style={styles.starsSection}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => {
                const isFilled = s <= display;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setRating(s);
                      setHovered(0);
                    }}
                    onHoverIn={() => setHovered(s)}
                    onHoverOut={() => setHovered(0)}
                    style={({ pressed }) => [
                      styles.starBtn,
                      pressed && styles.starBtnPressed,
                      { outlineStyle: 'none', cursor: 'pointer' } as any,
                    ]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${s} star${s > 1 ? 's' : ''}`}
                  >
                    <Ionicons
                      name={isFilled ? 'star' : 'star-outline'}
                      size={38}
                      color={isFilled ? '#F59E0B' : (isDark ? '#52525B' : Colors.border)}
                    />
                  </Pressable>
                );
              })}
            </View>
            {display > 0 ? (
              <Text style={styles.ratingLabel}>{t(LABEL_KEYS[display], LABEL_FALLBACKS[display])}</Text>
            ) : (
              <Text style={styles.ratingHint}>{t('rateModal.tapToRate', 'Tap a star to rate')}</Text>
            )}
          </View>

          {/* Quick tags */}
          <Text style={styles.sectionLabel}>{t('rateModal.whatStoodOut', 'What stood out?')}</Text>
          <View style={styles.tagsWrap}>
            {quickTags.map((tag) => {
              const isSelected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[
                    styles.tag,
                    isSelected && styles.tagActive,
                    { outlineStyle: 'none', cursor: 'pointer' } as any,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Comment */}
          <Text style={styles.sectionLabel}>{t('rateModal.addNote', 'Add a note (optional)')}</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder={t('rateModal.notePlaceholder', 'Share your experience with the community…')}
            placeholderTextColor={Colors.muted}
            multiline
            maxLength={280}
            {...({ outlineStyle: 'none' } as any)}
          />
          <Text style={styles.charCount}>{t('rateModal.charCount', { defaultValue: '{{count}}/280', count: comment.length })}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button label={t('rateModal.skip', 'Skip')} variant="secondary" flex onPress={handleClose} />
            <Button
              label={t('rateModal.submitReview', 'Submit review')}
              variant="primary"
              flex
              disabled={rating === 0}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: Colors.border,
      alignSelf: 'center',
      marginBottom: 18,
    },
    header: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    headerCopy: {
      flex: 1,
    },
    eyebrow: {
      color: Colors.primary,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    dishName: {
      color: Colors.dark,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 2,
    },
    kitchenLine: {
      color: Colors.muted,
      fontSize: 13,
      marginTop: 2,
    },
    starsSection: {
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      paddingVertical: 16,
      borderRadius: 16,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    starBtn: {
      padding: 6,
      borderRadius: 10,
    },
    starBtnPressed: {
      transform: [{ scale: 1.2 }],
    },
    ratingLabel: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '900',
      color: '#F59E0B',
    },
    ratingHint: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.muted,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '900',
      color: Colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: Colors.border,
      backgroundColor: Colors.bg,
    },
    tagActive: {
      backgroundColor: isDark ? 'rgba(224, 83, 67, 0.15)' : '#FEF2F2',
      borderColor: Colors.primary,
    },
    tagText: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.muted,
    },
    tagTextActive: {
      color: Colors.primary,
      fontWeight: '800',
    },
    commentInput: {
      backgroundColor: Colors.bg,
      borderWidth: 1.5,
      borderColor: Colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 14,
      color: Colors.dark,
      minHeight: 84,
      textAlignVertical: 'top',
      marginBottom: 4,
    },
    charCount: {
      fontSize: 11,
      color: Colors.muted,
      textAlign: 'right',
      marginBottom: 16,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
  });
