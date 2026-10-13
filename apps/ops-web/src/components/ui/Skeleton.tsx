import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`}
    />
  );
}
