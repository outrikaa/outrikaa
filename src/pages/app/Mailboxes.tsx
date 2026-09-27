import { useEffect, useState } from 'react';
import { Mail, Plus, RefreshCw, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, Modal, EmptyState, Skeleton, useToast, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { mailboxService } from '@/services/db';
import { emailService } from '@/services/email';
import type { Mailbox } from '@/types';
import { formatDate, cn } from '@/lib/utils';

const providers = [
  { id: 'gmail', label: 'Gmail', desc: 'Personal Google account via OAuth' },
  { id: 'google', label: 'Google Workspace', desc: 'Workspaces via OAuth' },
  { id: 'outlook', label: 'Outlook', desc: 'Personal Microsoft account via OAuth' },
  { id: 'microsoft365', label: 'Microsoft 365', desc: 'Business tenants via OAuth' },
  { id: 'smtp', label: 'Custom SMTP', desc: 'Any provider with app credentials' },
];

export default function Mailboxes() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('gmail');
  const [email, setEmail] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [confirm, setConfirm] = useState<Mailbox | null>(null);

  useEffect(() => {
    if (!workspace) return;
    mailboxService
      .list(workspace.id)
      .then(setMailboxes)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load mailboxes'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const connect = async () => {
    if (!email.trim()) return toast.error('Enter the mailbox address');
    setConnecting(true);
    const result = await emailService.connect(provider as 'gmail', { email });
    setConnecting(false);

    if (result.ok) {
      if (workspace) {
        try {
          const created = await mailboxService.create({
            workspace_id: workspace.id,
            email_address: email,
            provider: 'gmail',
            status: 'connected',
            daily_limit: 50,
            sent_today: 0,
            sending_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            sending_start_time: '09:00',
            sending_end_time: '17:00',
            health_score: 100,
            bounce_rate: 0,
            connected_at: new Date().toISOString(),
          });
          setMailboxes((prev) => [created, ...prev]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not save mailbox');
        }
      }
      toast.success('Mailbox connected');
      setOpen(false);
      setEmail('');
    } else {
      toast.error(result.message, 'Credentials required');
      if (workspace) {
        try {
          const pending = await mailboxService.create({
            workspace_id: workspace.id,
            email_address: email,
            provider: 'gmail',
            status: 'needs_attention',
            daily_limit: 50,
            sent_today: 0,
            sending_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            sending_start_time: '09:00',
            sending_end_time: '17:00',
            health_score: 40,
            bounce_rate: 0,
          });
          setMailboxes((prev) => [pending, ...prev]);
        } catch {
          /* ignore */
        }
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Mailboxes"
        description="Sending accounts with per-mailbox limits, schedules and health scoring."
        actions={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Connect mailbox</Button>}
      />

      <div className="mb-5 rounded-2xl border border-warning-500/25 bg-warning-500/5 p-4 flex items-start gap-3">
        <Shield className="h-4.5 w-4.5 h-[18px] w-[18px] text-warning-400 shrink-0 mt-0.5" />
        <div className="text-sm text-warning-100/90">
          <p className="font-medium">OAuth / SMTP credentials are not configured yet</p>
          <p className="text-xs text-warning-200/70 mt-1 leading-relaxed">
            Mailboxes can be registered here, but sending stays disabled until Gmail, Google Workspace, Outlook or
            Microsoft 365 credentials are added to the Supabase Edge Functions. No passwords are ever stored in the app.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : mailboxes.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Mail className="h-6 w-6" />}
              title="No mailboxes connected"
              description="Connect a sending account before launching a campaign."
              action={<Button size="sm" onClick={() => setOpen(true)}>Connect mailbox</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mailboxes.map((mb) => {
            const pctUsed = Math.round((mb.sent_today / (mb.daily_limit || 1)) * 100);
            return (
              <Card key={mb.id} className="hover:border-white/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 grid place-items-center rounded-xl bg-accent-500/15 border border-accent-500/25 text-accent-300 shrink-0">
                        <Mail className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{mb.email_address}</p>
                        <p className="text-[11px] text-slate-500">{mb.provider}</p>
                      </div>
                    </div>
                    <Badge tone={mb.status === 'connected' ? 'success' : mb.status === 'needs_attention' ? 'warning' : 'muted'} dot={mb.status === 'connected'}>
                      {mb.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Today's volume</span>
                      <span>{mb.sent_today} / {mb.daily_limit}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', pctUsed > 90 ? 'bg-error-500' : pctUsed > 70 ? 'bg-warning-500' : 'bg-primary-500')}
                        style={{ width: `${Math.min(pctUsed, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-white/4 border border-white/8 py-2">
                      <p className={cn('text-sm font-semibold', mb.health_score >= 80 ? 'text-success-400' : mb.health_score >= 50 ? 'text-warning-400' : 'text-error-400')}>
                        {mb.health_score}
                      </p>
                      <p className="text-[10px] text-slate-500">health</p>
                    </div>
                    <div className="rounded-lg bg-white/4 border border-white/8 py-2">
                      <p className="text-sm font-semibold text-white">{mb.bounce_rate}%</p>
                      <p className="text-[10px] text-slate-500">bounce rate</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/8 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">
                      {mb.connected_at ? `Connected ${formatDate(mb.connected_at)}` : 'Not connected'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await mailboxService.update(mb.id, { sent_today: 0 });
                          setMailboxes((prev) => prev.map((m) => (m.id === mb.id ? { ...m, sent_today: 0 } : m)));
                          toast.success('Daily counter reset');
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirm(mb)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Connect a mailbox"
        description="Choose a provider and register the address. OAuth happens provider-side."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={connecting} onClick={connect}>Connect</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3',
                  provider === p.id ? 'border-primary-500/50 bg-primary-500/10' : 'border-white/10 bg-white/4 hover:bg-white/8'
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-white">{p.label}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{p.desc}</span>
                </span>
                {provider === p.id && <Badge tone="primary">Selected</Badge>}
              </button>
            ))}
          </div>
          <Input label="Mailbox address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex items-start gap-2.5 rounded-xl border border-warning-500/25 bg-warning-500/5 p-3.5">
            <AlertTriangle className="h-4 w-4 text-warning-400 shrink-0 mt-0.5" />
            <p className="text-xs text-warning-200/80 leading-relaxed">
              Until provider credentials are configured server-side, this mailbox will be registered as
              <span className="text-white"> needs attention</span> and sending will stay disabled.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          await mailboxService.remove(confirm.id);
          setMailboxes((prev) => prev.filter((m) => m.id !== confirm.id));
          toast.success('Mailbox removed');
          setConfirm(null);
        }}
        title="Disconnect mailbox?"
        message="Scheduled sends using this mailbox will be cancelled."
        confirmLabel="Disconnect"
      />
    </div>
  );
}
