import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5">{breadcrumb}</div>}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaTone = 'neutral',
  hint,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  delta?: string;
  deltaTone?: 'good' | 'bad' | 'neutral';
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-card/80 backdrop-blur-xl p-5 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-slate-500">{label}</p>
        {icon && <span className="text-primary-400/70">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold text-white tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta && (
          <span
            className={
              deltaTone === 'good'
                ? 'text-[11px] font-medium text-success-400'
                : deltaTone === 'bad'
                  ? 'text-[11px] font-medium text-error-400'
                  : 'text-[11px] font-medium text-slate-500'
            }
          >
            {delta}
          </span>
        )}
        {hint && <span className="text-[11px] text-slate-600">{hint}</span>}
      </div>
    </div>
  );
}
