import { useEffect, useState } from 'react';
import { Plug, Slack, Webhook, RefreshCw, Mail, Building2, Inbox, MonitorSmartphone, MessageSquare, Database } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Skeleton, useToast, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { integrationService } from '@/services/db';
import type { Integration } from '@/types';
import { timeAgo, cn } from '@/lib/utils';

const catalog = [
  { provider: 'gmail', name: 'Gmail', desc: 'Send and sync from personal Google accounts.', icon: Mail, available: true },
  { provider: 'google_workspace', name: 'Google Workspace', desc: 'Organisational sending with admin consent.', icon: Building2, available: true },
  { provider: 'outlook', name: 'Outlook', desc: 'Microsoft personal accounts via OAuth.', icon: Inbox, available: false },
  { provider: 'microsoft365', name: 'Microsoft 365', desc: 'Tenant-wide mailboxes with Graph API.', icon: MonitorSmartphone, available: false },
  { provider: 'slack', name: 'Slack', desc: 'Push reply and campaign alerts to channels.', icon: MessageSquare, available: false },
  { provider: 'crm', name: 'CRM sync', desc: 'Two-way sync with your CRM of record.', icon: Database, available: false },
  { provider: 'webhooks', name: 'Webhooks', desc: 'Stream events to any HTTP endpoint.', icon: Webhook, available: false },
];

export default function Integrations() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Integration | null>(null);

  useEffect(() => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    integrationService
      .list(workspace.id)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
     
  }, [workspace]);

  const statusFor = (provider: string) => rows.find((r) => r.provider === provider)?.status;

  const connect = async (provider: string, name: string, available: boolean) => {
    if (!workspace) return;
    if (!available) {
      return toast.info(`${name} is coming soon`, 'Not wired up yet');
    }
    try {
      const existing = rows.find((r) => r.provider === provider);
      if (existing) {
        const updated = await integrationService.update(existing.id, { status: 'connected', connected_at: new Date().toISOString() });
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await integrationService.update(
          (await integrationService.list(workspace.id)).find((r) => r.provider === provider)?.id ?? '',
          {}
        ).catch(() => null);
        if (!created) {
          const { db } = await import('@/services/db');
          const ins = await db.insert<Integration>('integrations', {
            workspace_id: workspace.id,
            provider,
            name,
            status: 'connected',
            config: {},
            connected_at: new Date().toISOString(),
          });
          setRows((prev) => [...prev, ins]);
        }
      }
      toast.success(`${name} connected`);
    } catch {
      toast.error('Connect requires provider credentials', 'Configure them in Supabase Edge Functions');
    }
  };

  const disconnect = async () => {
    if (!pending) return;
    try {
      const updated = await integrationService.update(pending.id, { status: 'available', connected_at: null });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`${pending.name} disconnected`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setPending(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect the tools your outreach workflow depends on."
        actions={<Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => toast.info('Sync requires provider credentials')}>Sync all</Button>}
      />

      {rows.length === 0 && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/4 p-4 flex items-start gap-3">
          <Plug className="h-[18px] w-[18px] text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            Nothing connected yet. Email providers become fully functional once OAuth credentials are added server-side.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {catalog.map((item) => {
          const status = statusFor(item.provider) ?? (item.available ? 'available' : 'coming_soon');
          const connected = status === 'connected';
          return (
            <Card key={item.provider} className={cn('transition-all', connected ? 'border-success-500/30' : 'hover:border-white/20')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 grid place-items-center rounded-xl bg-white/6 border border-white/10 text-primary-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.provider}</p>
                    </div>
                  </div>
                  <Badge tone={connected ? 'success' : status === 'coming_soon' ? 'muted' : 'info'}>
                    {connected ? 'connected' : status === 'coming_soon' ? 'coming soon' : 'available'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 mt-3.5 leading-relaxed min-h-[32px]">{item.desc}</p>

                <div className="mt-4 pt-3.5 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    {connected && rows.find((r) => r.provider === item.provider)?.connected_at
                      ? `Connected ${timeAgo(rows.find((r) => r.provider === item.provider)!.connected_at)}`
                      : item.available
                        ? 'Requires credentials'
                        : 'In development'}
                  </span>
                  {connected ? (
                    <Button size="sm" variant="outline" onClick={() => setPending(rows.find((r) => r.provider === item.provider)!)}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={item.available ? 'primary' : 'outline'}
                      disabled={!item.available}
                      onClick={() => connect(item.provider, item.name, item.available)}
                    >
                      {item.available ? 'Connect' : 'Coming soon'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <Slack className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Slack notifications</p>
              <p className="text-xs text-slate-500 mt-1">
                Get reply and campaign alerts in Slack. Requires a Slack app webhook — coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <Webhook className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Outbound webhooks</p>
              <p className="text-xs text-slate-500 mt-1">
                Push events (sent, opened, replied) to your own endpoint. Coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={disconnect}
        title={`Disconnect ${pending?.name ?? ''}?`}
        message="Scheduled sends relying on this integration will be paused."
        confirmLabel="Disconnect"
      />
    </div>
  );
}
