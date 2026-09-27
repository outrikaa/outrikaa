import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Input, Select, Textarea, useToast, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { campaignService, leadService, mailboxService, sequenceService } from '@/services/db';
import type { Campaign } from '@/types';
import { cn } from '@/lib/utils';

const steps = ['Basics', 'Audience', 'Sending', 'Review'];

export default function CampaignNew() {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [mailboxes, setMailboxes] = useState<{ id: string; email_address: string; status: string }[]>([]);
  const [sequences, setSequences] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    lead_list_id: '',
    mailbox_id: '',
    sequence_id: '',
    daily_limit: 50,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sending_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    sending_start_time: '09:00',
    sending_end_time: '17:00',
    track_opens: true,
    track_clicks: true,
    unsubscribe_enabled: true,
  });

  useEffect(() => {
    if (!workspace) return;
    (async () => {
      try {
        const [l, m, s] = await Promise.all([
          leadService.lists(workspace.id),
          mailboxService.list(workspace.id),
          sequenceService.list(workspace.id),
        ]);
        setLists(l);
        setMailboxes(m);
        setSequences(s);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load options');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const toggleDay = (d: string) =>
    setForm((f) => ({
      ...f,
      sending_days: f.sending_days.includes(d) ? f.sending_days.filter((x) => x !== d) : [...f.sending_days, d],
    }));

  const submit = async () => {
    if (!workspace) return;
    if (!form.name.trim()) return toast.error('Give the campaign a name');
    if (!form.lead_list_id) return toast.error('Choose a lead list');
    setSaving(true);
    try {
      const created = await campaignService.create({
        workspace_id: workspace.id,
        status: 'draft',
        ...form,
      } as Partial<Campaign>);
      toast.success('Campaign created');
      navigate(`/app/campaigns/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create campaign');
      setSaving(false);
    }
  };

  const canNext =
    step === 0 ? form.name.trim().length > 0 :
    step === 1 ? !!form.lead_list_id :
    step === 2 ? (form.sending_days.length > 0 && form.daily_limit > 0) :
    true;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/app/campaigns" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader title="New campaign" description="Set up your audience, schedule and tracking in a few steps." />

      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={cn('h-1.5 rounded-full transition-all', i < step ? 'bg-primary-500' : i === step ? 'bg-primary-500/60' : 'bg-white/10')} />
            <p className={cn('mt-2 text-[11px]', i === step ? 'text-primary-300' : 'text-slate-600')}>{s}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <Input label="Campaign name" placeholder="Q4 SaaS CTOs — cold outbound" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              <Textarea label="Description" placeholder="What is this campaign trying to achieve?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <Select
                label="Lead list"
                value={form.lead_list_id}
                onChange={(e) => setForm({ ...form, lead_list_id: e.target.value })}
                placeholder={lists.length ? 'Select a list' : 'No lists available yet'}
                options={lists.map((l) => ({ value: l.id, label: l.name }))}
              />
              {lists.length === 0 && (
                <div className="rounded-xl border border-warning-500/25 bg-warning-500/5 p-4 text-sm text-warning-200">
                  You need a lead list first.{' '}
                  <Link to="/app/leads?import=1" className="underline underline-offset-2">Import leads</Link> to create one.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-300">Sending mailbox</label>
                <Select
                  value={form.mailbox_id}
                  onChange={(e) => setForm({ ...form, mailbox_id: e.target.value })}
                  placeholder="Select a mailbox"
                  options={mailboxes.map((m) => ({ value: m.id, label: `${m.email_address} (${m.status})` }))}
                />
                {mailboxes.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No mailbox connected yet — <Link to="/app/mailboxes" className="text-primary-400">connect one</Link>.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-300">Sequence</label>
                <Select
                  value={form.sequence_id}
                  onChange={(e) => setForm({ ...form, sequence_id: e.target.value })}
                  placeholder="Select a sequence"
                  options={sequences.map((s) => ({ value: s.id, label: s.name }))}
                />
                <p className="text-xs text-slate-500">
                  Build one in the <Link to="/app/sequences" className="text-primary-400">sequence builder</Link> if you haven't.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Daily send limit"
                  type="number"
                  min={1}
                  max={1000}
                  value={form.daily_limit}
                  onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })}
                  hint="Keep it under 150 per mailbox for warm reputation."
                />
                <Select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  options={[form.timezone, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Dhaka'].filter((v, i, a) => a.indexOf(v) === i).map((t) => ({ value: t, label: t }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-300">Sending days</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => toggleDay(v)}
                      className={cn(
                        'h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-all',
                        form.sending_days.includes(v)
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-200'
                          : 'bg-white/4 border-white/10 text-slate-400 hover:bg-white/8'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Send from" type="time" value={form.sending_start_time} onChange={(e) => setForm({ ...form, sending_start_time: e.target.value })} />
                <Input label="Send until" type="time" value={form.sending_end_time} onChange={(e) => setForm({ ...form, sending_end_time: e.target.value })} />
              </div>

              <div className="space-y-2 pt-1">
                {[
                  ['track_opens', 'Track opens', 'Adds a tracking pixel to measure open rate.'],
                  ['track_clicks', 'Track clicks', 'Rewrites links to measure click-through.'],
                  ['unsubscribe_enabled', 'Unsubscribe link', 'Adds a compliant opt-out footer to every email.'],
                ].map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/4 p-3.5 cursor-pointer hover:bg-white/8 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded accent-primary-500"
                      checked={(form as unknown as Record<string, boolean>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    />
                    <span>
                      <span className="block text-sm text-white">{label}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary-400" />
                <p className="text-sm font-medium text-white">Review your setup</p>
              </div>
              <div className="divide-y divide-white/8 rounded-xl border border-white/10 overflow-hidden">
                {[
                  ['Name', form.name || '—'],
                  ['Description', form.description || '—'],
                  ['Lead list', lists.find((l) => l.id === form.lead_list_id)?.name ?? '—'],
                  ['Mailbox', mailboxes.find((m) => m.id === form.mailbox_id)?.email_address ?? 'Not connected'],
                  ['Sequence', sequences.find((s) => s.id === form.sequence_id)?.name ?? '—'],
                  ['Daily limit', `${form.daily_limit} emails / day`],
                  ['Days', form.sending_days.join(', ').toUpperCase() || '—'],
                  ['Window', `${form.sending_start_time} – ${form.sending_end_time} (${form.timezone})`],
                  ['Tracking', [form.track_opens && 'opens', form.track_clicks && 'clicks', form.unsubscribe_enabled && 'unsubscribe'].filter(Boolean).join(', ') || 'none'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 px-4 py-3 bg-white/4">
                    <span className="text-xs text-slate-500 shrink-0">{k}</span>
                    <span className="text-sm text-slate-200 text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-primary-500/25 bg-primary-500/5 p-4 text-xs text-slate-400 leading-relaxed">
                The campaign starts in <span className="text-white">Draft</span>. You can launch it from the campaign detail
                page once the mailbox and sequence are ready.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        {step < 3 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue
          </Button>
        ) : (
          <Button loading={saving} onClick={submit} leftIcon={<Check className="h-4 w-4" />}>
            Create campaign
          </Button>
        )}
      </div>
    </div>
  );
}
