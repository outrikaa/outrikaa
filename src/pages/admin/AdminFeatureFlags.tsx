import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2, Flag } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, ConfirmDialog, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { FeatureFlag } from '@/types';
import { LoadError, fmtDate } from './shared';

interface FormState {
  id?: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  is_global: boolean;
  rollout_percentage: number;
}

const empty: FormState = {
  key: '',
  name: '',
  description: '',
  is_enabled: false,
  is_global: true,
  rollout_percentage: 0,
};

const slugifyKey = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');

export default function AdminFeatureFlags() {
  const toast = useToast();
  const [rows, setRows] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FeatureFlag | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const flags = await db.list<FeatureFlag>('feature_flags', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 199 });
      setRows(flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        key: slugifyKey(form.key || form.name),
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_enabled: form.is_enabled,
        is_global: form.is_global,
        rollout_percentage: Math.max(0, Math.min(100, Number(form.rollout_percentage) || 0)),
      };
      if (form.id) {
        const updated = await db.update<FeatureFlag>('feature_flags', form.id, payload);
        setRows((prev) => prev.map((f) => (f.id === form.id ? updated : f)));
        toast.success('Flag updated');
      } else {
        const created = await db.insert<FeatureFlag>('feature_flags', payload);
        setRows((prev) => [created, ...prev]);
        toast.success('Flag created');
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save flag');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (flag: FeatureFlag) => {
    try {
      const updated = await db.update<FeatureFlag>('feature_flags', flag.id, { is_enabled: !flag.is_enabled });
      setRows((prev) => prev.map((f) => (f.id === flag.id ? updated : f)));
      toast.success(`${flag.name} ${flag.is_enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update flag');
    }
  };

  const remove = async (flag: FeatureFlag) => {
    try {
      await db.remove('feature_flags', flag.id);
      setRows((prev) => prev.filter((f) => f.id !== flag.id));
      toast.success('Flag deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete flag');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Feature flags"
        description="Roll out new functionality gradually and reverse it instantly."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setForm({ ...empty })} leftIcon={<Plus className="h-4 w-4" />}>
              New flag
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Flags" value={rows.length} icon={<Flag className="h-4 w-4" />} />
        <StatCard label="Enabled" value={rows.filter((f) => f.is_enabled).length} />
        <StatCard label="Partial rollouts" value={rows.filter((f) => f.rollout_percentage > 0 && f.rollout_percentage < 100).length} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No feature flags"
          description="Flags let you ship behind a switch."
          action={<Button size="sm" onClick={() => setForm({ ...empty })}>New flag</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Rollout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <p className="text-[13px] text-white">{f.name}</p>
                      <p className="text-[11px] text-slate-600">{f.key}</p>
                      {f.description && <p className="text-[11px] text-slate-500 mt-0.5 max-w-[320px]">{f.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge tone="muted">{f.is_global ? 'global' : 'workspace'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>{f.rollout_percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${f.rollout_percentage}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggle(f)}>
                        <Badge tone={f.is_enabled ? 'success' : 'muted'}>{f.is_enabled ? 'enabled' : 'disabled'}</Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500">{fmtDate(f.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              id: f.id,
                              key: f.key,
                              name: f.name,
                              description: f.description ?? '',
                              is_enabled: f.is_enabled,
                              is_global: f.is_global,
                              rollout_percentage: f.rollout_percentage ?? 0,
                            })
                          }
                          leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(f)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit flag' : 'New flag'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save flag</Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New sequence builder" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Key</label>
                <Input value={form.key} onChange={(e) => setForm({ ...form, key: slugifyKey(e.target.value) })} placeholder="new_sequence_builder" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Description</label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label className="flex items-center justify-between text-[13px] text-slate-400 mb-2">
                <span>Rollout percentage</span>
                <span className="text-white">{form.rollout_percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.rollout_percentage}
                onChange={(e) => setForm({ ...form, rollout_percentage: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={form.is_global} onChange={(e) => setForm({ ...form, is_global: e.target.checked })} />
                Global (otherwise per workspace)
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete this flag?"
        message={`"${confirmDelete?.name}" will stop being evaluated anywhere.`}
        confirmLabel="Delete flag"
        tone="danger"
      />
    </div>
  );
}
