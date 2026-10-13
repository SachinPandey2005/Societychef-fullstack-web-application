import StatCard from '../StatCard';
import T from '../../tokens';
import { CardSkeleton } from './FinanceSkeleton';

interface FinanceKpiGridProps {
  data?: any;
  isLoading: boolean;
}

export default function FinanceKpiGrid({ data, isLoading }: FinanceKpiGridProps) {
  if (isLoading || !data) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const {
    todays_revenue,
    todays_orders,
    pending_chef_payouts,
    platform_commission,
    chef_earnings,
    monthly_revenue,
  } = data;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginBottom: 28,
    }}>
      {/* 1. Today's Revenue */}
      <StatCard
        icon="💵"
        label="Today's Revenue"
        value={`₹${(todays_revenue?.amount || 0).toLocaleString('en-IN')}`}
        trend={`${(todays_revenue?.growth_vs_yesterday || 0) >= 0 ? '+' : ''}${todays_revenue?.growth_vs_yesterday || 0}% vs yest.`}
        trendUp={(todays_revenue?.growth_vs_yesterday || 0) >= 0}
        accent={T.gold}
      />

      {/* 2. Today's Orders */}
      <StatCard
        icon="📦"
        label={`Completed: ${todays_orders?.completed || 0} | Pending: ${todays_orders?.pending || 0}`}
        value={`${todays_orders?.total || 0} Orders`}
        trend={`${todays_orders?.cancelled || 0} cancelled`}
        trendUp={false}
        accent={T.blue}
      />

      {/* 3. Pending Chef Payouts */}
      <StatCard
        icon="⏳"
        label={`${pending_chef_payouts?.pending_count || 0} Pending Settlements`}
        value={`₹${(pending_chef_payouts?.pending_amount || 0).toLocaleString('en-IN')}`}
        trend="Pending Action"
        trendUp={false}
        accent={T.red}
      />

      {/* 4. Platform Commission */}
      <StatCard
        icon="🏦"
        label={`Today: ₹${(platform_commission?.today || 0).toLocaleString('en-IN')} | Mtd: ₹${(platform_commission?.monthly || 0).toLocaleString('en-IN')}`}
        value={`₹${(platform_commission?.weekly || 0).toLocaleString('en-IN')}`}
        trend="7-Day Comm."
        trendUp={true}
        accent={T.primary}
      />

      {/* 5. Chef Net Earnings */}
      <StatCard
        icon="👨‍🍳"
        label={`Paid: ₹${(chef_earnings?.paid || 0).toLocaleString('en-IN')} | Pending: ₹${(chef_earnings?.pending || 0).toLocaleString('en-IN')}`}
        value={`₹${(chef_earnings?.total || 0).toLocaleString('en-IN')}`}
        trend="Total Earned"
        trendUp={true}
        accent={T.primaryDeep}
      />

      {/* 6. Monthly Revenue */}
      <StatCard
        icon="📈"
        label="Monthly Gross Volume"
        value={`₹${(monthly_revenue?.amount || 0).toLocaleString('en-IN')}`}
        trend={`${(monthly_revenue?.monthly_growth || 0) >= 0 ? '+' : ''}${monthly_revenue?.monthly_growth || 0}% MoM`}
        trendUp={(monthly_revenue?.monthly_growth || 0) >= 0}
        accent={T.gold}
      />
    </div>
  );
}
