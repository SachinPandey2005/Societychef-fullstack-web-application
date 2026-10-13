import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToStorage } from '../../services/storage.service';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Switch } from '../../components/ui/Switch';
import { Icon } from '../../components/Icon';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/useAuthStore';
import { usePartnerStore } from '../../store/usePartnerStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useBankStore } from '../../store/useBankStore';
import { useSocietyStore } from '../../store/useSocietyStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ThemeSelector } from '../../components/theme/ThemeSelector';
import { SettingsRepository } from '../../repositories/SettingsRepository';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  validateVehiclePlateNumber,
  validateBankName,
  validateAccountNumber,
  validateIfscCode,
} from '../../utils/validation';

const PROFILE_KYC_DOCUMENTS = [
  {
    type: 'aadhaar_front',
    title: 'Aadhaar Card — Front',
    subtitle: 'Front side of Aadhaar card',
    icon: 'badge',
  },
  {
    type: 'aadhaar_back',
    title: 'Aadhaar Card — Back',
    subtitle: 'Back side of Aadhaar card',
    icon: 'badge',
  },
  {
    type: 'pan_card',
    title: 'PAN Card',
    subtitle: 'Permanent Account Number card',
    icon: 'credit-card',
  },
  {
    type: 'license_front',
    title: 'Driving Licence — Front',
    subtitle: 'Front side of valid license',
    icon: 'drive-eta',
  },
  {
    type: 'license_back',
    title: 'Driving Licence — Back',
    subtitle: 'Back side of valid license',
    icon: 'drive-eta',
  },
  {
    type: 'selfie',
    title: 'Selfie Verification',
    subtitle: 'Front-facing selfie photo',
    icon: 'account-circle',
  },
];

