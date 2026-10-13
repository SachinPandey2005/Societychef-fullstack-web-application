import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { NotificationRepository } from '../../../repositories/NotificationRepository';

const CATEGORIES = ['ALL', 'ORDERS', 'FINANCE', 'SUPPORT', 'REWARDS', 'ANNOUNCEMENTS', 'EMERGENCY'] as const;

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { colors, spacing, radius, shadows } = useTheme();
  const { filteredNotifications, searchQuery, activeCategory, isLoading } = useNotificationStore();

  useEffect(() => {
    NotificationRepository.loadNotifications();
  }, []);

  const handleRefresh = async () => {
    await NotificationRepository.loadNotifications();
  };

  const handleSearch = (text: string) => {
    NotificationRepository.search(text);
  };

  const handleCategorySelect = (cat: typeof CATEGORIES[number]) => {
    NotificationRepository.filterCategory(cat);
  };

  const handleMarkAsRead = (id: string) => {
    NotificationRepository.markAsRead([id]);
  };

  const handleArchive = (id: string) => {
    NotificationRepository.archive(id);
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'ORDERS': return 'New Delivery';
      case 'FINANCE': return 'Payment';
      case 'KYC': return 'KYC';
      case 'SUPPORT': return 'Support';
      case 'EMERGENCY': return 'System';
      default: return 'Order Update';
    }
  };

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case 'ORDERS': return 'inventory';
      case 'FINANCE': return 'account-balance-wallet';
      case 'SUPPORT': return 'help-outline';
      case 'REWARDS': return 'stars';
      case 'EMERGENCY': return 'warning';
      default: return 'notifications';
    }
  };

  // Group notifications into Today, Yesterday, Earlier
  const groupNotifications = (list: typeof filteredNotifications) => {
    const today: typeof list = [];
    const yesterday: typeof list = [];
    const earlier: typeof list = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    list.forEach((item) => {
      const itemTime = new Date(item.created_at).getTime();
      if (itemTime >= todayStart) {
        today.push(item);
      } else if (itemTime >= yesterdayStart) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return [
      { title: 'Today', data: today },
      { title: 'Yesterday', data: yesterday },
      { title: 'Earlier', data: earlier },
    ].filter((g) => g.data.length > 0);
  };

  const grouped = groupNotifications(filteredNotifications);

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderRadius: radius.large }]}>
          <Icon name="search" size={20} color={colors.textSecondary} containerStyle={{ marginLeft: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search notifications..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Category Pills horizontal scroll list */}
      <View style={[styles.pillsContainer, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item;
            return (
              <Pressable
                onPress={() => handleCategorySelect(item)}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: isSelected ? '#0B4F3A' : colors.surfaceElevated,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          
          {grouped.map((group) => (
            <View key={group.title} style={{ gap: spacing.xs }}>
              <Text variant="caption" weight="extrabold" color="secondary" style={{ letterSpacing: 0.5, marginBottom: 4 }}>
                {group.title.toUpperCase()}
              </Text>

              {group.data.map((notif) => {
                const typeLabel = getTypeLabel(notif.type);
                return (
                  <Card
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      {
                        padding: spacing.md,
                        backgroundColor: notif.is_read ? colors.surface : '#F2F8F5',
                        borderColor: notif.is_read ? colors.border : '#0B4F3A',
                        borderWidth: notif.is_read ? 1 : 1.5,
                        borderRadius: radius.large,
                        ...shadows.xs,
                      },
                    ]}
                    onPress={() => !notif.is_read && handleMarkAsRead(notif.id)}
                  >
                    <View style={styles.notifLayout}>
                      <View style={[styles.iconContainer, { backgroundColor: notif.is_read ? colors.surfaceContainer : '#E2ECE7', borderRadius: radius.medium }]}>
                        <Icon name={getCategoryIcon(notif.type) as any} size={20} color={notif.type === 'EMERGENCY' ? '#DC2626' : '#0B4F3A'} />
                      </View>

                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <View style={styles.notifHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {!notif.is_read && (
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' }} />
                            )}
                            <Text variant="caption" weight="extrabold" style={{ color: '#0B4F3A' }}>
                              [{typeLabel}] {notif.title}
                            </Text>
                          </View>

                          <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>

                        <Text variant="caption" color="secondary" style={{ marginTop: 3, fontSize: 11 }}>
                          {notif.body}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      {!notif.is_read ? (
                        <Pressable onPress={() => handleMarkAsRead(notif.id)} style={styles.actionBtn}>
                          <Icon name="check-circle" size={14} color="#0B4F3A" />
                          <Text variant="caption" weight="bold" style={{ marginLeft: 4, fontSize: 10, color: '#0B4F3A' }}>
                            Mark as Read
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}

                      <Pressable onPress={() => handleArchive(notif.id)} style={styles.actionBtn}>
                        <Icon name="archive" size={14} color={colors.textSecondary} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 4, fontSize: 10 }}>
                          Archive
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))}

          {filteredNotifications.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Icon name="notifications-none" size={48} colorType="secondary" />
              <Text variant="sm" weight="extrabold" style={{ marginTop: 8, color: colors.text }}>
                No notifications found
              </Text>
              <Text variant="caption" color="secondary" align="center" style={{ marginTop: 2 }}>
                New delivery updates, earnings alerts, and messages will appear here.
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
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 13,
    paddingRight: 12,
  },
  pillsContainer: {
    width: '100%',
  },
  pillBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notifLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
});
