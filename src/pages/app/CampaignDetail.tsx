import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Trash2, Users, Send, Reply, Mail, Save } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select, Table,
  TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, useToast, ConfirmDialog, EmptyState, ErrorState,
} from '@/components/ui';
import { campaignService } from '@/services/db';
import type { Campaign, CampaignLead, Lead } from '@/types';
import { formatDateTime, formatDate, cn } from '@/lib/utils';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<(CampaignLead & { lead?: Lead })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stats, setStats] = useState({ sent: 0, opened: 0, replied: 0, bounced: 0 });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [c, rows] = await Promise.all([campaignService.get(id), campaignService.leads(id)]);
        if (!c) throw new Error('Campaign not found');
        setCampaign(c);
        setLeads(rows);
        setStats({
          sent: rows.length,
          opened: 0,
          replied: rows.filter((r) => r.status === 'replied').length,
          bounced: rows.filter((r) => r.status === 'bounced').length,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load campaign');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const update = async (values: Partial<Campaign>) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await campaignService.update(id, values);
      setCampaign(updated);
      toast.success('Campaign updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!campaign) return;
    const next: Campaign['status'] = campaign.status === 'running' ? 'paused' : 'running';
    await update({
      status: next,
      ...(next === 'running' ? { launched_at: campaign.launched_at ?? new Date().toISOString() } : {}),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!campaign) {
    return <ErrorState title="Campaign not found" description="It may have been deleted." onRetry={() => navigate('/app/campaigns')} />;
  }

  return (
    <div>
      <Link to="/app/campaigns" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader
        title={campaign.name}
        description={campaign.description || 'No description'}
        actions={
          <>
            <Badge tone={campaign.status === 'running' ? 'success' : campaign.status === 'paused' ? 'warning' : 'default'} dot={campaign.status === 'running'}>
              {campaign.status}
            </Badge>
            <Button variant="outline" onClick={toggleStatus} leftIcon={campaign.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}>
              {campaign.status === 'running' ? 'Pause' : 'Launch'}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Leads enrolled" value={leads.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Emails sent" value={stats.sent} icon={<Send className="h-4 w-4" />} />
        <StatCard label="Replies" value={stats.replied} icon={<Reply className="h-4 w-4" />} />
        <StatCard label="Bounced" value={stats.bounced} icon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Configuration</CardTitle>
            <Button size="sm" loading={saving} onClick={() => update({})} leftIcon={<Save className="h-3.5 w-3.5" />}>
              Save
            </Button>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" value={campaign.name} onChange={(e) => setCampaign({ ...campaign, name: e.target.value })} />
            <Input label="Daily limit" type="number" value={campaign.daily_limit} onChange={(e) => setCampaign({ ...campaign, daily_limit: Number(e.target.value) })} />
            <Select
              label="Status"
              value={campaign.status}
              onChange={(e) => setCampaign({ ...campaign, status: e.target.value as Campaign['status'] })}
              options={['draft', 'scheduled', 'running', 'paused', 'completed', 'archived'].map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Timezone"
              value={campaign.timezone}
              onChange={(e) => setCampaign({ ...campaign, timezone: e.target.value })}
              options={['UTC', 'America/New_York', 'Europe/London', 'Asia/Dhaka', 'Asia/Singapore'].map((t) => ({ value: t, label: t }))}
            />
            <Input label="Send from" type="time" value={campaign.sending_start_time} onChange={(e) => setCampaign({ ...campaign, sending_start_time: e.target.value })} />
            <Input label="Send until" type="time" value={campaign.sending_end_time} onChange={(e) => setCampaign({ ...campaign, sending_end_time: e.target.value })} />
            <div className="sm:col-span-2 space-y-2">
              {[
                ['track_opens', 'Track opens'],
                ['track_clicks', 'Track clicks'],
                ['unsubscribe_enabled', 'Unsubscribe link'],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-primary-500"
                    checked={(campaign as unknown as Record<string, boolean>)[k]}
                    onChange={(e) => setCampaign({ ...campaign, [k]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ['Created', formatDate(campaign.created_at)],
                ['Launched', campaign.launched_at ? formatDateTime(campaign.launched_at) : 'Not launched'],
                ['Paused', campaign.paused_at ? formatDateTime(campaign.paused_at) : '—'],
                ['Completed', campaign.completed_at ? formatDateTime(campaign.completed_at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className="text-xs text-slate-300">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sending window</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
                  <span
                    key={d}
                    className={cn(
                      'h-8 px-3 grid place-items-center rounded-lg text-[11px] uppercase border',
                      campaign.sending_days.includes(d)
                        ? 'bg-primary-500/20 border-primary-500/40 text-primary-200'
                        : 'bg-white/4 border-white/10 text-slate-600'
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {campaign.sending_start_time} – {campaign.sending_end_time} · {campaign.daily_limit}/day
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Enrolled leads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No leads enrolled yet"
              description="Leads are enrolled when you assign a list and launch the campaign."
              className="py-10"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 50).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-white">
                      {`${row.lead?.first_name ?? ''} ${row.lead?.last_name ?? ''}`.trim() || '—'}
                    </TableCell>
                    <TableCell>{row.lead?.email}</TableCell>
                    <TableCell>{row.lead?.company ?? '—'}</TableCell>
                    <TableCell>
                      <Badge tone={row.status === 'replied' ? 'success' : row.status === 'bounced' ? 'error' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.current_step}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await campaignService.remove(campaign.id);
          toast.success('Campaign deleted');
          navigate('/app/campaigns');
        }}
        title="Delete this campaign?"
        message="All scheduled sends for this campaign will be cancelled."
        confirmLabel="Delete"
      />
    </div>
  );
}
