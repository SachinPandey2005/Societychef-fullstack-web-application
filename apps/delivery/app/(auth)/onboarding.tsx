import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { usePartnerStore } from '../../store/usePartnerStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useBankStore } from '../../store/useBankStore';
import { useKYCStore } from '../../store/useKYCStore';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileToStorage } from '../../services/storage.service';
import {
  validateVehiclePlateNumber,
  validateAccountHolderName,
  validateBankName,
  validateAccountNumber,
  validateIfscCode,
  validateUpiId,
} from '../../utils/validation';

type Step = 
  | 'WELCOME' 
  | 'PERSONAL' 
  | 'ADDRESS' 
  | 'DOCUMENTS' 
  | 'VEHICLE' 
  | 'BANK' 
  | 'EMERGENCY' 
  | 'TERMS';

const STEPS_ORDER: Step[] = [
  'WELCOME', 
  'PERSONAL', 
  'ADDRESS', 
  'DOCUMENTS', 
  'VEHICLE', 
  'BANK', 
  'EMERGENCY', 
  'TERMS'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const { loadProfile, updateProfile } = usePartnerStore();
  const { uploadDocument, uploadSelfie } = useDocumentStore();
  const { updateVehicle } = useVehicleStore();
  const { updateBank } = useBankStore();
  const { submitKyc } = useKYCStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS_ORDER[currentStepIndex];

  const [documentDetails, setDocumentDetails] = useState<Record<string, { status: string; rejection_reason?: string }>>({});

  useEffect(() => {
    loadProfile().then(data => {
      if (data.profile) {
        setName(data.profile.name || '');
        setEmail(data.profile.email || '');
      }
      if (data.partner) {
        setGender(data.partner.gender || 'Male');
        setDob(data.partner.date_of_birth || '1995-01-01');
        setBloodGroup(data.partner.blood_group || 'O+');
        setLanguage(data.partner.preferred_language || 'English');
        
        setCurrentAddress(data.partner.current_address || '');
        setPermanentAddress(data.partner.permanent_address || '');
        setCity(data.partner.city || '');
        setState(data.partner.state || '');
        setPincode(data.partner.pincode || '');
        setLandmark(data.partner.landmark || '');
      }
      if (data.documents) {
        const detailsMap: Record<string, { status: string; rejection_reason?: string }> = {};
        data.documents.forEach((d: any) => {
          detailsMap[d.document_type] = { status: d.status, rejection_reason: d.rejection_reason };
        });
        setDocumentDetails(detailsMap);

        const aadhaarFrontDoc = data.documents.find(d => d.document_type === 'aadhaar_front');
        if (aadhaarFrontDoc) setAadhaarFront(aadhaarFrontDoc.document_url);
        const aadhaarBackDoc = data.documents.find(d => d.document_type === 'aadhaar_back');
        if (aadhaarBackDoc) setAadhaarBack(aadhaarBackDoc.document_url);
        const panCardDoc = data.documents.find(d => d.document_type === 'pan_card');
        if (panCardDoc) setPanCard(panCardDoc.document_url);
        const licenseFrontDoc = data.documents.find(d => d.document_type === 'license_front');
        if (licenseFrontDoc) setLicenseFront(licenseFrontDoc.document_url);
        const licenseBackDoc = data.documents.find(d => d.document_type === 'license_back');
        if (licenseBackDoc) setLicenseBack(licenseBackDoc.document_url);
        const selfieDoc = data.documents.find(d => d.document_type === 'selfie');
        if (selfieDoc) setSelfie(selfieDoc.document_url);
      }
      if (data.vehicle) {
        setVehicleType(data.vehicle.vehicle_type as any || 'SCOOTER');
        setVehicleNumber(data.vehicle.vehicle_number || '');
        setRcUrl(data.vehicle.rc_url || '');
        setInsuranceUrl(data.vehicle.insurance_url || '');
        setPucUrl(data.vehicle.puc_url || '');
      }
      if (data.bank) {
        setHolderName(data.bank.holder_name || '');
        setBankName(data.bank.bank_name || '');
        setAccountNumber(data.bank.account_number || '');
        setIfscCode(data.bank.ifsc_code || '');
        setUpiId(data.bank.upi_id || '');
        setChequeUrl(data.bank.cheque_url || '');
      }
      if (data.emergencyContact) {
        setPrimaryName(data.emergencyContact.primary_name || '');
        setPrimaryPhone(data.emergencyContact.primary_phone || '');
        setPrimaryRelationship(data.emergencyContact.primary_relationship || '');
        setSecondaryName(data.emergencyContact.secondary_name || '');
        setSecondaryPhone(data.emergencyContact.secondary_phone || '');
        setSecondaryRelationship(data.emergencyContact.secondary_relationship || '');
      }
    }).catch(err => {
      console.warn('Failed to load profile for onboarding screen:', err);
      if (err?.message?.includes('expired') || err?.message?.includes('Unauthorized')) {
        showToast('Session expired. Redirecting to login...', 'error');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } else {
        showToast(err?.message || 'Could not load existing onboarding profile', 'info');
      }
    });
  }, []);

  // Forms states
  // Step 2: Personal
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('1995-01-01');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [language, setLanguage] = useState('English');

  // Step 3: Address
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  // Step 4: Documents (Simulated upload URLs)
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [panCard, setPanCard] = useState('');
  const [licenseFront, setLicenseFront] = useState('');
  const [licenseBack, setLicenseBack] = useState('');
  const [selfie, setSelfie] = useState('');

  // Step 5: Vehicle
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV' | 'WALKING'>('SCOOTER');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rcUrl, setRcUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');
  const [pucUrl, setPucUrl] = useState('');

  // Step 6: Bank details
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [chequeUrl, setChequeUrl] = useState('');

  // Step 7: Emergency Contacts
  const [primaryName, setPrimaryName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryRelationship, setPrimaryRelationship] = useState('');
  const [secondaryName, setSecondaryName] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryRelationship, setSecondaryRelationship] = useState('');

  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    // Validation & API Calls per step
    switch (currentStep) {
      case 'WELCOME':
        setCurrentStepIndex(currentStepIndex + 1);
        break;

      case 'PERSONAL':
        if (!name.trim() || !email.trim()) {
          showToast('Please fill required name and email details', 'error');
          return;
        }
        if (!email.includes('@')) {
          showToast('Enter a valid email address', 'error');
          return;
        }
        setLoading(true);
        try {
          await updateProfile({
            name,
            email,
            gender: gender || 'Male',
            date_of_birth: dob || '1995-01-01',
            blood_group: bloodGroup || 'O+',
            preferred_language: language || 'English',
          });
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e?.message || 'Failed to save personal profile', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'ADDRESS':
        if (!permanentAddress.trim() || !currentAddress.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
          showToast('Please fill in complete address details or skip for now', 'error');
          return;
        }
        if (pincode.length !== 6) {
          showToast('PIN code must be exactly 6 digits', 'error');
          return;
        }
        setLoading(true);
        try {
          await updateProfile({
            permanent_address: permanentAddress,
            current_address: currentAddress,
            city,
            state,
            pincode,
            landmark: landmark || undefined,
          });
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e?.message || 'Failed to save address details', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'DOCUMENTS':
        if (!aadhaarFront || !aadhaarBack || !panCard || !licenseFront || !licenseBack || !selfie) {
          showToast('Please upload all identity documents to complete verification now, or tap Complete Later.', 'error');
          return;
        }
        setLoading(true);
        try {
          await Promise.all([
            uploadDocument('aadhaar_front', aadhaarFront, undefined, true),
            uploadDocument('aadhaar_back', aadhaarBack, undefined, true),
            uploadDocument('pan_card', panCard, undefined, true),
            uploadDocument('license_front', licenseFront, undefined, true),
            uploadDocument('license_back', licenseBack, undefined, true),
            uploadSelfie(selfie, true),
          ]);
          await loadProfile();
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e?.message || 'Failed to submit documents', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'VEHICLE':
        // Optional logic: if they choose WALKING or leave everything blank, allow progression without saving
        if (vehicleType === 'WALKING' || (!vehicleNumber.trim() && !rcUrl && !insuranceUrl)) {
          setCurrentStepIndex(currentStepIndex + 1);
          break;
        }
        if (!vehicleNumber.trim() || !rcUrl || !insuranceUrl) {
          showToast('Please provide vehicle plate number, RC and Insurance documents, or skip this step.', 'error');
          return;
        }
        const plateRes = validateVehiclePlateNumber(vehicleNumber);
        if (!plateRes.isValid) {
          showToast(plateRes.error || 'Invalid vehicle plate number format', 'error');
          return;
        }
        setLoading(true);
        try {
          await updateVehicle({
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber.replace(/[\s-]/g, '').toUpperCase(),
            rc_url: rcUrl,
            insurance_url: insuranceUrl,
            puc_url: pucUrl || undefined,
          });
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e.message || 'Failed to update vehicle information', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'BANK':
        if (!holderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !chequeUrl) {
          showToast('Please fill complete bank account details', 'error');
          return;
        }
        const nameRes = validateAccountHolderName(holderName);
        const bankRes = validateBankName(bankName);
        const accRes = validateAccountNumber(accountNumber);
        const ifscRes = validateIfscCode(ifscCode);
        const upiRes = validateUpiId(upiId);

        if (!nameRes.isValid || !bankRes.isValid || !accRes.isValid || !ifscRes.isValid || !upiRes.isValid) {
          const firstErr = nameRes.error || bankRes.error || accRes.error || ifscRes.error || upiRes.error;
          showToast(firstErr || 'Please provide valid bank details', 'error');
          return;
        }
        setLoading(true);
        try {
          await updateBank({
            holder_name: holderName.trim(),
            bank_name: bankName.trim(),
            account_number: accountNumber.replace(/\s/g, ''),
            ifsc_code: ifscCode.trim().toUpperCase(),
            upi_id: upiId ? upiId.trim().toLowerCase() : undefined,
            cheque_url: chequeUrl,
          });
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e.message || 'Failed to save bank information', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'EMERGENCY':
        if (!primaryName.trim() || !primaryPhone.trim() || !primaryRelationship.trim()) {
          showToast('Please fill primary emergency contact details', 'error');
          return;
        }
        setLoading(true);
        try {
          await updateProfile({
            name: name || undefined,
            email: email || undefined,
            gender: gender || undefined,
            date_of_birth: dob || undefined,
            blood_group: bloodGroup || undefined,
            preferred_language: language || undefined,
            permanent_address: permanentAddress || undefined,
            current_address: currentAddress || undefined,
            city: city || undefined,
            state: state || undefined,
            pincode: pincode || undefined,
            landmark: landmark || undefined,
            primary_name: primaryName,
            primary_phone: primaryPhone,
            primary_relationship: primaryRelationship,
            secondary_name: secondaryName || undefined,
            secondary_phone: secondaryPhone || undefined,
            secondary_relationship: secondaryRelationship || undefined,
          });
          setCurrentStepIndex(currentStepIndex + 1);
        } catch (e: any) {
          showToast(e.message || 'Failed to save emergency contact info', 'error');
        } finally {
          setLoading(false);
        }
        break;

      case 'TERMS':
        setLoading(true);
        try {
          await submitKyc();
          showToast('KYC application submitted for review', 'success');
          router.replace('/(auth)/register');
        } catch (e: any) {
          showToast(e.message || 'Submission failed', 'error');
        } finally {
          setLoading(false);
        }
        break;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const renderDocStatus = (docType: string, label: string, value: string, setter: (url: string) => void) => {
    const details = documentDetails[docType];
    const status = details?.status || 'PENDING';
    const reason = details?.rejection_reason;

    let statusText = '';
    let statusColor = colors.textSecondary;
    let buttonLabel = value ? 'Uploaded' : 'Upload File';
    let buttonVariant: 'primary' | 'outline' = value ? 'outline' : 'primary';

    if (value) {
      if (status === 'APPROVED') {
        statusText = '✓ Approved & Verified';
        statusColor = '#146b4b';
        buttonLabel = 'Verified';
        buttonVariant = 'outline';
      } else if (status === 'REJECTED') {
        statusText = `✗ Rejected: ${reason || 'Invalid file'}`;
        statusColor = colors.danger || '#c94737';
        buttonLabel = 'Upload Again';
        buttonVariant = 'primary';
      } else {
        statusText = '⏳ Pending Review';
        statusColor = '#d99825';
      }
    }

    return (
      <View style={{ marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="sm" weight="semibold">{label}</Text>
          <Button
            label={buttonLabel}
            size="sm"
            variant={buttonVariant}
            onPress={() => handleUpload(label, 'partner-documents', setter)}
            disabled={status === 'APPROVED'}
            style={status === 'APPROVED' ? { opacity: 0.7 } : undefined}
          />
        </View>
        {statusText ? (
          <Text variant="xs" style={{ color: statusColor, fontWeight: 'bold', marginTop: 4 }}>
            {statusText}
          </Text>
        ) : null}
      </View>
    );
  };

  // Real document uploader helpers
  const handleUpload = async (docName: string, bucketName: string, setter: (val: string) => void) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Permission to access camera roll is required!', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      setLoading(true);

      const uploadedUrl = await uploadFileToStorage(
        bucketName,
        'onboarding',
        selectedAsset.uri,
        selectedAsset.fileName || `${docName.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );

      setter(uploadedUrl);
      showToast(`${docName} uploaded successfully!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to upload document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPick = async (docName: string, bucketName: string, setter: (val: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      setLoading(true);

      const uploadedUrl = await uploadFileToStorage(
        bucketName,
        'onboarding',
        selectedAsset.uri,
        selectedAsset.name || `${docName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      );

      setter(uploadedUrl);
      showToast(`${docName} uploaded successfully!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to upload document', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.stepperHeader, { borderBottomColor: colors.border }]}>
        <IconButton
          name="arrow-back"
          onPress={handleBack}
          disabled={currentStepIndex === 0}
          accessibilityLabel="Back stepper"
        />
        <Text variant="sm" weight="bold">
          Step {currentStepIndex + 1} of {STEPS_ORDER.length}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { padding: spacing.md }]}>
        
        {/* Welcome Screen */}
        {currentStep === 'WELCOME' && (
          <View style={styles.centerCol}>
            <Icon name="delivery-dining" size={80} color={colors.primary} />
            <Text variant="h2" weight="extrabold" align="center" style={{ marginTop: spacing.md }}>
              Onboarding Journey
            </Text>
            <Text variant="sm" color="secondary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.lg }}>
              Become a verified RasoHi Delivery Partner. Complete your registration details in 7 simple steps to start receiving order payouts.
            </Text>
            <Button
              label="Begin Onboarding"
              onPress={handleNext}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.xl, width: '100%', maxWidth: 300 }}
              rightIcon="arrow-forward"
            />
          </View>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 'PERSONAL' && (
          <View>
            <Text variant="h3" weight="bold" style={styles.stepTitle}>
              Personal Information
            </Text>
            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.md }}>
              <TextInput label="Full Name" placeholder="Rajesh Kumar" value={name} onChangeText={setName} leftIcon="person" />
              <TextInput label="Email Address" placeholder="rajesh@gmail.com" value={email} onChangeText={setEmail} leftIcon="email" keyboardType="email-address" />
              <TextInput label="Gender" placeholder="Male / Female / Other" value={gender} onChangeText={setGender} leftIcon="people" />
              <TextInput label="Date of Birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} leftIcon="today" />
              <TextInput label="Blood Group" placeholder="O+ / A- / B+" value={bloodGroup} onChangeText={setBloodGroup} leftIcon="favorite" />
              <TextInput label="Preferred Language" placeholder="English / Hindi" value={language} onChangeText={setLanguage} leftIcon="language" />
            </Card>
            <Button label="Next Step" onPress={handleNext} variant="primary" size="lg" style={{ marginTop: spacing.lg }} rightIcon="arrow-forward" />
          </View>
        )}

        {/* Step 3: Address details */}
        {currentStep === 'ADDRESS' && (
          <View>
            <Text variant="h3" weight="bold" style={styles.stepTitle}>
              Address Information
            </Text>
            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.md }}>
              <TextInput label="Current Address" placeholder="Flat 101, building name..." value={currentAddress} onChangeText={setCurrentAddress} leftIcon="home" />
              <TextInput label="Permanent Address" placeholder="Same or original home address..." value={permanentAddress} onChangeText={setPermanentAddress} leftIcon="home" />
              <TextInput label="City" placeholder="Bangalore" value={city} onChangeText={setCity} leftIcon="location-city" />
              <TextInput label="State" placeholder="Karnataka" value={state} onChangeText={setState} leftIcon="map" />
              <TextInput label="Pincode" placeholder="560001" value={pincode} onChangeText={setPincode} leftIcon="pin" keyboardType="number-pad" maxLength={6} />
              <TextInput label="Landmark (Optional)" placeholder="Near central park" value={landmark} onChangeText={setLandmark} leftIcon="flag" />
            </Card>
            <Button label="Next Step" onPress={handleNext} variant="primary" size="lg" style={{ marginTop: spacing.lg }} rightIcon="arrow-forward" />
          </View>
        )}

        {/* Step 4: Documents Uploads */}
        {currentStep === 'DOCUMENTS' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text variant="h3" weight="bold" style={styles.stepTitle}>
                Identity Verification Documents
              </Text>
              <View style={{ backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.small }}>
                <Text variant="caption" weight="bold" color="secondary">Optional — Complete Later</Text>
              </View>
            </View>
            
            <Text variant="xs" color="secondary" style={{ marginBottom: spacing.md }}>
              Upload your identity documents to complete KYC verification now, or tap Complete Later to finish setup from your profile anytime.
            </Text>

            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.sm }}>
              {renderDocStatus('aadhaar_front', 'Aadhaar Front Card', aadhaarFront, setAadhaarFront)}
              {renderDocStatus('aadhaar_back', 'Aadhaar Back Card', aadhaarBack, setAadhaarBack)}
              {renderDocStatus('pan_card', 'PAN Card Details', panCard, setPanCard)}
              {renderDocStatus('license_front', 'Driving License Front', licenseFront, setLicenseFront)}
              {renderDocStatus('license_back', 'Driving License Back', licenseBack, setLicenseBack)}
              {renderDocStatus('selfie', 'Selfie Face Verification', selfie, setSelfie)}
            </Card>

            <Button label="Complete Now" onPress={handleNext} loading={loading} variant="primary" size="lg" style={{ marginTop: spacing.lg }} rightIcon="arrow-forward" />
            <Button label="Complete Later" onPress={() => setCurrentStepIndex(currentStepIndex + 1)} variant="outline" size="md" style={{ marginTop: spacing.sm }} leftIcon="schedule" />
          </View>
        )}

        {/* Step 5: Vehicle Details */}
        {currentStep === 'VEHICLE' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text variant="h3" weight="bold" style={styles.stepTitle}>
                Vehicle Details
              </Text>
              <View style={{ backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.small }}>
                <Text variant="caption" weight="bold" color="secondary">Optional — Complete Later</Text>
              </View>
            </View>
            
            <Text variant="xs" color="secondary" style={{ marginBottom: spacing.md }}>
              If you deliver using a motor vehicle, please register it here. Otherwise, you can complete later from your profile.
            </Text>

            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.md, marginBottom: spacing.md }}>
              <TextInput 
                label="Vehicle Type (BIKE / SCOOTER / EV / WALKING)" 
                placeholder="SCOOTER" 
                value={vehicleType} 
                onChangeText={(val) => setVehicleType(val.toUpperCase() as any)} 
                leftIcon="delivery-dining" 
              />
              
              {vehicleType !== 'WALKING' && (
                <View style={{ gap: spacing.md, marginTop: spacing.xs }}>
                  <TextInput 
                    label="Vehicle Plate Number" 
                    placeholder="KA-03-HA-8822" 
                    value={vehicleNumber} 
                    onChangeText={setVehicleNumber} 
                    leftIcon="card-membership" 
                  />
                  
                  <View style={styles.docRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="xs" weight="semibold">Vehicle RC Document</Text>
                      <Text variant="caption" color="muted">Registration Certificate</Text>
                    </View>
                    <Button 
                      label={rcUrl ? "Uploaded" : "Upload RC"} 
                      size="sm" 
                      variant={rcUrl ? "outline" : "primary"} 
                      onPress={() => handleDocumentPick('Vehicle RC', 'vehicle-documents', setRcUrl)} 
                    />
                  </View>
                  
                  <View style={styles.docRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="xs" weight="semibold">Vehicle Insurance Policy</Text>
                      <Text variant="caption" color="muted">Active insurance plan</Text>
                    </View>
                    <Button 
                      label={insuranceUrl ? "Uploaded" : "Upload Policy"} 
                      size="sm" 
                      variant={insuranceUrl ? "outline" : "primary"} 
                      onPress={() => handleDocumentPick('Vehicle Insurance', 'vehicle-documents', setInsuranceUrl)} 
                    />
                  </View>
                  
                  <View style={styles.docRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="xs" weight="semibold">Vehicle PUC Certificate</Text>
                      <Text variant="caption" color="muted">Emission compliance test</Text>
                    </View>
                    <Button 
                      label={pucUrl ? "Uploaded" : "Upload PUC"} 
                      size="sm" 
                      variant={pucUrl ? "outline" : "primary"} 
                      onPress={() => handleDocumentPick('Vehicle PUC', 'vehicle-documents', setPucUrl)} 
                    />
                  </View>
                </View>
              )}
            </Card>

            <Button 
              label="Complete Now" 
              onPress={handleNext} 
              loading={loading} 
              variant="primary" 
              size="lg" 
              rightIcon="arrow-forward" 
            />
            <Button 
              label="Complete Later" 
              onPress={() => setCurrentStepIndex(currentStepIndex + 1)} 
              variant="outline" 
              size="md" 
              style={{ marginTop: spacing.sm }} 
              leftIcon="schedule"
            />
          </View>
        )}

        {/* Step 6: Bank details */}
        {currentStep === 'BANK' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text variant="h3" weight="bold" style={styles.stepTitle}>
                Bank & Payout Details
              </Text>
              <View style={{ backgroundColor: colors.surfaceContainer, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.small }}>
                <Text variant="caption" weight="bold" color="secondary">Optional — Complete Later</Text>
              </View>
            </View>

            <Text variant="xs" color="secondary" style={{ marginBottom: spacing.md }}>
              Add your bank account details for rider payout settlements, or complete later from your profile.
            </Text>

            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.md }}>
              <TextInput label="Account Holder Name" placeholder="Rajesh Kumar" value={holderName} onChangeText={setHolderName} leftIcon="person" />
              <TextInput label="Bank Name" placeholder="State Bank of India" value={bankName} onChangeText={setBankName} leftIcon="account-balance" />
              <TextInput label="Account Number" placeholder="3081827828" value={accountNumber} onChangeText={setAccountNumber} leftIcon="credit-card" keyboardType="number-pad" />
              <TextInput label="IFSC Code" placeholder="SBIN0004561" value={ifscCode} onChangeText={setIfscCode} leftIcon="vpn-key" autoCapitalize="characters" />
              <TextInput label="UPI ID (Optional)" placeholder="rajesh@okaxis" value={upiId} onChangeText={setUpiId} leftIcon="payment" />
              <View style={styles.docRow}>
                <Text variant="xs" weight="semibold" style={{ flex: 1 }}>Cancelled Cheque / Passbook Image</Text>
                <Button label={chequeUrl ? "Uploaded" : "Upload Check"} size="sm" variant={chequeUrl ? "outline" : "primary"} onPress={() => handleDocumentPick('Cancelled Cheque', 'kyc-documents', setChequeUrl)} />
              </View>
            </Card>
            <Button label="Complete Now" onPress={handleNext} loading={loading} variant="primary" size="lg" style={{ marginTop: spacing.lg }} rightIcon="arrow-forward" />
            <Button label="Complete Later" onPress={() => setCurrentStepIndex(currentStepIndex + 1)} variant="outline" size="md" style={{ marginTop: spacing.sm }} leftIcon="schedule" />
          </View>
        )}

        {/* Step 7: Emergency Contacts */}
        {currentStep === 'EMERGENCY' && (
          <View>
            <Text variant="h3" weight="bold" style={styles.stepTitle}>
              Emergency Contacts
            </Text>
            <Card variant="flat" style={{ padding: spacing.md, gap: spacing.md }}>
              <Text variant="xs" weight="bold" color="primary">Primary Emergency Contact</Text>
              <TextInput label="Full Name" placeholder="Suresh Kumar" value={primaryName} onChangeText={setPrimaryName} leftIcon="person" />
              <TextInput label="Phone Number" placeholder="+919876543210" value={primaryPhone} onChangeText={setPrimaryPhone} leftIcon="phone" keyboardType="phone-pad" />
              <TextInput label="Relationship" placeholder="Brother / Spouse" value={primaryRelationship} onChangeText={setPrimaryRelationship} leftIcon="people" />

              <Text variant="xs" weight="bold" color="primary" style={{ marginTop: spacing.sm }}>Secondary Emergency Contact (Optional)</Text>
              <TextInput label="Full Name" placeholder="Ramesh Kumar" value={secondaryName} onChangeText={setSecondaryName} leftIcon="person" />
              <TextInput label="Phone Number" placeholder="+918765432109" value={secondaryPhone} onChangeText={setSecondaryPhone} leftIcon="phone" keyboardType="phone-pad" />
              <TextInput label="Relationship" placeholder="Father" value={secondaryRelationship} onChangeText={setSecondaryRelationship} leftIcon="people" />
            </Card>
            <Button label="Complete Now" onPress={handleNext} loading={loading} variant="primary" size="lg" style={{ marginTop: spacing.lg }} rightIcon="arrow-forward" />
            <Button label="Complete Later" onPress={() => setCurrentStepIndex(currentStepIndex + 1)} variant="outline" size="md" style={{ marginTop: spacing.sm }} leftIcon="schedule" />
          </View>
        )}

        {/* Step 8: Terms & Conditions and submission */}
        {currentStep === 'TERMS' && (
          <View style={styles.centerCol}>
            <Icon name="gavel" size={60} color={colors.primary} />
            <Text variant="h3" weight="bold" style={{ marginTop: spacing.md }}>
              Terms & Conditions
            </Text>
            <Card variant="outlined" style={{ padding: spacing.md, height: 180, marginVertical: spacing.md }}>
              <ScrollView>
                <Text variant="caption" color="secondary">
                  By clicking submit, you confirm that all KYC documents and details uploaded (Aadhaar, PAN, Driving License, Bank accounts, vehicle registration) are legally valid. Duplicate registrations or upload of fake identities will result in account suspension and blacklisting on CRM dispatch networks.
                </Text>
              </ScrollView>
            </Card>
            <Button
              label="Submit KYC Verification"
              onPress={handleNext}
              loading={loading}
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              rightIcon="check"
            />
            <Button
              label="Enter Main Delivery App"
              onPress={() => router.replace('/(main)/home')}
              variant="outline"
              size="md"
              style={{ width: '100%', marginTop: spacing.sm }}
              leftIcon="home"
            />
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}

// Custom Header back-arrow button
function IconButton({ name, onPress, disabled, accessibilityLabel }: any) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        {
          opacity: disabled ? 0.3 : pressed ? 0.7 : 1,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name={name} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
  },
  iconButton: {
    padding: 8,
  },
  scroll: {
    paddingBottom: 40,
  },
  centerCol: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepTitle: {
    marginBottom: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
