import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Building2, MapPin, Phone, Globe, Trash2, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Skeleton, useToast, ConfirmDialog, ErrorState } from '@/components/ui';
import { leadService, db } from '@/services/db';
import type { Lead, EmailMessage } from '@/types';
import { formatDateTime, timeAgo, cn } from '@/lib/utils';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [l, msgs] = await Promise.all([
          db.get<Lead>('leads', id),
          db.list<EmailMessage>('email_messages', {
            filters: { lead_id: id },
            orderBy: { column: 'created_at', ascending: false },
          }),
        ]);
        if (!l) throw new Error('Lead not found');
        setLead(l);
        setForm(l);
        setMessages(msgs);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load lead');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await leadService.update(id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        job_title: form.job_title,
        website: form.website,
        location: form.location,
        status: form.status,
        score: form.score,
        tags: form.tags,
      });
      setLead(updated);
      toast.success('Lead updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    try {
      await leadService.remove(id);
      toast.success('Lead deleted');
      navigate('/app/leads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!lead) {
    return <ErrorState title="Lead not found" description="This contact may have been deleted." onRetry={() => navigate('/app/leads')} />;
  }

  return (
    <div>
      <Link to="/app/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <PageHeader
        title={`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || lead.email}
        description={lead.job_title && lead.company ? `${lead.job_title} at ${lead.company}` : lead.email}
        actions={
          <>
            <Button variant="danger" onClick={() => setConfirm(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
            <Button loading={saving} onClick={save} leftIcon={<Save className="h-4 w-4" />}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" value={form.first_name ?? ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label="Last name" value={form.last_name ?? ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <Input label="Email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Company" value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input label="Job title" value={form.job_title ?? ''} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              <Input label="Website" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <Input label="Location" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Select
                label="Status"
                value={form.status ?? 'new'}
                onChange={(e) => setForm({ ...form, status: e.target.value as Lead['status'] })}
                options={['new', 'contacted', 'opened', 'clicked', 'replied', 'positive_reply', 'meeting', 'not_interested', 'bounced', 'unsubscribed'].map((s) => ({
                  value: s,
                  label: s.replace('_', ' '),
                }))}
              />
              <Input
                label="Lead score"
                type="number"
                min={0}
                max={100}
                value={form.score ?? 0}
                onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No email activity yet for this contact.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white truncate">{m.subject ?? '(no subject)'}</p>
                        <Badge tone={m.direction === 'outbound' ? 'primary' : 'info'}>{m.direction}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.preview_text ?? m.body ?? ''}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600">
                        <span>{formatDateTime(m.created_at)}</span>
                        <Badge tone={m.status === 'bounced' ? 'error' : m.status === 'replied' ? 'success' : 'default'}>{m.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Mail className="h-4 w-4 text-slate-500" /> <span className="truncate">{lead.email}</span>
              </div>
              {lead.company && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Building2 className="h-4 w-4 text-slate-500" /> {lead.company}
                </div>
              )}
              {lead.location && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-500" /> {lead.location}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Phone className="h-4 w-4 text-slate-500" /> {lead.phone}
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Globe className="h-4 w-4 text-slate-500" /> <span className="truncate">{lead.website}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                <span className="text-xs text-slate-500">Added</span>
                <span className="text-xs text-slate-300">{timeAgo(lead.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Last activity</span>
                <span className="text-xs text-slate-300">{timeAgo(lead.last_activity_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(form.tags ?? []).map((t) => (
                  <span key={t} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-xs text-primary-200')}>
                    {t}
                    <button
                      onClick={() => setForm({ ...form, tags: (form.tags ?? []).filter((x) => x !== t) })}
                      className="text-primary-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(form.tags ?? []).length === 0 && <p className="text-xs text-slate-500">No tags applied.</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = e.currentTarget.value.trim();
                      if (v && !(form.tags ?? []).includes(v)) {
                        setForm({ ...form, tags: [...(form.tags ?? []), v] });
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        title="Delete this lead?"
        message="The contact and their activity history will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
