import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { useNotificationStore, selectUnreadCount } from '../store/useNotificationStore';

interface NotificationBellProps {
  route: string;
  inverse?: boolean; // true when rendered on a dark background
}

export function NotificationBell({ route, inverse = false }: NotificationBellProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const unread = useNotificationStore(selectUnreadCount);
  const iconColor = inverse ? '#fff' : Colors.dark;

  return (
    <Pressable style={styles.wrap} onPress={() => router.push(route as any)}>
      <Ionicons name="notifications-outline" size={24} color={iconColor} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  wrap: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
});
