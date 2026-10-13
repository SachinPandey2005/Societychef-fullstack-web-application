import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useAchievementStore } from '../../../store/useAchievementStore';
import { AchievementRepository } from '../../../repositories/AchievementRepository';

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { data, isLoading } = useAchievementStore();

  useEffect(() => {
    AchievementRepository.fetchAchievements();
  }, []);

  const handleRefresh = async () => {
    await AchievementRepository.fetchAchievements();
  };

  const xpCurrent = data?.experience_points ?? 0;
  const xpTarget = data?.next_level_xp ?? 1000;
  const progressPct = xpTarget > 0 ? Math.min(100, Math.round((xpCurrent / xpTarget) * 100)) : 0;

  // Static list of badges configured in rules panel
  const BADGES_CATALOG = [
    { code: '100_DELIVERIES', title: 'Century Partner', desc: 'Complete 100 deliveries', icon: 'speed' },
    { code: '500_DELIVERIES', title: 'Half-K Hero', desc: 'Complete 500 deliveries', icon: 'military-tech' },
    { code: '1000_DELIVERIES', title: 'Grandmaster', desc: 'Complete 1000 deliveries', icon: 'workspace_premium' },
    { code: 'FIVE_STAR', title: '5-Star Captain', desc: 'Maintain perfect 5.0 rating', icon: 'star' },
    { code: 'FAST_DELIVERY', title: 'Speedster', desc: 'Avg delivery under 15 min', icon: 'flash_on' },
    { code: 'WEEKEND_CHAMPION', title: 'Weekend Warrior', desc: 'Deliver 4 straight weekends', icon: 'calendar_today' },
    { code: 'FESTIVAL_HERO', title: 'Festival Hero', desc: 'Deliver during peak festivals', icon: 'celebration' },
    { code: 'ELITE_PARTNER', title: 'Elite Captain', desc: 'Level 3 partner validation', icon: 'shield' },
  ];

  const unlockedBadgesMap = new Map((data?.badges || []).map((b) => [b.badge_code, b]));

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Achievements & Badges</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Gamification Level Milestone Card */}
          <Card variant="gradient" style={{ padding: spacing.lg }}>
            <View style={styles.levelHeader}>
              <View>
                <Text variant="xs" color="white" style={{ opacity: 0.8 }}>Current Partner Level</Text>
                <Text variant="h1" weight="extrabold" color="white" style={{ fontSize: 32, marginTop: spacing.xs }}>
                  Level {data?.partner_level || '1'} Captain
                </Text>
              </View>
              <Icon name="emoji-events" size={40} color="#FFFFFF" />
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <View style={styles.xpRow}>
                <Text variant="caption" color="white" style={{ opacity: 0.7 }}>Experience Points (XP)</Text>
                <Text variant="caption" weight="bold" color="white">
                  {xpCurrent} / {xpTarget} XP
                </Text>
              </View>
              
              {/* Progress bar fill */}
              <View style={[styles.xpTrack, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 6 }]}>
                <View
                  style={[
                    styles.xpFill,
                    {
                      backgroundColor: '#FFFFFF',
                      width: `${progressPct}%`,
                    },
                  ]}
                />
              </View>
              
              <Text variant="caption" color="white" style={{ opacity: 0.7, marginTop: 6, fontSize: 10 }}>
                {xpTarget - xpCurrent} XP needed to level up
              </Text>
            </View>
          </Card>

          {/* Badges Grid */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Badges Catalog</Text>
            
            <View style={styles.badgeGrid}>
              {BADGES_CATALOG.map((badge) => {
                const unlockedData = unlockedBadgesMap.get(badge.code);
                const isUnlocked = !!unlockedData;

                return (
                  <View
                    key={badge.code}
                    style={[
                      styles.badgeCard,
                      {
                        backgroundColor: isUnlocked ? colors.surface : colors.surfaceElevated,
                        borderColor: isUnlocked ? colors.primary : 'transparent',
                        borderWidth: isUnlocked ? 1.5 : 0,
                        borderRadius: radius.large,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isUnlocked ? colors.primaryContainer : colors.surfaceContainerHigh,
                          borderRadius: radius.medium,
                        },
                      ]}
                    >
                      <Icon
                        name={badge.icon as any}
                        size={28}
                        color={isUnlocked ? colors.primary : colors.textMuted}
                      />
                    </View>

                    <Text
                      variant="caption"
                      weight="bold"
                      style={{ marginTop: 8, color: isUnlocked ? colors.text : colors.textMuted }}
                      align="center"
                    >
                      {badge.title}
                    </Text>

                    <Text
                      variant="caption"
                      style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}
                      align="center"
                    >
                      {badge.desc}
                    </Text>

                    {isUnlocked && unlockedData.unlocked_at && (
                      <Text
                        variant="caption"
                        style={{ fontSize: 8, color: colors.success, marginTop: 4 }}
                        align="center"
                      >
                        ✓ Unlocked {new Date(unlockedData.unlocked_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
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
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
