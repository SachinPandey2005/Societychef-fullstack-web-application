import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScrollableLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const ScrollableLayout: React.FC<ScrollableLayoutProps> = ({
  children,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottomPadding = Math.max(insets.bottom + 100, 120);

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.content,
        { padding: spacing.md, paddingBottom: safeBottomPadding },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});

export default ScrollableLayout;
