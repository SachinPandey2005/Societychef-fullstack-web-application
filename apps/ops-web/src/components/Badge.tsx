import React from 'react';

export type Tone = 'green' | 'gold' | 'blue' | 'red' | 'default' | 'purple' | 'orange' | 'yellow';

interface BadgeProps {
  label: string;
  tone?: Tone;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
  gold: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/40',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  yellow: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
};

const DOT_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-500',
  gold: 'bg-amber-500',
  blue: 'bg-blue-500',
  red: 'bg-rose-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  default: 'bg-slate-400',
  yellow: 'bg-amber-500'
};

export default function Badge({ label, tone = 'default', pulse = false, size = 'sm' }: BadgeProps) {
  const isPulse = pulse || tone === 'gold' || tone === 'blue';
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold rounded-full capitalize whitespace-nowrap transition-colors ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${TONE_CLASSES[tone] || TONE_CLASSES.default}`}
    >
      {isPulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${DOT_CLASSES[tone] || 'bg-slate-400'}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${DOT_CLASSES[tone] || 'bg-slate-400'}`} />
        </span>
      )}
      {label}
    </span>
  );
}
