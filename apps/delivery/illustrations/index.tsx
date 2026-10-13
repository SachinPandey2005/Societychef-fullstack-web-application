import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface IllustrationProps {
  size?: number;
  style?: ViewStyle;
}

export const DeliveryRiderIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="riderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#0B5D34" />
          </LinearGradient>
          <LinearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor="#C67615" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#E8F5E9'} opacity="0.6" />
        {/* Rider Helmet Body */}
        <Path d="M 60,30 C 42,30 35,45 35,62 L 35,75 L 85,75 L 85,62 C 85,45 78,30 60,30 Z" fill="url(#riderGrad)" />
        {/* Helmet Visor */}
        <Path d="M 42,50 C 42,42 78,42 78,50 C 78,58 72,64 60,64 C 48,64 42,58 42,50 Z" fill="#2D3748" />
        <Path d="M 45,50 C 45,46 75,46 75,50 C 75,54 70,58 60,58 C 50,58 45,54 45,50 Z" fill="#4A5568" />
        {/* Helmet Stripe */}
        <Path d="M 57,30 L 63,30 L 63,45 L 57,45 Z" fill="url(#helmetGrad)" />
        {/* Collar/Jacket neckline */}
        <Path d="M 40,85 L 80,85 C 80,85 75,95 60,95 C 45,95 40,85 40,85 Z" fill="#2D3748" />
        {/* Speed lines */}
        <Path d="M 15,40 L 25,40 M 10,55 L 22,55 M 13,70 L 23,70" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
        <Path d="M 105,45 L 97,45 M 108,60 L 98,60" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const ScooterIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="scooterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#0B5D34" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#E8F5E9'} opacity="0.6" />
        {/* Ground lines */}
        <Path d="M 20,95 L 100,95" stroke={colors.border} strokeWidth="3" strokeLinecap="round" />
        {/* Rear Wheel */}
        <Circle cx="40" cy="85" r="13" fill="#2D3748" stroke="#E2E8F0" strokeWidth="2" />
        <Circle cx="40" cy="85" r="5" fill="#A0AEC0" />
        {/* Front Wheel */}
        <Circle cx="85" cy="85" r="13" fill="#2D3748" stroke="#E2E8F0" strokeWidth="2" />
        <Circle cx="85" cy="85" r="5" fill="#A0AEC0" />
        {/* Scooter Body Frame */}
        <Path d="M 40,85 L 50,85 C 55,85 58,80 60,75 L 68,52 C 69,48 73,45 77,45 L 82,45" stroke="url(#scooterGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Floorboard */}
        <Path d="M 43,80 L 68,80" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
        {/* Front Shield & Handlebar */}
        <Path d="M 82,45 L 85,85" stroke="url(#scooterGrad)" strokeWidth="5" strokeLinecap="round" />
        <Path d="M 76,40 L 86,40" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" />
        {/* Delivery Box on back */}
        <Rect x="26" y="44" width="24" height="24" rx="4" fill={colors.secondary} />
        {/* Box badge logo lines */}
        <Path d="M 32,56 L 44,56 M 34,62 L 42,62" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const WalletIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor="#C67615" />
          </LinearGradient>
          <LinearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FBD38D" />
            <Stop offset="100%" stopColor="#DD6B20" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#FFF3E0'} opacity="0.6" />
        {/* Currency bill coming out */}
        <Rect x="42" y="32" width="36" height="24" rx="3" fill="#81C784" transform="rotate(-15 60 44)" />
        <Path d="M 52,35 A 6,6 0 1,0 62,45" stroke="#FFFFFF" strokeWidth="2" />
        {/* Main Wallet body */}
        <Rect x="30" y="48" width="60" height="42" rx="6" fill="url(#walletGrad)" />
        {/* Wallet Flap */}
        <Path d="M 90,60 H 65 C 60,60 56,64 56,69 C 56,74 60,78 65,78 H 90 Z" fill="#B7791F" />
        {/* Lock button */}
        <Circle cx="80" cy="69" r="4" fill="#FEEBC8" />
        {/* Golden Coins */}
        <Circle cx="40" cy="90" r="10" fill="url(#coinGrad)" />
        <Circle cx="40" cy="90" r="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <Circle cx="80" cy="92" r="8" fill="url(#coinGrad)" />
        <Circle cx="80" cy="92" r="5" fill="none" stroke="#FFFFFF" strokeWidth="1" />
      </Svg>
    </View>
  );
};

export const OrdersIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="ordersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#0B5D34" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#E8F5E9'} opacity="0.6" />
        {/* Clipboard back */}
        <Rect x="35" y="32" width="50" height="66" rx="6" fill="#A0AEC0" />
        <Rect x="39" y="36" width="42" height="58" rx="4" fill={colors.surface} />
        {/* Clipboard Header Clip */}
        <Rect x="50" y="26" width="20" height="10" rx="3" fill="#4A5568" />
        {/* Order checklist lines */}
        <Path d="M 52,48 H 74 M 52,58 H 70 M 52,68 H 74 M 52,78 H 64" stroke={colors.border} strokeWidth="3" strokeLinecap="round" />
        {/* Checklist checkmarks */}
        <Path d="M 44,48 L 46,50 L 49,46 M 44,58 L 46,60 L 49,56 M 44,68 L 46,70 L 49,66" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Delivered package box layout */}
        <G transform="translate(68, 70)">
          <Rect x="0" y="0" width="26" height="24" rx="3" fill="url(#ordersGrad)" />
          {/* Box lid ribbon */}
          <Path d="M 13,0 V 24 M 0,12 H 26" stroke={colors.secondary} strokeWidth="2.5" />
        </G>
      </Svg>
    </View>
  );
};

