import { useState } from 'react';
import Table, { Column } from '../components/Table';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import {
  useTopChefs,
  useTopKitchens,
} from '../hooks/useChefEarnings';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { BarChart3, TrendingUp, DollarSign, Award, ChefHat, Store } from 'lucide-react';

export default function Analytics() {
  const [chefSortBy, setChefSortBy] = useState('revenue');
  const [kitchenSortBy, setKitchenSortBy] = useState('revenue');

  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await apiClient.get(`/analytics/overview`)).data.data,
  });

  const { data: topChefs = [], isLoading: chefsLoading } = useTopChefs(5, chefSortBy);
  const { data: topKitchens = [], isLoading: kitchensLoading } = useTopKitchens(5, kitchenSortBy);

  const CHEF_LEADERBOARD_COLS: Column[] = [
    {
      key: 'chef_name',
      label: 'Chef & Kitchen',
      width: 220,
      render: (_, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
            👨‍🍳
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{row.chef_name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{row.kitchen_name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'orders_count',
      label: 'Delivered Orders',
      width: 140,
      render: (v) => <span className="font-semibold">{v as number}</span>,
    },
    {
      key: 'gross_revenue',
      label: 'Gross Revenue',
      width: 150,
      render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{(v as number)?.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'net_earnings',
      label: 'Net Earnings',
      width: 150,
      render: (v) => <span className="font-extrabold text-teal-700 dark:text-teal-400">₹{(v as number)?.toLocaleString('en-IN')}</span>,
    },
  ];

  const KITCHEN_LEADERBOARD_COLS: Column[] = [
    {
      key: 'name',
      label: 'Kitchen Name',
      width: 220,
      render: (v, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{v as string}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{row.specialty || 'Home Kitchen'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'orders_count',
      label: 'Orders Processed',
      width: 140,
      render: (v) => <span className="font-semibold">{v as number || 0}</span>,
    },
    {
      key: 'gross_revenue',
      label: 'Kitchen Revenue',
      width: 150,
      render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{(v as number || 0)?.toLocaleString('en-IN')}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Executive Performance & Revenue Analytics"
        description="Comprehensive analytics dashboard for GMV, commission margins, chef leaderboards, and payout metrics"
      />

      {/* Overview Stat Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between text-teal-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              ₹{(overview?.total_gmv || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">All-time sales volume</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Net Platform Margin</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              ₹{(overview?.platform_commission || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">Platform commissions earned</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Delivered Orders</span>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {overview?.completed_orders || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Successful dispatches</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Active Kitchens</span>
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {overview?.active_kitchens || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Onboarded home chefs</div>
          </Card>
        </div>
      )}

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Chefs Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top Performing Chefs
                </CardTitle>
                <CardDescription>Rankings based on revenue generation and order volume</CardDescription>
              </div>
              <select
                value={chefSortBy}
                onChange={(e) => setChefSortBy(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="orders">Sort by Orders</option>
              </select>
            </div>
          </CardHeader>
          <Table columns={CHEF_LEADERBOARD_COLS} rows={topChefs} isLoading={chefsLoading} />
        </Card>

        {/* Top Kitchens Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-500" />
                  Top Kitchen Outlets
                </CardTitle>
                <CardDescription>Highest revenue home kitchens across housing societies</CardDescription>
              </div>
              <select
                value={kitchenSortBy}
                onChange={(e) => setKitchenSortBy(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="orders">Sort by Orders</option>
              </select>
            </div>
          </CardHeader>
          <Table columns={KITCHEN_LEADERBOARD_COLS} rows={topKitchens} isLoading={kitchensLoading} />
        </Card>
      </div>
    </div>
  );
}
