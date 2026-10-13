import T from '../../tokens';
import { useSettlementSummary } from '../../hooks/useSettlementData';

export default function SettlementSummaryCards() {
  const { data: summary, isLoading } = useSettlementSummary();

  const metrics = {
    pending: summary?.pending || { count: 0, total_amount: 0 },
    processing: summary?.processing || { count: 0, total_amount: 0 },
    paid: summary?.paid || { count: 0, total_amount: 0 },
    failed: summary?.failed || { count: 0, total_amount: 0 },
    total_chef_earnings: summary?.total_chef_earnings || {
      gross_sales: 0,
      platform_commission: 0,
      net_payable: 0,
      last_settlement_date: undefined,
    },
  };

  const cards = [
    {
      title: 'Pending Settlements',
      value: `₹${metrics.pending.total_amount.toLocaleString('en-IN')}`,
      subtext: `${metrics.pending.count} settlements awaiting approval`,
      color: T.gold,
      bg: T.goldBadge,
      icon: '⏳',
    },
    {
      title: 'Processing Payouts',
      value: `₹${metrics.processing.total_amount.toLocaleString('en-IN')}`,
      subtext: `${metrics.processing.count} settlements in bank transfer`,
      color: T.blue,
      bg: T.blueBadge,
      icon: '🔄',
    },
    {
      title: 'Paid Settlements',
      value: `₹${metrics.paid.total_amount.toLocaleString('en-IN')}`,
      subtext: `${metrics.paid.count} completed payout transfers`,
      color: T.primary,
      bg: T.greenBadge,
      icon: '✅',
    },
    {
      title: 'Failed Settlements',
      value: `₹${metrics.failed.total_amount.toLocaleString('en-IN')}`,
      subtext: `${metrics.failed.count} failed transfers needing retry`,
      color: T.red,
      bg: T.redBadge,
      icon: '⚠️',
    },
    {
      title: 'Total Chef Earnings',
      value: `₹${metrics.total_chef_earnings.net_payable.toLocaleString('en-IN')}`,
      subtext: `Gross: ₹${metrics.total_chef_earnings.gross_sales.toLocaleString('en-IN')} | Comm: ₹${metrics.total_chef_earnings.platform_commission.toLocaleString('en-IN')}`,
      color: T.primaryDeep,
      bg: T.surface,
      icon: '💰',
      border: `1px solid ${T.primary}`,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ flex: '1 1 180px', height: 90, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
      {cards.map(c => (
        <div
          key={c.title}
          style={{
            background: c.bg,
            border: c.border || `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>{c.title}</span>
            <span style={{ fontSize: 16 }}>{c.icon}</span>
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontWeight: 500 }}>{c.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
