import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Eye, Pause, Play } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, Select, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Campaign, Workspace } from '@/types';
import { StatusBadge, fmtDateTime, timeAgoShort, Row, LoadError, statusTone } from './shared';

type CampaignRow = Campaign & { workspace_name?: string };

export default function AdminCampaigns() {
  const toast = useToast();
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<CampaignRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaigns, workspaces] = await Promise.all([
        db.list<Campaign>('campaigns', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 199 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      setRows(campaigns.map((c) => ({ ...c, workspace_name: wsMap.get(c.workspace_id) ?? 'Unknown' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((c) => c.name.toLowerCase().includes(q) || (c.workspace_name ?? '').toLowerCase().includes(q));
    }
    return out;
  }, [rows, search, statusFilter]);

  const setStatus = async (campaign: CampaignRow, next: Campaign['status']) => {
    setSaving(true);
    try {
      const patch: Partial<Campaign> = { status: next };
      if (next === 'running' && !campaign.launched_at) patch.launched_at = new Date().toISOString();
      if (next === 'paused') patch.paused_at = new Date().toISOString();
      const updated = await db.update<Campaign>('campaigns', campaign.id, patch);
      setRows((prev) => prev.map((r) => (r.id === campaign.id ? { ...updated, workspace_name: campaign.workspace_name } : r)));
      setSelected((s) => (s && s.id === campaign.id ? { ...updated, workspace_name: campaign.workspace_name } : s));
      toast.success(`Campaign ${next === 'running' ? 'resumed' : 'paused'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update campaign');
    } finally {
      setSaving(false);
    }
  };

  const running = rows.filter((c) => c.status === 'running').length;
  const paused = rows.filter((c) => c.status === 'paused').length;
  const drafts = rows.filter((c) => c.status === 'draft').length;

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Every campaign across all workspaces."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Running" value={running} />
        <StatCard label="Paused" value={paused} />
        <StatCard label="Drafts" value={drafts} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search campaign or workspace…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {['draft', 'scheduled', 'running', 'paused', 'completed', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
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
        <EmptyState title="No campaigns match" description="Adjust the filters to see more results." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily limit</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-[13px] text-white">{c.name}</TableCell>
                    <TableCell className="text-[13px]">{c.workspace_name}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-[13px]">{c.daily_limit}</TableCell>
                    <TableCell className="text-[13px] text-slate-500">{timeAgoShort(c.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(c)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          View
                        </Button>
                        {c.status === 'running' ? (
                          <Button size="sm" variant="outline" loading={saving} onClick={() => setStatus(c, 'paused')} leftIcon={<Pause className="h-3.5 w-3.5" />}>
                            Pause
                          </Button>
                        ) : c.status === 'paused' ? (
                          <Button size="sm" variant="primary" loading={saving} onClick={() => setStatus(c, 'running')} leftIcon={<Play className="h-3.5 w-3.5" />}>
                            Resume
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Campaign details" size="md">
        {selected && (
          <div>
            <Row label="Campaign ID"><code className="text-[11px]">{selected.id}</code></Row>
            <Row label="Name">{selected.name}</Row>
            <Row label="Workspace">{selected.workspace_name}</Row>
            <Row label="Description">{selected.description || '—'}</Row>
            <Row label="Status"><StatusBadge status={selected.status} /></Row>
            <Row label="Timezone">{selected.timezone}</Row>
            <Row label="Sending window">
              {selected.sending_start_time}–{selected.sending_end_time} · {selected.sending_days?.join(', ')}
            </Row>
            <Row label="Daily limit">{selected.daily_limit}</Row>
            <Row label="Delay between sends">{selected.delay_between_emails}s</Row>
            <Row label="Tracking">
              opens {selected.track_opens ? 'on' : 'off'} · clicks {selected.track_clicks ? 'on' : 'off'} · unsubscribe {selected.unsubscribe_enabled ? 'on' : 'off'}
            </Row>
            <Row label="Launched">{fmtDateTime(selected.launched_at)}</Row>
            <Row label="Created">{fmtDateTime(selected.created_at)}</Row>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
              {selected.status === 'running' || selected.status === 'paused' ? (
                <Button
                  size="sm"
                  variant={selected.status === 'running' ? 'outline' : 'primary'}
                  loading={saving}
                  onClick={() => setStatus(selected, selected.status === 'running' ? 'paused' : 'running')}
                >
                  {selected.status === 'running' ? 'Pause campaign' : 'Resume campaign'}
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-[11px] text-slate-600 text-right">
              Status shown as <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
