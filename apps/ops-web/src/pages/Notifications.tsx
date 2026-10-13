import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/notifications`);
      return data.data;
    },
  });

  const COLS: Column[] = [
    {
      key: 'title',
      label: 'Title',
      width: 220,
      render: (v: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{v}</span>
        </div>
      ),
    },
    { key: 'message', label: 'Message', width: 360 },
    {
      key: 'is_read',
      label: 'Status',
      width: 120,
      render: (v: any) => <Badge label={v ? 'READ' : 'UNREAD'} tone={v ? 'default' : 'blue'} pulse={!v} />,
    },
    {
      key: 'created_at',
      label: 'Time',
      width: 180,
      render: (v: any) => <span className="text-slate-500 dark:text-slate-400 text-xs">{new Date(v).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Notification Center"
        description="Platform broadcast alerts, automated system triggers, and event telemetry"
      />

      {isLoading ? (
        <Table columns={COLS} rows={[]} isLoading={true} />
      ) : isError ? (
        <EmptyState
          title="Failed to Load Notifications"
          description="Permission error or network failure loading notifications."
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Found"
          description="Your notification center is currently empty."
          icon={<Bell className="w-10 h-10 text-teal-600" />}
        />
      ) : (
        <Table columns={COLS} rows={notifications} />
      )}
    </div>
  );
}
