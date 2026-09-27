import type { ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg h-4 w-full', className)} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-card/80 p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5" />
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary-400', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="h-14 w-14 rounded-2xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-center text-primary-400 mb-4">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="h-14 w-14 rounded-2xl bg-error-500/10 border border-error-500/25 flex items-center justify-center text-error-400 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1.5 max-w-sm">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 h-9 px-4 text-sm rounded-xl border border-white/15 text-slate-200 hover:bg-white/10 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function SuccessState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-14 w-14 rounded-2xl bg-success-500/10 border border-success-500/25 flex items-center justify-center text-success-400 mb-4">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
