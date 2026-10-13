import T from '../../tokens';
import { WidgetSkeleton } from './FinanceSkeleton';

interface PaymentSummaryWidgetProps {
  data?: {
    totals: { total: number; successful: number; failed: number; pending: number; refunded: number };
    breakdown: { upi: number; card: number; net_banking: number; wallet: number; cod: number };
  };
  isLoading: boolean;
}

export default function PaymentSummaryWidget({ data, isLoading }: PaymentSummaryWidgetProps) {
  if (isLoading) return <WidgetSkeleton height={240} />;

  const totals = data?.totals || { total: 0, successful: 0, failed: 0, pending: 0, refunded: 0 };
  const breakdown = data?.breakdown || { upi: 0, card: 0, net_banking: 0, wallet: 0, cod: 0 };

  const totalBreakdown = Math.max(breakdown.upi + breakdown.card + breakdown.net_banking + breakdown.wallet + breakdown.cod, 1);

  const methods = [
    { label: 'UPI (GPay, PhonePe, Paytm)', amount: breakdown.upi, icon: '📱', color: T.primary },
    { label: 'Credit / Debit Cards', amount: breakdown.card, icon: '💳', color: T.blue },
    { label: 'Net Banking', amount: breakdown.net_banking, icon: '🏛️', color: T.gold },
    { label: 'Wallets', amount: breakdown.wallet, icon: '👛', color: '#8b5cf6' },
    { label: 'Cash on Delivery (COD)', amount: breakdown.cod, icon: '💵', color: T.secondary },
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
        Payment Gateway & Channel Performance
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {/* Totals Summary */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            Transaction Status Totals
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.bg, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: T.dark, fontWeight: 500 }}>Total Processed:</span>
              <strong style={{ fontSize: 14, color: T.dark }}>₹{totals.total.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.greenBadge, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: T.primary, fontWeight: 600 }}>Successful:</span>
              <strong style={{ fontSize: 14, color: T.primary }}>₹{totals.successful.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.goldBadge, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: '#7a5400', fontWeight: 600 }}>Pending Authorization:</span>
              <strong style={{ fontSize: 14, color: '#7a5400' }}>₹{totals.pending.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.redBadge, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>Failed / Dropped:</span>
              <strong style={{ fontSize: 14, color: T.red }}>₹{totals.failed.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.pillInactive, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: T.secondary, fontWeight: 600 }}>Refunded:</span>
              <strong style={{ fontSize: 14, color: T.secondary }}>₹{totals.refunded.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Method Breakdown */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            Payment Method Split
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {methods.map(m => {
              const pct = Math.round((m.amount / totalBreakdown) * 100);
              return (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: T.dark, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{m.icon}</span> {m.label}
                    </span>
                    <span style={{ color: T.muted, fontWeight: 600 }}>
                      ₹{m.amount.toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: m.color,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
