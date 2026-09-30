import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Eye, FileText, Star } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, Modal, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { EmailTemplate, Workspace } from '@/types';
import { fmtDate, LoadError, timeAgoShort, Row } from './shared';

type TemplateRow = EmailTemplate & { workspace_name?: string };

export default function AdminTemplates() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TemplateRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [templates, workspaces] = await Promise.all([
        db.list<EmailTemplate>('email_templates', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 199 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      setRows(templates.map((t) => ({ ...t, workspace_name: wsMap.get(t.workspace_id) ?? 'Unknown' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load templates');
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
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.workspace_name ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Email templates saved by workspaces across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <StatCard label="Templates" value={rows.length} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Workspaces using templates" value={new Set(rows.map((r) => r.workspace_id)).size} />
        <StatCard label="Favourited" value={rows.filter((r) => r.is_favorite).length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search template, subject or tag…"
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
        <EmptyState title="No templates yet" description="Templates created in the app will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="text-[13px] text-white flex items-center gap-1.5">
                        {t.name}
                        {t.is_favorite && (
                          <span title="Favourite">
                            <Star className="h-3.5 w-3.5 text-warning-400 fill-warning-400" />
                          </span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-[13px] max-w-[260px] truncate">{t.subject}</TableCell>
                    <TableCell className="text-[13px]">{t.workspace_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(t.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} tone="muted">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500">{timeAgoShort(t.updated_at ?? t.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(t)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? 'Template'} size="lg">
        {selected && (
          <div>
            <Row label="Workspace">{selected.workspace_name}</Row>
            <Row label="Subject">{selected.subject}</Row>
            <Row label="Preview text">{selected.preview_text || '—'}</Row>
            <Row label="Tags">{(selected.tags ?? []).join(', ') || '—'}</Row>
            <Row label="Created">{fmtDate(selected.created_at)}</Row>
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-600 mb-2">Body</p>
              <div className="rounded-xl border border-white/10 bg-white/4 p-4 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-[13px] text-slate-300 leading-relaxed font-sans">{selected.body}</pre>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
