import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, ConfirmDialog, EmptyState,
} from '@/components/ui';
import { contentService } from '@/services/db';
import type { Testimonial } from '@/types';
import { LoadError } from './shared';

interface FormState {
  id?: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
}

const empty: FormState = { name: '', role: '', company: '', quote: '', rating: 5, is_published: true, sort_order: 0 };

export default function AdminTestimonials() {
  const toast = useToast();
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await contentService.allTestimonials();
      setRows(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.company ?? '').toLowerCase().includes(q) || t.quote.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error('Name and quote are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        company: form.company.trim() || null,
        quote: form.quote.trim(),
        rating: Number(form.rating) || 5,
        is_published: form.is_published,
        sort_order: Number(form.sort_order) || 0,
      };
      if (form.id) {
        const updated = await contentService.updateTestimonial(form.id, payload);
        setRows((prev) => prev.map((t) => (t.id === form.id ? updated : t)));
        toast.success('Testimonial updated');
      } else {
        const created = await contentService.createTestimonial(payload);
        setRows((prev) => [...prev, created]);
        toast.success('Testimonial created');
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Testimonial) => {
    try {
      await contentService.removeTestimonial(item.id);
      setRows((prev) => prev.filter((t) => t.id !== item.id));
      toast.success('Testimonial deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete testimonial');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Customer quotes shown across the marketing site."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setForm({ ...empty })}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New testimonial
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Testimonials" value={rows.length} icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard label="Published" value={rows.filter((t) => t.is_published).length} />
        <StatCard label="Average rating" value={rows.length ? (rows.reduce((s, t) => s + (t.rating ?? 5), 0) / rows.length).toFixed(1) : '—'} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search name, company or quote…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No testimonials" description="Add a quote to show social proof on the homepage." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="text-[13px] text-white">{t.name}</p>
                      <p className="text-[11px] text-slate-600">{[t.role, t.company].filter(Boolean).join(', ') || '—'}</p>
                    </TableCell>
                    <TableCell className="text-[13px] max-w-[340px]">
                      <span className="line-clamp-2">{t.quote}</span>
                    </TableCell>
                    <TableCell className="text-[13px] text-warning-300">{'★'.repeat(t.rating ?? 5)}</TableCell>
                    <TableCell>
                      <button onClick={async () => {
                        try {
                          const updated = await contentService.updateTestimonial(t.id, { is_published: !t.is_published });
                          setRows((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Update failed');
                        }
                      }}>
                        <Badge tone={t.is_published ? 'success' : 'muted'}>{t.is_published ? 'visible' : 'hidden'}</Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-[13px]">{t.sort_order ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              id: t.id,
                              name: t.name,
                              role: t.role ?? '',
                              company: t.company ?? '',
                              quote: t.quote,
                              rating: t.rating ?? 5,
                              is_published: t.is_published,
                              sort_order: t.sort_order ?? 0,
                            })
                          }
                          leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(t)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
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
        title={form?.id ? 'Edit testimonial' : 'New testimonial'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save</Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Role</label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Head of Sales" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Company</label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Rating</label>
                <Input type="number" min={1} max={5} value={String(form.rating)} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Quote</label>
              <Textarea rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Sort order</label>
                <Input type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                Published
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete this testimonial?"
        message={`"${confirmDelete?.name}" will be removed from the site.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
