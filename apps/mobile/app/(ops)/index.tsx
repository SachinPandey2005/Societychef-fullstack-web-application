import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { getChefOrders, subscribeToOpsOrders, subscribeToLiveDishes, updateOrderStatus } from '../../services';

type OpsTileProps = {
  title: string;
  body: string;
  statusLabel: string;
  statusTone: 'green' | 'gold' | 'blue' | 'red' | 'default';
};

function OpsTile({ title, body, statusLabel, statusTone }: OpsTileProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Card>
      <Badge label={statusLabel} tone={statusTone} small />
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileBody}>{body}</Text>
    </Card>
  );
}

export default function OpsIndex() {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getChefOrders();
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to live orders across the platform
    const unsubOrders = subscribeToOpsOrders(() => {
      loadData();
    });

    // Subscribe to live dish changes
    const unsubDishes = subscribeToLiveDishes(() => {
      loadData();
    });

    return () => {
      unsubOrders();
      unsubDishes();
    };
  }, [loadData]);

  const activeOrders = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'delivered' && o.status !== 'Cancelled' && o.status !== 'cancelled'
  );
  const totalVolume = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    await updateOrderStatus(orderId, nextStatus as any);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
      >
        {/* Header with Back Button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable
            onPress={() => router.replace('/landing')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: Colors.border,
              gap: 4,
            }}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary }}>Landing</Text>
          </Pressable>
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.red, letterSpacing: 0.5 }}>
            OPERATIONS & CRM
          </Text>
        </View>

        <ScreenTitle
          eyebrow="PILOT MANAGEMENT"
          title="Live Pilot Society Ops Dashboard"
        />

        {/* Live metrics strip */}
        <View style={styles.metricsRow}>
          <Metric value={String(activeOrders.length)} label="Active orders" />
          <Metric value={String(orders.length)} label="Total orders" />
          <Metric value={`₹${totalVolume}`} label="Live volume" />
        </View>

        {/* Real-time Order Monitoring Feed */}
        <Text style={styles.sectionLabel}>LIVE ORDER STREAM (SYNCED)</Text>
        {orders.length === 0 ? (
          <Card style={{ marginBottom: 20 }}>
            <Text style={{ color: Colors.muted, textAlign: 'center', paddingVertical: 12 }}>No live orders in pilot pipeline yet.</Text>
          </Card>
        ) : (
          <View style={{ gap: 10, marginBottom: 24 }}>
            {orders.slice(0, 5).map((ord) => (
              <Card key={ord.id} style={styles.orderCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: Colors.dark, fontWeight: '900', fontSize: 15 }}>
                      Order #{ord.id} • {ord.dish || ord.dishName}
                    </Text>
                    <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
                      {ord.customer ? `Customer: ${ord.customer} (${ord.society})` : ord.kitchenName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: Colors.primary, fontWeight: '800', fontSize: 14 }}>
                      ₹{ord.amount || ord.total}
                    </Text>
                    <Badge
                      label={ord.status}
                      tone={
                        ord.status === 'Placed' || ord.status === 'placed'
                          ? 'gold'
                          : ord.status === 'Preparing' || ord.status === 'preparing'
                          ? 'blue'
                          : ord.status === 'Delivered' || ord.status === 'delivered'
                          ? 'green'
                          : 'red'
                      }
                      small
                    />
                  </View>
                </View>

                {/* Override controls */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' }}>
                  {(ord.status === 'Placed' || ord.status === 'placed') && (
                    <Pressable
                      style={styles.actionPillBtn}
                      onPress={() => handleStatusChange(ord.id, 'preparing')}
                    >
                      <Ionicons name="flame-outline" size={14} color="#FFF" />
                      <Text style={styles.actionPillText}>Mark Preparing</Text>
                    </Pressable>
                  )}
                  {(ord.status === 'Preparing' || ord.status === 'preparing') && (
                    <Pressable
                      style={[styles.actionPillBtn, { backgroundColor: '#16A34A' }]}
                      onPress={() => handleStatusChange(ord.id, 'delivered')}
                    >
                      <Ionicons name="checkmark-done" size={14} color="#FFF" />
                      <Text style={styles.actionPillText}>Mark Delivered</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionPillBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleStatusChange(ord.id, 'cancelled')}
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#FFF" />
                    <Text style={styles.actionPillText}>Cancel</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Ops board */}
        <Text style={styles.sectionLabel}>PILOT OPS BOARD</Text>
        <View style={styles.opsBoard}>
          <OpsTile
            title="Weekly free dish"
            body="Every live chef must publish one capped free dish weekly."
            statusLabel="50 dish target"
            statusTone="green"
          />
          <OpsTile
            title="Delivery model"
            body="Start with local staff and society runners before external partners."
            statusLabel="Manual ops"
            statusTone="blue"
          />
          <OpsTile
            title="Challenge inventory"
            body="After 5 orders, unlock capped rewards for 10 to 20 users."
            statusLabel="Capped"
            statusTone="gold"
          />
          <OpsTile
            title="Chef enablement"
            body="Packaging supplies and hygiene checklist reduce chef friction."
            statusLabel="Active"
            statusTone="green"
          />
        </View>

        {/* Quick actions */}
        {/* These previously had empty onPress handlers — they looked actionable
            but silently did nothing when tapped. Not yet built; say so plainly
            instead of pretending to work. */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actions}>
          <Button
            label="Review pending kitchens"
            onPress={() => router.push('/(ops)/trust')}
            variant="secondary"
            flex
          />
          <Button
            label="Process weekly settlements"
            onPress={() => Alert.alert('Coming soon', 'Settlement processing is not built yet.')}
            variant="secondary"
            flex
          />
          <Button
            label="Send chef nudges"
            onPress={() => Alert.alert('Coming soon', 'Chef nudges are not built yet.')}
            variant="secondary"
            flex
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  opsBoard: {
    gap: 12,
    marginBottom: 24,
  },
  tileTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  tileBody: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  orderCard: {
    marginBottom: 0,
    padding: 12,
  },
  actionPillBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
});
