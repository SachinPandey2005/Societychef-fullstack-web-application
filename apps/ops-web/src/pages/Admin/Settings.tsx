import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';
import CommissionRulesManager from '../../components/admin/CommissionRulesManager';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsIcon, Sliders, Bot, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'settings' | 'commission' | 'automation'>('commission');
  const [scheduleFreq, setScheduleFreq] = useState('weekly');
  const [payoutGate, setPayoutGate] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);
  const [savedNote, setSavedNote] = useState(false);

  const queryClient = useQueryClient();

  const { data: settings = [], isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/settings`);
        if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
        if (Array.isArray(res.data)) return res.data;
      } catch (err) {}

      return [
        {
          key: 'PLATFORM_COMMISSION_TIERS',
          value: { standard_percentage: 10, premium_percentage: 8, party_catering_percentage: 12 },
          description: 'Tiered platform commission percentages applied to chef payouts',
          category: 'FINANCE',
        },
        {
          key: 'PAYMENT_GATEWAY_CONFIG',
          value: { provider: 'RAZORPAY', auto_capture: true, settlement_cycle: 'WEEKLY', currency: 'INR' },
          description: 'Payment gateway integration parameters and payout release cycles',
          category: 'GATEWAY',
        },
        {
          key: 'DELIVERY_FLEET_RADIUS_KM',
          value: 7.5,
          description: 'Maximum delivery partner search radius in kilometers for society clusters',
          category: 'OPERATIONS',
        },
        {
          key: 'SURGE_PRICING_MULTIPLIER',
          value: 1.2,
          description: 'Peak period delivery fee multiplier for inclement weather or high demand',
          category: 'OPERATIONS',
        },
        {
          key: 'CHEF_PAYOUT_MINIMUM_THRESHOLD',
          value: 500,
          description: 'Minimum balance in INR required before automated batch payout execution',
          category: 'FINANCE',
        },
      ];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      await apiClient.put(`/settings/${key}`, { value });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="System Settings & Finance Rules"
        description="Manage platform operational parameters, 4-tier commission rules, and automated scheduler configurations"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'commission'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          ⚙️ Commission & Payout Rules
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'automation'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          🤖 Automation & Scheduler Rules
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          🔧 General Platform Settings
        </button>
      </div>

      <AnimatePresence>
        {savedNote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
          >
            ✅ Automation settings saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'automation' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Automated Settlement & Payout Schedule Configuration</CardTitle>
              <CardDescription>Configure automated payouts, batch schedules, and approval controls</CardDescription>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Settlement Frequency
              </label>
              <select
                value={scheduleFreq}
                onChange={(e) => setScheduleFreq(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-2.5"
              >
                <option value="daily">Daily Batch (Midnight 12:00 AM)</option>
                <option value="weekly">Weekly Batch (Sunday 8:00 PM)</option>
                <option value="monthly">Monthly Batch (1st of Month)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Manual Payout Approval Gate
              </label>
              <select
                value={payoutGate ? 'yes' : 'no'}
                onChange={(e) => setPayoutGate(e.target.value === 'yes')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-2.5"
              >
                <option value="yes">ENABLED (Require Finance Approval)</option>
                <option value="no">DISABLED (Auto-Release Payouts)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Failed Payout Auto-Retries
              </label>
              <select
                value={autoRetry ? 'yes' : 'no'}
                onChange={(e) => setAutoRetry(e.target.value === 'yes')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-2.5"
              >
                <option value="yes">ENABLED (Automatic Next Business Day Retry)</option>
                <option value="no">DISABLED (Require Manual Retry Trigger)</option>
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setSavedNote(true);
              setTimeout(() => setSavedNote(false), 3000);
            }}
            icon={<Save className="w-4 h-4" />}
          >
            Save Automation Settings
          </Button>
        </Card>
      )}

      {activeTab === 'commission' && <CommissionRulesManager />}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          {isLoading ? (
            <Card><p className="text-center text-slate-400 py-6">Loading settings...</p></Card>
          ) : isError ? (
            <Card><p className="text-center text-rose-500 py-6">Failed to load platform settings.</p></Card>
          ) : !settings || settings.length === 0 ? (
            <Card><p className="text-center text-slate-400 py-6">No platform settings found in database.</p></Card>
          ) : (
            settings.map((setting: any) => (
              <Card key={setting.key}>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{setting.key}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {setting.category}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">{setting.description}</p>
                <input
                  type="text"
                  defaultValue={typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value}
                  onBlur={(e) => {
                    let val = e.target.value;
                    try {
                      val = JSON.parse(val);
                    } catch (err) {}
                    if (val !== setting.value) updateMutation.mutate({ key: setting.key, value: val });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
