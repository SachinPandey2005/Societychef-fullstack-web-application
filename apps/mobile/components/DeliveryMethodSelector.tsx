import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import type { DeliveryMethod } from '../types';

interface DeliveryMethodSelectorProps {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
  deliveryFee: number;
}

export function DeliveryMethodSelector({
  value,
  onChange,
  deliveryFee,
}: DeliveryMethodSelectorProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('deliveryMethod.sectionLabel', 'Delivery Method')}</Text>

      {/* Card A: Self Pickup */}
      <Pressable
        style={({ pressed }) => [
          styles.selectionCard,
          value === 'PICKUP' && styles.selectionCardActive,
          pressed && styles.selectionCardPressed,
        ]}
        onPress={() => onChange('PICKUP')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="walk-outline" size={22} color={value === 'PICKUP' ? Colors.primary : Colors.muted} />
          </View>
          <View style={styles.textBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{t('deliveryMethod.selfPickup', 'Self Pickup')}</Text>
              <View style={[styles.badge, styles.badgeFree]}>
                <Text style={styles.badgeFreeText}>{t('deliveryMethod.free', 'FREE')}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              {t('deliveryMethod.selfPickupDesc', "Collect your order directly from the chef's kitchen.")}
            </Text>
          </View>
          <View style={[styles.radioOuter, value === 'PICKUP' && styles.radioOuterActive]}>
            {value === 'PICKUP' && <View style={styles.radioInner} />}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.benefitsRow}>
          <Text style={styles.benefitItem}>{t('deliveryMethod.noDeliveryFee', '• No delivery fee')}</Text>
          <Text style={styles.benefitItem}>{t('deliveryMethod.fasterPickup', '• Faster pickup')}</Text>
          <Text style={styles.benefitItem}>{t('deliveryMethod.flexibleTiming', '• Flexible timing')}</Text>
        </View>
      </Pressable>

      {/* Card B: Delivery Partner */}
      <Pressable
        style={({ pressed }) => [
          styles.selectionCard,
          value === 'DELIVERY_PARTNER' && styles.selectionCardActive,
          pressed && styles.selectionCardPressed,
        ]}
        onPress={() => onChange('DELIVERY_PARTNER')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle-outline" size={22} color={value === 'DELIVERY_PARTNER' ? Colors.primary : Colors.muted} />
          </View>
          <View style={styles.textBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{t('deliveryMethod.deliveryByPartner', 'Delivery by Partner')}</Text>
              <View style={[styles.badge, styles.badgeFee]}>
                <Text style={styles.badgeFeeText}>{t('deliveryMethod.feeBadge', { defaultValue: '₹{{fee}} FEE', fee: deliveryFee })}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              {t('deliveryMethod.deliveryDesc', 'Get your order delivered to your address.')}
            </Text>
          </View>
          <View style={[styles.radioOuter, value === 'DELIVERY_PARTNER' && styles.radioOuterActive]}>
            {value === 'DELIVERY_PARTNER' && <View style={styles.radioInner} />}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.benefitsRow}>
          <Text style={styles.benefitItem}>{t('deliveryMethod.doorstepDelivery', '• Doorstep delivery')}</Text>
          <Text style={styles.benefitItem}>{t('deliveryMethod.realtimeTracking', '• Real-time tracking')}</Text>
          <Text style={styles.benefitItem}>{t('deliveryMethod.safeConvenient', '• Safe & convenient')}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  selectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(23,33,28,0.04)' },
      default: {
        shadowColor: '#17211c',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
    }),
  },
  selectionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.greenBadge,
  },
  selectionCardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeFree: {
    backgroundColor: Colors.greenBadge,
  },
  badgeFreeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
  },
  badgeFee: {
    backgroundColor: Colors.pillInactive,
  },
  badgeFeeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    opacity: 0.6,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitItem: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});
