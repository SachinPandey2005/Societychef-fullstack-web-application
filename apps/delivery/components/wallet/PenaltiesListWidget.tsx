import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface PenaltyItem {
  id: string;
  orderNumber: string;
  reason: string;
  amount: number;
  appealStatus: 'NOT_APPEALED' | 'UNDER_REVIEW' | 'APPEAL_APPROVED' | 'APPEAL_REJECTED';
}

interface PenaltiesListWidgetProps {
  penalties?: PenaltyItem[];
  onAppeal?: (id: string) => void;
}

export const PenaltiesListWidget: React.FC<PenaltiesListWidgetProps> = ({
  penalties = [
    {
      id: 'pen-1',
      orderNumber: 'ORD-9788',
      reason: 'Late delivery beyond 30 min SLA',
      amount: 15,
      appealStatus: 'NOT_APPEALED',
    },
  ],
  onAppeal,
}) => {
  const { colors, radius, shadows } = useTheme();

  if (!penalties || penalties.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFF5F5',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#FEE2E2',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Icon name="error" size={18} color="#EF4444" />
        <Text variant="sm" weight="extrabold" style={{ color: '#EF4444', marginLeft: 6, fontSize: 13 }}>
          Applied Financial Penalties ({penalties.length})
        </Text>
      </View>

      <View style={{ marginTop: 10 }}>
        {penalties.map((p) => (
          <View key={p.id} style={styles.itemInnerCard}>
            <View style={styles.itemRow}>
              {/* Left Document Icon */}
              <View style={styles.docIconCircle}>
                <Icon name="assignment-late" size={20} color="#EF4444" />
              </View>

              <View style={styles.itemTextCol}>
                <View style={styles.itemHeader}>
                  <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                    Order #{p.orderNumber} (-₹{p.amount})
                  </Text>
                  
                  <View style={styles.statusPill}>
                    <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', fontSize: 9 }}>
                      {p.appealStatus.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 11 }}>
                  Reason: {p.reason}
                </Text>

                {p.appealStatus === 'NOT_APPEALED' && onAppeal && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onAppeal(p.id)}
                    style={{ marginTop: 6 }}
                  >
                    <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', fontSize: 11 }}>
                      Submit Appeal to CRM Ops ›
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderColor: '#FEE2E2',
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemTextCol: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});

export default PenaltiesListWidget;
