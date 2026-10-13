import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { useProofStore } from '../../store/useProofStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToStorage } from '../../services/storage.service';

interface ProofOfDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitProof: () => Promise<void>;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  visible,
  onClose,
  onSubmitProof,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { signatureData, photoUri, setSignatureData, setPhotoUri } = useProofStore();

  const handleSign = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      
      const selectedAsset = result.assets[0];
      const uploadedUrl = await uploadFileToStorage(
        'delivery-proof',
        'signatures',
        selectedAsset.uri,
        selectedAsset.fileName || `signature-${Date.now()}.jpg`
      );
      setSignatureData(uploadedUrl);
    } catch (e: any) {
      console.warn('Signature upload error:', e.message);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const selectedAsset = result.assets[0];
      const uploadedUrl = await uploadFileToStorage(
        'delivery-proof',
        'proofs',
        selectedAsset.uri,
        selectedAsset.fileName || `delivery-${Date.now()}.jpg`
      );
      setPhotoUri(uploadedUrl);
    } catch (e: any) {
      console.warn('Proof photo upload error:', e.message);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Proof of Delivery (POD)
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Capture digital signature or delivery photo for verification record.
        </Text>

        {/* Digital Signature Pad Card */}
        <View
          style={[
            styles.signatureBox,
            {
              backgroundColor: signatureData ? colors.successContainer : colors.surfaceElevated,
              borderColor: signatureData ? colors.success : colors.border,
              borderRadius: radius.medium,
              padding: spacing.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Icon name="gesture" size={24} colorType={signatureData ? 'success' : 'primary'} />
          <View style={{ marginLeft: spacing.xs, flex: 1 }}>
            <Text variant="xs" weight="bold">
              {signatureData ? 'Digital Signature Recorded' : 'Customer Digital Signature'}
            </Text>
            <Text variant="caption" color="secondary">
              {signatureData ? 'Timestamped signature attached' : 'Tap to simulate resident signature'}
            </Text>
          </View>
          <Button
            label={signatureData ? 'Change' : 'Sign'}
            onPress={handleSign}
            variant={signatureData ? 'outline' : 'primary'}
            size="sm"
          />
        </View>

        {/* Photo Upload Card */}
        <View
          style={[
            styles.photoBox,
            {
              backgroundColor: photoUri ? colors.infoContainer : colors.surfaceElevated,
              borderColor: photoUri ? colors.info : colors.border,
              borderRadius: radius.medium,
              padding: spacing.md,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Icon name="photo-camera" size={24} colorType={photoUri ? 'info' : 'primary'} />
          <View style={{ marginLeft: spacing.xs, flex: 1 }}>
            <Text variant="xs" weight="bold">
              {photoUri ? 'Delivery Photo Captured' : 'Photo Proof of Delivery'}
            </Text>
            <Text variant="caption" color="secondary">
              {photoUri ? 'Package photo attached' : 'Take photo of package at door'}
            </Text>
          </View>
          <Button
            label={photoUri ? 'Retake' : 'Capture'}
            onPress={handleCapturePhoto}
            variant={photoUri ? 'outline' : 'primary'}
            size="sm"
          />
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <Button label="Skip / Done" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Save Proof"
            onPress={async () => {
              await onSubmitProof();
              onClose();
            }}
            variant="primary"
            size="md"
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  signatureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  photoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default ProofOfDeliveryModal;
