import React, { useState } from 'react';
import Table from '../components/Table';
import Badge from '../components/Badge';
import {
  useRefunds,
  useProcessRefund,
  useFinancialAdjustments,
  useCreateFinancialAdjustment,
  useDisputes,
  useUpdateDisputeStatus,
} from '../hooks/useFinanceData';
import { useDashboardStore } from '../store/useDashboardStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { SearchBar } from '../components/ui/SearchBar';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'refunds' | 'adjustments' | 'disputes';

function getBadgeTone(status: string): 'green' | 'gold' | 'blue' | 'red' | 'default' {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'CREDIT': return 'green';
    case 'PENDING':
    case 'INVESTIGATING':
    case 'PROCESSING': return 'gold';
    case 'REJECTED':
    case 'FAILED':
    case 'DEBIT':
    case 'URGENT':
    case 'HIGH': return 'red';
    default: return 'default';
  }
}

export default function Finance() {
  const [activeTab, setActiveTab] = useState<SubTab>('refunds');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ order_id: '', amount: '', reason: '', type: 'FULL' });

  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    adjustment_type: 'WALLET_CORRECTION',
    target_type: 'CHEF',
    target_id: '',
    amount: '',
    entry_type: 'CREDIT',
    reason: '',
    supporting_notes: '',
  });

  const [resolvingDispute, setResolvingDispute] = useState<any | null>(null);
  const [disputeForm, setDisputeForm] = useState({ status: 'RESOLVED', resolution_notes: '' });

  const { searchQuery, setSearchQuery } = useDashboardStore();

  const { data: refunds = [], isLoading: refundsLoading } = useRefunds();
  const { data: adjustments = [], isLoading: adjLoading } = useFinancialAdjustments();
  const { data: disputes = [], isLoading: disputesLoading } = useDisputes();

  const processRefund = useProcessRefund();
  const createAdjustment = useCreateFinancialAdjustment();
  const updateDispute = useUpdateDisputeStatus();

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.order_id || !refundForm.amount) return;
    processRefund.mutate(
      {
        order_id: refundForm.order_id,
        amount: parseFloat(refundForm.amount),
        reason: refundForm.reason,
        type: refundForm.type as 'FULL' | 'PARTIAL',
      },
      {
        onSuccess: () => {
          showNotification('Refund request processed successfully');
          setShowRefundModal(false);
          setRefundForm({ order_id: '', amount: '', reason: '', type: 'FULL' });
        },
      }
    );
  };

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.target_id || !adjForm.amount) return;
    createAdjustment.mutate(
      {
        adjustment_type: adjForm.adjustment_type,
        target_type: adjForm.target_type as any,
        target_id: adjForm.target_id,
        amount: parseFloat(adjForm.amount),
        entry_type: adjForm.entry_type as any,
        reason: adjForm.reason,
        supporting_notes: adjForm.supporting_notes,
      },
      {
        onSuccess: () => {
          showNotification('Financial adjustment entry created successfully');
          setShowAdjModal(false);
          setAdjForm({
            adjustment_type: 'WALLET_CORRECTION',
            target_type: 'CHEF',
            target_id: '',
            amount: '',
            entry_type: 'CREDIT',
            reason: '',
            supporting_notes: '',
          });
        },
      }
    );
  };

  const handleDisputeResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute) return;
    updateDispute.mutate(
      {
        id: resolvingDispute.id,
        status: disputeForm.status,
        resolution_notes: disputeForm.resolution_notes,
      },
      {
        onSuccess: () => {
          showNotification(`Dispute updated to ${disputeForm.status}`);
          setResolvingDispute(null);
        },
      }
    );
  };

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
        title="Finance Operations & Ledger Controls"
        description="Process customer refunds, manual wallet adjustments, and dispute arbitrations"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search ID, customer, kitchen..."
            />
            {activeTab === 'refunds' && (
              <Button variant="primary" onClick={() => setShowRefundModal(true)} icon={<Plus className="w-4 h-4" />}>
                New Refund
              </Button>
            )}
            {activeTab === 'adjustments' && (
              <Button variant="primary" onClick={() => setShowAdjModal(true)} icon={<Plus className="w-4 h-4" />}>
                Create Entry
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'refunds'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          🔄 Customer Refunds ({refunds.length})
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'adjustments'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          💰 Financial Adjustments ({adjustments.length})
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 font-bold bg-white dark:bg-slate-900'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          ⚖️ Dispute Cases ({disputes.length})
        </button>
      </div>

      {activeTab === 'refunds' && (
        <Table
          isLoading={refundsLoading}
          columns={[
            { key: 'id', label: 'Refund ID', render: (v: any) => <span className="font-mono text-xs font-bold">#{(v as string)?.substring(0, 8)}</span> },
            { key: 'order_id', label: 'Order ID', render: (v: any) => <span className="font-mono text-xs text-teal-700">#{(v as string)?.substring(0, 8)}</span> },
            { key: 'amount', label: 'Amount', render: (v: any) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v as React.ReactNode}</span> },
            { key: 'type', label: 'Type' },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: (v: any) => <Badge label={String(v)} tone={getBadgeTone(String(v))} /> },
            { key: 'created_at', label: 'Date', render: (v: any) => v ? new Date(String(v)).toLocaleDateString() : 'N/A' },
          ]}
          rows={refunds}
        />
      )}

      {activeTab === 'adjustments' && (
        <Table
          isLoading={adjLoading}
          columns={[
            { key: 'id', label: 'Adj ID', render: (v: any) => <span className="font-mono text-xs font-bold">#{(v as string)?.substring(0, 8)}</span> },
            { key: 'target_type', label: 'Target Type' },
            { key: 'adjustment_type', label: 'Adjustment' },
            { key: 'amount', label: 'Amount', render: (v: any) => <span className="font-bold">₹{v as React.ReactNode}</span> },
            { key: 'entry_type', label: 'Entry', render: (v: any) => <Badge label={String(v)} tone={v === 'CREDIT' ? 'green' : 'red'} /> },
            { key: 'reason', label: 'Reason' },
          ]}
          rows={adjustments}
        />
      )}

      {activeTab === 'disputes' && (
        <Table
          isLoading={disputesLoading}
          columns={[
            { key: 'id', label: 'Dispute ID', render: (v: any) => <span className="font-mono text-xs font-bold">#{(v as string)?.substring(0, 8)}</span> },
            { key: 'order_id', label: 'Order ID', render: (v: any) => <span className="font-mono text-xs text-teal-700">#{(v as string)?.substring(0, 8)}</span> },
            { key: 'dispute_reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: (v: any) => <Badge label={String(v)} tone={getBadgeTone(String(v))} /> },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (_: any, r: any) => (
                <Button size="sm" variant="outline" onClick={() => setResolvingDispute(r)}>
                  Arbitrate Case
                </Button>
              ),
            },
          ]}
          rows={disputes}
        />
      )}

      {/* New Refund Modal */}
      <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title="Process New Refund">
        <form onSubmit={handleRefundSubmit} className="space-y-4">
          <Input
            label="Order ID"
            value={refundForm.order_id}
            onChange={(e) => setRefundForm({ ...refundForm, order_id: e.target.value })}
            placeholder="Enter Order ID"
          />
          <Input
            label="Refund Amount (₹)"
            type="number"
            value={refundForm.amount}
            onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Reason"
            value={refundForm.reason}
            onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
            placeholder="Reason for refund..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Refund</Button>
          </div>
        </form>
      </Modal>

      {/* New Adjustment Modal */}
      <Modal isOpen={showAdjModal} onClose={() => setShowAdjModal(false)} title="Create Financial Adjustment">
        <form onSubmit={handleAdjSubmit} className="space-y-4">
          <Input
            label="Target ID (Chef/Partner/Customer ID)"
            value={adjForm.target_id}
            onChange={(e) => setAdjForm({ ...adjForm, target_id: e.target.value })}
            placeholder="Target Profile ID"
          />
          <Input
            label="Adjustment Amount (₹)"
            type="number"
            value={adjForm.amount}
            onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Reason"
            value={adjForm.reason}
            onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
            placeholder="Reason..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdjModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Adjustment</Button>
          </div>
        </form>
      </Modal>

      {/* Arbitrate Dispute Modal */}
      <Modal isOpen={Boolean(resolvingDispute)} onClose={() => setResolvingDispute(null)} title="Arbitrate Dispute Case">
        {resolvingDispute && (
          <form onSubmit={handleDisputeResolve} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
              <div><strong>Dispute ID:</strong> #{resolvingDispute.id?.substring(0, 8)}</div>
              <div><strong>Reason:</strong> {resolvingDispute.dispute_reason}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
              <select
                value={disputeForm.status}
                onChange={(e) => setDisputeForm({ ...disputeForm, status: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Resolution Rationale</label>
              <textarea
                value={disputeForm.resolution_notes}
                onChange={(e) => setDisputeForm({ ...disputeForm, resolution_notes: e.target.value })}
                placeholder="Enter notes on arbitration decision..."
                className="w-full h-20 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setResolvingDispute(null)}>Cancel</Button>
              <Button variant="primary" type="submit">Update Dispute</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
