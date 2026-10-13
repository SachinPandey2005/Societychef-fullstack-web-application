import { useState } from 'react';
import Table, { Column } from '../../components/Table';
import Badge from '../../components/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

function getActionTone(action: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  const act = action?.toUpperCase() || '';
  if (act.includes('PAY') || act.includes('PAID') || act.includes('SUCCESS')) return 'green';
  if (act.includes('GENERATE') || act.includes('CREATE') || act.includes('UPDATE')) return 'blue';
  if (act.includes('PENDING') || act.includes('RETRY') || act.includes('RULE')) return 'gold';
  if (act.includes('FAIL') || act.includes('CANCEL') || act.includes('DELETE')) return 'red';
  return 'default';
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', page, filter],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/crm/audit-logs`, {
          params: { page, limit: 50, query: filter || undefined },
        });
        return res.data?.data || res.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const COLS: Column[] = [
    {
      key: 'created_at',
      label: 'Timestamp',
      width: 170,
      render: (v) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {v ? new Date(v as string).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actor_id',
      label: 'Actor ID & Role',
      width: 160,
      render: (v, row: any) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            #{(v as string)?.substring(0, 8) || 'SYSTEM'}
          </span>
          {row.actor_role && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Role: {row.actor_role}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      width: 220,
      render: (v) => <Badge label={v as string} tone={getActionTone(v as string)} />,
    },
    {
      key: 'target_entity',
      label: 'Target Entity',
      width: 180,
      render: (_, row: any) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {row.target_entity || 'entity'}: #{(row.target_entity_id as string)?.substring(0, 8) || 'N/A'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Audit Details & Reason',
      width: 260,
      render: (v, row: any) => (
        <div>
          <div className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-normal">
            {(v as string) || 'Financial action executed'}
          </div>
          {row.ip_address && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              IP: {row.ip_address}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Financial Security & System Audit Logs"
        description="Immutable, traceable audit trail of all financial transactions, payouts, settlement generation, and rules mutations"
        actions={
          <SearchBar
            value={filter}
            onChange={(val) => {
              setFilter(val);
              setPage(1);
            }}
            placeholder="Filter by action or entity..."
            className="w-64 sm:w-80"
          />
        }
      />

      {isLoading ? (
        <Table columns={COLS} rows={[]} isLoading={true} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          description={filter ? "No audit log entries match your filter criteria." : "No financial security audit logs recorded yet."}
          icon={<ShieldCheck className="w-10 h-10 text-teal-600" />}
          actionLabel={filter ? "Clear Filter" : undefined}
          onAction={filter ? () => setFilter('') : undefined}
        />
      ) : (
        <Table columns={COLS} rows={logs} />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2 text-xs">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          icon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Previous
        </Button>
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          Page <strong className="text-slate-900 dark:text-slate-100 font-bold">{page}</strong>
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={logs.length < 50}
          onClick={() => setPage((p) => p + 1)}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
