import T from '../../tokens';
import { useExecutiveFinanceSummary } from '../../hooks/useChefEarnings';

export default function ExecutiveFinanceSummaryCards() {
  const { data: summary, isLoading } = useExecutiveFinanceSummary();

  if (isLoading) {
    return <div style={{ padding: 16, textAlign: 'center', color: T.muted }}>Loading executive summary...</div>;
  }

  const revenue = summary?.revenue || { today: 0, weekly: 0, monthly: 0 };
  const commission = summary?.commission || { today: 0, weekly: 0, monthly: 0 };
  const earnings = summary?.chef_earnings || { pending: 0, paid: 0, total: 0 };
  const settlements = summary?.settlements || { pending_count: 0, paid_count: 0, failed_count: 0 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
      {/* 1. Revenue Card */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Gross Revenue</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.dark, marginTop: 4 }}>₹{revenue.monthly.toLocaleString('en-IN')}</div>
        <div style={{ fontSize: 11, color: T.secondary, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Today: <strong>₹{revenue.today}</strong></span>
          <span>Week: <strong>₹{revenue.weekly.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 2. Platform Commission */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Platform Commission</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.primary, marginTop: 4 }}>₹{commission.monthly.toLocaleString('en-IN')}</div>
        <div style={{ fontSize: 11, color: T.secondary, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Today: <strong>₹{commission.today}</strong></span>
          <span>Week: <strong>₹{commission.weekly.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 3. Chef Earnings */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Chef Earnings</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.primaryDeep, marginTop: 4 }}>₹{earnings.total.toLocaleString('en-IN')}</div>
        <div style={{ fontSize: 11, color: T.secondary, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Paid: <strong style={{ color: T.primary }}>₹{earnings.paid.toLocaleString('en-IN')}</strong></span>
          <span>Pending: <strong style={{ color: T.gold }}>₹{earnings.pending.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 4. Settlement Status */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Settlement Overview</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.dark, marginTop: 4 }}>
          {settlements.pending_count + settlements.paid_count + settlements.failed_count} Total
        </div>
        <div style={{ fontSize: 11, color: T.secondary, marginTop: 6, display: 'flex', gap: 10 }}>
          <span>Pending: <strong style={{ color: T.gold }}>{settlements.pending_count}</strong></span>
          <span>Paid: <strong style={{ color: T.primary }}>{settlements.paid_count}</strong></span>
          <span>Failed: <strong style={{ color: T.red }}>{settlements.failed_count}</strong></span>
        </div>
      </div>
    </div>
  );
}
