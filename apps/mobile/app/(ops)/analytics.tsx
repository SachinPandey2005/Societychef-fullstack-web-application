import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { apiClient } from '../../lib/apiClient';

type AnalyticsRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function AnalyticsRow({ label, value, isLast = false }: AnalyticsRowProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View
      style={[
        styles.analyticsRow,
        !isLast && styles.analyticsRowBorder,
      ]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type PanelProps = {
  title: string;
  rows: { label: string; value: string }[];
};

function Panel({ title, rows }: PanelProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Card>
      <Text style={styles.panelTitle}>{title}</Text>
      {rows.map((row, index) => (
        <AnalyticsRow
          key={row.label}
          label={row.label}
          value={row.value}
          isLast={index === rows.length - 1}
        />
      ))}
    </Card>
  );
}

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

type OverviewData = {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_chefs: number;
  cancellation_rate: number;
  average_order_value: number;
};

type RevenueData = {
  gross_sales: number;
  platform_commission: number;
  net_chef_earnings: number;
  delivery_charges: number;
};

export default function AnalyticsScreen() {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [weekOverview, setWeekOverview] = useState<OverviewData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [liveKitchens, setLiveKitchens] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const [overviewRes, weekRes, revenueRes, kitchensRes] = await Promise.all([
          apiClient.get('/analytics/overview'),
          apiClient.get(`/analytics/overview?start_date=${encodeURIComponent(weekAgo)}`),
          apiClient.get('/analytics/revenue'),
          apiClient.get('/kitchens'),
        ]);
        if (cancelled) return;
        setOverview(overviewRes.data);
        setWeekOverview(weekRes.data);
        setRevenue(revenueRes.data);
        const kitchens = kitchensRes.data || [];
        setLiveKitchens(kitchens.filter((k: any) => k.is_live).length);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 }}>
            ANALYTICS & METRICS
          </Text>
        </View>

        <ScreenTitle
          eyebrow="Analytics"
          title="Supply, demand, quality, and business."
        />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={{ color: Colors.red, textAlign: 'center', marginTop: 24 }}>{error}</Text>
        ) : (
          <>
            {/* Summary metrics */}
            <View style={styles.metricsRow}>
              <Metric value={String(liveKitchens ?? 0)} label="Live kitchens" />
              <Metric value={String(overview?.total_chefs ?? 0)} label="Chefs" />
              <Metric
                value={revenue && revenue.gross_sales > 0 ? pct((revenue.platform_commission / revenue.gross_sales) * 100) : '0%'}
                label="Take rate"
              />
            </View>

            {/* Platform overview */}
            {overview && (
              <Panel
                title="Platform overview"
                rows={[
                  { label: 'Total orders', value: String(overview.total_orders) },
                  { label: 'Orders this week', value: String(weekOverview?.total_orders ?? 0) },
                  { label: 'Total customers', value: String(overview.total_customers) },
                  { label: 'Average order value', value: money(overview.average_order_value) },
                  { label: 'Cancellation rate', value: pct(overview.cancellation_rate) },
                ]}
              />
            )}

            {/* Business metrics */}
            {revenue && (
              <Panel
                title="Business health"
                rows={[
                  { label: 'Gross order value', value: money(revenue.gross_sales) },
                  { label: 'Platform commission', value: money(revenue.platform_commission) },
                  { label: 'Net chef payouts', value: money(revenue.net_chef_earnings) },
                  { label: 'Delivery cost est.', value: money(revenue.delivery_charges) },
                ]}
              />
            )}
          </>
        )}
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
    marginBottom: 16,
  },
  panelTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  analyticsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    color: Colors.muted,
    fontSize: 14,
    flex: 1,
  },
  rowValue: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
});
