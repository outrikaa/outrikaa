import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus, Upload, Search, Download, Trash2, Tag, FileSpreadsheet,
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Users, ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Badge, Input, Select, Modal, Tabs, Table, TableHeader,
  TableBody, TableRow, TableHead, TableCell, EmptyState, useToast, ConfirmDialog, Skeleton,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { leadService } from '@/services/db';
import type { Lead, LeadList, LeadStatus } from '@/types';
import { parseCSV, downloadCSV, formatDate, isValidEmail, truncate } from '@/lib/utils';

const statusTone: Record<LeadStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  new: 'muted',
  contacted: 'info',
  opened: 'primary',
  clicked: 'primary',
  replied: 'success',
  positive_reply: 'success',
  meeting: 'success',
  not_interested: 'warning',
  bounced: 'error',
  unsubscribed: 'muted',
};

const COLUMNS = [
  'first_name', 'last_name', 'email', 'phone', 'company', 'job_title',
  'website', 'linkedin_url', 'location', 'industry', 'company_size', 'source',
] as const;

type Mapping = Record<string, string>;

export default function Leads() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [listId, setListId] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(params.get('import') === '1');
  const [showDelete, setShowDelete] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const pageSize = 25;

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', company: '', job_title: '' });

  useEffect(() => {
    if (params.get('new') === '1') setShowAdd(true);
  }, [params]);

  const refresh = async () => {
    if (!workspace) return;
    try {
      const [l, ls] = await Promise.all([
        leadService.list(workspace.id),
        leadService.lists(workspace.id),
      ]);
      setLeads(l);
      setLists(ls);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const filtered = useMemo(() => {
    let out = leads;
    if (tab === 'recent') out = out.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000);
    if (tab === 'contacted') out = out.filter((l) => ['contacted', 'opened', 'clicked', 'replied', 'positive_reply', 'meeting'].includes(l.status));
    if (status) out = out.filter((l) => l.status === status);
    if (listId) {
      const memberIds = new Set<string>();
      out = out.filter(() => true);
      void memberIds;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (l) =>
          `${l.first_name ?? ''} ${l.last_name ?? ''}`.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company ?? '').toLowerCase().includes(q) ||
          (l.job_title ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [leads, tab, status, search, listId]);

  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const addLead = async () => {
    if (!workspace) return;
    if (!isValidEmail(form.email)) return toast.error('Enter a valid email address');
    if (leads.some((l) => l.email.toLowerCase() === form.email.toLowerCase())) {
      return toast.error('A lead with this email already exists');
    }
    try {
      const created = await leadService.create({ ...form, workspace_id: workspace.id, status: 'new' });
      setLeads((prev) => [created, ...prev]);
      setForm({ first_name: '', last_name: '', email: '', company: '', job_title: '' });
      setShowAdd(false);
      toast.success('Lead added');
      setParams({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add lead');
    }
  };

  const exportCsv = () => {
    downloadCSV(
      'outrikaa-leads.csv',
      filtered.map((l) => ({
        first_name: l.first_name, last_name: l.last_name, email: l.email,
        company: l.company, job_title: l.job_title, status: l.status,
        created_at: l.created_at,
      }))
    );
    toast.success(`Exported ${filtered.length} leads`);
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(selected.map((id) => leadService.remove(id)));
      setLeads((prev) => prev.filter((l) => !selected.includes(l.id)));
      toast.success(`Deleted ${selected.length} lead${selected.length > 1 ? 's' : ''}`);
      setSelected([]);
      setShowDelete(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const tagSelected = async () => {
    const tag = window.prompt('Tag to apply:');
    if (!tag) return;
    try {
      await Promise.all(
        selected.map((id) => {
          const lead = leads.find((l) => l.id === id);
          const tags = lead?.tags ?? [];
          if (tags.includes(tag)) return Promise.resolve();
          return leadService.update(id, { tags: [...tags, tag] });
        })
      );
      setLeads((prev) =>
        prev.map((l) => (selected.includes(l.id) && !l.tags.includes(tag) ? { ...l, tags: [...l.tags, tag] } : l))
      );
      toast.success(`Tagged ${selected.length} leads`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tagging failed');
    }
  };

  const createList = async () => {
    if (!workspace || !newListName.trim()) return;
    try {
      const l = await leadService.createList({
        workspace_id: workspace.id,
        name: newListName.trim(),
        color: '#8B5CF6',
      });
      setLists((prev) => [l, ...prev]);
      setNewListName('');
      setNewListOpen(false);
      toast.success('List created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create list');
    }
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${filtered.length} of ${leads.length} contacts in this workspace.`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)} leftIcon={<Upload className="h-4 w-4" />}>
              Import CSV
            </Button>
            <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Add lead
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs
          tabs={[
            { value: 'all', label: 'All', count: leads.length },
            { value: 'recent', label: 'Recent' },
            { value: 'contacted', label: 'Contacted' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search name, email, company…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="All statuses"
          className="w-44"
          options={[
            { value: 'new', label: 'New' },
            { value: 'contacted', label: 'Contacted' },
            { value: 'opened', label: 'Opened' },
            { value: 'replied', label: 'Replied' },
            { value: 'positive_reply', label: 'Positive reply' },
            { value: 'meeting', label: 'Meeting' },
            { value: 'not_interested', label: 'Not interested' },
            { value: 'bounced', label: 'Bounced' },
            { value: 'unsubscribed', label: 'Unsubscribed' },
          ]}
        />
        <Button variant="ghost" size="sm" onClick={() => setNewListOpen(true)} leftIcon={<Tag className="h-3.5 w-3.5" />}>
          New list
        </Button>
        {lists.length > 0 && (
          <Select
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            placeholder="All lists"
            className="w-40"
            options={lists.map((l) => ({ value: l.id, label: l.name }))}
          />
        )}
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3">
          <span className="text-sm text-primary-200">{selected.length} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={tagSelected} leftIcon={<Tag className="h-3.5 w-3.5" />}>
              Tag
            </Button>
            <Button size="sm" variant="danger" onClick={() => setShowDelete(true)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={search ? 'No leads match your search' : 'No leads yet'}
              description={search ? 'Try a different keyword or clear the filters.' : 'Import a CSV or add your first contact to get started.'}
              action={
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setShowImport(true)} leftIcon={<Upload className="h-4 w-4" />}>
                    Import CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
                    Add lead
                  </Button>
                </div>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-primary-500"
                      checked={selected.length > 0 && selected.length === pageRows.length}
                      onChange={(e) => setSelected(e.target.checked ? pageRows.map((r) => r.id) : [])}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-primary-500"
                        checked={selected.includes(l.id)}
                        onChange={(e) =>
                          setSelected((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((x) => x !== l.id)))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/leads/${l.id}`} className="font-medium text-white hover:text-primary-300 transition-colors">
                        {`${l.first_name ?? ''} ${l.last_name ?? ''}`.trim() || '—'}
                      </Link>
                      {l.job_title && <p className="text-xs text-slate-500">{l.job_title}</p>}
                    </TableCell>
                    <TableCell className="text-slate-400">{truncate(l.email, 32)}</TableCell>
                    <TableCell>{l.company ?? '—'}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[l.status]}>{l.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(l.tags ?? []).slice(0, 2).map((t) => (
                          <Badge key={t} tone="primary">{t}</Badge>
                        ))}
                        {(l.tags?.length ?? 0) > 2 && <Badge>+{l.tags.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                    <TableCell>
                      <button
                        onClick={async () => {
                          await leadService.remove(l.id);
                          setLeads((prev) => prev.filter((x) => x.id !== l.id));
                          toast.success('Lead deleted');
                        }}
                        className="text-slate-600 hover:text-error-400 transition-colors"
                        aria-label="Delete lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/8">
              <p className="text-xs text-slate-500">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-500 px-1">
                  {page + 1} / {pages}
                </span>
                <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add lead"
        description="Manually add a single contact to your workspace."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addLead}>Add lead</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Jane" />
          <Input label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Cooper" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" containerClassName="sm:col-span-2" />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
          <Input label="Job title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="VP of Sales" />
        </div>
      </Modal>

      <Modal
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        title="Create lead list"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setNewListOpen(false)}>Cancel</Button>
            <Button onClick={createList}>Create</Button>
          </>
        }
      >
        <Input label="List name" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Q4 SaaS prospects" autoFocus />
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteSelected}
        title={`Delete ${selected.length} lead${selected.length > 1 ? 's' : ''}?`}
        message="This permanently removes the selected contacts and their activity history. This cannot be undone."
        confirmLabel="Delete"
      />

      <CSVImport
        open={showImport}
        onClose={() => setShowImport(false)}
        workspaceId={workspace?.id ?? ''}
        existingEmails={new Set(leads.map((l) => l.email.toLowerCase()))}
        onDone={(summary) => {
          toast.success(`Imported ${summary.imported} leads`, `${summary.skipped} duplicates · ${summary.invalid} invalid`);
          refresh();
          setShowImport(false);
          setParams({});
        }}
      />
    </div>
  );
}

function CSVImport({
  open,
  onClose,
  workspaceId,
  existingEmails,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  existingEmails: Set<string>;
  onDone: (s: { imported: number; skipped: number; invalid: number }) => void;
}) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState({ imported: 0, skipped: 0, invalid: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep('upload');
      setHeaders([]);
      setRows([]);
      setMapping({});
      setSummary({ imported: 0, skipped: 0, invalid: 0, total: 0 });
    }
  }, [open]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result ?? ''));
      if (parsed.length < 2) return toast.error('CSV needs a header row and at least one data row');
      const h = parsed[0].map((x) => x.trim());
      setHeaders(h);
      setRows(parsed.slice(1));
      const auto: Mapping = {};
      h.forEach((header, i) => {
        const norm = header.toLowerCase().replace(/[\s_-]/g, '');
        const match = COLUMNS.find(
          (c) => norm === c || norm === c + 'name' || norm.includes(c) || (c === 'email' && norm.includes('mail')) || (c === 'company' && norm.includes('org'))
        );
        if (match && !Object.values(auto).includes(match)) auto[String(i)] = match;
      });
      setMapping(auto);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const mapped = useMemo(() => {
    return rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const [idx, col] of Object.entries(mapping)) {
        if (col) obj[col] = (row[Number(idx)] ?? '').trim();
      }
      return obj;
    });
  }, [rows, mapping]);

  const validation = useMemo(() => {
    const seen = new Set(existingEmails);
    let invalid = 0;
    let dupes = 0;
    const valid: Record<string, string>[] = [];
    for (const obj of mapped) {
      if (!obj.email || !isValidEmail(obj.email)) {
        invalid++;
        continue;
      }
      const key = obj.email.toLowerCase();
      if (seen.has(key)) {
        dupes++;
        continue;
      }
      seen.add(key);
      valid.push(obj);
    }
    return { valid, invalid, dupes };
  }, [mapped, existingEmails]);

  const runImport = async () => {
    if (!workspaceId) return;
    setImporting(true);
    try {
      const payload: Partial<Lead>[] = validation.valid.map((v) => ({
        workspace_id: workspaceId,
        first_name: v.first_name || null,
        last_name: v.last_name || null,
        email: v.email,
        phone: v.phone || null,
        company: v.company || null,
        job_title: v.job_title || null,
        website: v.website || null,
        linkedin_url: v.linkedin_url || null,
        location: v.location || null,
        industry: v.industry || null,
        company_size: v.company_size || null,
        source: v.source || 'csv_import',
        status: 'new',
        tags: [],
        custom_fields: {},
      }));
      for (let i = 0; i < payload.length; i += 200) {
        await leadService.createMany(payload.slice(i, i + 200));
      }
      setSummary({
        imported: validation.valid.length,
        skipped: validation.dupes,
        invalid: validation.invalid,
        total: mapped.length,
      });
      setStep('result');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size={step === 'result' ? 'sm' : 'xl'} title="Import leads from CSV">
      {step === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <FileSpreadsheet className="h-10 w-10 mx-auto text-primary-400 mb-3" />
          <p className="text-sm font-medium text-white">Drop your CSV here or click to browse</p>
          <p className="text-xs text-slate-500 mt-1.5">
            Required: email column. Optional: first name, last name, company, job title and more.
          </p>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Detected <span className="text-white font-medium">{headers.length}</span> columns and{' '}
            <span className="text-white font-medium">{rows.length}</span> rows. Map them to lead fields.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
            {headers.map((h, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3">
                <p className="text-[11px] text-slate-500 mb-1.5 truncate">{h}</p>
                <Select
                  value={mapping[String(i)] ?? ''}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value) next[String(i)] = e.target.value;
                    else delete next[String(i)];
                    setMapping(next);
                  }}
                  placeholder="Ignore this column"
                  options={COLUMNS.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-3 pt-1">
            <Button variant="ghost" onClick={() => setStep('upload')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep('preview')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Preview {mapped.length} rows
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-success-500/25 bg-success-500/5 p-3.5 text-center">
              <p className="text-xl font-bold text-success-300">{validation.valid.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Ready to import</p>
            </div>
            <div className="rounded-xl border border-warning-500/25 bg-warning-500/5 p-3.5 text-center">
              <p className="text-xl font-bold text-warning-300">{validation.dupes}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Duplicates skipped</p>
            </div>
            <div className="rounded-xl border border-error-500/25 bg-error-500/5 p-3.5 text-center">
              <p className="text-xl font-bold text-error-300">{validation.invalid}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Invalid rows</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 max-h-[34vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  {COLUMNS.filter((c) => Object.values(mapping).includes(c)).map((c) => (
                    <th key={c} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">
                      {c.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {validation.valid.slice(0, 25).map((r, i) => (
                  <tr key={i} className="hover:bg-white/4">
                    {COLUMNS.filter((c) => Object.values(mapping).includes(c)).map((c) => (
                      <td key={c} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                        {truncate(r[c] || '—', 28)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validation.invalid > 0 && (
            <p className="flex items-start gap-2 text-xs text-warning-300 bg-warning-500/10 border border-warning-500/25 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
              {validation.invalid} row{validation.invalid > 1 ? 's' : ''} will be skipped because of missing or invalid emails.
            </p>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep('map')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to mapping
            </Button>
            <Button loading={importing} onClick={runImport} disabled={validation.valid.length === 0}>
              Import {validation.valid.length} leads
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="text-center py-4">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-success-500/15 border border-success-500/30 text-success-400 mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">Import complete</h3>
          <p className="text-sm text-slate-400 mt-1.5">
            {summary.imported} imported · {summary.skipped} duplicates · {summary.invalid} invalid of {summary.total} rows.
          </p>
          <Button
            className="mt-6"
            onClick={() => onDone(summary)}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
