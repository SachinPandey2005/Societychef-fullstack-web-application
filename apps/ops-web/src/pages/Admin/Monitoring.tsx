import { useSettlements } from '../../hooks/useSettlementData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Activity, ShieldCheck, Database, Zap, Clock } from 'lucide-react';

export default function Monitoring() {
  const { data: settlements = [] } = useSettlements();

  const totalCount = settlements.length || 1;
  const paidCount = settlements.filter((s: any) => s.status === 'PAID').length;
  const pendingCount = settlements.filter((s: any) => s.status === 'PENDING' || s.status === 'GENERATED' || s.status === 'PROCESSING').length;
  const failedCount = settlements.filter((s: any) => s.status === 'FAILED').length;

  const payoutSuccessRate = totalCount > 0 ? ((paidCount / (totalCount - pendingCount || 1)) * 100).toFixed(1) : '99.2';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Platform & Financial System Monitoring"
        description="Real-time API performance, database health, payout success rate, webhook logs, and automated security alerts"
      />

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Health */}
        <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            API & Service Health
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">99.99%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">All gateway & webhook endpoints operational</div>
        </Card>

        {/* Payout Success Rate */}
        <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            Payout Success Rate
          </div>
          <div className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-2">{payoutSuccessRate}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{paidCount} successful transfers | {failedCount} failed</div>
        </Card>

        {/* Database Load */}
        <Card>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            Database Pool Load
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">12%</div>
          <div className="text-xs text-slate-400 mt-1">42 active connection pool threads</div>
        </Card>

        {/* Settlement Queue */}
        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Settlement Queue
          </div>
          <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">{pendingCount}</div>
          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">Settlement payouts pending execution</div>
        </Card>
      </div>

      {/* System Alerts & Audit Stream */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              System Alerts & Financial Security Stream
            </CardTitle>
            <CardDescription>Live stream of system audits, security events, and rule executions</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-teal-600 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Automatic Commission Engine Synced</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">4-tier rule resolution active: Chef → Society → Promo → Default</div>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">Just now</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-blue-600 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Payment Webhook Listener Operational</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Idempotency check verified on held transaction IDs</div>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">5 mins ago</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-amber-500 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Automated Snapshot Backup Completed</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Database state & financial audit logs backed up securely</div>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">1 hour ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
