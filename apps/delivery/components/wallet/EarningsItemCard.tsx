import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { OrderEarningItem } from '../../store/useEarningsStore';

interface EarningsItemCardProps {
  earning: OrderEarningItem;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isLoadingDetail?: boolean;
  errorDetail?: string | null;
  onRetryDetail?: () => void;
}

function formatCompletedTime(isoString?: string): string {
  if (!isoString) return 'Completed';
  try {
    const d = new Date(isoString);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `Completed • ${formattedHours}:${formattedMinutes} ${ampm}`;
  } catch (e) {
    return 'Completed';
  }
}

export const EarningsItemCard: React.FC<EarningsItemCardProps> = ({
  earning,
  isExpanded = false,
  onToggleExpand,
  isLoadingDetail = false,
  errorDetail = null,
  onRetryDetail,
}) => {
  const { colors, radius, shadows, isDark } = useTheme();

  const cardBg = isDark ? colors.surfaceContainerLow || '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? colors.outlineVariant || '#334155' : '#E2E8F0';
  const textColor = isDark ? colors.text || '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? colors.textSecondary || '#94A3B8' : '#64748B';
  const dividerColor = isDark ? '#334155' : '#F1F5F9';
  const iconCircleBg = isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onToggleExpand}
      accessibilityRole="button"
      accessibilityLabel={`Order earnings for #${earning.order_number}, total ₹${earning.net_earnings}`}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderRadius: radius.large || 16,
          padding: 16,
          marginVertical: 5,
          borderColor: borderColor,
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      {/* 1. Header Summary Row (Always Visible) */}
      <View style={styles.headerRow}>
        <View style={styles.leftCol}>
          <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
            <Icon name="account-balance-wallet" size={18} color="#059669" />
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="xs" weight="extrabold" style={{ color: textColor, fontSize: 13 }}>
                Order Earnings
              </Text>
              <Text variant="caption" weight="bold" style={{ color: textMuted, fontSize: 11, marginLeft: 6 }}>
                #{earning.order_number}
              </Text>
            </View>

            <Text variant="caption" style={{ color: textMuted, fontSize: 10, marginTop: 2 }}>
              {isExpanded ? formatCompletedTime(earning.completed_at) : 'Base fare, distance, surge, etc.'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
          <Text variant="sm" weight="extrabold" style={{ color: textColor, fontSize: 15, marginRight: 8 }}>
            ₹{earning.net_earnings}
          </Text>
          <View style={styles.chevronWrapper}>
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color={textMuted}
            />
          </View>
        </View>
      </View>

      {/* 2. Expanded Detail Breakdown */}
      {isExpanded && (
        <View style={[styles.expandedContainer, { borderTopColor: dividerColor }]}>
          {isLoadingDetail ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#059669" />
              <Text variant="caption" style={{ color: textMuted, marginLeft: 8 }}>
                Loading earnings details...
              </Text>
            </View>
          ) : errorDetail ? (
            <View style={styles.errorBox}>
              <Text variant="caption" style={{ color: '#EF4444' }}>
                Unable to load earnings details
              </Text>
              {onRetryDetail && (
                <TouchableOpacity onPress={onRetryDetail} style={styles.retryBtn}>
                  <Text variant="caption" weight="bold" style={{ color: '#059669' }}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.breakdownContent}>
              {/* Order Meta Badge Header */}
              <View style={styles.orderMetaHeader}>
                <View style={styles.orderBadge}>
                  <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
                    #{earning.order_number}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 10 }}>
                    {formatCompletedTime(earning.completed_at)}
                  </Text>
                </View>
              </View>

              {/* Itemized Lines */}
              <View style={styles.breakdownList}>
                {earning.base_delivery_fee !== undefined && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: textMuted, fontSize: 12 }}>
                      Base Fare
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: textColor, fontSize: 12 }}>
                      ₹{earning.base_delivery_fee}
                    </Text>
                  </View>
                )}

                {!!earning.distance_pay && earning.distance_pay > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: textMuted, fontSize: 12 }}>
                      Distance / Delivery Fee
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: textColor, fontSize: 12 }}>
                      ₹{earning.distance_pay}
                    </Text>
                  </View>
                )}

                {!!earning.peak_hour_bonus && earning.peak_hour_bonus > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: textMuted, fontSize: 12 }}>
                      Surge / Peak Hour
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: textColor, fontSize: 12 }}>
                      +₹{earning.peak_hour_bonus}
                    </Text>
                  </View>
                )}

                {!!earning.festival_bonus && earning.festival_bonus > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: textMuted, fontSize: 12 }}>
                      Bonus
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 12 }}>
                      +₹{earning.festival_bonus}
                    </Text>
                  </View>
                )}

                {!!earning.tip_amount && earning.tip_amount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: textMuted, fontSize: 12 }}>
                      Customer Tip
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 12 }}>
                      +₹{earning.tip_amount}
                    </Text>
                  </View>
                )}

                {!!earning.penalty_amount && earning.penalty_amount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text variant="caption" style={{ color: '#EF4444', fontSize: 12 }}>
                      Penalty / Deduction
                    </Text>
                    <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', fontSize: 12 }}>
                      -₹{earning.penalty_amount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Total Divider & Summary */}
              <View style={[styles.netTotalDivider, { borderTopColor: dividerColor }]} />

              <View style={styles.netTotalRow}>
                <Text variant="sm" weight="extrabold" style={{ color: textColor, fontSize: 13 }}>
                  Net Order Earnings
                </Text>
                <Text variant="sm" weight="extrabold" style={{ color: '#059669', fontSize: 16 }}>
                  ₹{earning.net_earnings}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  breakdownContent: {
    width: '100%',
  },
  orderMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 4,
  },
  breakdownList: {
    marginVertical: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  netTotalDivider: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  netTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default EarningsItemCard;
