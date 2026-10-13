import { useState } from 'react';
import T from '../../tokens';
import Badge from '../Badge';
import Table, { Column } from '../Table';
import { useSettlementDetails, useUpdateSettlementStatus, useRetryPayout } from '../../hooks/useSettlementData';

interface SettlementDetailsDrawerProps {
  settlementId: string;
  onClose: () => void;
  onActionSuccess?: (msg: string) => void;
}

function getTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED': return 'green';
    case 'PROCESSING':
    case 'APPROVED': return 'blue';
    case 'PENDING':
    case 'GENERATED': return 'gold';
    case 'FAILED':
    case 'CANCELLED': return 'red';
    default: return 'default';
  }
}

export default function SettlementDetailsDrawer({
  settlementId,
  onClose,
  onActionSuccess,
}: SettlementDetailsDrawerProps) {
  const { data: details, isLoading } = useSettlementDetails(settlementId);
  const updateStatus = useUpdateSettlementStatus();
  const retryPayout = useRetryPayout();
  const [updating, setUpdating] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: 24, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, marginTop: 16 }}>
        Loading settlement details & order breakdown...
      </div>
    );
  }

  if (!details) return null;

  const { settlement, kitchen, orders = [], financial_summary } = details;

  const handleStatusTransition = (newStatus: string) => {
    setUpdating(true);
    updateStatus.mutate({ id: settlementId, status: newStatus }, {
      onSuccess: () => {
        onActionSuccess?.(`Settlement #${settlementId.substring(0, 8)} status updated to ${newStatus}`);
        setUpdating(false);
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to update settlement status');
        setUpdating(false);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Order Total', 'Commission', 'Taxes', 'Delivery', 'Net Earnings'];
    const rows = orders.map((o: any) => [
      o.id,
      new Date(o.created_at).toLocaleString(),
      o.customer_name,
      o.grand_total,
      o.platform_commission,
      o.tax_amount,
      o.delivery_fee,
      o.net_chef_earnings,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `settlement_${settlementId.substring(0, 8)}_breakdown.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ORDER_COLS: Column[] = [
    {
      key: 'id',
      label: 'Order ID',
      width: 100,
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(v as string)?.substring(0, 8)}</span>,
    },
    {
      key: 'created_at',
      label: 'Order Date',
      width: 130,
      render: (v) => new Date(v as string).toLocaleDateString('en-IN'),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      width: 130,
    },
    {
      key: 'grand_total',
      label: 'Order Total',
      width: 100,
      render: (v) => <strong>₹{v as number}</strong>,
    },
    {
      key: 'platform_commission',
      label: 'Commission',
      width: 100,
      render: (v) => <span style={{ color: T.primary }}>₹{v as number}</span>,
    },
    {
      key: 'tax_amount',
      label: 'Taxes',
      width: 80,
      render: (v) => <span style={{ color: T.muted }}>₹{v as number}</span>,
    },
    {
      key: 'delivery_fee',
      label: 'Delivery',
      width: 80,
      render: (v) => <span style={{ color: T.muted }}>₹{v as number}</span>,
    },
    {
      key: 'net_chef_earnings',
      label: 'Net Earnings',
      width: 110,
      render: (v) => <strong style={{ color: T.primaryDeep }}>₹{v as number}</strong>,
    },
  ];

  const currentSt = (settlement.status || 'PENDING').toUpperCase();

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.primary}`,
      borderRadius: 12,
      padding: '24px',
      marginTop: 16,
      marginBottom: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📄</span> Settlement Record — #{settlement.id.substring(0, 8)}
            <Badge label={currentSt} tone={getTone(currentSt)} />
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Period: {settlement.period_start} to {settlement.period_end} | Created: {new Date(settlement.created_at).toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExportCSV}
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={onClose}
            style={{
              background: T.pillInactive,
              border: `1px solid ${T.border}`,
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Grid Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* 1. Settlement Info */}
        <div style={{ background: T.bg, padding: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>1. Settlement Info</div>
          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><span style={{ color: T.muted }}>ID:</span> <span style={{ fontFamily: 'monospace' }}>{settlement.id}</span></div>
            <div><span style={{ color: T.muted }}>Status:</span> <strong>{currentSt}</strong></div>
            <div><span style={{ color: T.muted }}>Total Orders:</span> <strong>{settlement.orders_count || orders.length}</strong></div>
          </div>
        </div>

        {/* 2. Chef Info */}
        <div style={{ background: T.bg, padding: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>2. Chef & Kitchen</div>
          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><span style={{ color: T.muted }}>Chef:</span> <strong>{kitchen?.chef_name || 'Chef'}</strong></div>
            <div><span style={{ color: T.muted }}>Kitchen:</span> <strong>{kitchen?.name || 'Kitchen'}</strong></div>
            <div><span style={{ color: T.muted }}>Society:</span> {kitchen?.societies?.name || 'N/A'}</div>
          </div>
        </div>

        {/* 3. Financial Summary */}
        <div style={{ background: T.bg, padding: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>3. Financial Summary</div>
          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.muted }}>Gross Sales:</span> <strong>₹{financial_summary.gross_sales}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.muted }}>Platform Commission:</span> <span style={{ color: T.primary }}>-₹{financial_summary.platform_commission}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 4 }}>
              <strong style={{ color: T.dark }}>Net Payable to Chef:</strong> <strong style={{ color: T.primaryDeep, fontSize: 14 }}>₹{financial_summary.net_payable}</strong>
            </div>
          </div>
        </div>

        {/* 4. Lifecycle Actions */}
        <div style={{ background: T.bg, padding: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>4. Payout Lifecycle Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(currentSt === 'PENDING' || currentSt === 'GENERATED') && (
              <button
                disabled={updating}
                onClick={() => handleStatusTransition('PROCESSING')}
                style={{ fontSize: 12, background: T.blueBadge, color: T.blue, border: `1px solid ${T.blue}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                ⚡ Approve & Process Payout
              </button>
            )}

            {(currentSt === 'PROCESSING' || currentSt === 'APPROVED') && (
              <button
                disabled={updating}
                onClick={() => handleStatusTransition('PAID')}
                style={{ fontSize: 12, background: T.greenBadge, color: T.primary, border: `1px solid ${T.primary}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                ✅ Mark as Paid / Released
              </button>
            )}

            {(currentSt === 'FAILED') && (
              <button
                disabled={updating}
                onClick={() => {
                  setUpdating(true);
                  retryPayout.mutate(settlementId, {
                    onSuccess: () => {
                      onActionSuccess?.(`Settlement #${settlementId.substring(0, 8)} reset for payout retry`);
                      setUpdating(false);
                    },
                    onError: (err: any) => {
                      alert(err.response?.data?.message || 'Failed to retry payout');
                      setUpdating(false);
                    }
                  });
                }}
                style={{ fontSize: 12, background: T.goldBadge, color: T.gold, border: `1px solid ${T.gold}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Retry Failed Payout
              </button>
            )}

            {currentSt !== 'PAID' && currentSt !== 'CANCELLED' && (
              <button
                disabled={updating}
                onClick={() => handleStatusTransition('CANCELLED')}
                style={{ fontSize: 11, background: T.surface, color: T.muted, border: `1px solid ${T.border}`, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                Cancel Settlement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown Table */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: T.dark, marginBottom: 10 }}>
          📦 Itemized Order Breakdown ({orders.length} Orders)
        </h4>

        {orders.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted }}>No individual order records linked to this settlement period.</div>
        ) : (
          <Table columns={ORDER_COLS} rows={orders as any} />
        )}
      </div>
    </div>
  );
}
