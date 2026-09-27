import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Megaphone, Mail, CreditCard, Sparkles, LifeBuoy, ArrowUpRight } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@/components/ui';
import { db } from '@/services/db';
import { StatusBadge, timeAgoShort, fmtDate, Empty, LoadError } from './shared';

interface DashboardData {
  users: number;
  admins: number;
  workspaces: number;
  campaigns: number;
  messages: number;
  activeSubs: number;
  aiGenerations: number;
  openTickets: number;
  recentProfiles: { id: string; email: string; full_name: string | null; is_admin: boolean; onboarding_completed: boolean; created_at: string }[];
  recentCampaigns: { id: string; name: string; status: string; created_at: string; workspace: { name: string } | null }[];
  recentLogs: { id: string; action: string; target_type: string | null; created_at: string }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const [
          users, admins, workspaces, campaigns, messages, subs, usage, tickets,
          profiles, campRows, logs,
        ] = await Promise.all([
          db.count('profiles'),
          db.count('profiles', { is_admin: true }),
          db.count('workspaces'),
          db.count('campaigns'),
          supabaseCount('email_messages', since),
          db.count('subscriptions', { status: 'active' }),
          sumUsage(since),
          db.count('support_tickets', { status: 'open' }),
          db.list<DashboardData['recentProfiles'][number]>('profiles', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 7 }),
          db.list<DashboardData['recentCampaigns'][number]>('campaigns', {
            columns: 'id, name, status, created_at, workspace:workspaces(name)',
            orderBy: { column: 'created_at', ascending: false },
            from: 0,
            to: 7,
          }),
          db.list<DashboardData['recentLogs'][number]>('audit_logs', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 7 }),
        ]);
        if (!alive) return;
        setData({
          users,
          admins,
          workspaces,
          campaigns,
          messages,
          activeSubs: subs,
          aiGenerations: usage.ai,
          openTickets: tickets,
          recentProfiles: profiles,
          recentCampaigns: campRows,
          recentLogs: logs,
        });
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Could not load admin dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="Platform health at a glance." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" />
        <LoadError message={error} />
      </div>
    );
  }

  const d = data!;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Platform health at a glance."
        actions={
          <Link to="/admin/audit-logs" className="text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
            View audit logs <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Total users" value={d.users} icon={<Users className="h-4 w-4" />} hint={`${d.admins} admin${d.admins === 1 ? '' : 's'}`} />
        <StatCard label="Workspaces" value={d.workspaces} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Active subscriptions" value={d.activeSubs} icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="Emails sent (30d)" value={d.messages} icon={<Mail className="h-4 w-4" />} />
        <StatCard label="Campaigns" value={d.campaigns} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="AI generations (30d)" value={d.aiGenerations} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Open tickets" value={d.openTickets} icon={<LifeBuoy className="h-4 w-4" />} />
        <StatCard label="Pending onboarding" value={d.recentProfiles.filter((p) => !p.onboarding_completed).length} hint="in recent signups" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent signups</CardTitle>
            <Link to="/admin/users" className="text-xs text-primary-400 hover:text-primary-300">All users</Link>
          </CardHeader>
          <CardContent>
            {d.recentProfiles.length === 0 ? (
              <Empty title="No users yet" />
            ) : (
              <div className="space-y-3">
                {d.recentProfiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] text-white truncate">{p.full_name || p.email}</p>
                      <p className="text-[11px] text-slate-600 truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.is_admin && <Badge tone="warning">admin</Badge>}
                      <span className="text-[11px] text-slate-600">{timeAgoShort(p.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent campaigns</CardTitle>
            <Link to="/admin/campaigns" className="text-xs text-primary-400 hover:text-primary-300">All campaigns</Link>
          </CardHeader>
          <CardContent>
            {d.recentCampaigns.length === 0 ? (
              <Empty title="No campaigns yet" />
            ) : (
              <div className="space-y-3">
                {d.recentCampaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-600 truncate">{c.workspace?.name ?? 'Unknown workspace'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                      <span className="text-[11px] text-slate-600">{fmtDate(c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Link to="/admin/audit-logs" className="text-xs text-primary-400 hover:text-primary-300">All logs</Link>
          </CardHeader>
          <CardContent>
            {d.recentLogs.length === 0 ? (
              <Empty title="No audit entries yet" hint="Administrative actions will appear here." />
            ) : (
              <div className="space-y-3">
                {d.recentLogs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-slate-300 truncate">{l.action}</p>
                    <span className="text-[11px] text-slate-600 shrink-0">{timeAgoShort(l.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function supabaseCount(table: string, since: string): Promise<number> {
  const { supabase } = await import('@/lib/supabase');
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (error) throw error;
  return count ?? 0;
}

async function sumUsage(since: string): Promise<{ ai: number }> {
  const rows = await db.list<{ metric: string; value: number; recorded_at: string }>('usage_records', {
    orderBy: { column: 'recorded_at', ascending: false },
    from: 0,
    to: 499,
  });
  const ai = rows
    .filter(
      (r) =>
        (r.metric === 'ai_generation' || r.metric === 'ai_generations') &&
        r.recorded_at >= since
    )
    .reduce((acc, r) => acc + (r.value ?? 0), 0);
  return { ai };
}
