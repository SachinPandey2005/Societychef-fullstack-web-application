import { useNavigate } from 'react-router-dom';
import T from '../../tokens';
import { WidgetSkeleton } from './FinanceSkeleton';

interface SettlementSummaryWidgetProps {
  data?: {
    counts: { pending: number; processing: number; paid: number; failed: number };
    amounts: { pending: number; processing: number; paid: number; failed: number };
  };
  isLoading: boolean;
}

export default function SettlementSummaryWidget({ data, isLoading }: SettlementSummaryWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) return <WidgetSkeleton height={180} />;

  const counts = data?.counts || { pending: 0, processing: 0, paid: 0, failed: 0 };
  const amounts = data?.amounts || { pending: 0, processing: 0, paid: 0, failed: 0 };

  const items = [
    { key: 'PENDING', label: 'Pending', count: counts.pending, amount: amounts.pending, color: T.gold, bg: T.goldBadge, icon: '⏳' },
    { key: 'PROCESSING', label: 'Processing', count: counts.processing, amount: amounts.processing, color: T.blue, bg: T.blueBadge, icon: '⚙️' },
    { key: 'PAID', label: 'Paid / Completed', count: counts.paid, amount: amounts.paid, color: T.primary, bg: T.greenBadge, icon: '✅' },
    { key: 'FAILED', label: 'Failed', count: counts.failed, amount: amounts.failed, color: T.red, bg: T.redBadge, icon: '❌' },
  ];

  const handleCardClick = (statusKey: string) => {
    navigate(`/settlements?status=${statusKey}`);
  };

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: 0 }}>
            Settlement Summary & Payout Overview
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
            Click any status card to view pre-filtered settlements in the Payouts module
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {items.map(item => (
          <div
            key={item.key}
            onClick={() => handleCardClick(item.key)}
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = item.color;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: item.color,
                background: item.bg,
                padding: '2px 8px',
                borderRadius: 12,
              }}>
                {item.count} Records
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.dark }}>
              ₹{item.amount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
