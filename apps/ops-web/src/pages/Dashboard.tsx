import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Table, { Column } from '../components/Table';
import Badge from '../components/Badge';
import { useDashboardData } from '../hooks/useDashboardData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Users,
  ChefHat,
  ShoppingBag,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';

const KITCHEN_COLS: Column[] = [
  {
    key: 'name',
    label: 'Kitchen Name',
    width: 220,
    render: (v, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
          {(v as string)?.[0]?.toUpperCase() || 'K'}
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{v as string}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{row.specialty || 'Home Kitchen'}</div>
        </div>
      </div>
    ),
  },
  { key: 'address', label: 'Location / Address', width: 240 },
  {
    key: 'is_verified',
    label: 'Verification',
    width: 140,
    render: (v) => (
      <Badge
        label={v ? 'VERIFIED' : 'PENDING'}
        tone={v ? 'green' : 'gold'}
      />
    ),
  },
  {
    key: 'created_at',
    label: 'Registered',
    width: 140,
    render: (v) => <span className="text-slate-500 dark:text-slate-400">{new Date(v as string).toLocaleDateString()}</span>,
  },
];

const CONSUMER_COLS: Column[] = [
  {
    key: 'phone',
    label: 'Consumer Details',
    width: 220,
    render: (v, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
          {(row.name || 'G')?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name || (v ? `+${v}` : 'Guest User')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Role: {row.role || 'consumer'}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    render: (v) => <Badge label={(v as string)?.toUpperCase() || 'ACTIVE'} tone="green" />,
  },
  {
    key: 'created_at',
    label: 'Joined Date',
    width: 140,
    render: (v) => <span className="text-slate-500 dark:text-slate-400">{new Date(v as string).toLocaleDateString()}</span>,
  },
];

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardData();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description="Could not connect to live backend services. Please check your network or refresh."
        icon={<AlertCircle className="w-12 h-12 text-rose-500" />}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header View */}
      <PageHeader
        title="Executive Operations & CRM Overview"
        description={`Live Operations Telemetry • ${today}`}
        badge={<Badge label="Connected" tone="green" pulse />}
      />

      {/* Primary Connected Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Consumers"
          value={stats?.total_users || 0}
          trend="Active Platform"
          trendUp={true}
          accent="#3B82F6"
        />
        <StatCard
          icon={<ChefHat className="w-5 h-5" />}
          label="Home Kitchens / Chefs"
          value={stats?.total_chefs || 0}
          trend={`${stats?.pending_verification || 0} pending review`}
          trendUp={true}
          accent="#0F766E"
        />
        <StatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Orders Today"
          value={stats?.todays_orders || 0}
          trend="Live Dispatch"
          trendUp={true}
          accent="#F59E0B"
        />
        <StatCard
          icon={<IndianRupee className="w-5 h-5" />}
          label="Today's GMV"
          value={`₹${(stats?.todays_revenue || 0).toLocaleString('en-IN')}`}
          trend="Live Revenue"
          trendUp={true}
          accent="#10B981"
        />
      </div>

      {/* Executive Activity Visualizer */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Live Platform Performance & Analytics</CardTitle>
            <CardDescription>Real-time ecosystem health across registered societies & kitchens</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> 99.9% Uptime
            </span>
          </div>
        </CardHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Revenue Bar Visualizer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Dispatch</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              ₹{(stats?.todays_revenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-end gap-1.5 h-16 pt-2">
              {[40, 65, 30, 85, 55, 90, 70, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-teal-100 dark:bg-teal-950 rounded-t-sm relative overflow-hidden group">
                  <div
                    className="absolute bottom-0 inset-x-0 bg-teal-600 dark:bg-teal-500 transition-all duration-300 group-hover:bg-emerald-500"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Onboarding Metric */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kitchen Verification</span>
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              {stats?.total_chefs || 0} Registered
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats?.total_chefs || 1) * 10)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {stats?.pending_verification || 0} awaiting KYC approval
            </div>
          </div>

          {/* User Onboarding Metric */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Consumer Base</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              {stats?.total_users || 0} Consumers
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats?.total_users || 1) * 5)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active across platform societies
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Chef Side Information (Recent Kitchens) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Chef Side Information (Registered Kitchens)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest home kitchens registered for onboarding and verification</p>
          </div>
          <Link
            to="/kitchens"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
          >
            <span>View All Kitchens</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_kitchens && stats.recent_kitchens.length > 0 ? (
          <Table columns={KITCHEN_COLS} rows={stats.recent_kitchens} />
        ) : (
          <EmptyState
            title="No Kitchens Registered"
            description="There are currently no recent kitchens in the onboarding queue."
          />
        )}
      </section>

      {/* Connected Consumer Side Information (Recent Users) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Consumer Side Information (Registered Users)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent consumers onboarded onto the platform</p>
          </div>
          <Link
            to="/consumers"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
          >
            <span>View All Consumers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_consumers && stats.recent_consumers.length > 0 ? (
          <Table columns={CONSUMER_COLS} rows={stats.recent_consumers} />
        ) : (
          <EmptyState
            title="No Recent Consumers"
            description="There are currently no recent consumers onboarded."
          />
        )}
      </section>
    </div>
  );
}
