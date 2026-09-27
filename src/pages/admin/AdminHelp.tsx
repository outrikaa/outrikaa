import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Plus, Pencil, Trash2, LifeBuoy, ExternalLink } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, Select, ConfirmDialog, EmptyState,
} from '@/components/ui';
import { contentService } from '@/services/db';
import type { HelpArticle } from '@/types';
import { StatusBadge, LoadError, label } from './shared';

interface FormState {
  id?: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  sort_order: number;
}

const empty: FormState = {
  title: '',
  slug: '',
  category: 'Getting started',
  subcategory: '',
  content: '',
  status: 'published',
  sort_order: 0,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminHelp() {
  const toast = useToast();
  const [rows, setRows] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HelpArticle | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await contentService.allHelp();
      setRows(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load help articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (categoryFilter) out = out.filter((r) => r.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) => r.title.toLowerCase().includes(q) || r.slug.includes(q) || r.category.toLowerCase().includes(q));
    }
    return out;
  }, [rows, search, categoryFilter]);

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.content.trim() || !form.category.trim()) {
      toast.error('Title, category and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug || form.title),
        category: form.category.trim(),
        subcategory: form.subcategory.trim() || null,
        content: form.content,
        status: form.status,
        sort_order: Number(form.sort_order) || 0,
      };
      if (form.id) {
        const updated = await contentService.updateHelp(form.id, payload);
        setRows((prev) => prev.map((r) => (r.id === form.id ? updated : r)));
        toast.success('Article updated');
      } else {
        const created = await contentService.createHelp(payload);
        setRows((prev) => [created, ...prev]);
        toast.success('Article created');
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save article');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (article: HelpArticle) => {
    try {
      await contentService.removeHelp(article.id);
      setRows((prev) => prev.filter((r) => r.id !== article.id));
      toast.success('Article deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete article');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Help articles"
        description="Articles shown in the public Help Centre."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setForm({ ...empty })} leftIcon={<Plus className="h-4 w-4" />}>
              New article
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Articles" value={rows.length} icon={<LifeBuoy className="h-4 w-4" />} />
        <StatCard label="Published" value={rows.filter((r) => r.status === 'published').length} />
        <StatCard label="Categories" value={categories.length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-52">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
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
        <EmptyState
          title="No help articles"
          description="Create articles so users can self-serve common questions."
          action={<Button size="sm" onClick={() => setForm({ ...empty })}>New article</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Helpful</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="text-[13px] text-white">{a.title}</p>
                      <p className="text-[11px] text-slate-600">/help/{a.slug}</p>
                    </TableCell>
                    <TableCell className="text-[13px]">{a.category}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-[13px]">{a.views ?? 0}</TableCell>
                    <TableCell className="text-[13px] text-slate-500">{a.helpful_count ?? 0} / {a.unhelpful_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Link to={`/help/${a.slug}`} target="_blank">
                          <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              id: a.id,
                              title: a.title,
                              slug: a.slug,
                              category: a.category,
                              subcategory: a.subcategory ?? '',
                              content: a.content,
                              status: a.status,
                              sort_order: a.sort_order ?? 0,
                            })
                          }
                          leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(a)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
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
        title={form?.id ? 'Edit article' : 'New article'}
        size="lg"
        footer={
          <div className="flex justify-between items-center gap-2 w-full">
            <span className="text-[11px] text-slate-600">Status: {form ? label(form.status) : ''}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
              <Button loading={saving} onClick={save}>Save article</Button>
            </div>
          </div>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onBlur={() => setForm((f) => (f && !f.id ? { ...f, slug: f.slug || slugify(f.title) } : f))}
                />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Subcategory</label>
                <Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}>
                  {['draft', 'published', 'archived'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Content</label>
              <Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={'Intro paragraph.\n\n## Steps\n\n1. Do this.'} />
            </div>

            <div className="w-40">
              <label className="block text-[13px] text-slate-400 mb-1.5">Sort order</label>
              <Input type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete this article?"
        message={`"${confirmDelete?.title}" will be removed from the Help Centre.`}
        confirmLabel="Delete article"
        tone="danger"
      />
    </div>
  );
}
