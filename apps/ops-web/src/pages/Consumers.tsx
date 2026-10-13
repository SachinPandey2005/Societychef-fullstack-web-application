import { useState } from 'react';
import { Link } from 'react-router-dom';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { useConsumers, useUpdateUserStatus } from '../hooks/useCrmData';
import { useDashboardStore } from '../store/useDashboardStore';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Users, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'all' | 'ACTIVE' | 'SUSPENDED';

function statusTone(s: string): 'green' | 'red' | 'default' {
  if (s === 'ACTIVE') return 'green';
  if (s === 'SUSPENDED') return 'red';
  return 'default';
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Consumers' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SUSPENDED', label: 'Suspended' },
];

export default function Consumers() {
  const [tab, setTab] = useState<Tab>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const [notification, setNotification] = useState<string | null>(null);

  const { data: consumers = [], isLoading, isError } = useConsumers();
  const updateStatus = useUpdateUserStatus();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  const handleUpdateStatus = (id: string, status: string, name: string) => {
    setLoadingId(id);
    updateStatus.mutate(
      { id, type: 'customers', status, reason: 'Ops action' },
      {
        onSuccess: () => {
          setLoadingId(null);
          showNotification(`Successfully updated ${name || 'Consumer'} status to ${status}`);
        },
        onError: (err: any) => {
          setLoadingId(null);
          showNotification(`Failed to update status: ${err?.response?.data?.message || err?.message || 'Server error'}`);
        },
      }
    );
  };

  const filtered = consumers.filter((c: any) => {
    const statusUpper = (c.status || '').toUpperCase();
    const matchesTab = tab === 'all' || statusUpper === tab;
    const matchesSearch = !searchQuery || 
      (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone_number || '').includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const COLS: Column[] = [
    {
      key: 'full_name',
      label: 'Consumer Name',
      width: 240,
      render: (v, row: any) => (
        <Link to={`/crm/customers/${row.id}`} className="group flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
            {(v as string)?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="font-semibold text-teal-700 dark:text-teal-400 group-hover:underline flex items-center gap-1">
              {v as string}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{row.email}</div>
          </div>
        </Link>
      ),
    },
    { key: 'phone_number', label: 'Phone Number', width: 160 },
    {
      key: 'status',
      label: 'Status',
      width: 130,
      render: (v) => {
        const valUpper = (v as string || '').toUpperCase();
        return <Badge label={valUpper} tone={statusTone(valUpper)} />;
      },
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      width: 150,
      render: (v) => <span className="text-slate-500 dark:text-slate-400">{new Date(v as string).toLocaleDateString()}</span>,
    },
    {
      key: 'id',
      label: 'Actions',
      width: 180,
      align: 'right',
      render: (_v, row: any) => {
        const statusUpper = (row.status || '').toUpperCase();
        const isActive = statusUpper === 'ACTIVE' || statusUpper === 'APPROVED';
        const isSuspended = statusUpper === 'SUSPENDED';
        const isLoadingRow = loadingId === row.id;

        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                disabled={isLoadingRow}
                className="text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                onClick={() => handleUpdateStatus(row.id, 'SUSPENDED', row.full_name)}
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
              >
                {isLoadingRow ? 'Suspending...' : 'Suspend'}
              </Button>
            )}
            {isSuspended && (
              <Button
                size="sm"
                variant="outline"
                disabled={isLoadingRow}
                className="text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 border-teal-200 dark:border-teal-800"
                onClick={() => handleUpdateStatus(row.id, 'ACTIVE', row.full_name)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                {isLoadingRow ? 'Reactivating...' : 'Reactivate'}
              </Button>
            )}
          </div>
        );
      },
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
        title="Registered Consumers"
        description="Manage all consumers registered across housing societies on the platform"
        actions={
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search consumers by name, email, phone..."
          />
        }
      />

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
          title="Failed to Load Consumers"
          description="Permission error or network failure loading consumer records."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Consumers Found"
          description="No registered consumer records matching your search or filter."
          icon={<Users className="w-10 h-10 text-blue-600" />}
        />
      ) : (
        <Table
          columns={COLS}
          rows={filtered as unknown as Record<string, unknown>[]}
        />
      )}
    </div>
  );
}
