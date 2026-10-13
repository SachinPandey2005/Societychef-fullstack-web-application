import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'active' | 'inactive' | 'busy' | 'offline';
}

export function Avatar({ src, name, size = 'md', status }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const statusColors = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
    busy: 'bg-amber-500',
    offline: 'bg-rose-500',
  };

  return (
    <div className="relative inline-block shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 dark:border-slate-800`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center border border-teal-200 dark:border-teal-900/60`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${statusColors[status]}`}
        />
      )}
    </div>
  );
}
