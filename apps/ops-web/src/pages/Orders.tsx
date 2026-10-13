import { useState } from 'react';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { useGlobalOrders, useUpdateOrderStatus, OrderFilterState } from '../hooks/useCrmData';
import { useDashboardStore } from '../store/useDashboardStore';
import OrderFilterBar from '../components/orders/OrderFilterBar';
import OrderFinancialSummaryDrawer from '../components/orders/OrderFinancialSummaryDrawer';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ShoppingBag, AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'all' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'ACTIVE', label: 'Active Orders' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function getOrderStatusTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'DELIVERED': return 'green';
    case 'ACCEPTED':
    case 'OUT_FOR_DELIVERY': return 'blue';
    case 'PENDING':
    case 'PREPARING':
    case 'READY': return 'gold';
    case 'CANCELLED':
    case 'REJECTED': return 'red';
    default: return 'default';
  }
}

function getPaymentTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'SUCCESSFUL':
    case 'PAID':
    case 'CAPTURED': return 'green';
    case 'PENDING':
    case 'PROCESSING': return 'gold';
    case 'FAILED':
    case 'CANCELLED': return 'red';
    case 'REFUNDED': return 'blue';
    default: return 'default';
  }
}

function getSettlementTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'APPROVED': return 'green';
    case 'GENERATED':
    case 'PROCESSING': return 'blue';
    case 'PENDING': return 'gold';
    case 'FAILED':
    case 'REJECTED': return 'red';
    default: return 'default';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ExpandedOrderContent({
  row,
  onAction,
  onNotification,
}: {
  row: any;
  onAction: (status: string) => void;
  onNotification: (msg: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Financial Details Drawer */}
      <OrderFinancialSummaryDrawer
        order={row}
        onClose={() => {}}
        onActionSuccess={onNotification}
      />

      {/* Force Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {row.status !== 'CANCELLED' && row.status !== 'DELIVERED' && (
          <>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onAction('CANCELLED')}
              icon={<AlertCircle className="w-3.5 h-3.5" />}
            >
              Force Cancel Order
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAction('DELIVERED')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Force Complete Order
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const [tab, setTab] = useState<Tab>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const [notification, setNotification] = useState<string | null>(null);
  const [advFilters, setAdvFilters] = useState<OrderFilterState>({});

  const { data: orders = [], isLoading, isError } = useGlobalOrders({
    ...advFilters,
    query: searchQuery,
    status: tab === 'all' ? undefined : tab,
  });

  const updateStatus = useUpdateOrderStatus();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  const isActive = (s: string) => !['CANCELLED', 'REJECTED', 'DELIVERED'].includes(s);

  const active = orders.filter((o: any) => isActive(o.status));
  const urgent = active.filter((o: any) => Date.now() - new Date(o.created_at).getTime() > 30 * 60000);
  const todayGross = orders
    .filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString() && !['CANCELLED', 'REJECTED'].includes(o.status))
    .reduce((sum: number, o: any) => sum + Number(o.grand_total || 0), 0);

  const filtered = orders;

  const handleForceAction = (id: string, status: string) => {
    updateStatus.mutate({ id, status, reason: 'Ops Force Override' }, {
      onSuccess: () => {
        showNotification(`Order #${id.substring(0, 8)} status updated to ${status}`);
        setExpandedRow(null);
      }
    });
  };

  const COLS: Column[] = [
    {
      key: 'id',
      label: 'Order ID',
      width: 110,
      render: (v) => <span className="font-mono font-bold text-teal-700 dark:text-teal-400">#{(v as string)?.substring(0, 8)}</span>,
    },
    {
      key: 'kitchenName',
      label: 'Kitchen & Chef',
      width: 170,
      render: (_, row: any) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.kitchens?.name || row.kitchen_profiles?.name || 'Kitchen'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">👨‍🍳 {row.kitchens?.chef_name || 'Chef'}</div>
        </div>
      ),
    },
    {
      key: 'consumerName',
      label: 'Customer',
      width: 140,
      render: (_, row: any) => (
        <div className="font-medium text-slate-800 dark:text-slate-200">{row.profiles?.name || row.profiles?.full_name || 'Customer'}</div>
      ),
    },
    {
      key: 'grand_total',
      label: 'Order Total',
      width: 110,
      render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v as number}</span>,
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      width: 140,
      render: (v, row: any) => {
        const st = (v as string) || (row.payment_status?.toUpperCase() === 'PAID' ? 'SUCCESSFUL' : 'PENDING');
        return <Badge label={st} tone={getPaymentTone(st)} />;
      },
    },
    {
      key: 'payment_method',
      label: 'Method',
      width: 90,
      render: (v) => <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{(v as string) || 'UPI'}</span>,
    },
    {
      key: 'platform_commission',
      label: 'Commission',
      width: 100,
      render: (v) => <span className="font-semibold text-teal-700 dark:text-teal-400">₹{v as number || 0}</span>,
    },
    {
      key: 'delivery_fee',
      label: 'Delivery Fee',
      width: 95,
      render: (v) => <span className="text-slate-500 dark:text-slate-400">₹{v as number || 0}</span>,
    },
    {
      key: 'net_chef_earnings',
      label: 'Chef Earnings',
      width: 110,
      render: (v) => <span className="font-bold text-teal-800 dark:text-teal-300">₹{v as number || 0}</span>,
    },
    {
      key: 'settlement_status',
      label: 'Settlement',
      width: 110,
      render: (v) => {
        const st = (v as string) || 'PENDING';
        return <Badge label={st} tone={getSettlementTone(st)} />;
      },
    },
    {
      key: 'status',
      label: 'Order Status',
      width: 120,
      render: (v) => <Badge label={v as string} tone={getOrderStatusTone(v as string)} pulse={v === 'PREPARING'} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      width: 90,
      render: (v) => <span className="text-slate-500 dark:text-slate-400 text-xs">{timeAgo(v as string)}</span>,
    },
    {
      key: 'details',
      label: 'Details',
      width: 100,
      align: 'right',
      render: (_v, row: any) => (
        <Button
          size="sm"
          variant={expandedRow === row.id ? 'primary' : 'outline'}
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRow((prev) => (prev === row.id ? null : row.id));
          }}
        >
          {expandedRow === row.id ? 'Close ✕' : 'Financials 💳'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl border border-slate-800 dark:border-slate-200"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Live Orders & Financial Records"
        description="Real-time order dispatch ledger, commissions, chef payout statuses, and forced overrides"
        actions={
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Order ID, Customer, Chef..."
          />
        }
      />

      {/* Stats Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">{active.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Urgent (&gt;30 Min)</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-100">{urgent.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Gross Sales</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
            ₹{todayGross.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Filtered Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{orders.length}</div>
        </div>
      </div>

      {/* Advanced Order Filter Bar */}
      <OrderFilterBar filters={advFilters} onChange={setAdvFilters} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              tab === t.key
                ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Table columns={COLS} rows={[]} isLoading={true} />
      ) : isError ? (
        <EmptyState
          title="Failed to Load Orders"
          description="Permission error or network failure loading order records."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="No orders match your filter criteria or search query."
          icon={<ShoppingBag className="w-10 h-10 text-teal-600" />}
        />
      ) : (
        <Table
          columns={COLS}
          rows={filtered as unknown as Record<string, unknown>[]}
          expandedRow={expandedRow}
          onRowClick={(row) => {
            const id = (row as any).id;
            setExpandedRow((prev) => (prev === id ? null : id));
          }}
          expandContent={(row) => (
            <ExpandedOrderContent
              row={row}
              onAction={(s) => handleForceAction((row as any).id, s)}
              onNotification={showNotification}
            />
          )}
        />
      )}
    </div>
  );
}
