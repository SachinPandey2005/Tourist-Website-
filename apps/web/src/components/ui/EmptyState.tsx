import { ReactNode } from 'react';
import { Compass } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No Results Found',
  description = 'Try adjusting your search criteria, dates, or filters to find what you are looking for.',
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-slate-900/40 border border-slate-800/80 p-10 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center text-teal-400">
        {icon || <Compass className="w-7 h-7" aria-hidden="true" />}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-base font-bold text-slate-100">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      {action ? (
        <div className="pt-2">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
