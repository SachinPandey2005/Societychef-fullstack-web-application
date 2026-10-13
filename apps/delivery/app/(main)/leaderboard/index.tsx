import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useLeaderboardStore } from '../../../store/useLeaderboardStore';
import { LeaderboardRepository } from '../../../repositories/LeaderboardRepository';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { entries, currentScope, isLoading } = useLeaderboardStore();

  useEffect(() => {
    LeaderboardRepository.fetchLeaderboard('SOCIETY');
  }, []);

  const handleRefresh = async () => {
    await LeaderboardRepository.fetchLeaderboard(currentScope);
  };

  const handleScopeChange = async (scope: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY') => {
    await LeaderboardRepository.fetchLeaderboard(scope);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Partner Leaderboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surfaceContainerLow, borderBottomColor: colors.outlineVariant }]}>
        {(['SOCIETY', 'CITY', 'REGION', 'COMPANY'] as const).map((scope) => (
          <Pressable
            key={scope}
            onPress={() => handleScopeChange(scope)}
            style={[
              styles.tabBtn,
              currentScope === scope && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              variant="caption"
              weight="bold"
              style={{ color: currentScope === scope ? colors.primary : colors.textMuted }}
            >
              {scope}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          
          {entries.map((item) => {
            const isTop3 = item.rank <= 3;
            
            // Custom trophy icon colors for top 3
            const getTrophyColor = (rank: number) => {
              if (rank === 1) return '#FFD700'; // Gold
              if (rank === 2) return '#C0C0C0'; // Silver
              return '#CD7F32'; // Bronze
            };

            return (
              <Card
                key={item.id}
                style={[
                  styles.entryCard,
                  {
                    padding: spacing.md,
                    backgroundColor: item.is_self ? colors.primaryContainer : colors.surface,
                    borderColor: item.is_self ? colors.primary : 'transparent',
                    borderWidth: item.is_self ? 1.5 : 0,
                  },
                ]}
              >
                <View style={styles.rankWrapper}>
                  {isTop3 ? (
                    <View style={styles.trophyWrapper}>
                      <Icon name="emoji-events" size={20} color={getTrophyColor(item.rank)} />
                      <Text variant="caption" weight="extrabold" style={{ fontSize: 9, position: 'absolute', top: 2 }}>
                        {item.rank}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="caption" weight="extrabold" style={{ width: 20, textAlign: 'center' }}>
                      {item.rank}
                    </Text>
                  )}

                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text
                      variant="caption"
                      weight={item.is_self ? 'extrabold' : 'bold'}
                      style={{ color: item.is_self ? colors.onPrimaryContainer : colors.text }}
                    >
                      {item.name}
                    </Text>
                    <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                      {item.completed_deliveries} deliveries  •  ★ {item.rating}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="caption" weight="extrabold" color="primary">
                      {item.score} pts
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}

          {entries.length === 0 && (
            <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.xl }}>
              No leaderboard entries found for this scope.
            </Text>
          )}

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
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  entryCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rankWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
