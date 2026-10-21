import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to Load Data',
  message = 'A network or server error occurred. Please check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl bg-rose-950/20 border border-rose-500/30 p-8 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold text-slate-100">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="border-rose-500/40 hover:bg-rose-500/10 text-rose-300 hover:text-white"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
