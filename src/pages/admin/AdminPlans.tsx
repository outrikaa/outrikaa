import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Star } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, ConfirmDialog,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Plan } from '@/types';
import { fmtDate, LoadError, Empty } from './shared';

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  lead_limit: number;
  email_limit: number;
  mailbox_limit: number;
  campaign_limit: number;
  ai_generation_limit: number;
  features: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const empty: FormState = {
  name: '',
  slug: '',
  description: '',
  monthly_price: 0,
  yearly_price: 0,
  lead_limit: 1000,
  email_limit: 5000,
  mailbox_limit: 2,
  campaign_limit: 5,
  ai_generation_limit: 100,
  features: '',
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

export default function AdminPlans() {
  const toast = useToast();
  const [rows, setRows] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const plans = await db.list<Plan>('plans', { orderBy: { column: 'sort_order', ascending: true }, from: 0, to: 99 });
      setRows(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const openEdit = (plan: Plan) => {
    setForm({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      lead_limit: plan.lead_limit ?? 0,
      email_limit: plan.email_limit ?? 0,
      mailbox_limit: plan.mailbox_limit ?? 0,
      campaign_limit: plan.campaign_limit ?? 0,
      ai_generation_limit: plan.ai_generation_limit ?? 0,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      is_active: plan.is_active,
      is_featured: plan.is_featured,
      sort_order: plan.sort_order ?? 0,
    });
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: form.description.trim() || null,
        monthly_price: Number(form.monthly_price) || 0,
        yearly_price: Number(form.yearly_price) || 0,
        lead_limit: Number(form.lead_limit) || 0,
        email_limit: Number(form.email_limit) || 0,
        mailbox_limit: Number(form.mailbox_limit) || 0,
        campaign_limit: Number(form.campaign_limit) || 0,
        ai_generation_limit: Number(form.ai_generation_limit) || 0,
        features: form.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        is_active: form.is_active,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
      };
      if (form.id) {
        const updated = await db.update<Plan>('plans', form.id, payload);
        setRows((prev) => prev.map((p) => (p.id === form.id ? updated : p)));
        toast.success('Plan updated');
      } else {
        const created = await db.insert<Plan>('plans', payload);
        setRows((prev) => [...prev, created].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        toast.success('Plan created');
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save plan');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (plan: Plan) => {
    try {
      await db.remove('plans', plan.id);
      setRows((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success('Plan deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete plan');
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      const updated = await db.update<Plan>('plans', plan.id, { is_active: !plan.is_active });
      setRows((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update plan');
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Pricing, limits and features available to workspaces."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setForm({ ...empty })} leftIcon={<Plus className="h-4 w-4" />}>
              New plan
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Plans" value={rows.length} />
        <StatCard label="Active" value={rows.filter((p) => p.is_active).length} />
        <StatCard label="Featured" value={rows.filter((p) => p.is_featured).length} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : rows.length === 0 ? (
        <Empty title="No plans configured" hint="Create a plan to power pricing and billing." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-[13px] text-white flex items-center gap-1.5">
                            {p.name}
                            {p.is_featured && <Star className="h-3 w-3 text-warning-400 fill-warning-400" />}
                          </p>
                          <p className="text-[11px] text-slate-600">{p.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px]">${p.monthly_price}/mo</TableCell>
                    <TableCell className="text-[13px]">${p.yearly_price}/yr</TableCell>
                    <TableCell className="text-[12px] text-slate-500">
                      {p.lead_limit} leads · {p.email_limit} emails · {p.mailbox_limit} mailboxes
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleActive(p)} title="Toggle active">
                        <Badge tone={p.is_active ? 'success' : 'muted'}>{p.is_active ? 'active' : 'inactive'}</Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500">{fmtDate(p.updated_at ?? p.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(p)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
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
        title={form?.id ? 'Edit plan' : 'New plan'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save plan</Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Growth" />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="growth" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Description</label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {([
                ['monthly_price', 'Monthly price ($)'],
                ['yearly_price', 'Yearly price ($)'],
                ['lead_limit', 'Lead limit'],
                ['email_limit', 'Email limit'],
                ['mailbox_limit', 'Mailbox limit'],
                ['campaign_limit', 'Campaign limit'],
                ['ai_generation_limit', 'AI generations'],
                ['sort_order', 'Sort order'],
              ] as const).map(([key, lbl]) => (
                <div key={key}>
                  <label className="block text-[13px] text-slate-400 mb-1.5">{lbl}</label>
                  <Input
                    type="number"
                    value={String(form[key])}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Features (one per line)</label>
              <Textarea rows={5} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={'1,000 leads\n5,000 emails / month'} />
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                Featured (default plan)
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete this plan?"
        message={`"${confirmDelete?.name}" will be removed. Subscriptions referencing it keep their status but lose the plan link.`}
        confirmLabel="Delete plan"
        tone="danger"
      />
    </div>
  );
}
