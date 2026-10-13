import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import ExecutiveFinanceSummaryCards from '../components/reports/ExecutiveFinanceSummaryCards';
import { useChefReport, useSocietyPerformanceReport } from '../hooks/useChefEarnings';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { TrendingUp, Download, FileSpreadsheet } from 'lucide-react';

type ReportTab = 'chef_daily' | 'chef_weekly' | 'chef_monthly' | 'society' | 'ledger' | 'revenue' | 'orders';

function getTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'POSTED': return 'green';
    case 'PROCESSING':
    case 'APPROVED': return 'blue';
    case 'PENDING': return 'gold';
    case 'FAILED': return 'red';
    default: return 'default';
  }
}

export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ReportTab>('chef_daily');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isChefReport = tab.startsWith('chef_');
  const isSocietyReport = tab === 'society';
  const isLedgerReport = tab === 'ledger';
  const period = tab === 'chef_weekly' ? 'weekly' : tab === 'chef_monthly' ? 'monthly' : 'daily';

  const { data: chefReports = [], isLoading: chefLoading, isError: chefError } = useChefReport(period, {
    status: statusFilter,
  });

  const { data: societyReports = [], isLoading: societyLoading } = useSocietyPerformanceReport();

  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['financial-ledger-entries'],
    queryFn: async () => (await apiClient.get('/finance-automation/ledger')).data.data,
    enabled: isLedgerReport,
  });

  const { data: genericReport = [], isLoading: genLoading, isError: genError } = useQuery({
    queryKey: ['report', tab],
    queryFn: async () => (await apiClient.get(`/analytics/reports/${tab}`)).data.data,
    enabled: !isChefReport && !isSocietyReport && !isLedgerReport,
  });

  const handleExportCSV = () => {
    const dataToExport = isChefReport ? chefReports : isSocietyReport ? societyReports : isLedgerReport ? ledgerEntries : genericReport;
    if (!dataToExport || dataToExport.length === 0) return alert('No data to export');

    const headers = Object.keys(dataToExport[0] || {});
    const rows = dataToExport.map((row: any) => headers.map((h) => JSON.stringify(row[h] ?? '')));
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const CHEF_COLS: Column[] = [
    {
      key: 'chef_name',
      label: 'Chef Name',
      width: 200,
      render: (v, r: any) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{v as string}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{r.kitchen_name}</div>
        </div>
      ),
    },
    { key: 'society_name', label: 'Society', width: 160 },
    { key: 'orders_count', label: 'Orders', width: 100, render: (v) => <span className="font-semibold">{v as number}</span> },
    { key: 'gross_sales', label: 'Gross Sales', width: 130, render: (v) => <span className="font-bold">₹{v as number}</span> },
    { key: 'platform_commission', label: 'Commission', width: 120, render: (v) => <span className="text-teal-700 font-semibold">₹{v as number}</span> },
    { key: 'net_payout', label: 'Net Payout', width: 130, render: (v) => <span className="font-extrabold text-teal-800 dark:text-teal-300">₹{v as number}</span> },
    { key: 'settlement_status', label: 'Status', width: 120, render: (v) => <Badge label={v as string} tone={getTone(v as string)} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Executive Finance & Operational Reports"
        description="Comprehensive daily/weekly/monthly accounting ledgers and society performance exports"
        actions={
          <Button variant="outline" onClick={handleExportCSV} icon={<Download className="w-4 h-4" />}>
            Export Report CSV
          </Button>
        }
      />

      <ExecutiveFinanceSummaryCards />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {[
          { key: 'chef_daily', label: 'Chef Daily' },
          { key: 'chef_weekly', label: 'Chef Weekly' },
          { key: 'chef_monthly', label: 'Chef Monthly' },
          { key: 'society', label: 'Society Performance' },
          { key: 'ledger', label: 'General Ledger' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as ReportTab)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              tab === t.key
                ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isChefReport && (
        <Table columns={CHEF_COLS} rows={chefReports} isLoading={chefLoading} />
      )}

      {isSocietyReport && (
        <Table
          columns={[
            { key: 'society_name', label: 'Society Name' },
            { key: 'active_chefs', label: 'Active Chefs' },
            { key: 'total_orders', label: 'Total Orders' },
            { key: 'gross_sales', label: 'Gross Sales', render: (v: any) => <span className="font-bold">₹{v}</span> },
          ]}
          rows={societyReports}
          isLoading={societyLoading}
        />
      )}

      {isLedgerReport && (
        <Table
          columns={[
            { key: 'id', label: 'Ledger Entry ID' },
            { key: 'account_code', label: 'Account Code' },
            { key: 'entry_type', label: 'Type', render: (v: any) => <Badge label={String(v)} tone={v === 'DEBIT' ? 'red' : 'green'} /> },
            { key: 'amount', label: 'Amount', render: (v: any) => <span className="font-bold">₹{v}</span> },
          ]}
          rows={ledgerEntries}
          isLoading={ledgerLoading}
        />
      )}
    </div>
  );
}
