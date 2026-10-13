import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { Modal } from '../../../components/ui/Modal';
import { IncidentRepository } from '../../../repositories/IncidentRepository';
import { useLocationStore } from '../../../store/useLocationStore';
import { useToast } from '../../../components/ui/Toast';

const INCIDENT_TYPES = [
  'ACCIDENT',
  'VEHICLE_BREAKDOWN',
  'CUSTOMER_MISCONDUCT',
  'CHEF_MISCONDUCT',
  'FOOD_DAMAGE',
  'ROAD_CLOSURE',
  'SAFETY_HAZARD',
  'MEDICAL_EMERGENCY',
];

export default function IncidentReportingScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const [incidentType, setIncidentType] = useState('VEHICLE_BREAKDOWN');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [shareGPS, setShareGPS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('Please provide a description of the incident.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (shareGPS) {
        const { currentLocation } = useLocationStore.getState();
        if (currentLocation) {
          latitude = currentLocation.latitude;
          longitude = currentLocation.longitude;
        } else {
          showToast('GPS coordinates not available. Reporting without location.', 'warning');
        }
      }

      await IncidentRepository.reportIncident({
        incidentType,
        description,
        latitude,
        longitude,
        orderId: orderId || null,
        evidenceUrl: null, // Evidences plan mock placeholder
      });

      showToast('Incident logged successfully. Support team will contact you.', 'success');
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Incident logging failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhoto = () => {
    showToast('Camera and gallery attachment uploads are planned for Phase 11.', 'info');
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Report Incident</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Warning Banner */}
          <Card style={{ backgroundColor: colors.dangerContainer, padding: spacing.md, borderColor: 'transparent' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="error-outline" size={20} color={colors.danger} />
              <Text variant="caption" weight="extrabold" color="danger" style={{ marginLeft: 6 }}>
                Critical Incident Logging
              </Text>
            </View>
            <Text variant="caption" color="danger" style={{ marginTop: 4, fontSize: 10 }}>
              Use this form to log active delays, damage, breakdowns or misconduct. For extreme medical/safety emergencies, hold the SOS button on home.
            </Text>
          </Card>

          {/* Incident Type Selector */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Incident Type</Text>
            <Pressable
              onPress={() => setIsTypeModalVisible(true)}
              style={[
                styles.selectorBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.md,
                },
              ]}
            >
              <Text variant="caption" weight="bold">
                {incidentType.replace('_', ' ')}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Optional Order ID */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Active Order ID (Optional)</Text>
            <TextInput
              value={orderId}
              onChangeText={setOrderId}
              placeholder="e.g. ORD-9821"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                },
              ]}
            />
          </View>

          {/* Share GPS switch */}
          <View style={[styles.switchRow, { paddingVertical: spacing.xs }]}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="bold">Share GPS Location</Text>
              <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                Attach current location telemetry to expedite support assistance.
              </Text>
            </View>
            <Switch
              value={shareGPS}
              onValueChange={setShareGPS}
              trackColor={{ false: colors.outline, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          {/* Description input */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Incident Details</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the incident, breakdown status, road blocks, or issues..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.md,
                  color: colors.text,
                },
              ]}
            />
          </View>

          {/* Attach Evidence */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Attach Evidence (Optional)</Text>
            <Pressable
              onPress={handleUploadPhoto}
              style={[
                styles.uploadBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.outlineVariant,
                  borderRadius: radius.medium,
                  padding: spacing.lg,
                },
              ]}
            >
              <Icon name="camera-alt" size={32} color={colors.textSecondary} />
              <Text variant="caption" color="secondary" style={{ marginTop: 6 }}>
                Upload photo or video evidence
              </Text>
            </Pressable>
          </View>

          <Button
            label="Log Incident Event"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ marginTop: spacing.md, backgroundColor: colors.danger }}
          />

        </View>
      </ScrollableLayout>

      {/* Incident Type Modal */}
      <Modal visible={isTypeModalVisible} onClose={() => setIsTypeModalVisible(false)}>
        <View style={[styles.modalInner, { padding: spacing.md }]}>
          <Text variant="sm" weight="extrabold" style={{ marginBottom: spacing.md }}>
            Select Incident Type
          </Text>
          <View style={{ gap: 8 }}>
            {INCIDENT_TYPES.map((type) => (
              <Card
                key={type}
                onPress={() => {
                  setIncidentType(type);
                  setIsTypeModalVisible(false);
                }}
                style={{
                  padding: spacing.md,
                  backgroundColor: incidentType === type ? colors.primaryContainer : colors.surface,
                }}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: incidentType === type ? colors.primary : colors.text }}
                >
                  {type.replace('_', ' ')}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
  },
  textInput: {
    borderWidth: 1,
    height: 48,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAreaInput: {
    borderWidth: 1,
    minHeight: 100,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInner: {
    width: '100%',
  },
});
