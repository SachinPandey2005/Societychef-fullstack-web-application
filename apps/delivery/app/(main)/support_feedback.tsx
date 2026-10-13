import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components/Typography';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/Icon';
import { SupportRepository } from '../../repositories/SupportRepository';
import { useToast } from '../../components/ui/Toast';

const FEEDBACK_TYPES = [
  { value: 'APP_FEEDBACK', label: 'App Feedback' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'GENERAL_SUGGESTION', label: 'Suggestion' },
];

export default function SupportFeedbackScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const [feedbackType, setFeedbackType] = useState('APP_FEEDBACK');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('Please enter description details before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await SupportRepository.submitFeedback(feedbackType, description);
      showToast('Feedback submitted successfully! Thank you.', 'success');
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Feedback submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Submit Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Feedback Type Grid Selection */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Feedback Type</Text>
            <View style={styles.feedbackGrid}>
              {FEEDBACK_TYPES.map((type) => {
                const isSelected = feedbackType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    onPress={() => setFeedbackType(type.value)}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? 'transparent' : colors.outlineVariant,
                        borderRadius: radius.medium,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="bold"
                      style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                      align="center"
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description text input details */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Feedback Details</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the feature request, bug details, or app suggestions..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.md,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <Button
            label="Submit Feedback"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ marginTop: spacing.md }}
          />

        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeBtn: {
    width: '47%',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    borderWidth: 1,
    minHeight: 120,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
