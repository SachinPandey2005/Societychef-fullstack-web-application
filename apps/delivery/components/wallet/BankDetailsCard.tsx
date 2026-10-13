import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { Modal } from '../ui/Modal';
import { Icon } from '../Icon';
import { BankDetails } from '../../store/useBankStore';
import {
  validateBankName,
  validateAccountNumber,
  validateIfscCode,
  validateUpiId,
} from '../../utils/validation';

interface BankDetailsCardProps {
  bankDetails: BankDetails;
  onUpdateBankDetails: (details: Partial<BankDetails>) => Promise<void>;
}

export const BankDetailsCard: React.FC<BankDetailsCardProps> = ({ bankDetails, onUpdateBankDetails }) => {
  const { colors, radius, shadows } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [bankName, setBankName] = useState(bankDetails.bank_name);
  const [accNumber, setAccNumber] = useState(bankDetails.account_number);
  const [ifsc, setIfsc] = useState(bankDetails.ifsc_code);
  const [upiId, setUpiId] = useState(bankDetails.upi_id);
  const [isUpdating, setIsUpdating] = useState(false);

  // Field Validation Error states
  const [bankNameError, setBankNameError] = useState('');
  const [accNumberError, setAccNumberError] = useState('');
  const [ifscError, setIfscError] = useState('');
  const [upiError, setUpiError] = useState('');

  const isVerified = bankDetails.verification_status === 'VERIFIED';

  const validateAllFields = (): boolean => {
    const bankRes = validateBankName(bankName);
    const accRes = validateAccountNumber(accNumber);
    const ifscRes = validateIfscCode(ifsc);
    const upiRes = validateUpiId(upiId);

    setBankNameError(bankRes.error || '');
    setAccNumberError(accRes.error || '');
    setIfscError(ifscRes.error || '');
    setUpiError(upiRes.error || '');

    return bankRes.isValid && accRes.isValid && ifscRes.isValid && upiRes.isValid;
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateBankDetails({
        bank_name: bankName.trim(),
        account_number: accNumber.replace(/\s/g, ''),
        ifsc_code: ifsc.trim().toUpperCase(),
        upi_id: upiId ? upiId.trim().toLowerCase() : undefined,
      });
      setModalVisible(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="account-balance" size={16} color="#059669" />
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6, fontSize: 13 }}>
            Linked Bank & UPI Account
          </Text>
        </View>

        <View style={styles.verifiedBadge}>
          <Icon name="check-circle" size={12} color="#059669" />
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 3, fontSize: 10 }}>
            {isVerified ? 'VERIFIED' : bankDetails.verification_status}
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.textCol}>
          <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginTop: 8 }}>
            {bankDetails.bank_name} ({bankDetails.account_number_masked})
          </Text>
          
          <Text variant="caption" style={{ color: '#64748B', marginTop: 2, fontSize: 11 }}>
            IFSC: {bankDetails.ifsc_code} • UPI ID: {bankDetails.upi_id || 'partner@okhdfcbank'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setBankNameError('');
              setAccNumberError('');
              setIfscError('');
              setUpiError('');
              setModalVisible(true);
            }}
            style={{ marginTop: 10 }}
          >
            <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
              Edit Bank & UPI Linkage
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Graphic: Bank Illustration */}
        <View style={styles.bankGraphicCircle}>
          <Icon name="account-balance" size={32} color="#059669" />
        </View>
      </View>

      {/* Update Modal */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text variant="h3" weight="extrabold" align="center">
            Update Bank & UPI Details
          </Text>
          <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
            Payouts are deposited only to verified bank accounts.
          </Text>

          <View style={{ width: '100%', marginTop: 16 }}>
            <TextInput
              label="Bank Name"
              value={bankName}
              onChangeText={(val) => {
                setBankName(val);
                if (bankNameError) setBankNameError(validateBankName(val).error || '');
              }}
              error={bankNameError}
              placeholder="e.g. HDFC Bank"
            />
            <TextInput
              label="Account Number"
              value={accNumber}
              onChangeText={(val) => {
                setAccNumber(val);
                if (accNumberError) setAccNumberError(validateAccountNumber(val).error || '');
              }}
              error={accNumberError}
              keyboardType="number-pad"
              maxLength={18}
              placeholder="e.g. 918237192837"
            />
            <TextInput
              label="IFSC Code"
              value={ifsc}
              onChangeText={(val) => {
                const upper = val.toUpperCase();
                setIfsc(upper);
                if (ifscError) setIfscError(validateIfscCode(upper).error || '');
              }}
              error={ifscError}
              autoCapitalize="characters"
              maxLength={11}
              placeholder="e.g. HDFC0001234"
            />
            <TextInput
              label="UPI ID (Optional)"
              value={upiId}
              onChangeText={(val) => {
                setUpiId(val);
                if (upiError) setUpiError(validateUpiId(val).error || '');
              }}
              error={upiError}
              autoCapitalize="none"
              placeholder="e.g. partner@okhdfcbank"
            />
          </View>

          <View style={[styles.actionsRow, { marginTop: 16 }]}>
            <Button label="Cancel" onPress={() => setModalVisible(false)} variant="outline" size="md" style={{ flex: 1 }} />
            <Button label="Save & Submit" onPress={handleSave} loading={isUpdating} variant="primary" size="md" style={{ flex: 2, backgroundColor: '#059669' }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
    paddingRight: 10,
  },
  bankGraphicCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalContent: {
    width: '100%',
    padding: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});

export default BankDetailsCard;
