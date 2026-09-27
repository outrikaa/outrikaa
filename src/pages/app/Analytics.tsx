import { useEffect, useState } from 'react';
import { Download, TrendingUp, Reply, MousePointer, Mail, AlertTriangle, Sparkles } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, Skeleton, EmptyState, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { analyticsService, type AnalyticsSummary, type SeriesPoint } from '@/services/analytics';
import { formatNumber, formatPercent, downloadCSV, cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#8B5CF6', '#22D3EE', '#22C55E', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [days, setDays] = useState('30');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string; sent: number; opened: number; replied: number; bounced: number; openRate: number; replyRate: number }[]>([]);
  const [mailboxes, setMailboxes] = useState<{ id: string; email_address: string; sent: number; openRate: number; replyRate: number; health_score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const d = Number(days);
        const [s, ser, cps, mbs] = await Promise.all([
          analyticsService.summary(workspace.id, d),
          analyticsService.dailySeries(workspace.id, d),
          analyticsService.campaignPerformance(workspace.id),
          analyticsService.mailboxPerformance(workspace.id),
        ]);
        if (!alive) return;
        setSummary(s);
        setSeries(ser);
        setCampaigns(cps);
        setMailboxes(mbs);
      } catch (err) {
        if (alive) toast.error(err instanceof Error ? err.message : 'Could not load analytics');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [workspace, days, toast]);

  const funnel = summary
    ? [
        { name: 'Sent', value: summary.emailsSent, color: '#8B5CF6' },
        { name: 'Delivered', value: summary.delivered, color: '#6366F1' },
        { name: 'Opened', value: summary.opened, color: '#22D3EE' },
        { name: 'Clicked', value: summary.clicked, color: '#22C55E' },
        { name: 'Replied', value: summary.replied, color: '#F59E0B' },
      ]
    : [];

  const insights = summary ? analyticsService.insights(summary) : [];

  if (loading && !summary) {
    return (
      <div className="space-y-5">
        <PageHeader title="Analytics" description="Loading metrics…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Delivery, engagement and reply performance across every campaign."
        actions={
          <>
            <Tabs
              tabs={[
                { value: '7', label: '7d' },
                { value: '30', label: '30d' },
                { value: '90', label: '90d' },
              ]}
              value={days}
              onChange={setDays}
            />
            <Button
              variant="outline"
              onClick={() => {
                downloadCSV('outrikaa-analytics.csv', series);
                toast.success('Exported daily series');
              }}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Emails sent" value={formatNumber(summary?.emailsSent ?? 0)} icon={<Mail className="h-4 w-4" />} hint={`last ${days} days`} />
        <StatCard label="Open rate" value={formatPercent(summary?.openRate ?? 0)} icon={<TrendingUp className="h-4 w-4" />} hint={`${summary?.opened ?? 0} opens`} />
        <StatCard label="Reply rate" value={formatPercent(summary?.replyRate ?? 0)} icon={<Reply className="h-4 w-4" />} hint={`${summary?.replied ?? 0} replies`} />
        <StatCard label="Bounce rate" value={formatPercent(summary?.bounceRate ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} hint={`${summary?.bounced ?? 0} bounced`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Delivered" value={formatNumber(summary?.delivered ?? 0)} />
        <StatCard label="Clicked" value={formatNumber(summary?.clicked ?? 0)} icon={<MousePointer className="h-4 w-4" />} />
        <StatCard label="Positive replies" value={formatNumber(summary?.positiveReplies ?? 0)} icon={<Reply className="h-4 w-4" />} />
        <StatCard label="Unsubscribed" value={formatNumber(summary?.unsubscribed ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Engagement over time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="sent" stroke="#8B5CF6" strokeWidth={2} fill="url(#a1)" name="Sent" />
                  <Area type="monotone" dataKey="opened" stroke="#22D3EE" strokeWidth={2} fill="url(#a2)" name="Opened" />
                  <Area type="monotone" dataKey="replied" stroke="#22C55E" strokeWidth={2} fill="url(#a3)" name="Replied" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conversion funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              {summary && summary.emailsSent === 0 ? (
                <EmptyState title="No data yet" description="Send your first campaign to see the funnel." className="py-8" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={funnel} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="none">
                      {funnel.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Campaign comparison</CardTitle>
          <Badge tone="muted">top {campaigns.length}</Badge>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns to compare" description="Create a campaign to see performance side by side." className="py-8" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaigns.map((c) => ({ name: c.name.slice(0, 18), open: c.openRate, reply: c.replyRate }))}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="open" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Open %" />
                  <Bar dataKey="reply" fill="#22D3EE" radius={[6, 6, 0, 0]} name="Reply %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Mailbox performance</CardTitle></CardHeader>
          <CardContent className="p-0">
            {mailboxes.length === 0 ? (
              <EmptyState title="No mailboxes" description="Connect a mailbox to track per-sender performance." className="py-8" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mailbox</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Open rate</TableHead>
                    <TableHead>Reply rate</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mailboxes.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-white">{m.email_address}</TableCell>
                      <TableCell>{m.sent}</TableCell>
                      <TableCell>{formatPercent(m.openRate)}</TableCell>
                      <TableCell>{formatPercent(m.replyRate)}</TableCell>
                      <TableCell>
                        <Badge tone={m.health_score >= 80 ? 'success' : m.health_score >= 50 ? 'warning' : 'error'}>
                          {m.health_score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <CardTitle>AI insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((ins) => (
              <div key={ins.title} className={cn('rounded-xl border p-3.5', ins.tone === 'good' ? 'border-success-500/25 bg-success-500/5' : ins.tone === 'warn' ? 'border-warning-500/25 bg-warning-500/5' : 'border-primary-500/25 bg-primary-500/5')}>
                <p className="text-[13px] font-semibold text-white">{ins.title}</p>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{ins.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
