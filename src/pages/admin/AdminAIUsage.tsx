import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Sparkles, Download } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, Select, Badge, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Workspace } from '@/types';
import { formatNumber } from '@/lib/utils';
import { fmtDateTime, LoadError, timeAgoShort } from './shared';

interface UsageRow {
  id: string;
  workspace_id: string;
  metric: string;
  value: number;
  period: string | null;
  recorded_at: string;
  workspace_name?: string;
}

export default function AdminAIUsage() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState('ai_generation');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usage, workspaces] = await Promise.all([
        db.list<UsageRow>('usage_records', { orderBy: { column: 'recorded_at', ascending: false }, from: 0, to: 499 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      setRows(usage.map((u) => ({ ...u, workspace_name: wsMap.get(u.workspace_id) ?? 'Unknown' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load usage records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const metrics = useMemo(() => Array.from(new Set(rows.map((r) => r.metric))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => (metric ? r.metric === metric : true));
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) => (r.workspace_name ?? '').toLowerCase().includes(q));
    }
    return out;
  }, [rows, metric, search]);

  const totals = useMemo(() => {
    const byWorkspace = new Map<string, { name: string; total: number }>();
    for (const r of filtered) {
      const key = r.workspace_id;
      const cur = byWorkspace.get(key) ?? { name: r.workspace_name ?? 'Unknown', total: 0 };
      cur.total += r.value ?? 0;
      byWorkspace.set(key, cur);
    }
    return Array.from(byWorkspace.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);
  const aiTotal = rows.filter((r) => r.metric.startsWith('ai')).reduce((s, r) => s + (r.value ?? 0), 0);
  const emailTotal = rows.filter((r) => r.metric === 'email_sent' || r.metric === 'emails_sent').reduce((s, r) => s + (r.value ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="AI usage"
        description="Metered usage records across every workspace."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportCsv(filtered)}>
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Records (loaded)" value={rows.length} />
        <StatCard label="AI generations" value={formatNumber(aiTotal)} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Emails metered" value={formatNumber(emailTotal)} />
        <StatCard label="Active workspaces metered" value={totals.length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        <Card className="lg:col-span-1">
          <CardContent>
            <p className="text-[13px] font-semibold text-white mb-4">Totals by workspace ({metric || 'all metrics'})</p>
            {totals.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No usage recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {totals.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-slate-300 truncate">{t.name}</span>
                    <span className="text-[13px] font-semibold text-white shrink-0">{formatNumber(t.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/8">
                  <span className="text-[13px] text-slate-500">Total</span>
                  <span className="text-[13px] font-bold text-primary-300">{formatNumber(grandTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-3 p-4 pb-0">
              <Input
                placeholder="Search workspace…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full sm:w-64"
              />
              <Select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-52">
                <option value="">All metrics</option>
                {metrics.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <span className="text-xs text-slate-600 ml-auto">{filtered.length} records</span>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-4">
                  <LoadError message={error} />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No usage records" description="Usage is written as campaigns and AI generations run." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-[13px] text-white">{r.workspace_name}</TableCell>
                        <TableCell>
                          <Badge tone={r.metric.startsWith('ai') ? 'primary' : 'muted'}>{r.metric}</Badge>
                        </TableCell>
                        <TableCell className="text-[13px] font-semibold">{formatNumber(r.value ?? 0)}</TableCell>
                        <TableCell className="text-[13px] text-slate-500">{r.period || '—'}</TableCell>
                        <TableCell className="text-[12px] text-slate-500" title={fmtDateTime(r.recorded_at)}>
                          {timeAgoShort(r.recorded_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function exportCsv(rows: UsageRow[]) {
  const header = 'workspace,metric,value,period,recorded_at';
  const body = rows
    .map((r) => `"${(r.workspace_name ?? '').replace(/"/g, '""')}","${r.metric}",${r.value ?? 0},"${r.period ?? ''}","${r.recorded_at}"`)
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'outrikaa-usage.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}
