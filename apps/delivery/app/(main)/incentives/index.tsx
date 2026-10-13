import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useTargetStore } from '../../../store/useTargetStore';
import { TargetRepository } from '../../../repositories/TargetRepository';

export default function IncentivesScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { targets, incentives, isLoading } = useTargetStore();

  useEffect(() => {
    TargetRepository.fetchTargetsAndIncentives();
  }, []);

  const handleRefresh = async () => {
    await TargetRepository.fetchTargetsAndIncentives();
  };

  const getIncentiveIcon = (type: string) => {
    switch (type) {
      case 'PEAK_HOUR': return 'schedule';
      case 'RAIN': return 'umbrella';
      case 'WEEKEND': return 'calendar-today';
      case 'FESTIVAL': return 'celebration';
      case 'REFERRAL': return 'group-add';
      default: return 'stars';
    }
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Incentives & Targets</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Target Tracking Summary Cards */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Active Targets</Text>
            
            {targets.map((tgt) => {
              const remaining = Math.max(0, tgt.target_deliveries - tgt.completed_deliveries);
              const progress = tgt.target_deliveries > 0 ? Math.min(100, Math.round((tgt.completed_deliveries / tgt.target_deliveries) * 100)) : 0;
              
              return (
                <Card key={tgt.id} style={{ padding: spacing.md }}>
                  <View style={styles.targetHeader}>
                    <Text variant="caption" weight="extrabold" color="primary">
                      {tgt.target_type} TARGET
                    </Text>
                    <Text variant="caption" weight="bold" color="success">
                      Est. ₹{tgt.projected_earnings}
                    </Text>
                  </View>

                  <View style={[styles.progressBarRow, { marginTop: spacing.xs }]}>
                    <View style={styles.progressTextRow}>
                      <Text variant="caption" color="secondary">
                        Completed: {tgt.completed_deliveries} / {tgt.target_deliveries}
                      </Text>
                      <Text variant="caption" weight="bold" color="primary">
                        {progress}%
                      </Text>
                    </View>
                    
                    {/* Visual Bar fill */}
                    <View style={[styles.trackBar, { backgroundColor: colors.surfaceContainerHigh, marginTop: 4 }]}>
                      <View
                        style={[
                          styles.fillBar,
                          {
                            backgroundColor: colors.success,
                            width: `${progress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {remaining > 0 ? (
                    <Text variant="caption" style={{ color: colors.textMuted, marginTop: 6, fontSize: 10 }}>
                      Complete {remaining} more deliveries to unlock this target bonus.
                    </Text>
                  ) : (
                    <View style={[styles.completedChip, { marginTop: 6 }]}>
                      <Icon name="check-circle" size={12} color={colors.success} />
                      <Text variant="caption" weight="extrabold" color="success" style={{ marginLeft: 4, fontSize: 9 }}>
                        Target Milestone Achieved!
                      </Text>
                    </View>
                  )}
                </Card>
              );
            })}

            {targets.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.md }}>
                No active targets assigned.
              </Text>
            )}
          </View>

          {/* Incentives List */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Eligible Incentives</Text>
            
            {incentives.map((inc) => (
              <Card key={inc.id} style={{ padding: spacing.md }}>
                <View style={styles.incentiveRow}>
                  <View style={[styles.incIconBox, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}>
                    <Icon name={getIncentiveIcon(inc.incentive_type) as any} size={24} colorType="primary" />
                  </View>

                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text variant="caption" weight="extrabold">{inc.title}</Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: inc.status === 'CLAIMED' ? colors.success : colors.warning },
                        ]}
                      />
                      <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted, marginLeft: 4 }}>
                        {inc.status === 'CLAIMED' ? 'Claimed' : 'Eligible'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="sm" weight="extrabold" color="success">
                      +₹{inc.amount}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}

            {incentives.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.md }}>
                No eligible incentive bonuses currently active.
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
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarRow: {
    width: '100%',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incentiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
