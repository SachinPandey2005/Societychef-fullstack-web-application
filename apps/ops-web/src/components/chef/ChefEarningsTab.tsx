import { useState } from 'react';
import T from '../../tokens';
import Table, { Column } from '../Table';
import Badge from '../Badge';
import { useChefEarningsOverview, useChefOrdersBreakdown } from '../../hooks/useChefEarnings';

interface ChefEarningsTabProps {
  kitchenId: string;
  chefName?: string;
}

export default function ChefEarningsTab({ kitchenId, chefName }: ChefEarningsTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: overview, isLoading: overviewLoading } = useChefEarningsOverview(kitchenId);
  const { data: orders = [], isLoading: ordersLoading } = useChefOrdersBreakdown(kitchenId, selectedDate);

  if (overviewLoading) {
    return <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Loading chef earnings performance statistics...</div>;
  }

  const today = overview?.today || { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 };
  const weekly = overview?.weekly || { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 };
  const monthly = overview?.monthly || { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 };
  const lifetime = overview?.lifetime || { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0, pending_settlement_amount: 0 };

  const ORDER_COLS: Column[] = [
    {
      key: 'id',
      label: 'Order ID',
      width: 100,
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(v as string)?.substring(0, 8)}</span>,
    },
    {
      key: 'created_at',
      label: 'Time',
      width: 110,
      render: (v) => new Date(v as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      width: 130,
      render: (v) => <strong style={{ color: T.dark }}>{v as string}</strong>,
    },
    {
      key: 'grand_total',
      label: 'Gross Amount',
      width: 110,
      render: (v) => <span style={{ fontWeight: 600 }}>₹{v as number}</span>,
    },
    {
      key: 'platform_commission',
      label: 'Commission',
      width: 110,
      render: (v) => <span style={{ color: T.primary }}>₹{v as number}</span>,
    },
    {
      key: 'net_chef_earnings',
      label: 'Net Earnings',
      width: 120,
      render: (v) => <strong style={{ color: T.primaryDeep }}>₹{v as number}</strong>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      render: (v) => <Badge label={v as string} tone={v === 'DELIVERED' ? 'green' : 'gold'} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 Performance Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Today */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Today's Performance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.dark, marginTop: 4 }}>₹{today.gross_revenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>
            Orders: <strong>{today.orders_count}</strong> | Net: <strong style={{ color: T.primary }}>₹{today.net_earnings}</strong>
          </div>
        </div>

        {/* Weekly */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Weekly Performance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.dark, marginTop: 4 }}>₹{weekly.gross_revenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>
            Orders: <strong>{weekly.orders_count}</strong> | Net: <strong style={{ color: T.primary }}>₹{weekly.net_earnings}</strong>
          </div>
        </div>

        {/* Monthly */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Monthly Performance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.dark, marginTop: 4 }}>₹{monthly.gross_revenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>
            Orders: <strong>{monthly.orders_count}</strong> | Net: <strong style={{ color: T.primary }}>₹{monthly.net_earnings}</strong>
          </div>
        </div>

        {/* Lifetime */}
        <div style={{ background: T.goldBadge, border: `1px solid ${T.gold}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: 'uppercase' }}>Lifetime Statistics</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.dark, marginTop: 4 }}>₹{lifetime.gross_revenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 4 }}>
            Pending Settlement: <strong style={{ color: T.gold }}>₹{lifetime.pending_settlement_amount}</strong>
          </div>
        </div>
      </div>

      {/* Daily Orders Breakdown Section */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: T.dark, margin: 0 }}>
              Daily Orders Breakdown — {chefName || 'Chef'}
            </h4>
            <span style={{ fontSize: 12, color: T.muted }}>
              Showing {orders.length} orders for {selectedDate}
            </span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg }}
          />
        </div>

        {ordersLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted }}>Loading daily order history...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>No orders recorded on {selectedDate}.</div>
        ) : (
          <Table columns={ORDER_COLS} rows={orders} />
        )}
      </div>
    </div>
  );
}
