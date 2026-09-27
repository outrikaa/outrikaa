import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, CreditCard } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, Select, useToast, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Subscription, Workspace, Plan } from '@/types';
import { StatusBadge, fmtDate, LoadError, label } from './shared';

type SubRow = Subscription & { workspace_name?: string; plan_name?: string };

const statusOptions = ['active', 'trialing', 'past_due', 'paused', 'canceled'];

export default function AdminSubscriptions() {
  const toast = useToast();
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, workspaces, plans] = await Promise.all([
        db.list<Subscription>('subscriptions', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 299 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
        db.list<Plan>('plans', { from: 0, to: 99 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      const planMap = new Map(plans.map((p) => [p.id, p.name]));
      setRows(
        subs.map((s) => ({
          ...s,
          workspace_name: wsMap.get(s.workspace_id) ?? 'Unknown',
          plan_name: s.plan_id ? planMap.get(s.plan_id) ?? 'Unknown plan' : 'Free / none',
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (s) =>
          (s.workspace_name ?? '').toLowerCase().includes(q) ||
          (s.plan_name ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, statusFilter]);

  const updateStatus = async (sub: SubRow, next: Subscription['status']) => {
    setSavingId(sub.id);
    try {
      const patch: Partial<Subscription> = { status: next };
      if (next === 'canceled') patch.cancel_at_period_end = true;
      const updated = await db.update<Subscription>('subscriptions', sub.id, patch);
      setRows((prev) =>
        prev.map((r) =>
          r.id === sub.id ? { ...updated, workspace_name: sub.workspace_name, plan_name: sub.plan_name } : r
        )
      );
      toast.success(`Subscription marked ${label(next)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update subscription');
    } finally {
      setSavingId(null);
    }
  };

  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Plan status for every workspace."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Active" value={byStatus('active')} icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="Trialing" value={byStatus('trialing')} />
        <StatCard label="Past due" value={byStatus('past_due')} />
        <StatCard label="Canceled" value={byStatus('canceled')} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search workspace or plan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No subscriptions yet" description="Subscriptions are created when workspaces start a plan." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period ends</TableHead>
                  <TableHead className="text-right">Change status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-[13px] text-white">{s.workspace_name}</TableCell>
                    <TableCell className="text-[13px]">{s.plan_name}</TableCell>
                    <TableCell className="text-[13px] capitalize">{s.billing_cycle}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-[13px] text-slate-500">{fmtDate(s.current_period_end)}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={s.status}
                        disabled={savingId === s.id}
                        onChange={(e) => updateStatus(s, e.target.value as Subscription['status'])}
                        className="w-36 ml-auto"
                      >
                        {statusOptions.map((o) => (
                          <option key={o} value={o}>{o}</option>
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
        <Badge tone="muted">note</Badge>
        Status changes here are recorded in audit logs. Stripe is not connected in this environment, so payment
        transitions are managed manually.
      </p>
    </div>
  );
}
