import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface TipsSummaryCardProps {
  todayTips?: number;
  monthlyTips?: number;
  lifetimeTips?: number;
}

export const TipsSummaryCard: React.FC<TipsSummaryCardProps> = ({
  todayTips = 80,
  monthlyTips = 1450,
  lifetimeTips = 6200,
}) => {
  const { colors, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="card-giftcard" size={16} color="#059669" />
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6, fontSize: 13 }}>
            Customer Tips Tracker
          </Text>
        </View>

        <View style={styles.tipsGraphicCircle}>
          <Icon name="savings" size={24} color="#059669" />
        </View>
      </View>

      <View style={styles.gridRow}>
        {/* Column 1: Today's Tips */}
        <View style={styles.col}>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 10 }}>
            TODAY'S TIPS
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 16 }}>
              ₹{todayTips}
            </Text>
            <View style={styles.iconCircleSmall}>
              <Icon name="paid" size={12} color="#D97706" />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Column 2: This Month */}
        <View style={styles.col}>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 10 }}>
            THIS MONTH
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 16 }}>
              ₹{monthlyTips}
            </Text>
            <View style={styles.iconCircleSmall}>
              <Icon name="monetization-on" size={12} color="#D97706" />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Column 3: Lifetime */}
        <View style={styles.col}>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 10 }}>
            LIFETIME
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 16 }}>
              ₹{lifetimeTips}
            </Text>
            <View style={styles.iconCircleSmall}>
              <Icon name="savings" size={12} color="#059669" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipsGraphicCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  col: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  iconCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
});

export default TipsSummaryCard;
