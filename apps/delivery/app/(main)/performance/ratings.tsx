import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useRatingStore } from '../../../store/useRatingStore';
import { RatingRepository } from '../../../repositories/RatingRepository';

export default function RatingsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { summary, reviews, isLoading } = useRatingStore();

  useEffect(() => {
    RatingRepository.fetchRatingsSummary();
    RatingRepository.fetchReviews();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      RatingRepository.fetchRatingsSummary(),
      RatingRepository.fetchReviews(),
    ]);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Ratings & Customer Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Overall Summary Card */}
          <Card style={{ padding: spacing.md, alignItems: 'center' }}>
            <Text variant="caption" color="secondary">Overall Rating</Text>
            <Text variant="h1" weight="extrabold" color="warning" style={{ fontSize: 48, marginVertical: spacing.xs }}>
              {summary?.overall_rating || '5.0'}
            </Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => {
                const isHalf = (summary?.overall_rating || 5) >= s - 0.5 && (summary?.overall_rating || 5) < s;
                const isFull = (summary?.overall_rating || 5) >= s;
                return (
                  <Icon
                    key={s}
                    name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                    size={28}
                    color={colors.warning}
                  />
                );
              })}
            </View>
            
            <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
              Based on {summary?.total_reviews || 0} reviews
            </Text>
          </Card>

          {/* Positives & Suggestions Feed */}
          {summary && (
            <Card style={{ padding: spacing.md }}>
              <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>Positive Feedback Areas</Text>
              <View style={styles.feedbackGrid}>
                <View style={styles.feedbackItem}>
                  <Icon name="face" size={16} colorType="success" />
                  <Text variant="caption" color="secondary" style={{ marginLeft: 6 }}>Polite behavior: </Text>
                  <Text variant="caption" weight="bold">{summary.positive_feedback.polite_behavior}</Text>
                </View>
                <View style={styles.feedbackItem}>
                  <Icon name="inventory" size={16} colorType="success" />
                  <Text variant="caption" color="secondary" style={{ marginLeft: 6 }}>Package Intact: </Text>
                  <Text variant="caption" weight="bold">{summary.positive_feedback.package_intact}</Text>
                </View>
                <View style={styles.feedbackItem}>
                  <Icon name="timer" size={16} colorType="success" />
                  <Text variant="caption" color="secondary" style={{ marginLeft: 6 }}>On-Time: </Text>
                  <Text variant="caption" weight="bold">{summary.positive_feedback.on_time}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginVertical: spacing.md }]} />

              <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.sm }}>Improvement Suggestions</Text>
              {summary.suggestions.map((suggestion, idx) => (
                <View key={idx} style={styles.suggestionRow}>
                  <Icon name="tips-and-updates" size={16} colorType="info" />
                  <Text variant="caption" style={{ marginLeft: spacing.xs, flex: 1 }}>{suggestion}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Reviews List */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Recent Reviews ({reviews.length})</Text>
            
            {reviews.map((rev) => (
              <Card key={rev.id} style={{ padding: spacing.md }}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text variant="caption" weight="extrabold">{rev.customer_name}</Text>
                    <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                      Order Code: {rev.order_id}
                    </Text>
                  </View>
                  <View style={styles.miniStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon
                        key={s}
                        name={rev.rating >= s ? 'star' : 'star-outline'}
                        size={14}
                        color={colors.warning}
                      />
                    ))}
                  </View>
                </View>

                <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
                  "{rev.comment}"
                </Text>

                <View style={styles.reviewFooter}>
                  <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))}

            {reviews.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.xl }}>
                No written reviews available
              </Text>
            )}
          </View>

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
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  feedbackGrid: {
    gap: 8,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  miniStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
