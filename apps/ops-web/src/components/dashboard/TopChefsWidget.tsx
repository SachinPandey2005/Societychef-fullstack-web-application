import { useNavigate } from 'react-router-dom';
import Table, { Column } from '../Table';
import T from '../../tokens';
import { WidgetSkeleton } from './FinanceSkeleton';

interface TopChef {
  chef_id: string;
  chef_name: string;
  kitchen_name: string;
  society_name: string;
  orders_count: number;
  total_revenue: number;
  platform_commission: number;
  net_earnings: number;
}

interface TopChefsWidgetProps {
  data?: TopChef[];
  isLoading: boolean;
}

export default function TopChefsWidget({ data = [], isLoading }: TopChefsWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) return <WidgetSkeleton height={260} />;

  const COLS: Column[] = [
    {
      key: 'chef_name',
      label: 'Chef Name',
      width: 150,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, color: T.dark }}>{v as string}</div>
          <div style={{ fontSize: 11, color: T.muted }}>ID: {(r.chef_id as string)?.substring(0, 8)}</div>
        </div>
      ),
    },
    { key: 'kitchen_name', label: 'Kitchen', width: 140 },
    { key: 'society_name', label: 'Society', width: 140 },
    {
      key: 'orders_count',
      label: 'Orders',
      width: 90,
      render: (v) => <span style={{ fontWeight: 600, color: T.blue }}>{v as number}</span>,
    },
    {
      key: 'total_revenue',
      label: 'Total Revenue',
      width: 120,
      render: (v) => <span style={{ fontWeight: 600, color: T.dark }}>₹{(v as number)?.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'platform_commission',
      label: 'Commission',
      width: 110,
      render: (v) => <span style={{ fontWeight: 600, color: T.primary }}>₹{(v as number)?.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'net_earnings',
      label: 'Net Earnings',
      width: 120,
      render: (v) => <span style={{ fontWeight: 700, color: T.primaryDeep }}>₹{(v as number)?.toLocaleString('en-IN')}</span>,
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
            Top 5 Performing Chefs
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
            Chefs driving highest Gross Revenue & Platform Commission
          </p>
        </div>

        <button
          onClick={() => navigate('/kitchens')}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.primary,
            background: T.greenBadge,
            padding: '6px 14px',
            borderRadius: 20,
            cursor: 'pointer',
          }}
        >
          View All Chefs →
        </button>
      </div>

      <Table columns={COLS} rows={data as any} rowKey="chef_id" />
    </div>
  );
}
