import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

export default function NotificationsScreen() {
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
          <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
          {unread > 0 && !showSettings && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{t('notifications.newCount', { defaultValue: '{{count}} new', count: unread })}</Text>
            </View>
          )}
        </View>
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
          <Text style={styles.groupLabel}>{t('notifications.preferenceSettings', 'Preference Settings')}</Text>

          {prefsLoading || !prefs ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <Card style={styles.settingsCard}>
              {[
                { key: 'push_enabled' as const, title: t('notifications.pushTitle', 'Push Notifications'), desc: t('notifications.pushDesc', 'Device alerts for order updates and cutoff reminders') },
                { key: 'in_app_enabled' as const, title: t('notifications.inAppTitle', 'In-App Notifications'), desc: t('notifications.inAppDesc', 'Show order and account updates in your notification inbox') },
                { key: 'promotional_enabled' as const, title: t('notifications.rewardsTitle', 'Rewards & Offers'), desc: t('notifications.rewardsDesc', 'Spins, cashbacks, and special society discounts') },
              ].map((item, idx) => (
                <View key={item.key}>
                  {idx > 0 && <View style={styles.settingsDivider} />}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingDesc}>{item.desc}</Text>
                    </View>
                    <Pressable
                      style={[styles.switch, prefs[item.key] && styles.switchOn]}
                      onPress={() => toggleSetting(item.key)}
                    >
                      <View style={[styles.switchThumb, prefs[item.key] && styles.switchThumbOn]} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={36} color={Colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifications.emptyTitle', 'No notifications yet')}</Text>
          <Text style={styles.emptyBody}>
            {t('notifications.emptyBody', "We'll notify you when your order is accepted, free dishes go live, or you're close to a reward.")}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Group: unread */}
          {notifications.filter((n) => !n.read).length > 0 && (
            <>
              <Text style={styles.groupLabel}>{t('notifications.groupNew', 'New')}</Text>
              {notifications
                .filter((n) => !n.read)
                .map((n) => (
                  <NotifRow key={n.id} notif={n} onPress={() => handlePress(n)} Colors={Colors} toneBg={TONE_BG} toneFg={TONE_FG} styles={styles} />
                ))}
            </>
          )}

          {/* Group: earlier */}
          {notifications.filter((n) => n.read).length > 0 && (
            <>
              <Text style={styles.groupLabel}>{t('notifications.groupEarlier', 'Earlier')}</Text>
              {notifications
                .filter((n) => n.read)
                .map((n) => (
                  <NotifRow key={n.id} notif={n} onPress={() => handlePress(n)} Colors={Colors} toneBg={TONE_BG} toneFg={TONE_FG} styles={styles} />
                ))}
            </>
          )}

          {/* Clear all */}
          <Pressable style={styles.clearBtn} onPress={clearAll}>
            <Ionicons name="trash-outline" size={14} color={Colors.muted} />
            <Text style={styles.clearBtnText}>{t('notifications.clearAll', 'Clear all notifications')}</Text>
          </Pressable>
        </ScrollView>
      )}
      </ImageBackground>
    </SafeAreaView>
  );
}

// ── NotifRow ──────────────────────────────────────────────────────────────────
function NotifRow({ notif, onPress, Colors, toneBg, toneFg, styles }: {
  notif: AppNotification;
  onPress: () => void;
  Colors: any;
  toneBg: Record<NotifTone, string>;
  toneFg: Record<NotifTone, string>;
  styles: any;
}) {
  const { t } = useTranslation();
  const bg = toneBg[notif.tone];
  const fg = toneFg[notif.tone];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !notif.read && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      {/* Unread dot */}
      {!notif.read && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={notif.icon as any} size={20} color={fg} />
      </View>

      {/* Content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, !notif.read && styles.rowTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.rowTime}>{timeAgo(new Date(notif.timestamp))}</Text>
        </View>
        <Text style={styles.rowBody} numberOfLines={2}>{notif.body}</Text>
        {notif.actionRoute && (
          <Text style={[styles.rowCta, { color: fg }]}>
            {t('notifications.view', 'View →')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  headerBadge: {
    backgroundColor: Colors.red, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  headerAction: { paddingHorizontal: 4 },
  headerActionText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  headerActionDim: { color: Colors.muted },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 21 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  groupLabel: {
    fontSize: 11, fontWeight: '900', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7,
    marginTop: 20, marginBottom: 8,
  },

  // Notification row
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10, gap: 12,
    position: 'relative',
  },
  rowUnread: { borderColor: Colors.primary + '55', backgroundColor: Colors.surfaceAlt },
  rowPressed: { opacity: 0.82 },
  unreadDot: {
    position: 'absolute', top: 14, left: -4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5, borderColor: Colors.bg,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 },
  rowTitle:       { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.dark },
  rowTitleUnread: { fontWeight: '900' },
  rowTime:  { fontSize: 11, color: Colors.muted, flexShrink: 0 },
  rowBody:  { fontSize: 13, color: Colors.muted, lineHeight: 19 },
  rowCta:   { fontSize: 12, fontWeight: '900', marginTop: 5 },

  // Clear all
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, marginTop: 8,
  },
  clearBtnText: { fontSize: 13, color: Colors.muted, fontWeight: '700' },

  // Settings preferences
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
});
