import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, description, actions, badge, showBack, onBack }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800 mb-6">
      <div>
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              title="Go Back"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white hover:border-teal-500 transition-all shadow-2xs group cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors shrink-0" />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
