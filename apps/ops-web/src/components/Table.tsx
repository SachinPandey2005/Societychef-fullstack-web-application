import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Inbox } from 'lucide-react';

export interface Column {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  expandedRow?: string | null;
  expandContent?: (row: Record<string, unknown>) => React.ReactNode;
  rowKey?: string;
  isLoading?: boolean;
}

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < bp);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [bp]);
  return mobile;
}

export default function Table({
  columns,
  rows,
  onRowClick,
  expandedRow,
  expandContent,
  rowKey = 'id',
  isLoading = false,
}: TableProps) {
  const isMobile = useIsMobile(768);

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const key = (row[rowKey] as string) ?? String(i);
          const isExpanded = expandedRow === key;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onRowClick?.(row)}
              className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
                onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''
              } ${
                isExpanded
                  ? 'border-teal-500 ring-2 ring-teal-500/20 dark:border-teal-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 text-right max-w-[60%] truncate">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode)}
                  </span>
                </div>
              ))}
              {isExpanded && expandContent && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {expandContent(row)}
                </div>
              )}
            </motion.div>
          );
        })}
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <Inbox className="w-10 h-10 mb-2 opacity-60" />
            <p className="text-sm font-medium">No records found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row, i) => {
              const key = (row[rowKey] as string) ?? String(i);
              const isExpanded = expandedRow === key;
              return (
                <React.Fragment key={key}>
                  <tr
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors group ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isExpanded
                        ? 'bg-teal-50/50 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && expandContent && (
                    <tr className="bg-teal-50/40 dark:bg-teal-950/30">
                      <td colSpan={columns.length} className="px-6 py-4 border-b border-teal-100 dark:border-teal-900/40">
                        {expandContent(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Inbox className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                    <p className="text-sm font-medium">No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
