import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { useSupportStore } from '../../../store/useSupportStore';
import { SupportRepository } from '../../../repositories/SupportRepository';
import { useToast } from '../../../components/ui/Toast';

export default function SupportHubScreen() {
  const router = useRouter();
  const { colors, spacing, radius, shadows } = useTheme();
  const { tickets, isLoading } = useSupportStore();
  const { showToast } = useToast();

  useEffect(() => {
    SupportRepository.fetchTickets();
  }, []);

  const handleRefresh = async () => {
    await SupportRepository.fetchTickets();
  };

  const handleCall = (label: string, number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      showToast(`Cannot dial ${label}. Dial manually: ${number}`, 'error');
    });
  };

  const categories = [
    { id: 'delivery', title: '🚴 Delivery Issue', category: 'DELIVERY' },
    { id: 'order', title: '📦 Order Problem', category: 'ORDER' },
    { id: 'payment', title: '💳 Payment/Earnings Issue', category: 'PAYMENT' },
    { id: 'kyc', title: '🪪 KYC/Account', category: 'KYC' },
    { id: 'vehicle', title: '🛵 Vehicle Issue', category: 'VEHICLE' },
    { id: 'contact', title: '💬 Contact Support', category: 'CONTACT' },
  ];

  const getStatusChip = (status: string) => {
    const s = status ? status.toUpperCase() : 'OPEN';
    if (s === 'OPEN') {
      return { bg: '#E2ECE7', text: '#0B4F3A', label: 'Open' };
    } else if (s === 'RESOLVED' || s === 'CLOSED') {
      return { bg: '#E0F2FE', text: '#0284C7', label: 'Resolved' };
    }
    return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#0B4F3A" />
        </Pressable>
        <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A' }}>
          Help & Support
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading} contentContainerStyle={{ padding: spacing.md, paddingBottom: 120, gap: spacing.md }}>

        {/* Hero Support Banner */}
        <View style={[styles.heroCard, { borderRadius: radius.large, backgroundColor: '#E2ECE7' }]}>
          <View style={styles.heroTextCol}>
            <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A' }}>
              We're here to help you
            </Text>
            <Text variant="caption" style={{ color: '#5A6E63', marginTop: 4 }}>
              24/7 Delivery Partner Support Line
            </Text>
          </View>
          <View style={styles.heroIconBadge}>
            <Icon name="contact-support" size={32} color="#0B4F3A" />
          </View>
        </View>

        {/* 6 Issue Categories Grid */}
        <Text variant="caption" weight="extrabold" color="secondary" style={{ letterSpacing: 0.5 }}>
          ISSUE CATEGORIES
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => {
                if (cat.id === 'contact') {
                  handleCall('Support', '+918095958822');
                } else {
                  router.push({ pathname: '/(main)/support/create', params: { category: cat.category } });
                }
              }}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: '#FFFFFF',
                  borderRadius: radius.large,
                  borderColor: colors.border,
                  borderWidth: 1,
                  ...shadows.xs,
                },
              ]}
            >
              <Text variant="xs" weight="bold" style={{ color: '#0B4F3A' }}>
                {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MY SUPPORT REQUESTS Section */}
        <View style={[styles.ticketsCard, { borderRadius: radius.large, borderColor: colors.border, borderWidth: 1, ...shadows.sm }]}>
          <View style={styles.ticketsHeader}>
            <Text variant="caption" weight="extrabold" color="secondary" style={{ letterSpacing: 0.5 }}>
              MY SUPPORT REQUESTS
            </Text>
            <Button
              label="New Ticket"
              onPress={() => router.push('/(main)/support/create')}
              variant="primary"
              size="sm"
              style={{ backgroundColor: '#0B4F3A' }}
            />
          </View>

          {isLoading && tickets.length === 0 ? (
            <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
              <View style={{ height: 60, backgroundColor: colors.surfaceContainer, borderRadius: radius.medium }} />
              <View style={{ height: 60, backgroundColor: colors.surfaceContainer, borderRadius: radius.medium }} />
            </View>
          ) : tickets.length > 0 ? (
            <View style={{ gap: 8, marginTop: spacing.sm }}>
              {tickets.map((t) => {
                const chip = getStatusChip(t.status);
                const ticketNumber = t.id ? `#TICK-${t.id.slice(0, 4).toUpperCase()}` : '#TICK-1024';
                const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today';

                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(main)/support/chat', params: { ticketId: t.id } })}
                    style={styles.ticketRow}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text variant="xs" weight="extrabold" style={{ color: '#0B4F3A' }}>
                          {ticketNumber}
                        </Text>
                        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                          <Text variant="caption" weight="extrabold" style={{ color: chip.text, fontSize: 10 }}>
                            {chip.label}
                          </Text>
                        </View>
                      </View>

                      <Text variant="xs" weight="bold" numberOfLines={1} style={{ color: colors.text, marginTop: 4 }}>
                        {t.subject}
                      </Text>
                      <Text variant="caption" color="muted" style={{ fontSize: 10, marginTop: 2 }}>
                        Last updated: {dateStr}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={18} color="#0B4F3A" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTickets}>
              <Icon name="support-agent" size={36} colorType="secondary" />
              <Text variant="sm" weight="extrabold" style={{ color: colors.text, marginTop: 8 }}>
                No support requests
              </Text>
              <Text variant="caption" color="secondary" align="center" style={{ marginTop: 2 }}>
                Have a question? Raise a ticket from any category above.
              </Text>
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D5',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E2ECE7',
    padding: 20,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  ticketsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  ticketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAF8',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
