import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../components/ui/Toast';

type DeliveryStatus = 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'AT_PICKUP' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'REACHED_CUSTOMER' | 'DELIVERED' | 'CANCELLED' | 'FAILED';

type Assignment = {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  order_code: string;
  delivery_fee: number;
  kitchen_name: string;
  kitchen_address: string;
  customer_name: string;
  customer_phone: string;
};

type Summary = {
  today_earnings: number;
  deliveries_completed_today: number;
  is_online: boolean;
  active_assignments: Assignment[];
};

// Next step in the real backend state machine (delivery.schema.ts). PICKED_UP
// and DELIVERED require the pickup/delivery OTP the chef/customer were given.
const NEXT_STEP: Partial<Record<DeliveryStatus, { status: DeliveryStatus; label: string; needsOtp?: boolean }>> = {
  ASSIGNED: { status: 'ACCEPTED', label: 'Accept delivery' },
  ACCEPTED: { status: 'AT_PICKUP', label: "I've arrived at the kitchen" },
  AT_PICKUP: { status: 'PICKED_UP', label: 'Confirm pickup', needsOtp: true },
  PICKED_UP: { status: 'OUT_FOR_DELIVERY', label: 'Start delivery' },
  OUT_FOR_DELIVERY: { status: 'REACHED_CUSTOMER', label: "I've arrived at the customer" },
  REACHED_CUSTOMER: { status: 'DELIVERED', label: 'Confirm delivery', needsOtp: true },
};

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  ASSIGNED: 'New assignment',
  ACCEPTED: 'Accepted — head to kitchen',
  REJECTED: 'Rejected',
  AT_PICKUP: 'At kitchen',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  REACHED_CUSTOMER: 'At customer',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

