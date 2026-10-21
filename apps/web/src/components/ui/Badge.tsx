import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  className,
  variant = 'brand',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants: Record<BadgeVariant, string> = {
    brand: 'bg-teal-500/10 text-teal-300 border border-teal-500/30',
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    info: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-1 leading-none',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
