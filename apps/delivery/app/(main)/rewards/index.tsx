import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { useRewardStore } from '../../../store/useRewardStore';
import { RewardRepository } from '../../../repositories/RewardRepository';

export default function RewardsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { pointsBalance, totalPointsEarned, catalog, redemptions, isLoading, isRedeeming } = useRewardStore();

  useEffect(() => {
    RewardRepository.fetchRewards();
  }, []);

  const handleRefresh = async () => {
    await RewardRepository.fetchRewards();
  };

  const handleRedeem = (rewardId: string, title: string, cost: number) => {
    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${title}" for ${cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const res = await RewardRepository.redeemReward(rewardId);
              if (res) {
                Alert.alert('Redeemed Success!', `Your promo code is: ${res.code}`);
              }
            } catch (e: any) {
              Alert.alert('Redemption Failed', e.message || 'Points deduction failed.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Reward Point Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Points Balance Card */}
          <Card variant="gradient" style={{ padding: spacing.lg }}>
            <View style={styles.balanceHeader}>
              <View>
                <Text variant="xs" color="white" style={{ opacity: 0.8 }}>Available Reward Points</Text>
                <Text variant="h1" weight="extrabold" color="white" style={{ fontSize: 36, marginTop: spacing.xs }}>
                  {pointsBalance} pts
                </Text>
              </View>
              <Icon name="stars" size={48} color="#FFFFFF" />
            </View>

            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: spacing.md }]} />

            <View style={styles.pointsMeta}>
              <Text variant="caption" color="white" style={{ opacity: 0.7 }}>Lifetime Points Earned</Text>
              <Text variant="caption" weight="extrabold" color="white">{totalPointsEarned} pts</Text>
            </View>
          </Card>

          {/* Redeem Catalog */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Redeemable Rewards</Text>
            
            {catalog.map((item) => {
              const canRedeem = pointsBalance >= item.points_cost;
              return (
                <Card key={item.id} style={{ padding: spacing.md }}>
                  <View style={styles.catalogItemRow}>
                    <View style={[styles.catalogIconBox, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}>
                      <Icon
                        name={item.reward_type === 'RECOGNITION_CERTIFICATE' ? 'verified' : 'card-giftcard'}
                        size={28}
                        colorType="primary"
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text variant="caption" weight="extrabold">{item.title}</Text>
                      <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                        {item.description}
                      </Text>
                      <Text variant="caption" weight="extrabold" color="primary" style={{ marginTop: 4 }}>
                        {item.points_cost} points required
                      </Text>
                    </View>
                  </View>

                  <Button
                    label={canRedeem ? 'Redeem Voucher' : 'Insufficient Points'}
                    onPress={() => handleRedeem(item.id, item.title, item.points_cost)}
                    variant={canRedeem ? 'primary' : 'outline'}
                    disabled={!canRedeem || isRedeeming}
                    size="sm"
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              );
            })}

            {catalog.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.md }}>
                No redeemable catalog items available.
              </Text>
            )}
          </View>

          {/* Redemption History */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">Redemption History</Text>
            
            {redemptions.map((red) => (
              <Card key={red.id} style={{ padding: spacing.md }}>
                <View style={styles.historyHeader}>
                  <Text variant="caption" weight="extrabold">{red.title}</Text>
                  <Text variant="caption" weight="bold" color="success">
                    {red.status}
                  </Text>
                </View>

                <View style={[styles.promoBox, { backgroundColor: colors.surfaceElevated, borderRadius: radius.small, marginTop: spacing.xs }]}>
                  <Text variant="caption" color="secondary">PROMO CODE:</Text>
                  <Text variant="caption" weight="extrabold" color="primary" style={{ fontSize: 14 }}>
                    {red.code}
                  </Text>
                </View>

                <View style={styles.historyFooter}>
                  <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                    Redeemed on {new Date(red.redeemed_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))}

            {redemptions.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.md }}>
                No past redemptions found.
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  pointsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catalogItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogIconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoBox: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
