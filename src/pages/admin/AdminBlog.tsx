import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Plus, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, Select, ConfirmDialog, EmptyState,
} from '@/components/ui';
import { contentService } from '@/services/db';
import type { BlogPost } from '@/types';
import { StatusBadge, fmtDate, LoadError, label } from './shared';

interface FormState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  reading_time_min: number;
  meta_description: string;
}

const empty: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'General',
  author_name: '',
  status: 'draft',
  reading_time_min: 5,
  meta_description: '',
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminBlog() {
  const toast = useToast();
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BlogPost | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const posts = await contentService.allPosts();
      setRows(posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (p) => p.title.toLowerCase().includes(q) || p.slug.includes(q) || (p.category ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, statusFilter]);

  const openNew = () => setForm({ ...empty, author_name: '' });

  const openEdit = (post: BlogPost) =>
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      content: post.content,
      category: post.category ?? 'General',
      author_name: post.author_name ?? '',
      status: post.status,
      reading_time_min: post.reading_time_min ?? 5,
      meta_description: post.meta_description ?? '',
    });

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug || form.title),
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        category: form.category.trim() || null,
        author_name: form.author_name.trim() || null,
        status: form.status,
        published_at: form.status === 'published' ? new Date().toISOString() : null,
        reading_time_min: Number(form.reading_time_min) || 5,
        meta_description: form.meta_description.trim() || null,
      };
      if (form.id) {
        const updated = await contentService.updatePost(form.id, payload);
        setRows((prev) => prev.map((p) => (p.id === form.id ? updated : p)));
        toast.success('Post updated');
      } else {
        const created = await contentService.createPost(payload);
        setRows((prev) => [created, ...prev]);
        toast.success('Post created');
      }
      setForm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save post');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: BlogPost) => {
    try {
      await contentService.removePost(post.id);
      setRows((prev) => prev.filter((p) => p.id !== post.id));
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete post');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Create and publish articles shown on the public blog."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              New post
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Posts" value={rows.length} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Published" value={rows.filter((p) => p.status === 'published').length} />
        <StatCard label="Drafts" value={rows.filter((p) => p.status === 'draft').length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search title, slug or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          {['draft', 'published', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Write your first article to populate the public blog."
          action={<Button size="sm" onClick={openNew}>New post</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="min-w-0 max-w-[320px]">
                        <p className="text-[13px] text-white truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-600 truncate">/blog/{p.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{p.category ? <Badge tone="muted">{p.category}</Badge> : '—'}</TableCell>
                    <TableCell className="text-[13px]">{p.author_name || '—'}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-[12px] text-slate-500">{fmtDate(p.published_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        {p.status === 'published' && (
                          <Link to={`/blog/${p.slug}`} target="_blank">
                            <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                              View
                            </Button>
                          </Link>
                        )}
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
        title={form?.id ? 'Edit post' : 'New post'}
        size="xl"
        footer={
          <div className="flex justify-between items-center gap-2 w-full">
            <span className="text-[11px] text-slate-600">Status: {form ? label(form.status) : ''}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
              <Button loading={saving} onClick={save}>Save post</Button>
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
                  onBlur={() => form.id ? undefined : setForm((f) => (f ? { ...f, slug: f.slug || slugify(f.title) } : f))}
                />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="auto-generated" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Excerpt</label>
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>

            <div>
              <label className="block text-[13px] text-slate-400 mb-1.5">Content</label>
              <Textarea
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={'Paragraph one.\n\n## Section heading\n\nParagraph two.'}
              />
              <p className="mt-1.5 text-[11px] text-slate-600">Use blank lines between paragraphs and ## before headings.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Author</label>
                <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Reading time (min)</label>
                <Input type="number" value={String(form.reading_time_min)} onChange={(e) => setForm({ ...form, reading_time_min: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}>
                  {['draft', 'published', 'archived'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-[13px] text-slate-400 mb-1.5">Meta description</label>
                <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete this post?"
        message={`"${confirmDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete post"
        tone="danger"
      />
    </div>
  );
}
