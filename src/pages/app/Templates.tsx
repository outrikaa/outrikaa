import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Star, Copy, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, Textarea, Modal, EmptyState, Skeleton, useToast, ConfirmDialog, Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { templateService } from '@/services/db';
import type { EmailTemplate } from '@/types';
import { formatDate, truncate } from '@/lib/utils';

const empty = { name: '', subject: '', body: '', preview_text: '', tags: [] as string[] };

export default function Templates() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<(EmailTemplate | typeof empty) & { id?: string }>(empty);
  const [confirm, setConfirm] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    templateService
      .list(workspace.id)
      .then(setTemplates)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load templates'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      ),
    [templates, search]
  );

  const openNew = () => {
    setEditing({ ...empty });
    setOpen(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setOpen(true);
  };

  const save = async () => {
    if (!workspace) return;
    if (!editing.name.trim()) return toast.error('Template name is required');
    if (!editing.subject.trim()) return toast.error('Subject is required');
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await templateService.update(editing.id, {
          name: editing.name,
          subject: editing.subject,
          body: editing.body,
          preview_text: editing.preview_text,
          tags: editing.tags,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success('Template updated');
      } else {
        const created = await templateService.create({
          workspace_id: workspace.id,
          name: editing.name,
          subject: editing.subject,
          body: editing.body,
          preview_text: editing.preview_text,
          tags: editing.tags,
        });
        setTemplates((prev) => [created, ...prev]);
        toast.success('Template created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (t: EmailTemplate) => {
    if (!workspace) return;
    try {
      const copy = await templateService.create({
        workspace_id: workspace.id,
        name: `${t.name} (copy)`,
        subject: t.subject,
        body: t.body,
        preview_text: t.preview_text,
        tags: t.tags,
      });
      setTemplates((prev) => [copy, ...prev]);
      toast.success('Template duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  const toggleFavorite = async (t: EmailTemplate) => {
    try {
      const updated = await templateService.update(t.id, { is_favorite: !t.is_favorite });
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Email templates"
        description="Reusable copy for first touches and follow-ups."
        actions={<Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>New template</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search templates…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={search ? 'No templates match your search' : 'No templates yet'}
              description="Save winning copy once and reuse it across every campaign."
              action={<Button size="sm" onClick={openNew}>Create template</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="group hover:border-white/20 transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-white truncate">{t.name}</h3>
                      <button onClick={() => toggleFavorite(t)} aria-label="Favorite">
                        <Star className={t.is_favorite ? 'h-4 w-4 text-warning-400 fill-warning-400' : 'h-4 w-4 text-slate-600 group-hover:text-slate-400'} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">{truncate(t.subject, 56)}</p>
                  </div>
                  <Dropdown
                    trigger={
                      <button className="h-8 w-8 grid place-items-center rounded-lg border border-white/12 text-slate-400 hover:bg-white/10 transition-colors">
                        ⋯
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => openEdit(t)}>Edit</DropdownItem>
                    <DropdownItem onClick={() => duplicate(t)} icon={<Copy className="h-4 w-4" />}>Duplicate</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem danger onClick={() => setConfirm(t)} icon={<Trash2 className="h-4 w-4" />}>Delete</DropdownItem>
                  </Dropdown>
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-3 flex-1 leading-relaxed">
                  {truncate(t.body.replace(/\{\{[^}]+\}\}/g, '…'), 160)}
                </p>

                <div className="mt-4 pt-3.5 border-t border-white/8 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(t.tags ?? []).slice(0, 2).map((tag) => (
                      <Badge key={tag} tone="primary">{tag}</Badge>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-600">{formatDate(t.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing.id ? 'Edit template' : 'New template'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={save}>{editing.id ? 'Save changes' : 'Create template'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Template name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Cold intro — SaaS CTOs" />
          <Input label="Subject" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Quick question about {{company}}" />
          <Input label="Preview text" value={editing.preview_text ?? ''} onChange={(e) => setEditing({ ...editing, preview_text: e.target.value })} placeholder="Shown after the subject line" />
          <Textarea
            label="Body"
            rows={12}
            value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            placeholder={"Hi {{first_name}},\n\nI noticed…"}
            hint="Supported variables: {{first_name}}, {{last_name}}, {{company}}, {{job_title}}, {{email}}"
          />
          <Input
            label="Tags"
            value={(editing.tags ?? []).join(', ')}
            onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="cold, intro, saas"
            hint="Comma separated."
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          await templateService.remove(confirm.id);
          setTemplates((prev) => prev.filter((t) => t.id !== confirm.id));
          toast.success('Template deleted');
          setConfirm(null);
        }}
        title="Delete this template?"
        message="Sequences referencing it will keep their inline copy."
        confirmLabel="Delete"
      />
    </div>
  );
}
