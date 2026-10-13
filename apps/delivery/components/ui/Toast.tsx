import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast({ id: Math.random().toString(), message, type, duration });

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      });
    },
    [fadeAnim, hideToast]
  );

  // Style helper based on type
  const getToastStyles = (type: ToastType) => {
    let bg = colors.surface;
    let iconName: IconName = 'info';
    let iconColor: 'success' | 'danger' | 'warning' | 'info' = 'info';

    switch (type) {
      case 'success':
        bg = colors.successContainer;
        iconName = 'check-circle';
        iconColor = 'success';
        break;
      case 'error':
        bg = colors.dangerContainer;
        iconName = 'error';
        iconColor = 'danger';
        break;
      case 'warning':
        bg = colors.warningContainer;
        iconName = 'warning';
        iconColor = 'warning';
        break;
      case 'info':
        bg = colors.infoContainer;
        iconName = 'info';
        iconColor = 'info';
        break;
    }
    return { bg, iconName, iconColor };
  };

  const activeStyles = toast ? getToastStyles(toast.type) : null;

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });

  const scale = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && activeStyles && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: activeStyles.bg,
              borderRadius: radius.large,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              opacity: fadeAnim,
              transform: [{ translateY }, { scale }],
              ...shadows.lg,
            },
          ]}
        >
          <View style={styles.content}>
            <Icon name={activeStyles.iconName} size={20} colorType={activeStyles.iconColor} />
            <Text variant="xs" weight="extrabold" style={{ marginLeft: spacing.sm, flexShrink: 1, color: activeStyles.iconColor === 'success' ? '#0B4F3A' : colors.text }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60, // float from top
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});

export default ToastProvider;