export const OfflineIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#F1F5F9'} opacity="0.6" />
        {/* Signal arcs */}
        <Path d="M 35,70 A 35,35 0 0,1 85,70" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 6" />
        <Path d="M 45,78 A 20,20 0 0,1 75,78" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        <Circle cx="60" cy="85" r="5" fill="#475569" />
        {/* Warning Badge overlying */}
        <G transform="translate(62, 34)">
          <Circle cx="12" cy="12" r="14" fill="#F87171" stroke={colors.surface} strokeWidth="3" />
          {/* Exclamation point */}
          <Path d="M 12,7 V 13 M 12,17 H 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </G>
        {/* Sleeping Zzzs */}
        <Path d="M 28,42 L 36,42 L 28,50 L 36,50 M 40,32 L 46,32 L 40,38 L 46,38" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

export const SuccessIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="succGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4CAF50" />
            <Stop offset="100%" stopColor="#2E7D32" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1B5E20' : '#E8F5E9'} opacity="0.6" />
        {/* Green Outer Ring */}
        <Circle cx="60" cy="60" r="36" fill="url(#succGrad)" />
        {/* White Checkmark */}
        <Path d="M 46,60 L 55,69 L 75,49" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Celebratory confetti */}
        <Path d="M 25,35 L 29,38 M 95,35 L 91,38 M 30,85 L 34,81 M 90,85 L 86,81" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
        <Circle cx="60" cy="18" r="3" fill={colors.secondary} />
        <Circle cx="18" cy="60" r="3" fill="#42A5F5" />
        <Circle cx="102" cy="60" r="3" fill="#42A5F5" />
      </Svg>
    </View>
  );
};

export const EmptyIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#1E293B' : '#F1F5F9'} opacity="0.6" />
        {/* Box outline */}
        <Path d="M 35,45 L 60,32 L 85,45 L 85,75 L 60,90 L 35,75 Z" stroke="#94A3B8" strokeWidth="3" strokeLinejoin="round" />
        {/* Box inner lines */}
        <Path d="M 35,45 L 60,58 L 85,45 M 60,58 L 60,90" stroke="#94A3B8" strokeWidth="2" />
        {/* Magnifying glass checking inside box */}
        <G transform="translate(18, 18)">
          <Circle cx="50" cy="50" r="14" fill={colors.surface} stroke={colors.secondary} strokeWidth="3.5" />
          <Path d="M 60,60 L 72,72" stroke={colors.secondary} strokeWidth="4" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
};

export const SupportIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="supportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#42A5F5" />
            <Stop offset="100%" stopColor="#1565C0" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#0D47A1' : '#E3F2FD'} opacity="0.6" />
        {/* Agent silhouette */}
        <Path d="M 60,35 C 48,35 44,45 44,55 C 44,65 48,68 60,68 C 72,68 76,65 76,55 C 76,45 72,35 60,35 Z" fill="url(#supportGrad)" />
        <Path d="M 38,90 C 38,76 46,74 60,74 C 74,74 82,76 82,90 Z" fill="url(#supportGrad)" />
        {/* Headset arc */}
        <Path d="M 40,55 A 20,20 0 0,1 80,55" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Headphone ear pads */}
        <Rect x="37" y="50" width="6" height="12" rx="3" fill="#2D3748" />
        <Rect x="77" y="50" width="6" height="12" rx="3" fill="#2D3748" />
        {/* Microphone boom */}
        <Path d="M 40,60 C 40,65 45,67 48,67" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Circle cx="50" cy="67" r="2.5" fill="#F87171" />
        {/* Chat message bubbles */}
        <Path d="M 94,30 H 76 C 73,30 71,32 71,35 V 45 C 71,48 73,50 76,50 H 80 L 84,54 V 50 H 94 C 97,50 99,48 99,45 V 35 C 99,32 97,30 94,30 Z" fill="#FFF" stroke={colors.border} strokeWidth="1" />
        <Path d="M 78,37 H 92 M 78,43 H 86" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const EmergencyIllustration: React.FC<IllustrationProps> = ({ size = 180, style }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EF5350" />
            <Stop offset="100%" stopColor="#C62828" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill={isDark ? '#5C0F0F' : '#FFEBEE'} opacity="0.6" />
        {/* Red Shield */}
        <Path d="M 60,25 C 74,25 84,29 84,29 C 84,29 88,58 75,76 C 67,87 60,93 60,93 C 60,93 53,87 45,76 C 32,58 36,29 36,29 C 36,29 46,25 60,25 Z" fill="url(#alertGrad)" />
        {/* Siren flash rays */}
        <Path d="M 24,18 L 34,26 M 96,18 L 86,26 M 60,10 V 20" stroke="#EF5350" strokeWidth="3" strokeLinecap="round" />
        {/* Phone Receiver Symbol */}
        <G transform="translate(48, 44)">
          <Path d="M 4,4 C 4,14 10,20 20,20 L 22,17 C 22.5,16.5 22.5,15.5 22,15 L 18,12 C 17.5,11.5 16.5,11.5 16,12 L 14.5,13.5 C 11.5,12 9,9.5 7.5,6.5 L 9,5 C 9.5,4.5 9.5,3.5 9,3 L 6,0 C 5.5,-0.5 4.5,-0.5 4,0 Z" fill="#FFFFFF" transform="scale(1.1)" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default {
  DeliveryRider: DeliveryRiderIllustration,
  Scooter: ScooterIllustration,
  Wallet: WalletIllustration,
  Orders: OrdersIllustration,
  Offline: OfflineIllustration,
  Success: SuccessIllustration,
  Empty: EmptyIllustration,
  Support: SupportIllustration,
  Emergency: EmergencyIllustration,
};
