import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500 ${
            icon ? 'pl-10 pr-4' : 'px-3.5'
          } py-2.5 ${
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
}
