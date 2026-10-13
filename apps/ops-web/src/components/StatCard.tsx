import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode | string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
  subtitle?: string;
}

export default function StatCard({ icon, label, value, trend, trendUp, accent, subtitle }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 group"
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: accent }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 group-hover:scale-110 transition-transform duration-200">
          {typeof icon === 'string' ? <span className="text-xl">{icon}</span> : icon}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trendUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {label}
        </div>
        {subtitle && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}
