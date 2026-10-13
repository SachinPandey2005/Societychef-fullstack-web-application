import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const SECTION_META = [
  { id: 'overview', icon: 'shield-checkmark-outline' },
  { id: 'collection', icon: 'document-text-outline' },
  { id: 'use', icon: 'construct-outline' },
  { id: 'privacy_controls', icon: 'eye-off-outline' },
  { id: 'sharing', icon: 'share-social-outline' },
  { id: 'rights', icon: 'key-outline' },
  { id: 'contact', icon: 'mail-outline' },
];

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedNav, setSelectedNav] = useState('overview');
  const SECTIONS = SECTION_META.map((m) => ({
    ...m,
    title: t(`privacy.s.${m.id}.title`),
    content: t(`privacy.s.${m.id}.content`),
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="lock-closed-outline" size={22} color={Colors.primary} />
              <Text style={styles.headerTitle}>{t('privacy.headerTitle', 'Privacy Policy & Data Security')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          {/* Quick Nav Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContainer}
          >
            {SECTIONS.map((sec) => (
              <Pressable
                key={sec.id}
                style={[
                  styles.chip,
                  selectedNav === sec.id && styles.chipActive,
                ]}
                onPress={() => setSelectedNav(sec.id)}
              >
                <Ionicons
                  name={sec.icon as any}
                  size={14}
                  color={selectedNav === sec.id ? Colors.primary : '#64748B'}
                />
                <Text
                  style={[
                    styles.chipText,
                    selectedNav === sec.id && styles.chipTextActive,
                  ]}
                >
                  {sec.title.split('.').slice(1).join('.').trim()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Body Content */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.badgeBanner}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
              <Text style={styles.badgeBannerText}>
                {t('privacy.badgeBanner', 'DPDP Act Compliant • 256-Bit SSL Encryption • Zero Raw Card Storage')}
              </Text>
            </View>

            {SECTIONS.map((sec) => (
              <View key={sec.id} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name={sec.icon as any} size={18} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </View>
                <Text style={styles.sectionContent}>{sec.content}</Text>
              </View>
            ))}

            <Text style={styles.footerNote}>
              {t('privacy.footerNote', 'Last updated: August 2026 • Rasohi Platform v1.0.0')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  chipScroll: {
    maxHeight: 44,
    marginVertical: 10,
  },
  chipContainer: {
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  badgeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 20,
  },
});