export default function RiderDashboardScreen() {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { showToast } = useToast();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [otpModal, setOtpModal] = useState<{ assignmentId: string; nextStatus: DeliveryStatus } | null>(null);
  const [otpValue, setOtpValue] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiClient.get('/delivery/my-summary');
      setSummary(res.data);
    } catch (err: any) {
      showToast(err?.message || 'Could not load your deliveries.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleOnline() {
    if (!summary) return;
    setTogglingOnline(true);
    const next = !summary.is_online;
    try {
      await apiClient.patch('/delivery/status', { is_online: next });
      setSummary({ ...summary, is_online: next });
    } catch (err: any) {
      showToast(err?.message || 'Could not update your status.', 'error');
    } finally {
      setTogglingOnline(false);
    }
  }

  async function advance(assignment: Assignment, otp?: string) {
    const step = NEXT_STEP[assignment.status];
    if (!step) return;
    setActingOnId(assignment.id);
    try {
      await apiClient.patch(`/delivery/assignments/${assignment.id}/status`, {
        status: step.status,
        ...(otp ? { otp } : {}),
      });
      await load();
    } catch (err: any) {
      showToast(err?.message || 'Could not update this delivery.', 'error');
    } finally {
      setActingOnId(null);
    }
  }

  function handleAdvancePress(assignment: Assignment) {
    const step = NEXT_STEP[assignment.status];
    if (!step) return;
    if (step.needsOtp) {
      setOtpValue('');
      setOtpModal({ assignmentId: assignment.id, nextStatus: step.status });
      return;
    }
    advance(assignment);
  }

  function handleOtpSubmit() {
    if (!otpModal || otpValue.trim().length !== 6) return;
    const assignment = summary?.active_assignments.find((a) => a.id === otpModal.assignmentId);
    if (!assignment) return;
    const otp = otpValue.trim();
    setOtpModal(null);
    advance(assignment, otp);
  }

  function handleReject(assignment: Assignment) {
    Alert.alert('Reject this delivery?', 'It will be reassigned to another rider.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActingOnId(assignment.id);
          try {
            await apiClient.patch(`/delivery/assignments/${assignment.id}/status`, { status: 'REJECTED' });
            await load();
          } catch (err: any) {
            showToast(err?.message || 'Could not reject this delivery.', 'error');
          } finally {
            setActingOnId(null);
          }
        },
      },
    ]);
  }

  const isOnline = summary?.is_online ?? false;
  const deliveries = summary?.active_assignments ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/landing')}>
            <Ionicons name="arrow-back" size={18} color={Colors.dark} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Delivery Partner</Text>
            <Text style={styles.headerSub}>Hyperlocal Delivery Agent</Text>
          </View>
        </View>

        <Pressable
          style={[styles.onlinePill, isOnline ? styles.onlineOn : styles.onlineOff]}
          onPress={toggleOnline}
          disabled={togglingOnline || loading}
        >
          {togglingOnline ? (
            <ActivityIndicator size="small" color={Colors.dark} />
          ) : (
            <>
              <View style={[styles.onlineDot, isOnline ? styles.dotOn : styles.dotOff]} />
              <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Earnings Card */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>₹{summary?.today_earnings ?? 0}</Text>
                <Text style={styles.statLabel}>Today's Earnings</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{summary?.deliveries_completed_today ?? 0}</Text>
                <Text style={styles.statLabel}>Deliveries Completed</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Active Delivery Tasks</Text>

            {deliveries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bicycle-outline" size={32} color={Colors.muted} />
                <Text style={styles.emptyTitle}>
                  {isOnline ? 'No active delivery tasks' : "You're offline — go online to receive deliveries"}
                </Text>
              </View>
            ) : (
              deliveries.map((item) => {
                const step = NEXT_STEP[item.status];
                const isActing = actingOnId === item.id;
                return (
                  <View key={item.id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.order_code}</Text>
                      </View>
                      <Text style={styles.payoutText}>₹{item.delivery_fee}</Text>
                    </View>

                    <View style={styles.locationRow}>
                      <Ionicons name="restaurant" size={16} color={Colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Pickup: {item.kitchen_name}</Text>
                        <Text style={styles.locationSub}>{item.kitchen_address || 'Address not set'}</Text>
                      </View>
                    </View>

                    <View style={{ paddingLeft: 6, marginVertical: 4 }}>
                      <Ionicons name="arrow-down" size={14} color={Colors.muted} />
                    </View>

                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color={Colors.gold} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Dropoff: {item.customer_name}</Text>
                        <Text style={styles.locationSub}>{item.customer_phone}</Text>
                      </View>
                    </View>

                    <View style={styles.taskFooter}>
                      <Text style={styles.statusPill}>Status: {STATUS_LABELS[item.status]}</Text>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {item.status === 'ASSIGNED' && (
                          <Pressable style={styles.rejectBtn} onPress={() => handleReject(item)} disabled={isActing}>
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </Pressable>
                        )}
                        {step && (
                          <Pressable style={styles.actionBtn} onPress={() => handleAdvancePress(item)} disabled={isActing}>
                            {isActing ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.actionBtnText}>{step.label}</Text>
                            )}
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* OTP Modal */}
      <Modal visible={!!otpModal} transparent animationType="fade" onRequestClose={() => setOtpModal(null)}>
        <View style={styles.otpOverlay}>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>
              {otpModal?.nextStatus === 'PICKED_UP' ? 'Enter pickup OTP' : 'Enter delivery OTP'}
            </Text>
            <Text style={styles.otpSub}>
              {otpModal?.nextStatus === 'PICKED_UP'
                ? 'Ask the chef for the 6-digit pickup code.'
                : 'Ask the customer for the 6-digit delivery code.'}
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otpValue}
              onChangeText={setOtpValue}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={Colors.muted}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={styles.otpCancelBtn} onPress={() => setOtpModal(null)}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.otpConfirmBtn, otpValue.trim().length !== 6 && { opacity: 0.5 }]}
                onPress={handleOtpSubmit}
                disabled={otpValue.trim().length !== 6}
              >
                <Text style={styles.otpConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(Colors: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderColor: Colors.border,
    },
    backBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: Colors.surfaceAlt,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark },
    headerSub: { fontSize: 12, color: Colors.muted },
    onlinePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      minWidth: 84,
      justifyContent: 'center',
    },
    onlineOn: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    onlineOff: { backgroundColor: Colors.surfaceAlt },
    onlineDot: { width: 8, height: 8, borderRadius: 4 },
    dotOn: { backgroundColor: '#22C55E' },
    dotOff: { backgroundColor: Colors.muted },
    onlineText: { fontSize: 12, fontWeight: '700', color: Colors.dark },
    content: { padding: 16, gap: 14 },
    statsCard: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
    },
    statCol: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 20, fontWeight: '900', color: Colors.primary },
    statLabel: { fontSize: 12, color: Colors.muted, marginTop: 2 },
    divider: { width: 1, height: 32, backgroundColor: Colors.border },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.dark, marginTop: 6 },
    emptyCard: {
      padding: 32,
      backgroundColor: Colors.surface,
      borderRadius: 16,
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    emptyTitle: { fontSize: 14, color: Colors.muted, textAlign: 'center' },
    taskCard: {
      backgroundColor: Colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 10,
    },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    payoutText: { fontSize: 16, fontWeight: '900', color: Colors.primary },
    locationRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    locationTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark },
    locationSub: { fontSize: 12, color: Colors.muted },
    taskFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderColor: Colors.border,
      paddingTop: 10,
      marginTop: 4,
      flexWrap: 'wrap',
      gap: 8,
    },
    statusPill: { fontSize: 12, fontWeight: '700', color: Colors.dark },
    actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, minWidth: 80, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    rejectBtn: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    rejectBtnText: { color: Colors.red, fontSize: 12, fontWeight: '800' },
    otpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    otpCard: { width: '100%', maxWidth: 360, backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
    otpTitle: { fontSize: 17, fontWeight: '900', color: Colors.dark, marginBottom: 6 },
    otpSub: { fontSize: 13, color: Colors.muted, marginBottom: 14 },
    otpInput: {
      borderWidth: 1.5,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: 6,
      textAlign: 'center',
      color: Colors.dark,
    },
    otpCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.surfaceAlt },
    otpCancelText: { fontSize: 14, fontWeight: '800', color: Colors.dark },
    otpConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.primary },
    otpConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  });
}
