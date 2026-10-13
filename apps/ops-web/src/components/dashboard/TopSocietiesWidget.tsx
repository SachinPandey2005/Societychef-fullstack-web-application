import { useNavigate } from 'react-router-dom';
import Table, { Column } from '../Table';
import T from '../../tokens';
import { WidgetSkeleton } from './FinanceSkeleton';

interface TopSociety {
  society_id: string;
  society_name: string;
  city: string;
  orders_count: number;
  total_revenue: number;
  active_customers: number;
  active_chefs: number;
}

interface TopSocietiesWidgetProps {
  data?: TopSociety[];
  isLoading: boolean;
}

export default function TopSocietiesWidget({ data = [], isLoading }: TopSocietiesWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) return <WidgetSkeleton height={260} />;

  const COLS: Column[] = [
    {
      key: 'society_name',
      label: 'Society',
      width: 180,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, color: T.dark }}>🏢 {v as string}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{r.city as string}</div>
        </div>
      ),
    },
    {
      key: 'orders_count',
      label: 'Orders',
      width: 100,
      render: (v) => <span style={{ fontWeight: 600, color: T.blue }}>{v as number}</span>,
    },
    {
      key: 'total_revenue',
      label: 'Total Revenue',
      width: 140,
      render: (v) => <span style={{ fontWeight: 700, color: T.primary }}>₹{(v as number)?.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'active_customers',
      label: 'Active Customers',
      width: 130,
      render: (v) => <span style={{ fontWeight: 500, color: T.dark }}>👥 {v as number}</span>,
    },
    {
      key: 'active_chefs',
      label: 'Active Chefs',
      width: 120,
      render: (v) => <span style={{ fontWeight: 500, color: T.dark }}>👨‍🍳 {v as number}</span>,
    },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.dark, margin: 0 }}>
            Top Performing Gated Societies
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
            Societies generating maximum order volume and demand
          </p>
        </div>

        <button
          onClick={() => navigate('/societies')}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.blue,
            background: T.blueBadge,
            padding: '6px 14px',
            borderRadius: 20,
            cursor: 'pointer',
          }}
        >
          View All Societies →
        </button>
      </div>

      <Table columns={COLS} rows={data as any} rowKey="society_id" />
    </div>
  );
}
