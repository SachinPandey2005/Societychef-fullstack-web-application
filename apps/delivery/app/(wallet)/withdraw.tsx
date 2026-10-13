import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { Text } from '../../components/Typography';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils';
import { useToast } from '../../components/ui/Toast';

export default function WithdrawScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const maxBalance = 680;
  const [amount, setAmount] = useState(maxBalance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProcessCashOut = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (value > maxBalance) {
      setError(`Cannot withdraw more than ${formatCurrency(maxBalance)}`);
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      showToast(`Successfully cashed out ${formatCurrency(value)} to your bank account!`, 'success');
      router.back();
    }, 1500);
  };

  return (
    <ScreenWrapper>
      <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Back button" />
        <Text variant="sm" weight="bold" style={styles.titleText}>
          Cash Out to Bank
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollableLayout contentContainerStyle={styles.scroll}>
        <Card variant="flat" style={styles.infoCard}>
          <Text variant="xs" color="secondary" align="center">
            Maximum Cash Out Balance
          </Text>
          <Text variant="xxl" weight="extrabold" align="center" color="primary" style={{ marginTop: 4 }}>
            {formatCurrency(maxBalance)}
          </Text>
        </Card>

        <View style={[styles.form, { marginTop: spacing.lg }]}>
          <TextInput
            label="Withdrawal Amount (INR)"
            value={amount}
            onChangeText={(text) => {
              setAmount(text.replace(/[^0-9]/g, ''));
              if (error) setError('');
            }}
            keyboardType="number-pad"
            leftIcon="payment"
            error={error}
          />

          <Pressable
            onPress={() => setAmount(maxBalance.toString())}
            style={styles.maxBtn}
            accessibilityRole="button"
            accessibilityLabel="Select maximum balance"
          >
            <Text variant="caption" weight="bold" color="primary">
              WITHDRAW ALL
            </Text>
          </Pressable>

          {/* Bank details card */}
          <Card variant="outlined" style={[styles.bankCard, { marginTop: spacing.md }]}>
            <View style={styles.bankRow}>
              <Icon name="account-balance" size={24} colorType="primary" />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text variant="xs" weight="semibold">
                  State Bank of India
                </Text>
                <Text variant="caption" color="secondary">
                  A/C: *******8822 | IFSC: SBIN0008081
                </Text>
              </View>
              <Icon name="check-circle" size={18} colorType="success" />
            </View>
          </Card>

          <Button
            label="Confirm Payout Transfer"
            onPress={handleProcessCashOut}
            loading={loading}
            variant="primary"
            size="lg"
            rightIcon="trending-flat"
            style={{ marginTop: spacing.xl }}
          />

          <Text variant="caption" color="muted" align="center" style={{ marginTop: spacing.md, lineHeight: 16 }}>
            * Instant cash out transfers are processed via IMPS. Settlement timing may vary depending on banking hours.
          </Text>
        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
  },
  titleText: {
    flex: 1,
    marginLeft: 8,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  infoCard: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  maxBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
    padding: 4,
  },
  bankCard: {
    width: '100%',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
