import T from '../../tokens';
import { CardSkeleton } from './FinanceSkeleton';

interface PerformanceMetricsProps {
  data?: {
    avg_order_value: number;
    avg_chef_earnings: number;
    avg_commission: number;
    order_success_rate: number;
    payment_success_rate: number;
    settlement_success_rate: number;
  };
  isLoading: boolean;
}

export default function PerformanceMetricsGrid({ data, isLoading }: PerformanceMetricsProps) {
  if (isLoading || !data) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const metrics = [
    { label: 'Average Order Value', value: `₹${data.avg_order_value.toLocaleString('en-IN')}`, icon: '🛒', color: T.primary },
    { label: 'Avg Chef Earnings / Order', value: `₹${data.avg_chef_earnings.toLocaleString('en-IN')}`, icon: '👨‍🍳', color: T.primaryDeep },
    { label: 'Avg Commission / Order', value: `₹${data.avg_commission.toLocaleString('en-IN')}`, icon: '🏦', color: T.gold },
    { label: 'Order Fulfillment Rate', value: `${data.order_success_rate}%`, icon: '🎯', color: T.blue },
    { label: 'Payment Gateway Success', value: `${data.payment_success_rate}%`, icon: '💳', color: T.primary },
    { label: 'Settlement Payout Success', value: `${data.settlement_success_rate}%`, icon: '💰', color: T.primary },
  ];

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '24px',
      marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: '0 0 16px' }}>
        Financial & Operational Performance Metrics
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 14,
      }}>
        {metrics.map(m => (
          <div
            key={m.label}
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
