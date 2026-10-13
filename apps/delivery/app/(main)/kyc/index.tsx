import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { Modal } from '../../../components/ui/Modal';
import { useTheme } from '../../../theme/ThemeContext';
import { useToast } from '../../../components/ui/Toast';
import { usePartnerStore } from '../../../store/usePartnerStore';
import { useKYCStore } from '../../../store/useKYCStore';
import { uploadFileToStorage } from '../../../services/storage.service';
import { partnerApi } from '../../../api/partner.api';

interface DocSpec {
  type: string;
  title: string;
  subtitle: string;
  icon: string;
}

const REQUIRED_DOCUMENTS: DocSpec[] = [
  {
    type: 'aadhaar_front',
    title: 'Aadhaar Card — Front',
    subtitle: 'Clear photo of front side with your photo & details',
    icon: 'badge',
  },
  {
    type: 'aadhaar_back',
    title: 'Aadhaar Card — Back',
    subtitle: 'Back side showing full address and barcode',
    icon: 'badge',
  },
  {
    type: 'pan_card',
    title: 'PAN Card',
    subtitle: 'Permanent Account Number card for tax & payouts',
    icon: 'credit-card',
  },
  {
    type: 'license_front',
    title: 'Driving Licence — Front',
    subtitle: 'Front side of valid commercial/motor vehicle license',
    icon: 'drive-eta',
  },
  {
    type: 'license_back',
    title: 'Driving Licence — Back',
    subtitle: 'Back side of driving license with endorsements',
    icon: 'drive-eta',
  },
  {
    type: 'selfie',
    title: 'Selfie Verification',
    subtitle: 'Clear front-facing photo of your face without glasses',
    icon: 'account-circle',
  },
];