const DEFAULT_DOC_SAMPLES: Record<string, string> = {
  aadhaar_front: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
  aadhaar_back: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
  pan_card: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
  license_front: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop',
  license_back: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop',
  selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const { theme, setTheme } = useThemeStore();
  const { showToast } = useToast();

  const { logout, userProfile } = useAuthStore();
  const { profile, partner, documents, loadProfile, updateProfile, isLoading: profileLoading } = usePartnerStore();
  const { vehicle, loadVehicle, updateVehicle } = useVehicleStore();
  const { bank, loadBank, updateBank } = useBankStore();
  const { society, loadSocietyAssignment } = useSocietyStore();

  const [editPersonal, setEditPersonal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(false);
  const [editBank, setEditBank] = useState(false);

  // Avatar upload state
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Document Inspection modal state
  const [inspectDocImage, setInspectDocImage] = useState<{ title: string; url: string; type?: string } | null>(null);

  // Edit Forms state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV' | 'WALKING'>('SCOOTER');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rcUrl, setRcUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');

  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [chequeUrl, setChequeUrl] = useState('');

  // Form Field Validation Error states
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [bankNameError, setBankNameError] = useState('');
  const [accountNumberError, setAccountNumberError] = useState('');
  const [ifscCodeError, setIfscCodeError] = useState('');

  // Security preferences
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadProfile();
        await loadVehicle();
        await loadBank();
        await loadSocietyAssignment();
      } catch (err) {
        console.warn('Failed to load profile parameters:', err);
      }
    };
    fetchData();
  }, [userProfile?.id]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    } else {
      setName('');
      setEmail('');
    }
    if (partner) {
      setLanguage(partner.preferred_language || 'English');
    } else {
      setLanguage('English');
    }
  }, [profile, partner]);

  useEffect(() => {
    if (vehicle) {
      setVehicleType((vehicle.vehicle_type as any) || 'SCOOTER');
      setVehicleNumber(vehicle.vehicle_number || '');
      setRcUrl(vehicle.rc_url || '');
      setInsuranceUrl(vehicle.insurance_url || '');
    } else {
      setVehicleType('SCOOTER');
      setVehicleNumber('');
      setRcUrl('');
      setInsuranceUrl('');
    }
  }, [vehicle]);

  useEffect(() => {
    if (bank) {
      setHolderName(bank.holder_name || '');
      setBankName(bank.bank_name || '');
      setAccountNumber(bank.account_number || '');
      setIfscCode(bank.ifsc_code || '');
      setChequeUrl(bank.cheque_url || '');
    } else {
      setHolderName('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setChequeUrl('');
    }
  }, [bank]);

  const docsMap = new Map<string, any>();
  (documents || []).forEach((doc: any) => {
    if (doc?.document_type) {
      docsMap.set(doc.document_type, doc);
    }
  });

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      showToast('Please enter a valid name (at least 2 characters)', 'error');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast('Please enter a valid email address (e.g. user@domain.com)', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: trimmedName,
        preferred_language: language.trim() || 'English',
      };
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }
      await updateProfile(payload);
      setEditPersonal(false);
      showToast('Personal details updated successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    const plateRes = validateVehiclePlateNumber(vehicleNumber);
    if (!plateRes.isValid) {
      setVehicleNumberError(plateRes.error || 'Invalid plate number');
      showToast(plateRes.error || 'Invalid plate number', 'error');
      return;
    }
    setVehicleNumberError('');
    setSaving(true);
    try {
      await updateVehicle({
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.replace(/[\s-]/g, '').toUpperCase(),
        rc_url: rcUrl,
        insurance_url: insuranceUrl,
      });
      setEditVehicle(false);
      showToast('Vehicle details saved successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Vehicle update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    const bankRes = validateBankName(bankName);
    const accRes = validateAccountNumber(accountNumber);
    const ifscRes = validateIfscCode(ifscCode);

    setBankNameError(bankRes.error || '');
    setAccountNumberError(accRes.error || '');
    setIfscCodeError(ifscRes.error || '');

    if (!bankRes.isValid || !accRes.isValid || !ifscRes.isValid) {
      const firstErr = bankRes.error || accRes.error || ifscRes.error;
      showToast(firstErr || 'Please fix invalid bank details', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateBank({
        holder_name: holderName || profile?.name || 'Rider Partner',
        bank_name: bankName.trim(),
        account_number: accountNumber.replace(/\s/g, ''),
        ifsc_code: ifscCode.trim().toUpperCase(),
        cheque_url: chequeUrl,
      });
      setEditBank(false);
      showToast('Bank details updated successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Bank update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBiometrics = async (checked: boolean) => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      showToast('Biometric hardware not available on this device', 'error');
      return;
    }
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      showToast('No biometrics enrolled. Setup fingerprints in device settings first.', 'warning');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable biometric logins',
    });

    if (result.success) {
      setBiometricsEnabled(checked);
      showToast(`Biometric login ${checked ? 'enabled' : 'disabled'}`, 'success');
    } else {
      showToast('Biometric validation failed', 'error');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Profile & Account',
      'In accordance with Google Play Developer Policy, requesting account deletion will permanently remove your profile, KYC documents, vehicle registration, and payout details.\n\nAre you sure you want to request permanent account deletion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Account Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              await SettingsRepository.requestDelete();
              Alert.alert(
                'Deletion Request Registered',
                'Your profile deletion request has been registered. You will now be logged out.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await logout();
                      router.replace('/(auth)/login');
                    },
                  },
                ]
              );
            } catch (e: any) {
              showToast(e?.message || 'Failed to submit account deletion request.', 'error');
            }
          },
        },
      ]
    );
  };

  const handlePickAvatarImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera roll permission required to select avatar photo', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarPreviewUri(result.assets[0].uri);
        setAvatarModalVisible(true);
      }
    } catch (e: any) {
      showToast('Failed to select image from gallery', 'error');
    }
  };

  const handleConfirmAvatarUpload = async () => {
    if (!avatarPreviewUri) return;
    setAvatarUploading(true);
    try {
      const partnerId = partner?.id || profile?.id || 'partner';
      const fileName = `avatar_${partnerId}_${Date.now()}.jpg`;
      const publicUrl = await uploadFileToStorage('partner-profile', 'avatars', avatarPreviewUri, fileName);

      await updateProfile({ profile_photo_url: publicUrl });
      await loadProfile();
      await useAuthStore.getState().refreshPartnerProfile();

      setAvatarModalVisible(false);
      setAvatarPreviewUri(null);
      showToast('Avatar profile photo updated successfully!', 'success');
    } catch (e: any) {
      console.error('[ProfileScreen] Avatar upload error:', e);
      showToast(e.message || 'Avatar upload failed. Check connection and try again.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (profileLoading && !partner) {
    return (
      <ScreenWrapper>
        <View style={styles.centerCol}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const completionPercent = partner?.progress_percentage || 0;
  const kycStatus = partner?.kyc_status || 'PENDING';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.container, { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 10 }]}>
        
        {/* 1. Hero Profile Header Card */}
        <Card variant="elevated" style={[styles.heroCard, { borderRadius: 24, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, ...shadows.xs }]}>
          {/* City Landscape Header Background Graphic */}
          <View style={styles.heroHeaderBg}>
            <View style={styles.skyLineH} />
            <View style={styles.treeCircleLeft} />
            <View style={styles.treeCircleRight} />
          </View>

          {/* Avatar with Camera Badge */}
          <TouchableOpacity activeOpacity={0.8} onPress={handlePickAvatarImage} style={styles.avatarTouchable}>
            <View style={styles.avatarCircleBg}>
              <Icon name="person" size={44} color="#059669" />
            </View>
            <View style={styles.cameraBadge}>
              <Icon name="photo-camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Dynamic Verification Badge */}
          {kycStatus === 'APPROVED' ? (
            <View style={[styles.verifiedBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Icon name="check-circle" size={14} color="#059669" />
              <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 4, fontSize: 11 }}>
                Verified Partner
              </Text>
            </View>
          ) : kycStatus === 'UNDER_REVIEW' ? (
            <View style={[styles.verifiedBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Icon name="schedule" size={14} color="#D97706" />
              <Text variant="caption" weight="extrabold" style={{ color: '#D97706', marginLeft: 4, fontSize: 11 }}>
                Verification In Review
              </Text>
            </View>
          ) : kycStatus === 'REJECTED' ? (
            <View style={[styles.verifiedBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Icon name="cancel" size={14} color="#EF4444" />
              <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', marginLeft: 4, fontSize: 11 }}>
                KYC Rejected
              </Text>
            </View>
          ) : (
            <View style={[styles.verifiedBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
              <Icon name="warning" size={14} color="#64748B" />
              <Text variant="caption" weight="extrabold" style={{ color: '#64748B', marginLeft: 4, fontSize: 11 }}>
                Verification Pending
              </Text>
            </View>
          )}

          {/* Rider Name & ID */}
          <Text variant="h2" weight="extrabold" style={{ color: '#0F172A', marginTop: 8, fontSize: 22 }}>
            {profile?.name || userProfile?.name || 'New User'}
          </Text>

          <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 12 }}>
            Delivery Partner ID: {(partner as any)?.partner_code || (profile as any)?.partner_code || 'DP-0000'}
          </Text>

          {/* Dynamic Rating */}
          <View style={styles.ratingRow}>
            {(partner as any)?.rating ? (
              <>
                <Text variant="sm" weight="extrabold" style={{ color: '#0F172A' }}>
                  {(partner as any).rating}
                </Text>
                <View style={{ marginHorizontal: 4 }}>
                  <Icon name="star" size={16} color="#EAB308" />
                </View>
                <Text variant="caption" style={{ color: '#64748B', fontSize: 11 }}>
                  ({(partner as any).reviews_count || 0} Reviews)
                </Text>
              </>
            ) : (
              <Text variant="caption" weight="bold" style={{ color: '#64748B', fontSize: 11 }}>
                🌱 New Delivery Partner (0 Deliveries)
              </Text>
            )}
          </View>

          {/* Dynamic KYC Verification Banner */}
          <View style={styles.kycBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name={kycStatus === 'APPROVED' ? 'verified-user' : kycStatus === 'REJECTED' ? 'error-outline' : 'schedule'}
                size={18}
                color={kycStatus === 'APPROVED' ? '#059669' : kycStatus === 'REJECTED' ? '#EF4444' : '#D97706'}
              />
              <Text variant="xs" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
                KYC Verification
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                variant="xs"
                weight="extrabold"
                style={{
                  color: kycStatus === 'APPROVED' ? '#059669' : kycStatus === 'REJECTED' ? '#EF4444' : '#D97706',
                  marginRight: 4,
                }}
              >
                {kycStatus === 'APPROVED'
                  ? 'Completed'
                  : kycStatus === 'UNDER_REVIEW'
                  ? 'In Review'
                  : kycStatus === 'REJECTED'
                  ? 'Rejected'
                  : 'Pending Verification'}
              </Text>
              <Icon
                name={kycStatus === 'APPROVED' ? 'check-circle' : kycStatus === 'REJECTED' ? 'cancel' : 'pending'}
                size={16}
                color={kycStatus === 'APPROVED' ? '#059669' : kycStatus === 'REJECTED' ? '#EF4444' : '#D97706'}
              />
            </View>
          </View>
        </Card>

        {/* 2. Complete Your Setup Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="assignment" size={22} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 15 }}>
                Complete Your Setup
              </Text>
              <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 11, lineHeight: 15 }}>
                Complete optional verification items anytime to unlock all rider features.
              </Text>
            </View>

            {/* Circular Progress Ring */}
            <View style={styles.progressRingCircle}>
              <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', fontSize: 11 }}>
                {completionPercent}%
              </Text>
              <Text variant="caption" style={{ color: '#64748B', fontSize: 8 }}>
                Finished
              </Text>
            </View>
          </View>

          <View style={styles.setupDivider} />

          {/* Setup Rows List */}
          <View style={{ gap: 12 }}>
            {/* Basic Profile */}
            <View style={styles.setupRow}>
              <View style={styles.iconCircleLightGreen}>
                <Icon name="assignment-ind" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  Basic Rider Profile
                </Text>
                <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                  Add your basic information
                </Text>
              </View>
              <View style={styles.completedPill}>
                <Icon name="check" size={12} color="#059669" />
                <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 2, fontSize: 10 }}>
                  Completed
                </Text>
              </View>
            </View>

            {/* Identity & Selfie */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(main)/kyc')} style={styles.setupRow}>
              <View style={styles.iconCircleLightGreen}>
                <Icon name="account-circle" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  Identity & Selfie Verification
                </Text>
                <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                  Verify your identity documents
                </Text>
              </View>
              <View
                style={[
                  styles.completedPill,
                  kycStatus === 'APPROVED'
                    ? null
                    : kycStatus === 'REJECTED'
                    ? { backgroundColor: '#FEE2E2' }
                    : { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Icon
                  name={kycStatus === 'APPROVED' ? 'check' : kycStatus === 'REJECTED' ? 'close' : 'schedule'}
                  size={12}
                  color={kycStatus === 'APPROVED' ? '#059669' : kycStatus === 'REJECTED' ? '#EF4444' : '#D97706'}
                />
                <Text
                  variant="caption"
                  weight="extrabold"
                  style={{
                    color: kycStatus === 'APPROVED' ? '#059669' : kycStatus === 'REJECTED' ? '#EF4444' : '#D97706',
                    marginLeft: 2,
                    fontSize: 10,
                  }}
                >
                  {kycStatus === 'APPROVED'
                    ? 'Verified'
                    : kycStatus === 'UNDER_REVIEW'
                    ? 'In Review'
                    : kycStatus === 'REJECTED'
                    ? 'Rejected'
                    : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Vehicle Details */}
            <View style={styles.setupRow}>
              <View style={styles.iconCircleLightGreen}>
                <Icon name="directions-car" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  Vehicle Details
                </Text>
                <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                  Add your vehicle information
                </Text>
              </View>
              <View style={styles.completedPill}>
                <Icon name="check" size={12} color="#059669" />
                <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 2, fontSize: 10 }}>
                  Completed
                </Text>
              </View>
            </View>

            {/* Bank & Payout Details */}
            <View style={styles.setupRow}>
              <View style={styles.iconCircleLightGreen}>
                <Icon name="verified-user" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  Bank & Payout Details
                </Text>
                <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                  Add bank & payout information
                </Text>
              </View>
              <View style={styles.completedPill}>
                <Icon name="check" size={12} color="#059669" />
                <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 2, fontSize: 10 }}>
                  Configured
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 3. CRM Assigned Gated Society Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.crmHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="business" size={22} color="#FFFFFF" />
            </View>
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 10, flex: 1, fontSize: 15 }}>
              CRM Assigned Gated Society
            </Text>
            
            {/* Building Vector Graphic Circle */}
            <View style={styles.buildingGraphicCircle}>
              <Icon name="location-city" size={32} color="#059669" />
            </View>
          </View>

          <View style={{ gap: 8, marginTop: 12 }}>
            <View style={styles.infoDetailRow}>
              <Icon name="business" size={14} color="#64748B" />
              <Text variant="caption" style={{ color: '#64748B', marginLeft: 6, fontSize: 11 }}>
                Tower Coverage: <Text variant="caption" weight="extrabold" style={{ color: '#0F172A' }}>All Towers</Text>
              </Text>
            </View>

            <View style={styles.infoDetailRow}>
              <Icon name="place" size={14} color="#64748B" />
              <Text variant="caption" style={{ color: '#64748B', marginLeft: 6, fontSize: 11 }}>
                Zone: <Text variant="caption" weight="extrabold" style={{ color: '#0F172A' }}>Core Campus (Radius: km)</Text>
              </Text>
            </View>

            <View style={styles.infoDetailRow}>
              <Icon name="schedule" size={14} color="#64748B" />
              <Text variant="caption" style={{ color: '#64748B', marginLeft: 6, fontSize: 11 }}>
                Shift: <Text variant="caption" weight="extrabold" style={{ color: '#0F172A' }}>08:00 AM - 10:00 PM</Text>
              </Text>
            </View>
          </View>
        </Card>

        {/* 4. Personal Details Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="person" size={22} color="#FFFFFF" />
            </View>

            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 10, flex: 1, fontSize: 15 }}>
              Personal Details
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setEditPersonal(!editPersonal)} style={styles.editBtnCircle}>
              <Icon name={editPersonal ? 'close' : 'edit'} size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {editPersonal ? (
            <View style={{ gap: 12, marginTop: 14 }}>
              <TextInput label="Full Name" placeholder="New User" value={name} onChangeText={setName} />
              <TextInput label="Email" placeholder="email@domain.com" value={email} onChangeText={setEmail} />
              <TextInput label="Preferred Language" placeholder="English" value={language} onChangeText={setLanguage} />
              <Button label="Save Changes" onPress={handleSaveProfile} loading={saving} variant="primary" size="sm" style={{ backgroundColor: '#059669' }} />
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 60, fontSize: 11 }}>
                  Name:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {profile?.name || userProfile?.name || 'New User'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 60, fontSize: 11 }}>
                  Email:
                </Text>
                <Text variant="xs" style={{ color: '#0F172A' }}>
                  {profile?.email || 'N/A'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 60, fontSize: 11 }}>
                  Mobile:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {profile?.phone ? (profile.phone.startsWith('+') ? profile.phone : `+91 ${profile.phone.slice(-10)}`) : (userProfile?.phone || 'N/A')}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 60, fontSize: 11 }}>
                  Language:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {partner?.preferred_language || 'English'}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* 5. Identity & Verification Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="assignment-turned-in" size={22} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', fontSize: 15 }}>
                Identity & Verification
              </Text>
              <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                Upload your documents to complete rider verification.
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(main)/kyc')} style={styles.editBtnCircle}>
              <Icon name="edit" size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* List of KYC Documents */}
          <View style={{ gap: 12, marginTop: 14 }}>
            {PROFILE_KYC_DOCUMENTS.map((docSpec) => {
              const existingDoc = docsMap.get(docSpec.type);
              const docUrl = existingDoc?.document_url;

              return (
                <View key={docSpec.type} style={styles.docCardBox}>
                  <View style={styles.docHeaderRow}>
                    <View style={styles.iconCircleLightGreen}>
                      <Icon name={docSpec.icon as any} size={16} color="#059669" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                        {docSpec.title}
                      </Text>
                      <Text variant="caption" style={{ color: '#64748B', fontSize: 10 }}>
                        {docSpec.subtitle}
                      </Text>
                    </View>
                    {existingDoc?.status === 'APPROVED' ? (
                      <View style={styles.completedPill}>
                        <Icon name="check" size={12} color="#059669" />
                        <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 2, fontSize: 10 }}>
                          Verified
                        </Text>
                      </View>
                    ) : existingDoc?.status === 'PENDING' ? (
                      <View style={[styles.completedPill, { backgroundColor: '#FEF3C7' }]}>
                        <Icon name="schedule" size={12} color="#D97706" />
                        <Text variant="caption" weight="extrabold" style={{ color: '#D97706', marginLeft: 2, fontSize: 10 }}>
                          In Review
                        </Text>
                      </View>
                    ) : existingDoc?.status === 'REJECTED' ? (
                      <View style={[styles.completedPill, { backgroundColor: '#FEE2E2' }]}>
                        <Icon name="cancel" size={12} color="#EF4444" />
                        <Text variant="caption" weight="extrabold" style={{ color: '#EF4444', marginLeft: 2, fontSize: 10 }}>
                          Rejected
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.completedPill, { backgroundColor: '#F1F5F9' }]}>
                        <Icon name="warning" size={12} color="#64748B" />
                        <Text variant="caption" weight="extrabold" style={{ color: '#64748B', marginLeft: 2, fontSize: 10 }}>
                          Not Uploaded
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      const finalUrl =
                        docUrl ||
                        DEFAULT_DOC_SAMPLES[docSpec.type] ||
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop';
                      setInspectDocImage({ title: docSpec.title, url: finalUrl, type: docSpec.type });
                    }}
                    style={styles.viewDocBtnOutline}
                  >
                    <Icon name="remove-red-eye" size={14} color="#059669" />
                    <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 6, fontSize: 11 }}>
                      View Document
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Card>

        {/* 6. Vehicle Details Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="directions-car" size={22} color="#FFFFFF" />
            </View>

            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 10, flex: 1, fontSize: 15 }}>
              Vehicle Details
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setEditVehicle(!editVehicle)} style={styles.editBtnCircle}>
              <Icon name={editVehicle ? 'close' : 'edit'} size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {editVehicle ? (
            <View style={{ gap: 12, marginTop: 14 }}>
              <TextInput label="Vehicle Type" placeholder="SCOOTER / BIKE" value={vehicleType} onChangeText={(val) => setVehicleType(val.toUpperCase() as any)} />
              <TextInput
                label="Plate Number"
                placeholder="e.g. MH02CB1234"
                value={vehicleNumber}
                onChangeText={(val) => {
                  const upper = val.toUpperCase();
                  setVehicleNumber(upper);
                  if (vehicleNumberError) setVehicleNumberError(validateVehiclePlateNumber(upper).error || '');
                }}
                error={vehicleNumberError}
                autoCapitalize="characters"
                maxLength={12}
              />
              <Button label="Save Vehicle Details" onPress={handleSaveVehicle} loading={saving} variant="primary" size="sm" style={{ backgroundColor: '#059669' }} />
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 110, fontSize: 11 }}>
                  Vehicle Type:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {vehicle?.vehicle_type || 'SCOOTER'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 110, fontSize: 11 }}>
                  Plate Number:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {vehicle?.vehicle_number || 'Not Configured'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 110, fontSize: 11 }}>
                  Verification status:
                </Text>
                <View
                  style={[
                    styles.pendingBadgePill,
                    (vehicle?.status || 'PENDING') === 'APPROVED'
                      ? { backgroundColor: '#ECFDF5' }
                      : (vehicle?.status || 'PENDING') === 'REJECTED'
                      ? { backgroundColor: '#FEE2E2' }
                      : { backgroundColor: '#FEF3C7' },
                  ]}
                >
                  <Text
                    variant="caption"
                    weight="extrabold"
                    style={{
                      color:
                        (vehicle?.status || 'PENDING') === 'APPROVED'
                          ? '#059669'
                          : (vehicle?.status || 'PENDING') === 'REJECTED'
                          ? '#EF4444'
                          : '#D97706',
                      fontSize: 10,
                    }}
                  >
                    {vehicle?.status || 'PENDING'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* 7. Bank & Payouts Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="account-balance" size={22} color="#FFFFFF" />
            </View>

            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 10, flex: 1, fontSize: 15 }}>
              Bank & Payouts
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setEditBank(!editBank)} style={styles.editBtnCircle}>
              <Icon name={editBank ? 'close' : 'edit'} size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {editBank ? (
            <View style={{ gap: 12, marginTop: 14 }}>
              <TextInput
                label="Bank Name"
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChangeText={(val) => {
                  setBankName(val);
                  if (bankNameError) setBankNameError(validateBankName(val).error || '');
                }}
                error={bankNameError}
              />
              <TextInput
                label="Account Number"
                placeholder="e.g. 918237192837"
                value={accountNumber}
                onChangeText={(val) => {
                  setAccountNumber(val);
                  if (accountNumberError) setAccountNumberError(validateAccountNumber(val).error || '');
                }}
                error={accountNumberError}
                keyboardType="number-pad"
                maxLength={18}
              />
              <TextInput
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChangeText={(val) => {
                  const upper = val.toUpperCase();
                  setIfscCode(upper);
                  if (ifscCodeError) setIfscCodeError(validateIfscCode(upper).error || '');
                }}
                error={ifscCodeError}
                autoCapitalize="characters"
                maxLength={11}
              />
              <Button label="Save Bank Details" onPress={handleSaveBank} loading={saving} variant="primary" size="sm" style={{ backgroundColor: '#059669' }} />
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 90, fontSize: 11 }}>
                  Bank Name:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {bank?.bank_name || 'HDFC Bank'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 90, fontSize: 11 }}>
                  Account No:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {bank?.account_number ? `******${bank.account_number.slice(-4)}` : '******2837'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 90, fontSize: 11 }}>
                  IFSC:
                </Text>
                <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
                  {bank?.ifsc_code || 'HDFC0001234'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text variant="caption" style={{ color: '#64748B', width: 90, fontSize: 11 }}>
                  Bank status:
                </Text>
                <View style={styles.pendingBadgePill}>
                  <Text variant="caption" weight="extrabold" style={{ color: '#D97706', fontSize: 10 }}>
                    PENDING
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* 7.5 App Theme Preferences Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleDarkGreen}>
              <Icon name="palette" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="sm" weight="extrabold" style={{ color: colors.text, fontSize: 15 }}>
                Appearance & Theme Mode
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                Choose between Light, Auto (System), or Dark mode
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <ThemeSelector variant="card" />
          </View>
        </Card>

        {/* 8. Security Settings Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginBottom: 12, fontSize: 15 }}>
            Security Settings
          </Text>

          <View style={styles.toggleRow}>
            <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
              Enable Biometric Login
            </Text>
            <Switch value={biometricsEnabled} onValueChange={handleToggleBiometrics} />
          </View>

          <View style={[styles.toggleRow, { marginTop: 12 }]}>
            <Text variant="xs" weight="extrabold" style={{ color: '#0F172A' }}>
              Enable Security App Lock
            </Text>
            <Switch value={appLockEnabled} onValueChange={setAppLockEnabled} />
          </View>
        </Card>

        {/* 9. Play Store Account & Profile Deletion Card */}
        <Card variant="flat" style={[styles.sectionCard, { marginTop: 14, borderRadius: 20, backgroundColor: colors.surface, borderColor: '#FCA5A5', borderWidth: 1, padding: 16, ...shadows.xs }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircleDarkGreen, { backgroundColor: '#DC2626' }]}>
              <Icon name="delete-forever" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="sm" weight="extrabold" style={{ color: '#DC2626', fontSize: 15 }}>
                Delete Account & Profile Data
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                Google Play Policy • Permanent Data Removal & Anonymization
              </Text>
            </View>
          </View>

          <Text variant="caption" color="secondary" style={{ fontSize: 11, marginVertical: 10, lineHeight: 16 }}>
            In accordance with Google Play Developer Policy, you can request permanent deletion of your partner profile, personal information, KYC uploads, and vehicle registration records.
          </Text>

          <Button
            label="Request Permanent Account Deletion"
            onPress={handleDeleteAccount}
            variant="outline"
            size="sm"
            style={{ borderColor: '#DC2626', borderRadius: 12 }}
            labelStyle={{ color: '#DC2626', fontWeight: 'bold', fontSize: 12 }}
          />
        </Card>

        {/* Logout Account Button */}
        <View style={{ marginTop: 20 }}>
          <Button
            label="Log Out Account"
            onPress={async () => {
              await logout();
              showToast('Logged out successfully', 'info');
              router.replace('/(auth)/login');
            }}
            variant="outline"
            size="md"
            leftIcon="logout"
            style={{ borderColor: '#EF4444', borderRadius: 16 }}
            labelStyle={{ color: '#EF4444' }}
          />
        </View>
      </ScrollView>

      {/* Avatar Image Preview & Upload Modal */}
      <Modal visible={avatarModalVisible} onClose={() => !avatarUploading && setAvatarModalVisible(false)}>
        <View style={styles.avatarModalContent}>
          <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A', marginBottom: 12 }}>
            Preview Avatar Photo
          </Text>

          {avatarPreviewUri ? (
            <Image
              source={{ uri: avatarPreviewUri }}
              style={styles.avatarPreviewImage}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.avatarModalActions}>
            <Button
              label="Cancel"
              onPress={() => setAvatarModalVisible(false)}
              variant="outline"
              size="md"
              disabled={avatarUploading}
              style={{ flex: 1 }}
            />
            <Button
              label={avatarUploading ? 'Uploading...' : 'Upload Photo'}
              onPress={handleConfirmAvatarUpload}
              variant="primary"
              size="md"
              loading={avatarUploading}
              disabled={avatarUploading}
              style={{ flex: 1, backgroundColor: '#0B4F3A' }}
            />
          </View>
        </View>
      </Modal>

      {/* Document Image Inspection Modal */}
      {inspectDocImage && (
        <Modal visible={!!inspectDocImage} onClose={() => setInspectDocImage(null)}>
          <View style={styles.modalInspectContent}>
            <Text variant="md" weight="extrabold" style={{ color: '#0B4F3A', marginBottom: 12 }}>
              {inspectDocImage.title}
            </Text>
            <Image
              source={{ uri: inspectDocImage.url }}
              style={styles.fullInspectImage}
              resizeMode="contain"
              onError={() => {
                const fallback = (inspectDocImage.type && DEFAULT_DOC_SAMPLES[inspectDocImage.type]) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop';
                if (inspectDocImage.url !== fallback) {
                  setInspectDocImage({ ...inspectDocImage, url: fallback });
                }
              }}
            />
            <Button label="Close Preview" onPress={() => setInspectDocImage(null)} variant="outline" size="md" style={{ marginTop: 16, width: '100%' }} />
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

function IconButton({ name, onPress }: any) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ padding: 4 }}>
      <Icon name={name} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    alignItems: 'center',
    width: '100%',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#F0FDF4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  skyLineH: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#DCFCE7',
  },
  treeCircleLeft: {
    position: 'absolute',
    left: 16,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
  },
  treeCircleRight: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
  },
  avatarTouchable: {
    position: 'relative',
    marginTop: 14,
    marginBottom: 4,
  },
  avatarCircleBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  sectionCard: {
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleDarkGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B4F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  iconCircleLightGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  crmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buildingGraphicCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDocBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  pendingBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarModalContent: {
    alignItems: 'center',
    width: '100%',
    padding: 8,
  },
  avatarPreviewImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#0B4F3A',
    marginVertical: 16,
  },
  avatarModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
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
