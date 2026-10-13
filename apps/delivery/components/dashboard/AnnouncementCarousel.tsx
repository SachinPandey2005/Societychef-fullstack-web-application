import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { AnnouncementItem } from '../../store/useDashboardStore';

interface AnnouncementCarouselProps {
  announcements: AnnouncementItem[];
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({ announcements }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (!announcements || announcements.length === 0) return null;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'BONUS':
        return { bg: colors.successContainer, text: colors.success, icon: 'card-giftcard' };
      case 'ALERT':
      case 'WEATHER':
        return { bg: colors.dangerContainer, text: colors.danger, icon: 'warning' };
      case 'MAINTENANCE':
        return { bg: colors.warningContainer, text: colors.warning, icon: 'build' };
      case 'POLICY':
      default:
        return { bg: colors.infoContainer, text: colors.info, icon: 'info' };
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>
        Announcements & Broadcasts
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {announcements.map((item) => {
          const styleConfig = getTypeStyle(item.type);
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: styleConfig.bg,
                  borderRadius: radius.large,
                  padding: spacing.md,
                  marginRight: spacing.sm,
                  ...shadows.sm,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Icon name={styleConfig.icon as any} size={16} colorType="primary" />
                <Text variant="xs" weight="extrabold" style={{ marginLeft: 6, flex: 1, color: styleConfig.text }}>
                  {item.title}
                </Text>
                <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                  <Text variant="caption" weight="bold" color="secondary">
                    {item.type}
                  </Text>
                </View>
              </View>

              <Text variant="caption" weight="medium" style={{ marginTop: 4, color: colors.text }}>
                {item.content}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    width: 280,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default AnnouncementCarousel;
