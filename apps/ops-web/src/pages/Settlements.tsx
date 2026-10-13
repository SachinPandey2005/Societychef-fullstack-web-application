import { useState } from 'react';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import SettlementSummaryCards from '../components/settlements/SettlementSummaryCards';
import SettlementDetailsDrawer from '../components/settlements/SettlementDetailsDrawer';
import PayChefModal from '../components/settlements/PayChefModal';
import Payments from './Payments';
import {
  useSettlements,
  useBulkUpdateSettlementStatus,
  useBulkGenerateSettlements,
  SettlementFilterState,
} from '../hooks/useSettlementData';
import { useDashboardStore } from '../store/useDashboardStore';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CreditCard, Download, Zap, CheckCircle2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MainTab = 'settlements' | 'transactions';

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

export default function Settlements() {
  const [mainTab, setMainTab] = useState<MainTab>('settlements');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payingSettlement, setPayingSettlement] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [advFilters, setAdvFilters] = useState<SettlementFilterState>({});

  const { searchQuery, setSearchQuery } = useDashboardStore();

  const { data: settlements = [], isLoading, isError } = useSettlements({
    ...advFilters,
    query: searchQuery,
  });

  const bulkUpdateStatus = useBulkUpdateSettlementStatus();
  const bulkGenerate = useBulkGenerateSettlements();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  const handleSelectAll = () => {
    if (selectedIds.length === settlements.length && settlements.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(settlements.map((s: any) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (status: string) => {
    if (selectedIds.length === 0) return alert('Select at least one settlement');
    bulkUpdateStatus.mutate(
      { ids: selectedIds, status },
      {
        onSuccess: () => {
          showNotification(`Bulk updated ${selectedIds.length} settlements to ${status}`);
          setSelectedIds([]);
        },
      }
    );
  };

  const handleBulkGenerate = () => {
    if (confirm('Bulk generate settlements for all kitchens with delivered sales today?')) {
      bulkGenerate.mutate(
        {},
        {
          onSuccess: (data: any) => {
            showNotification(`Successfully generated ${data.generated_count || 0} settlements`);
          },
        }
      );
    }
  };

  const handleBulkExport = () => {
    const selectedData = settlements.filter((s: any) => selectedIds.includes(s.id));
    const dataToExport = selectedData.length > 0 ? selectedData : settlements;

    const headers = ['Settlement ID', 'Chef Name', 'Kitchen', 'Society', 'Period Start', 'Period End', 'Gross Sales', 'Commission', 'Taxes', 'Net Payable', 'Status'];
    const rows = dataToExport.map((s: any) => [
      s.id,
      s.kitchens?.chef_name || 'N/A',
      s.kitchens?.name || 'N/A',
      s.kitchens?.societies?.name || 'N/A',
      s.period_start,
      s.period_end,
      s.gross_sales,
      s.platform_commission,
      s.tax_deducted,
      s.net_payout,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `settlements_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Exported ${dataToExport.length} settlements to CSV`);
  };

  const COLS: Column[] = [
    {
      key: 'select',
      label: 'Select',
      width: 60,
      render: (_, row: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleToggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500"
        />
      ),
    },
    {
      key: 'id',
      label: 'Settlement ID',
      width: 110,
      render: (v) => <span className="font-mono font-bold text-teal-700 dark:text-teal-400">#{(v as string)?.substring(0, 8)}</span>,
    },
    {
      key: 'kitchenName',
      label: 'Chef & Kitchen',
      width: 180,
      render: (_, row: any) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.kitchens?.chef_name || 'Home Chef'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">🏪 {row.kitchens?.name || 'Kitchen'}</div>
        </div>
      ),
    },
    {
      key: 'gross_sales',
      label: 'Gross Sales',
      width: 110,
      render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v as number || 0}</span>,
    },
    {
      key: 'platform_commission',
      label: 'Commission',
      width: 110,
      render: (v) => <span className="font-semibold text-teal-700 dark:text-teal-400">₹{v as number || 0}</span>,
    },
    {
      key: 'net_payout',
      label: 'Net Payout',
      width: 120,
      render: (v) => <span className="font-extrabold text-teal-800 dark:text-teal-300">₹{v as number || 0}</span>,
    },
    {
      key: 'status',
      label: 'Payout Status',
      width: 130,
      render: (v) => <Badge label={v as string} tone={getTone(v as string)} pulse={v === 'PROCESSING'} />,
    },
    {
      key: 'period_end',
      label: 'Period End',
      width: 120,
      render: (v) => <span className="text-slate-500 dark:text-slate-400 text-xs">{new Date(v as string).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 180,
      align: 'right',
      render: (_, row: any) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status !== 'PAID' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setPayingSettlement(row)}
              icon={<DollarSign className="w-3.5 h-3.5" />}
            >
              Pay Chef
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpandedRow((prev) => (prev === row.id ? null : row.id))}
          >
            {expandedRow === row.id ? 'Close' : 'Details'}
          </Button>
        </div>
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
        title="Chef Payouts & Settlements Ledger"
        description="Automated weekly/daily chef payout calculations, gateway transfers, and financial tracking"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search chef, kitchen, settlement ID..."
            />
            <Button
              variant="outline"
              onClick={handleBulkExport}
              icon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkGenerate}
              icon={<Zap className="w-4 h-4" />}
            >
              Generate All
            </Button>
          </div>
        }
      />

      {/* Main Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setMainTab('settlements')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
            mainTab === 'settlements'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          💳 Chef Settlements
        </button>
        <button
          onClick={() => setMainTab('transactions')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
            mainTab === 'transactions'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          💵 Gateway Transactions
        </button>
      </div>

      {mainTab === 'transactions' ? (
        <Payments />
      ) : (
        <>
          <SettlementSummaryCards />

          {selectedIds.length > 0 && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                {selectedIds.length} settlements selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => handleBulkStatus('APPROVED')}>
                  Approve Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatus('PAID')}>
                  Mark Paid
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <Table columns={COLS} rows={[]} isLoading={true} />
          ) : isError ? (
            <EmptyState
              title="Failed to Load Settlements"
              description="Permission error or network failure loading settlements."
            />
          ) : settlements.length === 0 ? (
            <EmptyState
              title="No Settlements Found"
              description="No chef payout settlement records match your query."
              icon={<CreditCard className="w-10 h-10 text-teal-600" />}
            />
          ) : (
            <Table
              columns={COLS}
              rows={settlements as unknown as Record<string, unknown>[]}
              expandedRow={expandedRow}
              onRowClick={(row) => {
                const id = (row as any).id;
                setExpandedRow((prev) => (prev === id ? null : id));
              }}
              expandContent={(row) => (
                <SettlementDetailsDrawer
                  settlementId={String((row as any).id)}
                  onClose={() => setExpandedRow(null)}
                  onActionSuccess={showNotification}
                />
              )}
            />
          )}

          {payingSettlement && (
            <PayChefModal
              settlement={payingSettlement}
              onClose={() => setPayingSettlement(null)}
              onSuccess={(msg) => {
                showNotification(msg);
                setPayingSettlement(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
