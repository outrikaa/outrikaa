import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Megaphone, Send, Reply, TrendingUp, Plus, Sparkles,
  ArrowUpRight, Clock, BarChart3,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState, SkeletonCard, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { db, campaignService, messageService } from '@/services/db';
import { analyticsService, type AnalyticsSummary, type SeriesPoint } from '@/services/analytics';
import type { Campaign, Lead, ScheduledEmail } from '@/types';
import { formatNumber, formatPercent, timeAgo, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const { profile, workspace } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scheduled, setScheduled] = useState<(ScheduledEmail & { lead?: Lead; campaign?: Campaign })[]>([]);
  const [activities, setActivities] = useState<{ id: string; title: string; message: string; created_at: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [s, ser, camps, sched, acts] = await Promise.all([
          analyticsService.summary(workspace.id),
          analyticsService.dailySeries(workspace.id, 30),
          campaignService.list(workspace.id),
          messageService.scheduled(workspace.id),
          db.list<{ id: string; title: string; message: string; created_at: string; type: string }>('notifications', {
            filters: { user_id: profile?.id },
            orderBy: { column: 'created_at', ascending: false },
            from: 0,
            to: 7,
          }),
        ]);
        if (!alive) return;
        setSummary(s);
        setSeries(ser);
        setCampaigns(camps);
        setScheduled(sched);
        setActivities(acts);
      } catch (err) {
        if (alive) toast.error(err instanceof Error ? err.message : 'Could not load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [workspace, profile, toast]);

  const insights = useMemo(() => (summary ? analyticsService.insights(summary) : []), [summary]);
  const isNew = summary !== null && summary.emailsSent === 0 && summary.totalLeads === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Loading your workspace…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total leads', value: formatNumber(summary?.totalLeads ?? 0), icon: <Users className="h-4 w-4" />, to: '/app/leads' },
    { label: 'Active campaigns', value: summary?.activeCampaigns ?? 0, icon: <Megaphone className="h-4 w-4" />, to: '/app/campaigns' },
    { label: 'Emails sent (30d)', value: formatNumber(summary?.emailsSent ?? 0), icon: <Send className="h-4 w-4" />, to: '/app/analytics' },
    { label: 'Reply rate', value: formatPercent(summary?.replyRate ?? 0), icon: <Reply className="h-4 w-4" />, to: '/app/analytics', tone: (summary?.replyRate ?? 0) >= 5 ? 'good' : 'neutral' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="Here's what's happening across your outreach today."
        actions={
          <>
            <Link to="/app/ai-writer"><Button variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>Write with AI</Button></Link>
            <Link to="/app/campaigns/new"><Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button></Link>
          </>
        }
      />

      {isNew ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="Let's get your first campaign out the door"
              description="Import leads, connect a mailbox and let the AI draft your first email. It takes about five minutes."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/app/leads?import=1"><Button leftIcon={<Users className="h-4 w-4" />}>Import leads</Button></Link>
                  <Link to="/app/campaigns/new"><Button variant="outline">Create campaign</Button></Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <StatCard
              label={s.label}
              value={s.value}
              icon={s.icon}
              delta={s.tone === 'good' ? 'Above benchmark' : undefined}
              deltaTone="good"
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Delivered" value={formatNumber(summary?.delivered ?? 0)} icon={<Send className="h-4 w-4" />} hint="30 days" />
        <StatCard label="Opened" value={formatPercent(summary?.openRate ?? 0)} icon={<TrendingUp className="h-4 w-4" />} hint={`${summary?.opened ?? 0} opens`} />
        <StatCard label="Replies" value={formatNumber(summary?.replied ?? 0)} icon={<Reply className="h-4 w-4" />} hint={`${summary?.positiveReplies ?? 0} positive`} />
        <StatCard label="Bounces" value={formatPercent(summary?.bounceRate ?? 0)} icon={<BarChart3 className="h-4 w-4" />} hint={`${summary?.bounced ?? 0} bounced`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Sending volume</CardTitle>
            <Badge tone="muted">Last 30 days</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="replyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0B0D11',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#3B82F6" strokeWidth={2} fill="url(#sentGrad)" name="Sent" />
                  <Area type="monotone" dataKey="replied" stroke="#38BDF8" strokeWidth={2} fill="url(#replyGrad)" name="Replied" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 && <p className="text-sm text-slate-500">Not enough data yet.</p>}
            {insights.map((ins) => (
              <div
                key={ins.title}
                className={cn(
                  'rounded-xl border p-3.5',
                  ins.tone === 'good' && 'border-success-500/25 bg-success-500/5',
                  ins.tone === 'warn' && 'border-warning-500/25 bg-warning-500/5',
                  ins.tone === 'info' && 'border-primary-500/25 bg-primary-500/5'
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={cn('h-3.5 w-3.5', ins.tone === 'good' ? 'text-success-400' : ins.tone === 'warn' ? 'text-warning-400' : 'text-primary-400')} />
                  <p className="text-[13px] font-semibold text-white">{ins.title}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{ins.body}</p>
              </div>
            ))}
            <Link to="/app/analytics" className="block text-center text-[13px] text-primary-400 hover:text-primary-300 pt-1">
              View full analytics →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Top campaigns</CardTitle>
            <Link to="/app/campaigns" className="text-xs text-primary-400 hover:text-primary-300">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {campaigns.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/app/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3.5 py-3 hover:bg-white/8 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{timeAgo(c.created_at)}</p>
                </div>
                <Badge tone={c.status === 'running' ? 'success' : c.status === 'paused' ? 'warning' : c.status === 'completed' ? 'info' : 'default'}>
                  {c.status}
                </Badge>
              </Link>
            ))}
            {campaigns.length === 0 && (
              <EmptyState
                icon={<Megaphone className="h-5 w-5" />}
                title="No campaigns yet"
                description="Create one to start outreach."
                className="py-8"
                action={<Link to="/app/campaigns/new"><Button size="sm">New campaign</Button></Link>}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming sends</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {scheduled.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] text-white truncate">
                    {s.lead ? `${s.lead.first_name ?? ''} ${s.lead.last_name ?? ''}`.trim() || s.lead.email : 'Lead'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{s.campaign?.name ?? 'Campaign'}</p>
                </div>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">{timeAgo(s.scheduled_for)}</span>
              </div>
            ))}
            {scheduled.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">Nothing scheduled.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Link to="/app/inbox" className="text-xs text-primary-400 hover:text-primary-300">Inbox</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No activity yet.</p>}
            {activities.map((a) => (
              <div key={a.id} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-white truncate">{a.title}</p>
                  {a.message && <p className="text-xs text-slate-500 truncate">{a.message}</p>}
                  <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Getting started</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/app/leads?import=1', title: 'Import leads', desc: 'Upload a CSV and map columns' },
              { to: '/app/mailboxes', title: 'Connect mailbox', desc: 'Gmail, Workspace or SMTP' },
              { to: '/app/ai-writer', title: 'Draft with AI', desc: 'Generate subject lines & body' },
              { to: '/app/campaigns/new', title: 'Launch campaign', desc: 'Schedule and start sending' },
            ].map((s) => (
              <Link
                key={s.title}
                to={s.to}
                className="rounded-xl border border-white/8 bg-white/4 p-4 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
              >
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
