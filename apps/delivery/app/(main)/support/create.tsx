import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { Modal } from '../../../components/ui/Modal';
import { Card } from '../../../components/ui/Card';
import { SupportRepository } from '../../../repositories/SupportRepository';
import { useToast } from '../../../components/ui/Toast';

const CATEGORIES = [
  'DELIVERY_ISSUE',
  'PICKUP_ISSUE',
  'CUSTOMER_ISSUE',
  'CHEF_ISSUE',
  'PAYMENT_ISSUE',
  'WALLET_ISSUE',
  'TECHNICAL_ISSUE',
  'ACCOUNT_ISSUE',
  'SAFETY_ISSUE',
  'EMERGENCY',
  'OTHER',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function CreateTicketScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const [category, setCategory] = useState('DELIVERY_ISSUE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('Please enter a description for your issue.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await SupportRepository.createTicket(category, description, orderId || null);
      if (ticket) {
        showToast('Ticket created successfully!', 'success');
        router.back();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to file ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">New Support Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          
          {/* Category Picker Selector */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Issue Category</Text>
            <Pressable
              onPress={() => setIsCategoryModalVisible(true)}
              style={[
                styles.selectorBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.md,
                },
              ]}
            >
              <Text variant="caption" weight="bold">
                {category.replace('_', ' ')}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Priority Segments Selection */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Priority Level</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const getPriorityColor = (prio: string) => {
                  if (prio === 'URGENT') return colors.danger;
                  if (prio === 'HIGH') return colors.warning;
                  return colors.primary;
                };

                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.prioBtn,
                      {
                        backgroundColor: isSelected ? getPriorityColor(p) : colors.surface,
                        borderColor: isSelected ? 'transparent' : colors.outlineVariant,
                        borderRadius: radius.medium,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="bold"
                      style={{ color: isSelected ? '#FFFFFF' : colors.textMuted }}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Optional Order ID */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Related Order ID (Optional)</Text>
            <TextInput
              value={orderId}
              onChangeText={setOrderId}
              placeholder="e.g. ORD-9001"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                },
              ]}
            />
          </View>

          {/* Description details input */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Describe Your Issue</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide details about the issue you are facing..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.md,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <Button
            label="Submit Support Ticket"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ marginTop: spacing.md }}
          />

        </View>
      </ScrollableLayout>

      {/* Category Selection Modal */}
      <Modal visible={isCategoryModalVisible} onClose={() => setIsCategoryModalVisible(false)}>
        <View style={[styles.modalInner, { padding: spacing.md }]}>
          <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>
            Select Issue Category
          </Text>
          <View style={{ gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <Card
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setIsCategoryModalVisible(false);
                }}
                style={{
                  padding: spacing.md,
                  backgroundColor: category === cat ? colors.primaryContainer : colors.surface,
                }}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: category === cat ? colors.primary : colors.text }}
                >
                  {cat.replace('_', ' ')}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      </Modal>

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
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textInput: {
    borderWidth: 1,
    height: 48,
    fontSize: 14,
  },
  textAreaInput: {
    borderWidth: 1,
    minHeight: 120,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalInner: {
    width: '100%',
  },
});
