import { useState } from 'react';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { useTickets, useUpdateTicketStatus } from '../hooks/useCrmData';
import { useDashboardStore } from '../store/useDashboardStore';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Headphones, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Tickets' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
];

function getPriorityTone(priority: string): 'red' | 'gold' | 'default' {
  if (priority === 'HIGH' || priority === 'URGENT') return 'red';
  if (priority === 'MEDIUM') return 'gold';
  return 'default';
}

function getStatusTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status) {
    case 'OPEN': return 'red';
    case 'IN_PROGRESS': return 'gold';
    case 'RESOLVED': return 'green';
    default: return 'default';
  }
}

export default function Support() {
  const [tab, setTab] = useState<Tab>('all');
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const [notification, setNotification] = useState<string | null>(null);

  const { data: tickets = [], isLoading, isError } = useTickets();
  const updateStatus = useUpdateTicketStatus();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }

  const filtered = tickets.filter((t: any) => {
    const matchesTab = tab === 'all' || t.status === tab;
    const matchesSearch = !searchQuery || 
      (t.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => showNotification(`Ticket status updated to ${status}`)
    });
  };

  const COLS: Column[] = [
    {
      key: 'id',
      label: 'Ticket ID',
      width: 110,
      render: (v) => <span className="font-mono font-bold text-teal-700 dark:text-teal-400">#{(v as string).split('-')[0]}</span>,
    },
    {
      key: 'subject',
      label: 'Subject',
      width: 260,
      render: (v) => <span className="font-semibold text-slate-900 dark:text-slate-100">{v as string}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 110,
      render: (v) => <Badge label={v as string} tone={getPriorityTone(v as string)} pulse={v === 'URGENT' || v === 'HIGH'} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 130,
      render: (v) => <Badge label={v as string} tone={getStatusTone(v as string)} />,
    },
    {
      key: 'created_at',
      label: 'Opened At',
      width: 160,
      render: (v) => <span className="text-slate-500 dark:text-slate-400 text-xs">{new Date(v as string).toLocaleString()}</span>,
    },
    {
      key: 'id',
      label: 'Actions',
      width: 220,
      align: 'right',
      render: (_v, row: any) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status !== 'IN_PROGRESS' && row.status !== 'RESOLVED' && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800"
              onClick={() => handleUpdateStatus(row.id, 'IN_PROGRESS')}
              icon={<Clock className="w-3.5 h-3.5" />}
            >
              In Progress
            </Button>
          )}
          {row.status !== 'RESOLVED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleUpdateStatus(row.id, 'RESOLVED')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Resolve
            </Button>
          )}
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
        title="Support Desk & Customer Care"
        description="Manage consumer and chef support tickets, escalations, and resolution SLAs"
        actions={
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tickets by ID, subject..."
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
          title="Failed to Load Support Tickets"
          description="Permission error or network failure loading tickets."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Support Tickets Found"
          description="No customer support tickets match your search or filter."
          icon={<Headphones className="w-10 h-10 text-teal-600" />}
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
