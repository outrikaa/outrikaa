import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'muted';

const successSet = new Set([
  'active', 'running', 'connected', 'published', 'paid', 'delivered', 'resolved',
  'completed', 'available', 'yes', 'enabled', 'sent', 'ok',
]);
const warningSet = new Set([
  'pending', 'scheduled', 'paused', 'trialing', 'past_due', 'needs_attention', 'draft',
  'waiting', 'in_progress', 'open', 'maintenance', 'degraded', 'invited', 'high', 'urgent',
]);
const errorSet = new Set([
  'failed', 'bounced', 'error', 'canceled', 'cancelled', 'closed', 'archived',
  'refunded', 'outage', 'suspended', 'urgent',
]);
const infoSet = new Set(['replied', 'opened', 'clicked', 'positive_reply', 'meeting', 'info']);

export function statusTone(status?: string | null): Tone {
  const s = (status ?? '').toLowerCase();
  if (successSet.has(s)) return 'success';
  if (warningSet.has(s)) return 'warning';
  if (errorSet.has(s)) return 'error';
  if (infoSet.has(s)) return 'info';
  return 'muted';
}

export function StatusBadge({ status, tone }: { status?: string | null; tone?: Tone }) {
  if (!status) return <span className="text-xs text-slate-600">—</span>;
  return <Badge tone={tone ?? statusTone(status)}>{status.replace(/_/g, ' ')}</Badge>;
}

export function label(value?: string | null) {
  return value ? value.replace(/_/g, ' ') : '—';
}

export function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgoShort(value?: string | null) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return '—';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(value);
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-14 rounded-2xl border border-dashed border-white/12">
      <p className="text-sm text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-600 mt-1.5">{hint}</p>}
    </div>
  );
}

export function LoadError({ message }: { message?: string | null }) {
  return (
    <div className="text-center py-14 rounded-2xl border border-error-500/30 bg-error-500/5">
      <p className="text-sm text-error-300">{message || 'Could not load data'}</p>
      <p className="text-xs text-slate-600 mt-1.5">Check your connection and try again.</p>
    </div>
  );
}

export function Row({ label: l, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/6 last:border-0">
      <span className="text-[13px] text-slate-500">{l}</span>
      <span className="text-[13px] text-slate-200 text-right min-w-0 break-words">{children}</span>
    </div>
  );
}
