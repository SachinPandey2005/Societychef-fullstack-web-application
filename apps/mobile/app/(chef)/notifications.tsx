import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore, selectUnreadCount } from '../../store/useNotificationStore';
import { timeAgo } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../components/ui/Toast';
import type { AppNotification, NotifTone } from '../../store/useNotificationStore';

type NotificationPreferences = {
  push_enabled: boolean;
  in_app_enabled: boolean;
  promotional_enabled: boolean;
};

export default function ChefNotificationsScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const TONE_BG: Record<NotifTone, string> = {
    green:   Colors.greenBadge,
    gold:    Colors.goldBadge,
    blue:    Colors.blueBadge,
    red:     `${Colors.red}22`,
    default: Colors.pillInactive,
  };

  const TONE_FG: Record<NotifTone, string> = {
    green:   Colors.primary,
    gold:    Colors.gold,
    blue:    Colors.blue,
    red:     Colors.red,
    default: Colors.muted,
  };

  const { notifications, markRead, markAllRead, clearAll } = useNotificationStore();
  const unread = useNotificationStore(selectUnreadCount);
  const { showToast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!showSettings || prefs) return;
    setPrefsLoading(true);
    apiClient.get('/notifications/preferences')
      .then((res) => setPrefs(res.data))
      .catch((err) => showToast(err?.message || 'Could not load notification preferences.', 'error'))
      .finally(() => setPrefsLoading(false));
  }, [showSettings]);

  const toggleSetting = async (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await apiClient.patch('/notifications/preferences', { [key]: next[key] });
    } catch (err: any) {
      setPrefs(prefs);
      showToast(err?.message || 'Could not update preference.', 'error');
    }
  };

  function handlePress(n: AppNotification) {
    markRead(n.id);
    if (n.actionRoute) {
      router.push(n.actionRoute as any);
    } else {
      router.push('/(chef)/orders');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('notifications.chefTitle', 'Chef Notifications')}</Text>
            {unread > 0 && !showSettings && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{t('notifications.newCount', { defaultValue: '{{count}} new', count: unread })}</Text>
              </View>
            )}
          </View>
          <LanguageTogglePill />
          <Pressable style={{ marginRight: 8, padding: 4 }} onPress={() => setShowSettings(!showSettings)}>
            <Ionicons name={showSettings ? "close-outline" : "settings-outline"} size={20} color={Colors.primary} />
          </Pressable>
          <Pressable style={styles.headerAction} onPress={markAllRead} disabled={unread === 0 || showSettings}>
            <Text style={[styles.headerActionText, (unread === 0 || showSettings) && styles.headerActionDim]}>
              {t('notifications.markAllRead', 'Mark all read')}
            </Text>
          </Pressable>
        </View>

        {showSettings ? (
          <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.groupLabel}>{t('notifications.chefAlertPrefs', 'Chef Alert Preferences')}</Text>

            {prefsLoading || !prefs ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <Card style={styles.settingsCard}>
                {[
                  { key: 'push_enabled' as const, title: t('notifications.pushTitle', 'Push Notifications'), desc: t('notifications.chefPushDesc', 'Device alerts for new orders and payouts') },
                  { key: 'in_app_enabled' as const, title: t('notifications.inAppTitle', 'In-App Notifications'), desc: t('notifications.chefInAppDesc', 'Order, settlement, and verification updates in your inbox') },
                  { key: 'promotional_enabled' as const, title: t('notifications.chefPromoTitle', 'Promotional Updates'), desc: t('notifications.chefPromoDesc', 'Platform announcements and marketing updates') },
                ].map((item, idx) => (
                  <View key={item.key}>
                    {idx > 0 && <View style={styles.settingsDivider} />}
                    <View style={styles.settingRow}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingDesc}>{item.desc}</Text>
                      </View>
                      <Pressable
                        style={[styles.toggleBtn, prefs[item.key] && styles.toggleBtnActive]}
                        onPress={() => toggleSetting(item.key)}
                      >
                        <View style={[styles.toggleCircle, prefs[item.key] && styles.toggleCircleActive]} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            <Pressable style={styles.doneBtn} onPress={() => setShowSettings(false)}>
              <Text style={styles.doneBtnText}>{t('notifications.done', 'Done')}</Text>
            </Pressable>
          </ScrollView>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={56} color={Colors.muted} />
            <Text style={styles.emptyTitle}>{t('notifications.chefEmptyTitle', 'No chef notifications')}</Text>
            <Text style={styles.emptySub}>{t('notifications.chefEmptySub', 'You are all caught up! Order alerts and payouts will appear here.')}</Text>
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {notifications.map((n) => {
              const bg = TONE_BG[n.tone || 'default'];
              const fg = TONE_FG[n.tone || 'default'];

              return (
                <Pressable
                  key={n.id}
                  style={[styles.itemCard, !n.read && styles.unreadCard]}
                  onPress={() => handlePress(n)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                    <Ionicons name={(n.icon as any) || 'notifications'} size={20} color={fg} />
                  </View>

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, !n.read && styles.itemTitleUnread]}>{n.title}</Text>
                      <Text style={styles.timeText}>{timeAgo(new Date(n.timestamp))}</Text>
                    </View>
                    <Text style={styles.itemBody}>{n.body}</Text>
                  </View>

                  {!n.read && <View style={styles.unreadDot} />}
                </Pressable>
              );
            })}

            <Pressable style={styles.clearAllBtn} onPress={clearAll}>
              <Text style={styles.clearAllText}>{t('notifications.clearAll', 'Clear all notifications')}</Text>
            </Pressable>
          </ScrollView>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: 'rgba(255,255,255,0.85)',
    },
    backBtn: {
      marginRight: 12,
      padding: 4,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.dark,
    },
    headerBadge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    headerBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    headerAction: {
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    headerActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary,
    },
    headerActionDim: {
      color: Colors.muted,
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    groupLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.dark,
      marginBottom: 8,
    },
    settingsCard: {
      padding: 16,
      borderRadius: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.dark,
    },
    settingDesc: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 2,
    },
    settingsDivider: {
      height: 1,
      backgroundColor: Colors.border,
    },
    toggleBtn: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleBtnActive: {
      backgroundColor: Colors.primary,
    },
    toggleCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
    },
    toggleCircleActive: {
      alignSelf: 'flex-end',
    },
    doneBtn: {
      backgroundColor: Colors.primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    doneBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: Colors.surface,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 12,
    },
    unreadCard: {
      borderColor: Colors.primary,
      backgroundColor: `${Colors.primary}08`,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.dark,
    },
    itemTitleUnread: {
      color: Colors.primary,
    },
    timeText: {
      fontSize: 11,
      color: Colors.muted,
    },
    itemBody: {
      fontSize: 13,
      color: Colors.muted,
      lineHeight: 18,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.primary,
      marginTop: 6,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.dark,
      marginTop: 16,
    },
    emptySub: {
      fontSize: 13,
      color: Colors.muted,
      textAlign: 'center',
      marginTop: 6,
    },
    clearAllBtn: {
      alignSelf: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    clearAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.muted,
    },
  });
