import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { usePerformanceStore } from '../../../store/usePerformanceStore';
import { PerformanceRepository } from '../../../repositories/PerformanceRepository';

export default function PerformanceScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { metrics, trends, penalties, isLoading } = usePerformanceStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { width } = useWindowDimensions();

  useEffect(() => {
    PerformanceRepository.fetchPerformance();
  }, []);

  const handleRefresh = async () => {
    await PerformanceRepository.fetchPerformance();
  };

  const getActiveTrend = () => {
    if (!trends) return [];
    return trends[activeTab] || [];
  };

  const activePoints = getActiveTrend();
  const maxScore = activePoints.length > 0 ? Math.max(...activePoints.map(p => p.score)) : 100;

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Custom Navigation Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Performance Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          
          {/* Main KPI Card */}
          <Card variant="gradient" style={{ padding: spacing.lg }}>
            <View style={styles.kpiHeader}>
              <View>
                <Text variant="xs" color="white" style={{ opacity: 0.8 }}>Overall Partner Rating</Text>
                <Text variant="h1" weight="extrabold" color="white" style={{ fontSize: 36, marginTop: spacing.xs }}>
                  ★ {metrics?.overall_rating || '5.0'}
                </Text>
              </View>
              <Icon name="military-tech" size={48} color="#FFFFFF" />
            </View>
            
            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: spacing.md }]} />
            
            <View style={styles.scoresGrid}>
              <View style={styles.scoreItem}>
                <Text variant="caption" color="white" style={{ opacity: 0.7 }}>Today's Score</Text>
                <Text variant="sm" weight="extrabold" color="white">{metrics?.today_score || '100'}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text variant="caption" color="white" style={{ opacity: 0.7 }}>Weekly</Text>
                <Text variant="sm" weight="extrabold" color="white">{metrics?.weekly_score || '100'}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text variant="caption" color="white" style={{ opacity: 0.7 }}>Monthly</Text>
                <Text variant="sm" weight="extrabold" color="white">{metrics?.monthly_score || '100'}</Text>
              </View>
            </View>
          </Card>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <Card style={{ flex: 1, padding: spacing.md }}>
              <Icon name="check-circle" size={20} colorType="success" />
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>Acceptance Rate</Text>
              <Text variant="md" weight="extrabold">{metrics?.acceptance_rate || '100'}%</Text>
            </Card>
            <Card style={{ flex: 1, padding: spacing.md }}>
              <Icon name="assignment-turned-in" size={20} colorType="primary" />
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>Completion Rate</Text>
              <Text variant="md" weight="extrabold">{metrics?.completion_rate || '100'}%</Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={{ flex: 1, padding: spacing.md }}>
              <Icon name="schedule" size={20} colorType="warning" />
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>On-Time Rate</Text>
              <Text variant="md" weight="extrabold">{metrics?.on_time_delivery_rate || '100'}%</Text>
            </Card>
            <Card style={{ flex: 1, padding: spacing.md }}>
              <Icon name="speed" size={20} colorType="info" />
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>Avg Time</Text>
              <Text variant="md" weight="extrabold">{metrics?.avg_delivery_time_minutes || '0'} min</Text>
            </Card>
          </View>

          {/* Performance Trends Chart */}
          <Card style={{ padding: spacing.md }}>
            <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>Score Trends</Text>
            
            {/* Chart Tabs */}
            <View style={[styles.tabBar, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}>
              {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    activeTab === tab && { backgroundColor: colors.primary, borderRadius: radius.small },
                  ]}
                >
                  <Text
                    variant="caption"
                    weight="bold"
                    style={{ color: activeTab === tab ? '#FFFFFF' : colors.textMuted }}
                  >
                    {tab.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom Bar Graph */}
            <View style={[styles.chartContainer, { height: 180, marginTop: spacing.lg }]}>
              {activePoints.map((pt, idx) => {
                const heightPct = maxScore > 0 ? (pt.score / maxScore) * 100 : 0;
                return (
                  <View key={idx} style={styles.chartCol}>
                    <View style={styles.barWrapper}>
                      <Text variant="caption" weight="bold" style={{ fontSize: 9, marginBottom: 4 }}>
                        {pt.score}
                      </Text>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: colors.primary,
                            height: `${heightPct}%`,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" color="secondary" style={{ fontSize: 10, marginTop: 4 }}>
                      {pt.label}
                    </Text>
                  </View>
                );
              })}
              {activePoints.length === 0 && (
                <Text variant="caption" color="secondary" align="center" style={{ flex: 1, alignSelf: 'center' }}>
                  No trend data available
                </Text>
              )}
            </View>
          </Card>

          {/* Attendance Summary */}
          <Card style={{ padding: spacing.md }}>
            <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>Attendance Summary</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Days Worked</Text>
                <Text variant="caption" weight="bold">{metrics?.days_worked || 0} days</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Hours Online</Text>
                <Text variant="caption" weight="bold">{metrics?.hours_online || 0} hrs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Shift Completion Rate</Text>
                <Text variant="caption" weight="bold">{metrics?.shift_completion_rate || 100}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Late Starts</Text>
                <Text variant="caption" weight="bold" color={metrics?.late_starts_count ? 'danger' : undefined}>
                  {metrics?.late_starts_count || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Break Compliance</Text>
                <Text variant="caption" weight="bold">{metrics?.break_compliance_rate || 100}%</Text>
              </View>
            </View>
          </Card>

          {/* Quality Metrics */}
          <Card style={{ padding: spacing.md }}>
            <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>Quality Metrics</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Package Handling Score</Text>
                <Text variant="caption" weight="bold">{metrics?.package_handling_score || 100}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Customer Satisfaction</Text>
                <Text variant="caption" weight="bold">{metrics?.customer_satisfaction_score || 100}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Order Accuracy</Text>
                <Text variant="caption" weight="bold">{metrics?.order_accuracy_score || 100}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="caption" color="secondary">Professionalism Score</Text>
                <Text variant="caption" weight="bold">{metrics?.professionalism_score || 100}%</Text>
              </View>
            </View>
          </Card>

          {/* Penalty Summary & Appeals Link */}
          <Card style={{ padding: spacing.md }}>
            <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
              <Text variant="sm" weight="extrabold">Penalties & Violations</Text>
              <View style={[styles.penaltyCount, { backgroundColor: penalties.length > 0 ? colors.dangerContainer : colors.surfaceElevated }]}>
                <Text variant="caption" weight="extrabold" style={{ color: penalties.length > 0 ? colors.danger : colors.textMuted }}>
                  {penalties.length} Active
                </Text>
              </View>
            </View>

            {penalties.map((item) => (
              <View key={item.id} style={[styles.penaltyItem, { borderColor: colors.outlineVariant }]}>
                <View style={styles.penaltyHeader}>
                  <Text variant="caption" weight="extrabold" color="danger">
                    {item.penalty_type.replace('_', ' ')}
                  </Text>
                  <Text variant="caption" weight="bold" color="danger">
                    -₹{item.amount}
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>{item.reason}</Text>
                <View style={styles.penaltyMeta}>
                  <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  <Text variant="caption" weight="bold" style={{ fontSize: 10 }} color={item.status === 'APPEALED' ? 'warning' : 'danger'}>
                    {item.status}
                  </Text>
                </View>
              </View>
            ))}

            {penalties.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.md }}>
                Perfect record! No policy violations applied.
              </Text>
            )}

            <Button
              label="View Detailed Ratings & Reviews"
              onPress={() => router.push('/(main)/performance/ratings')}
              variant="outline"
              size="md"
              style={{ marginTop: spacing.md }}
            />
          </Card>

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
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 24,
  },
  detailGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  penaltyCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  penaltyItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  penaltyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
