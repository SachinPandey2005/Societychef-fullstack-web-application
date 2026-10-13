import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/useThemeStore';
import apiClient from '../lib/apiClient';

export default function PaymentReturnScreen() {
  const params = useLocalSearchParams<{ order_id?: string }>();
  const Colors = useThemeStore((s) => s.colors);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING'>('PENDING');
  const [message, setMessage] = useState('Verifying payment with Cashfree...');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      const orderId = params.order_id;
      if (!orderId) {
        if (isMounted) {
          setLoading(false);
          setStatus('FAILED');
          setMessage('No order reference provided.');
        }
        return;
      }

      try {
        const res = await apiClient.post('/payments/cashfree/verify', {
          order_id: orderId,
          cf_order_id: orderId,
        });

        if (!isMounted) return;

        if (res?.data?.success) {
          setStatus('SUCCESS');
          setMessage('Your payment has been received and verified!');
          setPaymentDetails(res?.data?.payment);
        } else {
          setStatus('FAILED');
          setMessage(res?.data?.message || 'Payment could not be verified.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('FAILED');
        setMessage(err?.message || 'Failed to verify payment status.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [params.order_id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.title, { color: Colors.textPrimary, marginTop: 24 }]}>
              Verifying Payment
            </Text>
            <Text style={[styles.subtitle, { color: Colors.muted }]}>
              Please wait while we confirm your Cashfree transaction...
            </Text>
          </View>
        ) : status === 'SUCCESS' ? (
          <View style={styles.centerBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>Payment Confirmed!</Text>
            <Text style={[styles.subtitle, { color: Colors.muted }]}>
              {message}
            </Text>

            {paymentDetails?.amount && (
              <View style={[styles.amountBadge, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.amountLabel, { color: Colors.muted }]}>Amount Paid</Text>
                <Text style={[styles.amountVal, { color: Colors.primary }]}>
                  ₹{Number(paymentDetails.amount).toFixed(2)}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: Colors.primary }]}
              onPress={() => router.replace('/(consumer)/orders')}
            >
              <Text style={styles.primaryBtnText}>View My Orders</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="alert-circle" size={80} color="#ef4444" />
            </View>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>Payment Incomplete</Text>
            <Text style={[styles.subtitle, { color: Colors.muted }]}>
              {message}
            </Text>

            <View style={styles.btnRow}>
              <Pressable
                style={[styles.secondaryBtn, { borderColor: Colors.border }]}
                onPress={() => router.replace('/(consumer)/cart')}
              >
                <Text style={[styles.secondaryBtnText, { color: Colors.textPrimary }]}>Back to Cart</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.replace('/(consumer)/orders')}
              >
                <Text style={styles.primaryBtnText}>My Orders</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  amountBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    width: '80%',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
