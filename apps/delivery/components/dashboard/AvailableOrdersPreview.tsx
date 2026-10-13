import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { AvailableOrderPreview } from '../../store/useDashboardStore';

interface AvailableOrdersPreviewProps {
  orders: AvailableOrderPreview[];
  onAcceptOrder: (orderId: string) => void;
  onViewAllOrders?: () => void;
}

export const AvailableOrdersPreview: React.FC<AvailableOrdersPreviewProps> = ({
  orders,
  onAcceptOrder,
  onViewAllOrders,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const count = orders ? orders.length : 0;
  const previewOrders = (orders || []).slice(0, 2);

  return (
    <View style={{ width: '100%', marginVertical: 6 }}>
      {/* Alert Banner Matching Image 5 */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onViewAllOrders}
        style={[
          styles.bannerCard,
          {
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            borderColor: colors.border,
            borderWidth: 1,
            ...shadows.xs,
          },
        ]}
      >
        <View style={styles.bannerRow}>
          <View style={styles.boxIconWrap}>
            <Icon name="inventory" size={24} color="#059669" />
          </View>

          <View style={styles.bannerTextCol}>
            <View style={styles.rushBadge}>
              <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', fontSize: 10 }}>
                Rush hour! Be careful
              </Text>
            </View>

            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginTop: 4 }}>
              {count > 0 ? `${count} Delivery orders found!` : 'No delivery orders right now'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text variant="caption" weight="bold" style={{ color: '#059669', fontSize: 11 }}>
                View details
              </Text>
              <Icon name="arrow-forward" size={12} color="#059669" containerStyle={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Itemized Order Cards (if any) */}
      {previewOrders.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {previewOrders.map((ord) => (
            <View
              key={ord.id}
              style={[
                styles.orderCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 14,
                  borderColor: '#10B981',
                  borderWidth: 1.5,
                  ...shadows.xs,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.newTag}>
                  <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF', fontSize: 10 }}>
                    🔥 NEW DELIVERY #{ord.order_number}
                  </Text>
                </View>
                <Text variant="sm" weight="extrabold" style={{ color: '#059669' }}>
                  ₹{ord.estimated_earnings} • {ord.distance_km} km
                </Text>
              </View>

              <Text variant="xs" weight="bold" style={{ color: '#1E293B', marginTop: 6 }}>
                {ord.kitchen_name} → {(ord as any).drop_address || 'Customer Location'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Button
                  label="REJECT"
                  onPress={() => onViewAllOrders?.()}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1, borderColor: '#EF4444' }}
                  labelStyle={{ color: '#EF4444' }}
                />
                <Button
                  label="ACCEPT"
                  onPress={() => onAcceptOrder(ord.id)}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1, backgroundColor: '#059669' }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerCard: {
    width: '100%',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
  },
  rushBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default AvailableOrdersPreview;
