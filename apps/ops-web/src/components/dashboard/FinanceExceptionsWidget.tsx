import { useNavigate } from 'react-router-dom';
import T from '../../tokens';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';

export default function FinanceExceptionsWidget() {
  const navigate = useNavigate();

  const { data: recData } = useQuery({
    queryKey: ['reconciliation-summary'],
    queryFn: async () => (await apiClient.get('/finance-automation/reconciliation')).data.data
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements-exception-list'],
    queryFn: async () => (await apiClient.get('/settlements')).data.data
  });

  const failedPayouts = settlements.filter((s: any) => s.status === 'FAILED').length;
  const pendingRec = recData?.mismatch_count || 0;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: 0 }}>
            🚨 Finance Exceptions & Risk Monitor
          </h3>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2, margin: 0 }}>
            Real-time reconciliation alerts, failed payouts, unverified payments, and high-value transaction flags
          </p>
        </div>
        <button
          onClick={() => navigate('/settlements')}
          style={{
            padding: '6px 12px', borderRadius: 6, background: T.bg, border: `1px solid ${T.border}`,
            color: T.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
        >
          View Settlements 💳
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Tile 1: Reconciliation Mismatches */}
        <div style={{ background: pendingRec > 0 ? T.goldBadge : T.bg, border: `1px solid ${pendingRec > 0 ? T.gold : T.border}`, padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Reconciliation Flags</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: pendingRec > 0 ? T.dark : T.primary, marginTop: 4 }}>{pendingRec} Items</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>Requires review</div>
        </div>

        {/* Tile 2: Failed Payouts */}
        <div style={{ background: failedPayouts > 0 ? T.redBadge : T.bg, border: `1px solid ${failedPayouts > 0 ? T.red : T.border}`, padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Failed Chef Payouts</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: failedPayouts > 0 ? T.red : T.dark, marginTop: 4 }}>{failedPayouts} Payouts</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>Retry available</div>
        </div>

        {/* Tile 3: Reconciliation Health Score */}
        <div style={{ background: T.greenBadge, border: `1px solid ${T.primary}`, padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, textTransform: 'uppercase' }}>Reconciliation Health</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.dark, marginTop: 4 }}>{recData?.health_score || '100%'}</div>
          <div style={{ fontSize: 11, color: T.primary, marginTop: 4 }}>Transaction chain status</div>
        </div>

        {/* Tile 4: Automation Status */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Scheduler Service</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.dark, marginTop: 4 }}>ACTIVE</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Batch jobs running</div>
        </div>
      </div>
    </div>
  );
}
