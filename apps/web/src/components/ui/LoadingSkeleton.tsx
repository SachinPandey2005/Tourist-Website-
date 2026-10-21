import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export function LoadingSkeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 my-1',
  };

  return (
    <div
      className={cn(
        'bg-slate-800/60 animate-pulse border border-slate-700/30',
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Pre-configured Card loading skeleton for catalog destinations and tours.
 */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 space-y-4 animate-pulse">
      <div className="h-48 w-full bg-slate-800/70 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-slate-800/70 rounded-md" />
        <div className="h-3 w-1/2 bg-slate-800/50 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-20 bg-slate-800/70 rounded-md" />
        <div className="h-8 w-24 bg-slate-800/70 rounded-xl" />
      </div>
    </div>
  );
}
