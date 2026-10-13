import T from '../../tokens';
import Badge from '../Badge';
import { WidgetSkeleton } from './FinanceSkeleton';

interface FinancialActivityItem {
  id: string;
  event_type: 'CUSTOMER_PAYMENT' | 'SETTLEMENT_GENERATED' | 'SETTLEMENT_PAID' | 'COMMISSION_CALCULATED' | 'REFUND_ISSUED';
  timestamp: string;
  order_id?: string;
  amount: number;
  status: string;
  related_user: string;
  description: string;
}

interface RecentFinancialActivityFeedProps {
  data?: FinancialActivityItem[];
  isLoading: boolean;
}

function getEventIcon(type: string): { icon: string; tone: 'green' | 'gold' | 'blue' | 'red' | 'default' } {
  switch (type) {
    case 'CUSTOMER_PAYMENT':
      return { icon: '💳', tone: 'green' };
    case 'SETTLEMENT_PAID':
      return { icon: '💰', tone: 'green' };
    case 'SETTLEMENT_GENERATED':
      return { icon: '📄', tone: 'blue' };
    case 'COMMISSION_CALCULATED':
      return { icon: '🏦', tone: 'gold' };
    case 'REFUND_ISSUED':
      return { icon: '↩️', tone: 'red' };
    default:
      return { icon: '🔔', tone: 'default' };
  }
}

export default function RecentFinancialActivityFeed({ data = [], isLoading }: RecentFinancialActivityFeedProps) {
  if (isLoading) return <WidgetSkeleton height={280} />;

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '24px',
      marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: 0 }}>
            Recent Financial Activity (Live Feed)
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
            Real-time feed of payments, settlements, platform commissions, and refunds
          </p>
        </div>

        <span style={{
          fontSize: 11,
          fontWeight: 700,
          background: T.greenBadge,
          color: T.primary,
          padding: '3px 10px',
          borderRadius: 20,
        }}>
          Live Updates
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            No recent financial events detected.
          </div>
        ) : (
          data.map(item => {
            const { icon, tone } = getEventIcon(item.event_type);
            const timeStr = new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: T.bg,
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{
                    fontSize: 18,
                    background: T.surface,
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, truncate: 'true' } as any}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, display: 'flex', gap: 10 }}>
                      <span>User: {item.related_user}</span>
                      {item.order_id && <span>Order: #{item.order_id.substring(0, 8)}</span>}
                      <span>{dateStr} at {timeStr}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.dark }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Badge label={item.status} tone={tone} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
