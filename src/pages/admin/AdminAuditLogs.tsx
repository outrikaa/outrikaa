import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, ScrollText, Download, User } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, Select, Modal, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { AuditLog, Profile } from '@/types';
import { fmtDateTime, LoadError, timeAgoShort, Row } from './shared';

type LogRow = AuditLog & { actor_email?: string };

export default function AdminAuditLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<LogRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logs, profiles] = await Promise.all([
        db.list<AuditLog>('audit_logs', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 299 }),
        db.list<Profile>('profiles', { from: 0, to: 999 }),
      ]);
      const profileMap = new Map(profiles.map((p) => [p.id, p.email]));
      setRows(logs.map((l) => ({ ...l, actor_email: l.actor_id ? profileMap.get(l.actor_id) ?? 'Deleted user' : 'System' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (actionFilter) out = out.filter((r) => r.action === actionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.action.toLowerCase().includes(q) ||
          (r.actor_email ?? '').toLowerCase().includes(q) ||
          (r.target_type ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, actionFilter]);

  const exportCsv = () => {
    const header = 'created_at,action,actor,target_type,target_id';
    const body = filtered
      .map(
        (r) =>
          `"${r.created_at}","${r.action}","${r.actor_email ?? ''}","${r.target_type ?? ''}","${r.target_id ?? ''}"`
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'outrikaa-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const actionTone = (action: string) => {
    if (action.includes('delete') || action.includes('remove') || action.includes('revoke')) return 'error';
    if (action.includes('create') || action.includes('insert')) return 'success';
    if (action.includes('update') || action.includes('change')) return 'warning';
    return 'muted';
  };

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Immutable record of administrative and security-relevant actions."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Entries (loaded)" value={rows.length} icon={<ScrollText className="h-4 w-4" />} />
        <StatCard label="Distinct actions" value={actions.length} />
        <StatCard label="Last 24 hours" value={rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86400000).length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search action, actor or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-56">
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit entries" description="Administrative actions are recorded here automatically." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelected(log)}>
                    <TableCell className="text-[12px] text-slate-500 whitespace-nowrap" title={fmtDateTime(log.created_at)}>
                      {timeAgoShort(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-[13px]">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-600" />
                        {log.actor_email || 'System'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {log.target_type || '—'}
                      {log.target_id && <span className="text-[11px] text-slate-600 ml-1.5">{log.target_id.slice(0, 8)}…</span>}
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-600">{log.ip_address || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Audit entry" size="md">
        {selected && (
          <div>
            <Row label="Entry ID"><code className="text-[11px]">{selected.id}</code></Row>
            <Row label="Action"><Badge tone={actionTone(selected.action)}>{selected.action}</Badge></Row>
            <Row label="Actor">{selected.actor_email || 'System'}</Row>
            <Row label="Actor ID"><code className="text-[11px]">{selected.actor_id ?? '—'}</code></Row>
            <Row label="Target type">{selected.target_type || '—'}</Row>
            <Row label="Target ID"><code className="text-[11px]">{selected.target_id ?? '—'}</code></Row>
            <Row label="Workspace ID"><code className="text-[11px]">{selected.workspace_id ?? '—'}</code></Row>
            <Row label="IP address">{selected.ip_address || '—'}</Row>
            <Row label="When">{fmtDateTime(selected.created_at)}</Row>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-600 mb-2">Metadata</p>
              <pre className="rounded-xl border border-white/10 bg-white/4 p-3 text-[11px] text-slate-400 overflow-x-auto max-h-48">
                {JSON.stringify(selected.metadata ?? {}, null, 2)}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
