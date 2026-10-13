import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { isMockMode } from '../lib/mockMode';
import { apiClient } from '../lib/apiClient';

interface AddressInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (addressDetails: { society: string; flat: string; address: string }) => void;
}

export function AddressInputModal({ visible, onClose, onSaved }: AddressInputModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { user, updateUser } = useAuthStore();

  const [society, setSociety] = useState(user?.society || '');
  const [flat, setFlat] = useState(user?.flat || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveAddress() {
    if (!society.trim()) {
      Alert.alert(t('addressModal.required', 'Required'), t('addressModal.enterSociety', 'Please enter your Housing Society name.'));
      return;
    }
    if (!flat.trim()) {
      Alert.alert(t('addressModal.required', 'Required'), t('addressModal.enterFlat', 'Please enter your Flat / House number.'));
      return;
    }

    const fullAddress = address.trim()
      ? address.trim()
      : `${flat.trim()}, ${society.trim()}`;

    setIsSaving(true);
    try {
      // 1. Update local Zustand state
      updateUser({
        society: society.trim(),
        flat: flat.trim(),
        address: fullAddress,
      });

      // 2. Persist to the backend if logged in
      if (user?.id && !isMockMode) {
        await apiClient.patch('/auth/profile', {
          society: society.trim(),
          flat: flat.trim(),
        });
      }

      setIsSaving(false);
      onSaved({
        society: society.trim(),
        flat: flat.trim(),
        address: fullAddress,
      });
    } catch (e) {
      console.warn('Address update notice:', e);
      setIsSaving(false);
      onSaved({
        society: society.trim(),
        flat: flat.trim(),
        address: fullAddress,
      });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('addressModal.title', 'Delivery Address Required')}</Text>
              <Text style={styles.subtitle}>{t('addressModal.subtitle', 'Enter your society & flat to proceed with order')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.dark} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addressModal.societyLabel', 'Housing Society Name *')}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lotus Heights, Green Valley, Palm Residency"
                placeholderTextColor={Colors.muted}
                value={society}
                onChangeText={setSociety}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addressModal.flatLabel', 'Tower & Flat / House No. *')}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tower B, Flat 402"
                placeholderTextColor={Colors.muted}
                value={flat}
                onChangeText={setFlat}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addressModal.landmarkLabel', 'Full Delivery Address / Landmark (Optional)')}</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Near West Gate, Lotus Heights"
                placeholderTextColor={Colors.muted}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <Pressable
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveAddress}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? t('addressModal.saving', 'Saving Address...') : t('addressModal.saveBtn', 'Save & Continue Order')}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStyles(Colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderColor: Colors.border,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: { fontSize: 16, fontWeight: '800', color: Colors.dark },
    subtitle: { fontSize: 12, color: Colors.muted, marginTop: 2 },
    closeBtn: { padding: 4 },
    form: { paddingTop: 16, gap: 14 },
    inputGroup: { gap: 6 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.dark },
    input: {
      backgroundColor: Colors.bg,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: Colors.dark,
    },
    saveBtn: {
      backgroundColor: Colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  });
}
