import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
// react-native's own SafeAreaView is a no-op on Android (doesn't apply
// status-bar/nav-bar insets, especially with edgeToEdgeEnabled: true) — use
// the real one, consistent with every other screen in this app. This toast
// container is mounted globally, so this affected every toast on Android.
import { SafeAreaView } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const animMap = useRef<Map<string, Animated.Value>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const anim = new Animated.Value(0);
    animMap.current.set(id, anim);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Slide in
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    // Auto-dismiss after 2.5s
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        animMap.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <SafeAreaView style={styles.container} pointerEvents="none">
        {toasts.map((toast) => {
          const anim = animMap.current.get(toast.id);
          if (!anim) return null;
          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                toast.type === 'success' && styles.toastSuccess,
                toast.type === 'error' && styles.toastError,
                toast.type === 'info' && styles.toastInfo,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-60, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
          );
        })}
      </SafeAreaView>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  toast: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    maxWidth: 360,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  toastSuccess: { backgroundColor: '#146b4b' },
  toastError:   { backgroundColor: '#c94737' },
  toastInfo:    { backgroundColor: '#17211c' },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
