import React from 'react';
import { OrderFilterState } from '../../hooks/useCrmData';
import { Filter, RotateCcw } from 'lucide-react';

interface OrderFilterBarProps {
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
}

export default function OrderFilterBar({ filters, onChange }: OrderFilterBarProps) {
  const handleUpdate = (key: keyof OrderFilterState, value: string) => {
    onChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Advanced Financial Filters</span>
        </div>

        <button
          onClick={() => onChange({})}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Payment Status */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus || 'all'}
            onChange={(e) => handleUpdate('paymentStatus', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Payment Statuses</option>
            <option value="SUCCESSFUL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Successful / Paid</option>
            <option value="PENDING" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Pending</option>
            <option value="FAILED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Failed</option>
            <option value="REFUNDED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Refunded</option>
          </select>
        </div>

        {/* 2. Settlement Status */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Settlement Status
          </label>
          <select
            value={filters.settlementStatus || 'all'}
            onChange={(e) => handleUpdate('settlementStatus', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Settlement Statuses</option>
            <option value="PENDING" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Pending</option>
            <option value="GENERATED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Generated</option>
            <option value="PROCESSING" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Processing</option>
            <option value="PAID" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Paid / Completed</option>
            <option value="FAILED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Failed</option>
          </select>
        </div>

        {/* 3. Payment Method */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod || 'all'}
            onChange={(e) => handleUpdate('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Payment Methods</option>
            <option value="UPI" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">UPI (GPay / PhonePe)</option>
            <option value="Card" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cards (Credit/Debit)</option>
            <option value="Net Banking" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Net Banking</option>
            <option value="Wallet" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Wallet</option>
            <option value="COD" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cash on Delivery</option>
          </select>
        </div>

        {/* 4. Timeframe */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Date Period
          </label>
          <select
            value={filters.range || 'all'}
            onChange={(e) => handleUpdate('range', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Time</option>
            <option value="today" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Today</option>
            <option value="yesterday" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Yesterday</option>
            <option value="7days" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 7 Days</option>
            <option value="30days" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 30 Days</option>
            <option value="this_month" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">This Month</option>
            <option value="last_month" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
