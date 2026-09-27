import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Eye, Building2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Workspace, Subscription, Plan, Profile, WorkspaceMember } from '@/types';
import { StatusBadge, fmtDateTime, timeAgoShort, Row, LoadError } from './shared';

type WorkspaceRow = Workspace & { owner?: Profile | null };
type SubRow = Subscription & { plan?: Plan | null };

export default function AdminWorkspaces() {
  const toast = useToast();
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WorkspaceRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ws, subscriptions, memberRows] = await Promise.all([
        db.list<Workspace>('workspaces', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 299 }),
        db.list<SubRow>('subscriptions', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 999 }),
        db.list<WorkspaceMember>('workspace_members', { from: 0, to: 1999 }),
      ]);

      const ownerIds = Array.from(new Set(ws.map((w) => w.owner_id)));
      const profiles = ownerIds.length
        ? await db.list<Profile>('profiles', { from: 0, to: 999 })
        : [];
      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      setRows(ws.map((w) => ({ ...w, owner: profileMap.get(w.owner_id) ?? null })));
      setSubs(subscriptions);
      setMembers(memberRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const planMap = useMemo(() => new Map(subs.map((s) => [s.workspace_id, s])), [subs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.slug ?? '').toLowerCase().includes(q) ||
        (w.owner?.email ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const active = rows.filter((w) => planMap.get(w.id)?.status === 'active').length;
  const trialing = rows.filter((w) => planMap.get(w.id)?.status === 'trialing').length;

  const rename = async (workspace: WorkspaceRow) => {
    try {
      const next = window.prompt('New workspace name', workspace.name);
      if (!next || next.trim() === workspace.name) return;
      const updated = await db.update<Workspace>('workspaces', workspace.id, { name: next.trim() });
      setRows((prev) => prev.map((r) => (r.id === workspace.id ? { ...updated, owner: workspace.owner } : r)));
      setSelected((s) => (s && s.id === workspace.id ? { ...updated, owner: workspace.owner } : s));
      toast.success('Workspace renamed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rename failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="All customer workspaces, owners and subscription status."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Workspaces" value={rows.length} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Active subscriptions" value={active} />
        <StatCard label="Trialing" value={trialing} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search workspace, slug or owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
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
        <EmptyState title="No workspaces yet" description="Workspaces appear here as soon as users sign up." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => {
                  const sub = planMap.get(w.id);
                  const memberCount = members.filter((m) => m.workspace_id === w.id).length;
                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-[13px] text-white truncate">{w.name}</p>
                          <p className="text-[11px] text-slate-600 truncate">{w.slug || 'no slug'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {w.owner?.full_name || w.owner?.email || '—'}
                      </TableCell>
                      <TableCell>
                        {sub ? (
                          <div className="flex items-center gap-2">
                            <StatusBadge status={sub.status} />
                            <span className="text-[11px] text-slate-600 capitalize">{sub.billing_cycle}</span>
                          </div>
                        ) : (
                          <Badge tone="muted">none</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[13px]">{memberCount || '—'}</TableCell>
                      <TableCell className="text-[13px] text-slate-500">{timeAgoShort(w.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(w)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Workspace details" size="md">
        {selected && (
          <div>
            <Row label="Workspace ID"><code className="text-[11px]">{selected.id}</code></Row>
            <Row label="Name">{selected.name}</Row>
            <Row label="Slug">{selected.slug || '—'}</Row>
            <Row label="Owner">{selected.owner?.full_name || selected.owner?.email || '—'}</Row>
            <Row label="Industry">{selected.industry || '—'}</Row>
            <Row label="Company size">{selected.company_size || '—'}</Row>
            <Row label="Members">{members.filter((m) => m.workspace_id === selected.id).length}</Row>
            <Row label="Subscription">
              {(() => {
                const sub = planMap.get(selected.id);
                if (!sub) return 'None';
                return `${sub.status} · ${sub.billing_cycle}`;
              })()}
            </Row>
            <Row label="Created">{fmtDateTime(selected.created_at)}</Row>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => rename(selected)}>Rename</Button>
              <Button size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
