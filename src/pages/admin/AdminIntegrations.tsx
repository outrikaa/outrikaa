import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Plug, Link2, Unlink } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Select, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Integration, Workspace } from '@/types';
import { StatusBadge, fmtDateTime, LoadError, timeAgoShort, Row } from './shared';

type IntegrationRow = Integration & { workspace_name?: string };

const providerLabels: Record<string, string> = {
  gmail: 'Gmail',
  google_workspace: 'Google Workspace',
  outlook: 'Outlook',
  microsoft365: 'Microsoft 365',
  slack: 'Slack',
  crm: 'CRM',
  webhook: 'Webhooks',
  smtp: 'Custom SMTP',
  zapier: 'Zapier',
};

export default function AdminIntegrations() {
  const toast = useToast();
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [integrations, workspaces] = await Promise.all([
        db.list<Integration>('integrations', { orderBy: { column: 'updated_at', ascending: false }, from: 0, to: 299 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      setRows(integrations.map((i) => ({ ...i, workspace_name: wsMap.get(i.workspace_id) ?? 'Unknown' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const providers = useMemo(() => Array.from(new Set(rows.map((r) => r.provider))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (providerFilter) out = out.filter((r) => r.provider === providerFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          (r.name ?? '').toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q) ||
          (r.workspace_name ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, providerFilter]);

  const updateStatus = async (row: IntegrationRow, status: Integration['status']) => {
    setSavingId(row.id);
    try {
      const patch: Partial<Integration> = { status };
      if (status === 'connected') {
        patch.connected_at = new Date().toISOString();
        patch.last_synced_at = new Date().toISOString();
      }
      const updated = await db.update<Integration>('integrations', row.id, patch);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...updated, workspace_name: row.workspace_name } : r)));
      toast.success(`${row.name} marked ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update integration');
    } finally {
      setSavingId(null);
    }
  };

  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Provider connections across all workspaces."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Connections" value={rows.length} icon={<Plug className="h-4 w-4" />} />
        <StatCard label="Connected" value={byStatus('connected')} />
        <StatCard label="Errors" value={byStatus('error')} />
        <StatCard label="Coming soon" value={byStatus('coming_soon')} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search integration or workspace…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="w-52">
          <option value="">All providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{providerLabels[p] ?? p}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No integrations yet" description="Connections appear when workspaces link providers." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integration</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last synced</TableHead>
                  <TableHead className="text-right">Change status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-[13px] text-white">{r.name}</TableCell>
                    <TableCell className="text-[13px]">{providerLabels[r.provider] ?? r.provider}</TableCell>
                    <TableCell className="text-[13px]">{r.workspace_name}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-[12px] text-slate-500">{timeAgoShort(r.last_synced_at)}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={r.status}
                        disabled={savingId === r.id}
                        onChange={(e) => updateStatus(r, e.target.value as Integration['status'])}
                        className="w-40 ml-auto"
                      >
                        {['available', 'connected', 'error', 'coming_soon'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-[11px] text-slate-600 flex items-center gap-1.5">
        <Badge tone="muted">honesty</Badge>
        Status is metadata only — changing it here does not create a real OAuth connection. Real connections are made
        by workspace owners from the app.
      </p>
    </div>
  );
}

export function IntegrationDetail({ row }: { row: IntegrationRow }) {
  return (
    <div>
      <Row label="Provider">{providerLabels[row.provider] ?? row.provider}</Row>
      <Row label="Status"><StatusBadge status={row.status} /></Row>
      <Row label="Workspace">{row.workspace_name}</Row>
      <Row label="Connected">{fmtDateTime(row.connected_at)}</Row>
      <Row label="Last synced">{fmtDateTime(row.last_synced_at)}</Row>
      <Row label="Config keys">{Object.keys(row.config ?? {}).join(', ') || '—'}</Row>
    </div>
  );
}

export function connectionIcons() {
  return { Link2, Unlink };
}
