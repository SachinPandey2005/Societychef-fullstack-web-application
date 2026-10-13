import React, { useEffect } from 'react';
import { View, StyleSheet, Modal as RNModal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { IncomingOrderPayload } from '../../store/useAssignmentStore';

interface IncomingOrderModalProps {
  visible: boolean;
  order: IncomingOrderPayload | null;
  countdownSeconds: number;
  onAccept: () => void;
  onReject: () => void;
  onIgnore: () => void;
}

export const IncomingOrderModal: React.FC<IncomingOrderModalProps> = ({
  visible,
  order,
  countdownSeconds,
  onAccept,
  onReject,
  onIgnore,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (!visible || !order) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'VIP':
        return '#D97706';
      case 'EXPRESS':
        return colors.danger;
      case 'HIGH_VALUE':
        return colors.success;
      case 'FESTIVAL':
        return '#7C3AED';
      case 'CORPORATE':
        return colors.info;
      default:
        return colors.primary;
    }
  };

  const priorityColor = getPriorityColor(order.priority);
  const timerPct = Math.min(100, Math.round((countdownSeconds / 30) * 100));

  return (
    <RNModal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.large,
              padding: spacing.md,
              ...shadows.xl,
            },
          ]}
        >
          {/* Header & Timer Badge */}
          <View style={styles.topRow}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF' }}>
                {order.priority} DELIVERY
              </Text>
            </View>

            <View style={[styles.timerCircle, { borderColor: colors.primary }]}>
              <Text variant="md" weight="extrabold" color="primary">
                {countdownSeconds}s
              </Text>
            </View>
          </View>

          <Text variant="h3" weight="extrabold" align="center" style={{ marginTop: spacing.xs }}>
            New Order Assignment!
          </Text>

          <View style={styles.feeContainer}>
            <Text variant="caption" color="secondary">
              ESTIMATED EARNINGS
            </Text>
            <Text variant="h1" weight="extrabold" color="success">
              ₹{order.delivery_fee}
            </Text>
          </View>

          {/* Details Grid */}
          <View style={[styles.detailsBox, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium, padding: spacing.sm }]}>
            <View style={styles.detailLine}>
              <Icon name="storefront" size={18} colorType="primary" />
              <View style={{ marginLeft: spacing.xs, flex: 1 }}>
                <Text variant="caption" color="muted">
                  PICKUP KITCHEN
                </Text>
                <Text variant="xs" weight="bold">
                  {order.kitchen_name} ({order.chef_name})
                </Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {order.pickup_address}
                </Text>
              </View>
            </View>

            <View style={[styles.detailLine, { marginTop: spacing.xs }]}>
              <Icon name="person" size={18} colorType="secondary" />
              <View style={{ marginLeft: spacing.xs, flex: 1 }}>
                <Text variant="caption" color="muted">
                  DROP RESIDENT
                </Text>
                <Text variant="xs" weight="bold">
                  {order.customer_name}
                </Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {order.drop_address}
                </Text>
              </View>
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <Text variant="caption" weight="bold">
                Dist: {order.distance_km} km
              </Text>
              <Text variant="caption" weight="bold">
                Time: {order.estimated_delivery_time} mins
              </Text>
              <Text variant="caption" weight="bold">
                Items: {order.items_count}
              </Text>
            </View>
          </View>

          {order.special_instructions ? (
            <View style={[styles.noteBox, { backgroundColor: colors.infoContainer, borderRadius: radius.small }]}>
              <Text variant="caption" weight="medium" color="info" numberOfLines={1}>
                Note: {order.special_instructions}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
            <Button
              label="Reject"
              onPress={onReject}
              variant="outline"
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              label="Accept Order"
              onPress={onAccept}
              variant="primary"
              size="md"
              style={{ flex: 2 }}
            />
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={onIgnore} style={{ alignSelf: 'center', marginTop: spacing.xs }}>
            <Text variant="caption" color="muted">
              Ignore Assignment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  detailsBox: {
    width: '100%',
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  noteBox: {
    padding: 6,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default IncomingOrderModal;
