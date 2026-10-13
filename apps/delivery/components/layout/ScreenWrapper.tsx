import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ViewStyle, Animated } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeContext';
import { useFadeIn } from '../../animations';
import { useOfflineStore } from '../../store/useOfflineStore';
import { Text } from '../Typography';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  useKeyboardAvoiding?: boolean;
  headerGradient?: readonly [string, string];
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  useKeyboardAvoiding = true,
  headerGradient,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useFadeIn(200);
  const { isOnline, connectionQuality } = useOfflineStore();

  const barStyle = isDark ? 'light' : 'dark';

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    style,
  ];

  const content = (
    <Animated.View style={[{ opacity: fadeAnim }, styles.animatedContainer]}>
      <SafeAreaView edges={edges} style={[styles.safeArea, contentContainerStyle]}>
        <StatusBar style={barStyle} backgroundColor="transparent" translucent />
        
        {/* Network Resiliency Alert Bar */}
        {!isOnline && (
          <View style={[styles.networkBar, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.networkText}>⚡ You're offline • Working with saved data</Text>
          </View>
        )}
        {isOnline && connectionQuality === 'POOR' && (
          <View style={[styles.networkBar, { backgroundColor: '#D97706' }]}>
            <Text style={styles.networkText}>⚠️ Connection Unstable • Retrying...</Text>
          </View>
        )}

        {headerGradient && (
          <Animated.View
            style={[styles.headerGradient, { opacity: fadeAnim }, { backgroundColor: headerGradient[0] }]}
          >
            {/* Gradient can be used via expo-linear-gradient in child component */}
          </Animated.View>
        )}
        {children}
      </SafeAreaView>
    </Animated.View>
  );

  if (useKeyboardAvoiding) {
    return (
      <View style={containerStyle}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          {content}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  safeArea: { flex: 1 },
  animatedContainer: { flex: 1 },
  headerGradient: {
    height: 200,
    width: '100%',
  },
  networkBar: {
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ScreenWrapper;
