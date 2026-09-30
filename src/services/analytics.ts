import { supabase } from '@/lib/supabase';

export interface AnalyticsSummary {
  totalLeads: number;
  activeCampaigns: number;
  emailsSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  positiveReplies: number;
  bounced: number;
  unsubscribed: number;
  meetings: number;
  openRate: number;
  replyRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface SeriesPoint {
  date: string;
  sent: number;
  opened: number;
  replied: number;
}

const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);

export const analyticsService = {
  async summary(workspaceId: string, days = 30): Promise<AnalyticsSummary> {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [leads, campaigns, sent, delivered, opened, clicked, replied, positive, bounced, unsub, meetings] =
      await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).in('status', ['running', 'scheduled']),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').gte('sent_at', since),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').in('status', ['delivered', 'opened', 'clicked', 'replied']),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').not('opened_at', 'is', null),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').not('clicked_at', 'is', null),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').not('replied_at', 'is', null),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'inbound').eq('reply_classification', 'positive'),
        supabase.from('email_messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('direction', 'outbound').not('bounced_at', 'is', null),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'unsubscribed'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'meeting'),
      ]);

    const emailsSent = sent.count ?? 0;
    const deliveredN = delivered.count ?? 0;
    const openedN = opened.count ?? 0;
    const clickedN = clicked.count ?? 0;
    const repliedN = replied.count ?? 0;
    const bouncedN = bounced.count ?? 0;

    return {
      totalLeads: leads.count ?? 0,
      activeCampaigns: campaigns.count ?? 0,
      emailsSent,
      delivered: deliveredN,
      opened: openedN,
      clicked: clickedN,
      replied: repliedN,
      positiveReplies: positive.count ?? 0,
      bounced: bouncedN,
      unsubscribed: unsub.count ?? 0,
      meetings: meetings.count ?? 0,
      openRate: pct(openedN, deliveredN),
      replyRate: pct(repliedN, emailsSent),
      clickRate: pct(clickedN, deliveredN),
      bounceRate: pct(bouncedN, emailsSent + bouncedN),
    };
  },

  async dailySeries(workspaceId: string, days = 30): Promise<SeriesPoint[]> {
    const since = new Date(Date.now() - days * 86400000);
    const { data } = await supabase
      .from('email_messages')
      .select('created_at, sent_at, opened_at, replied_at, direction')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'outbound')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })
      .limit(2000);

    const buckets = new Map<string, SeriesPoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, sent: 0, opened: 0, replied: 0 });
    }

    for (const row of data ?? []) {
      const key = (row.sent_at ?? row.created_at).slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      b.sent += 1;
      if (row.opened_at) b.opened += 1;
      if (row.replied_at) b.replied += 1;
    }

    return [...buckets.values()].map((p) => ({ ...p, date: p.date.slice(5) }));
  },

  async campaignPerformance(workspaceId: string) {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, status')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(8);
    if (!campaigns?.length) return [];

    const { data: messages } = await supabase
      .from('email_messages')
      .select('campaign_id, status, opened_at, replied_at, bounced_at')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'outbound')
      .in('campaign_id', campaigns.map((c) => c.id));

    return campaigns.map((c) => {
      const rows = (messages ?? []).filter((m) => m.campaign_id === c.id);
      const sent = rows.length;
      const opened = rows.filter((r) => r.opened_at).length;
      const replied = rows.filter((r) => r.replied_at).length;
      const bounced = rows.filter((r) => r.bounced_at).length;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        sent,
        opened,
        replied,
        bounced,
        openRate: pct(opened, sent),
        replyRate: pct(replied, sent),
      };
    });
  },

  async mailboxPerformance(workspaceId: string) {
    const { data: mailboxes } = await supabase
      .from('mailboxes')
      .select('id, email_address, status, health_score, sent_today, bounce_rate, daily_limit')
      .eq('workspace_id', workspaceId);
    if (!mailboxes?.length) return [];

    const { data: messages } = await supabase
      .from('email_messages')
      .select('mailbox_id, opened_at, replied_at, bounced_at')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'outbound');

    return mailboxes.map((mb) => {
      const rows = (messages ?? []).filter((m) => m.mailbox_id === mb.id);
      const sent = rows.length;
      const opened = rows.filter((r) => r.opened_at).length;
      const replied = rows.filter((r) => r.replied_at).length;
      return {
        ...mb,
        sent,
        opened,
        replied,
        openRate: pct(opened, sent),
        replyRate: pct(replied, sent),
      };
    });
  },

  insights(summary: AnalyticsSummary): { title: string; body: string; tone: 'good' | 'warn' | 'info' }[] {
    const out: { title: string; body: string; tone: 'good' | 'warn' | 'info' }[] = [];
    if (summary.emailsSent === 0) {
      out.push({ title: 'No activity yet', body: 'Launch your first campaign to start collecting open and reply data.', tone: 'info' });
      return out;
    }
    if (summary.replyRate >= 8) out.push({ title: 'Strong reply rate', body: `${summary.replyRate}% reply rate is above the typical cold outreach benchmark of 5–8%.`, tone: 'good' });
    else if (summary.replyRate >= 3) out.push({ title: 'Reply rate has room to grow', body: `${summary.replyRate}% reply rate. Tighten the first-line personalization to push past 8%.`, tone: 'warn' });
    else out.push({ title: 'Low reply rate', body: `${summary.replyRate}% reply rate. Test a shorter email and a more specific CTA.`, tone: 'warn' });

    if (summary.bounceRate > 5) out.push({ title: 'Bounce rate elevated', body: `${summary.bounceRate}% of sends bounced — verify the list before scaling volume.`, tone: 'warn' });
    else out.push({ title: 'List health is good', body: `${summary.bounceRate}% bounce rate keeps sender reputation stable.`, tone: 'good' });

    if (summary.openRate > 0 && summary.openRate < 35) out.push({ title: 'Opens lagging', body: `${summary.openRate}% open rate. A/B test subject lines and send windows.`, tone: 'warn' });
    else if (summary.openRate >= 50) out.push({ title: 'Subject lines landing', body: `${summary.openRate}% open rate — your subject lines are working.`, tone: 'good' });

    return out;
  },
};