export default function KycScreen() {
  const router = useRouter();
  const { colors, spacing, radius, isDark } = useTheme();
  const { showToast } = useToast();

  const { partner, documents, loadProfile } = usePartnerStore();
  const { status: kycStatus, rejectionReason, submitKyc, isLoading: kycSubmitting } = useKYCStore();

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [inspectImage, setInspectImage] = useState<{ title: string; url: string } | null>(null);

  // Picker source and preview modal state
  const [activeDocSpec, setActiveDocSpec] = useState<DocSpec | null>(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadProfile().catch(() => {});
  }, []);

  const docsMap = new Map<string, any>();
  (documents || []).forEach((doc: any) => {
    if (doc?.document_type) {
      docsMap.set(doc.document_type, doc);
    }
  });

  const uploadedCount = docsMap.size;
  const progressPercent = Math.min(100, Math.round((uploadedCount / 6) * 100));

  const handleOpenSourcePicker = (docSpec: DocSpec) => {
    setActiveDocSpec(docSpec);
    setSourceModalVisible(true);
  };

  const handleSelectSource = async (source: 'camera' | 'gallery') => {
    if (!activeDocSpec) return;
    setSourceModalVisible(false);

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast('Camera permission required to take document photo', 'error');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: activeDocSpec.type === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPendingImageUri(result.assets[0].uri);
          setPreviewModalVisible(true);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Gallery permission required to select document photo', 'error');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: activeDocSpec.type === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPendingImageUri(result.assets[0].uri);
          setPreviewModalVisible(true);
        }
      }
    } catch (e: any) {
      showToast('Image selection failed', 'error');
    }
  };

  const handleConfirmDocumentUpload = async () => {
    if (!activeDocSpec || !pendingImageUri) return;
    const docSpec = activeDocSpec;
    setPreviewModalVisible(false);
    setUploadingType(docSpec.type);

    try {
      const partnerId = partner?.id || 'partner';
      const fileName = `${docSpec.type}_${partnerId}_${Date.now()}.jpg`;

      const publicUrl = await uploadFileToStorage('partner-profile', 'documents', pendingImageUri, fileName);

      if (docSpec.type === 'selfie') {
        await partnerApi.uploadSelfie(publicUrl);
      } else {
        await partnerApi.uploadDocument(docSpec.type, publicUrl);
      }

      await loadProfile();
      showToast(`${docSpec.title} uploaded successfully!`, 'success');
    } catch (e: any) {
      console.error('[KycScreen] Document upload failed:', e);
      showToast(e.message || 'Document upload failed. Check connection and retry.', 'error');
    } finally {
      setUploadingType(null);
      setPendingImageUri(null);
      setActiveDocSpec(null);
    }
  };

  const handleSubmitKycAudit = async () => {
    try {
      await submitKyc();
      await loadProfile();
      showToast('KYC submitted for audit verification successfully!', 'success');
    } catch (e: any) {
      showToast(e.message || 'KYC submission failed', 'error');
    }
  };

  return (
    <ScreenWrapper>
      {/* Header Bar */}
      <View style={[styles.topHeaderBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text variant="md" weight="extrabold" style={{ color: colors.text }}>
            Identity & Verification
          </Text>
          <Text variant="caption" style={{ color: colors.textSecondary }}>
            Upload your documents to complete your rider verification.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { padding: spacing.md }]}>
        {/* Verification Overview Progress Card */}
        <Card variant="elevated" style={[styles.progressCard, { borderRadius: radius.xxlarge, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressRowHeader}>
            <View>
              <Text variant="sm" weight="extrabold" style={{ color: colors.text }}>
                Identity Verification
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                {uploadedCount} of 6 documents uploaded
              </Text>
            </View>

            {/* Dynamic Overall Status Chip */}
            <View
              style={[
                styles.statusBadgeChip,
                {
                  backgroundColor:
                    partner?.kyc_status === 'APPROVED'
                      ? '#E2ECE7'
                      : partner?.kyc_status === 'UNDER_REVIEW'
                      ? '#FEF3C7'
                      : partner?.kyc_status === 'REJECTED'
                      ? '#FEE2E2'
                      : '#E0F2FE',
                },
              ]}
            >
              <Text
                variant="caption"
                weight="extrabold"
                style={{
                  color:
                    partner?.kyc_status === 'APPROVED'
                      ? '#0B4F3A'
                      : partner?.kyc_status === 'UNDER_REVIEW'
                      ? '#D97706'
                      : partner?.kyc_status === 'REJECTED'
                      ? '#DC2626'
                      : '#0284C7',
                  fontSize: 11,
                }}
              >
                {partner?.kyc_status === 'APPROVED'
                  ? 'Verified Partner ✓'
                  : partner?.kyc_status === 'UNDER_REVIEW'
                  ? 'Under Review ⏳'
                  : partner?.kyc_status === 'REJECTED'
                  ? 'Action Required ⚠'
                  : 'Verification Incomplete'}
              </Text>
            </View>
          </View>

          {/* Dynamic Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>

          {/* Rejection Notice Banner */}
          {partner?.kyc_status === 'REJECTED' && (
            <View style={styles.rejectionBox}>
              <Icon name="warning" size={18} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text variant="xs" weight="extrabold" style={{ color: '#DC2626' }}>
                  Verification Rejected
                </Text>
                <Text variant="caption" style={{ color: '#7F1D1D', marginTop: 2 }}>
                  {rejectionReason || partner?.rejection_reason || 'Some documents require re-uploading. Please check flagged items below.'}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Document Items List */}
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text variant="sm" weight="extrabold" style={{ color: colors.text, marginBottom: 4 }}>
            Required Identity Documents (6)
          </Text>

          {REQUIRED_DOCUMENTS.map((docSpec) => {
            const existingDoc = docsMap.get(docSpec.type);
            const isUploading = uploadingType === docSpec.type;
            const docStatus = existingDoc?.status || (existingDoc ? 'UPLOADED' : 'NOT_UPLOADED');
            const overallKyc = partner?.kyc_status;

            return (
              <Card
                key={docSpec.type}
                variant="outlined"
                style={[
                  styles.docCard,
                  {
                    borderRadius: radius.large,
                    backgroundColor: colors.surface,
                    borderColor: docStatus === 'REJECTED' ? '#FCA5A5' : docStatus === 'APPROVED' ? '#A7F3D0' : colors.border,
                  },
                ]}
              >
                <View style={styles.docHeaderRow}>
                  <View style={[styles.docIconBox, { backgroundColor: colors.surfaceContainer }]}>
                    <Icon name={docSpec.icon as any} size={22} color={colors.primary} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text variant="sm" weight="bold" style={{ color: colors.text }}>
                      {docSpec.title}
                    </Text>
                    <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 1, fontSize: 11 }}>
                      {docSpec.subtitle}
                    </Text>
                  </View>

                  {/* Status Badge per Document */}
                  {docStatus === 'APPROVED' || overallKyc === 'APPROVED' ? (
                    <View style={[styles.miniBadge, { backgroundColor: '#E2ECE7' }]}>
                      <Text variant="caption" weight="bold" style={{ color: '#0B4F3A', fontSize: 10 }}>
                        ✓ Verified
                      </Text>
                    </View>
                  ) : overallKyc === 'UNDER_REVIEW' || docStatus === 'UNDER_REVIEW' ? (
                    <View style={[styles.miniBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text variant="caption" weight="bold" style={{ color: '#D97706', fontSize: 10 }}>
                        ⏳ Under Review
                      </Text>
                    </View>
                  ) : docStatus === 'REJECTED' ? (
                    <View style={[styles.miniBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text variant="caption" weight="bold" style={{ color: '#DC2626', fontSize: 10 }}>
                        ⚠ Action Required
                      </Text>
                    </View>
                  ) : existingDoc ? (
                    <View style={[styles.miniBadge, { backgroundColor: '#E0F2FE' }]}>
                      <Text variant="caption" weight="bold" style={{ color: '#0284C7', fontSize: 10 }}>
                        ✓ Uploaded
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.miniBadge, { backgroundColor: '#EFEBE0' }]}>
                      <Text variant="caption" weight="bold" style={{ color: '#8A9C91', fontSize: 10 }}>
                        Pending
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions Row */}
                <View style={styles.docActionsRow}>
                  {isUploading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#0B4F3A" />
                      <Text variant="caption" weight="bold" style={{ color: '#0B4F3A' }}>
                        Uploading file...
                      </Text>
                    </View>
                  ) : (existingDoc?.document_url || docStatus === 'APPROVED' || docStatus === 'VERIFIED') ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
                      <Button
                        label="View Document"
                        size="sm"
                        variant="outline"
                        leftIcon="visibility"
                        onPress={() => setInspectImage({ title: docSpec.title, url: existingDoc?.document_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop' })}
                      />
                      {overallKyc !== 'APPROVED' && overallKyc !== 'UNDER_REVIEW' && (
                        <Button
                          label={docStatus === 'REJECTED' ? 'Re-upload' : 'Replace'}
                          size="sm"
                          variant={docStatus === 'REJECTED' ? 'primary' : 'outline'}
                          leftIcon="cloud-upload"
                          onPress={() => handleOpenSourcePicker(docSpec)}
                          style={docStatus === 'REJECTED' ? { backgroundColor: '#DC2626' } : undefined}
                        />
                      )}
                    </View>
                  ) : (
                    <Button
                      label="Upload Photo"
                      size="sm"
                      variant="primary"
                      leftIcon="cloud-upload"
                      onPress={() => handleOpenSourcePicker(docSpec)}
                      style={{ backgroundColor: '#0B4F3A', alignSelf: 'flex-start' }}
                    />
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Submit Verification for Audit Button */}
        {uploadedCount >= 1 && (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label={
                partner?.kyc_status === 'UNDER_REVIEW'
                  ? 'Verification Submitted (Under Review ⏳)'
                  : partner?.kyc_status === 'APPROVED'
                  ? 'KYC Verification Approved ✓'
                  : 'Submit Verification for Audit'
              }
              onPress={handleSubmitKycAudit}
              variant="primary"
              size="lg"
              loading={kycSubmitting}
              disabled={kycSubmitting || partner?.kyc_status === 'UNDER_REVIEW' || partner?.kyc_status === 'APPROVED'}
              style={{ backgroundColor: partner?.kyc_status === 'APPROVED' ? '#146b4b' : '#0B4F3A' }}
            />
          </View>
        )}
      </ScrollView>

      {/* Camera / Gallery Selection Source Modal */}
      <Modal visible={sourceModalVisible} onClose={() => setSourceModalVisible(false)}>
        <View style={styles.modalInspectContent}>
          <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A', marginBottom: 4 }}>
            Select Photo Source
          </Text>
          <Text variant="caption" style={{ color: '#5A6E63', marginBottom: 16 }}>
            Choose how you want to upload {activeDocSpec?.title}
          </Text>
          <View style={{ gap: 10, width: '100%' }}>
            <Button
              label="Take Photo with Camera 📷"
              onPress={() => handleSelectSource('camera')}
              variant="primary"
              size="md"
              style={{ backgroundColor: '#0B4F3A' }}
            />
            <Button
              label="Choose from Photo Gallery 🖼️"
              onPress={() => handleSelectSource('gallery')}
              variant="outline"
              size="md"
            />
            <Button
              label="Cancel"
              onPress={() => setSourceModalVisible(false)}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      </Modal>

      {/* Selected Image Upload Preview Modal */}
      <Modal visible={previewModalVisible} onClose={() => setPreviewModalVisible(false)}>
        <View style={styles.modalInspectContent}>
          <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A', marginBottom: 4 }}>
            Confirm Document Upload
          </Text>
          <Text variant="caption" style={{ color: '#5A6E63', marginBottom: 12 }}>
            Preview of {activeDocSpec?.title} before uploading
          </Text>
          {pendingImageUri ? (
            <Image source={{ uri: pendingImageUri }} style={styles.fullInspectImage} resizeMode="contain" />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 16 }}>
            <Button
              label="Cancel"
              onPress={() => setPreviewModalVisible(false)}
              variant="outline"
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              label="Confirm & Upload"
              onPress={handleConfirmDocumentUpload}
              variant="primary"
              size="md"
              style={{ flex: 1, backgroundColor: '#0B4F3A' }}
            />
          </View>
        </View>
      </Modal>

      {/* Document Image Inspection Modal */}
      {inspectImage && (
        <Modal visible={!!inspectImage} onClose={() => setInspectImage(null)}>
          <View style={styles.modalInspectContent}>
            <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A', marginBottom: 12 }}>
              {inspectImage.title}
            </Text>
            <Image source={{ uri: inspectImage.url }} style={styles.fullInspectImage} resizeMode="contain" />
            <Button label="Close Preview" onPress={() => setInspectImage(null)} variant="outline" size="md" style={{ marginTop: 16, width: '100%' }} />
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F4EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D5',
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D5',
  },
  container: {
    paddingBottom: 40,
  },
  progressCard: {
    padding: 16,
    width: '100%',
  },
  progressRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadgeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EFEBE0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  docCard: {
    padding: 14,
    width: '100%',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2ECE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  docActionsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EFE6',
  },
  modalInspectContent: {
    alignItems: 'center',
    width: '100%',
    padding: 8,
  },
  fullInspectImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
});
