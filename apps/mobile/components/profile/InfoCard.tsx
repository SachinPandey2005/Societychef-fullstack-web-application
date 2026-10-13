import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';

export interface KitchenInfoData {
  cuisine: string;
  experience: string;
  prepTime: string;
  deliveryTime: string;
  operatingHours: string;
  languages: string;
}

interface InfoCardProps {
  info: KitchenInfoData;
  isEditable?: boolean;
  onSaveDetails?: (newInfo: KitchenInfoData) => Promise<void> | void;
}

export function InfoCard({ info, isEditable, onSaveDetails }: InfoCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<KitchenInfoData>({
    cuisine: info.cuisine || '',
    prepTime: info.prepTime || '',
    deliveryTime: info.deliveryTime || '',
    operatingHours: info.operatingHours || '',
    experience: info.experience || '',
    languages: info.languages || '',
  });

  useEffect(() => {
    setForm({
      cuisine: info.cuisine || '',
      prepTime: info.prepTime || '',
      deliveryTime: info.deliveryTime || '',
      operatingHours: info.operatingHours || '',
      experience: info.experience || '',
      languages: info.languages || '',
    });
  }, [info]);

  const items = [
    { icon: 'restaurant-outline' as const, label: t('infoCard.cuisine', 'Cuisine'), value: info.cuisine },
    { icon: 'time-outline' as const, label: t('infoCard.prepTime', 'Prep time'), value: info.prepTime },
    { icon: 'bicycle-outline' as const, label: t('infoCard.delivery', 'Delivery'), value: info.deliveryTime },
    { icon: 'calendar-outline' as const, label: t('infoCard.hours', 'Hours'), value: info.operatingHours },
    { icon: 'medal-outline' as const, label: t('infoCard.experience', 'Experience'), value: info.experience },
    { icon: 'language-outline' as const, label: t('infoCard.speaks', 'Speaks'), value: info.languages },
  ];

  async function handleSave() {
    try {
      setIsSaving(true);
      await onSaveDetails?.(form);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('infoCard.kitchenDetails', 'Kitchen Details')}</Text>
        {isEditable && (
          <Pressable style={styles.editBtn} onPress={() => setIsModalOpen(true)}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.editBtnText}>{t('infoCard.edit', 'Edit')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {items.map((item, index) => (
          <Pressable
            key={index}
            style={styles.gridItem}
            onPress={() => isEditable && setIsModalOpen(true)}
          >
            <Ionicons name={item.icon} size={24} color={item.value ? Colors.primary : Colors.muted} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.value, !item.value && { color: Colors.primary, fontStyle: 'italic' }]}>
              {item.value ? item.value : t('infoCard.addDetail', '+ Add detail')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Edit Kitchen Details Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('infoCard.editKitchenDetails', 'Edit Kitchen Details')}</Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.dark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.cuisineSpecialtyLabel', 'Cuisine Specialty')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.cuisine}
                  onChangeText={(v) => setForm((p) => ({ ...p, cuisine: v }))}
                  placeholder={t('infoCard.cuisinePlaceholder', 'e.g. Northern Indian Thali')}
                  placeholderTextColor={Colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.prepTimeLabel', 'Prep Time')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.prepTime}
                  onChangeText={(v) => setForm((p) => ({ ...p, prepTime: v }))}
                  placeholder={t('infoCard.prepTimePlaceholder', 'e.g. 2 hours')}
                  placeholderTextColor={Colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.deliveryTimeLabel', 'Delivery Time')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.deliveryTime}
                  onChangeText={(v) => setForm((p) => ({ ...p, deliveryTime: v }))}
                  placeholder={t('infoCard.deliveryTimePlaceholder', 'e.g. 30 mins')}
                  placeholderTextColor={Colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.operatingHoursLabel', 'Operating Hours')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.operatingHours}
                  onChangeText={(v) => setForm((p) => ({ ...p, operatingHours: v }))}
                  placeholder={t('infoCard.operatingHoursPlaceholder', 'e.g. 11 AM - 9 PM')}
                  placeholderTextColor={Colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.experienceLabel', 'Experience')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.experience}
                  onChangeText={(v) => setForm((p) => ({ ...p, experience: v }))}
                  placeholder={t('infoCard.experiencePlaceholder', 'e.g. 5+ years')}
                  placeholderTextColor={Colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('infoCard.languagesLabel', 'Languages Spoken')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.languages}
                  onChangeText={(v) => setForm((p) => ({ ...p, languages: v }))}
                  placeholder={t('infoCard.languagesPlaceholder', 'e.g. Hindi, English')}
                  placeholderTextColor={Colors.muted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelBtnText}>{t('infoCard.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('infoCard.saveChanges', 'Save Changes')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 24,
      marginHorizontal: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: Colors.dark,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: Colors.bg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    gridItem: {
      width: '46%',
      backgroundColor: Colors.bg,
      padding: 16,
      borderRadius: 16,
      alignItems: 'flex-start',
    },
    label: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 12,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    value: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.dark,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: Colors.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: Colors.dark,
    },
    formContent: {
      gap: 16,
      paddingBottom: 20,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.muted,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: Colors.dark,
      fontWeight: '600',
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.dark,
    },
    saveBtn: {
      flex: 1.5,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: 'center',
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#fff',
    },
  });
