// Campaign sending engine — enrolls leads, queues follow-ups and sends
// due emails through Gmail, respecting daily limits and sending windows.
//
// Invoked every minute by pg_cron (see CRON_SECRET header check).
//
// Deploy:  supabase functions deploy campaign-scheduler --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/crypto.ts';
import { refreshGmailToken, sendGmail, renderVars, wrapHtml, textToHtml, unsubscribeUrl } from '../_shared/gmail.ts';
import { refreshMSToken, sendOutlook } from '../_shared/microsoft.ts';
import { sendViaSmtpRelay } from '../_shared/smtp.ts';

const SEND_BATCH = 25;
const MAX_ATTEMPTS = 3;
const ENROLL_CHUNK = 500;

interface CampaignRow {
  id: string;
  workspace_id: string;
  lead_list_id: string | null;
  mailbox_id: string | null;
  sequence_id: string | null;
  template_id: string | null;
  status: string;
  timezone: string;
  daily_limit: number;
  sending_days: string[];
  sending_start_time: string;
  sending_end_time: string;
  delay_between_emails: number;
  unsubscribe_enabled: boolean;
  start_date: string | null;
}

interface Stats {
  activated: number;
  enrolled: number;
  queued: number;
  sent: number;
  deferred: number;
  failed: number;
  completed: number;
}

type Db = ReturnType<typeof createClient>;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dayKeysInTz(date: Date, tz: string): { weekday: string; year: number; month: number; day: number; hm: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  return {
    weekday: (parts.weekday ?? 'Mon').slice(0, 3).toLowerCase(),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hm: `${pad2(hour)}:${pad2(Number(parts.minute))}`,
  };
}

function tzOffsetMs(ts: number, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second)
  );
  return asUTC - ts;
}

function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let ts = naive - tzOffsetMs(naive, tz);
  ts = naive - tzOffsetMs(ts, tz);
  return new Date(ts);
}

function windowState(c: CampaignRow, now: Date): { open: boolean; nextOpen: Date } {
  let tz = c.timezone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    tz = 'UTC';
  }
  const today = dayKeysInTz(now, tz);
  const dayOk = (c.sending_days ?? []).includes(today.weekday);
  const start = c.sending_start_time || '09:00';
  const end = c.sending_end_time || '17:00';
  // start <= end: normal window; start > end: overnight window (e.g. 22:00–06:00)
  const inWindow = start <= end ? today.hm >= start && today.hm < end : today.hm >= start || today.hm < end;
  if (dayOk && inWindow) return { open: true, nextOpen: now };

  const [sh, sm] = start.split(':').map((x) => Number(x) || 0);
  for (let i = 0; i < 8; i++) {
    const probe = new Date(now.getTime() + i * 86_400_000);
    const p = dayKeysInTz(probe, tz);
    if (!(c.sending_days ?? []).includes(p.weekday)) continue;
    const openAt = zonedToUtc(p.year, p.month, p.day, sh, sm, tz);
    if (openAt.getTime() > now.getTime()) return { open: false, nextOpen: openAt };
  }
  return { open: false, nextOpen: new Date(now.getTime() + 3_600_000) };
}

async function queueNext(
  admin: Db,
  c: CampaignRow,
  leadId: string,
  emailsSent: number,
  baseTime: Date
): Promise<boolean> {
  let subject: string | null = null;
  let body: string | null = null;
  let stepId: string | null = null;

  if (c.sequence_id) {
    const { data: steps } = await admin
      .from('sequence_steps')
      .select('id, step_type, step_order, template_id, subject, body, wait_days, wait_hours')
      .eq('sequence_id', c.sequence_id)
      .order('step_order', { ascending: true });

    let waitHours = 0;
    let emailIdx = -1;
    for (const s of steps ?? []) {
      if (s.step_type === 'wait') {
        waitHours += (s.wait_days ?? 0) * 24 + (s.wait_hours ?? 0);
        continue;
      }
      if (s.step_type !== 'email') continue;
      emailIdx++;
      if (emailIdx === emailsSent) {
        subject = s.subject;
        body = s.body;
        stepId = s.id;
        if ((!subject || !body) && s.template_id) {
          const { data: t } = await admin.from('email_templates').select('subject, body').eq('id', s.template_id).maybeSingle();
          if (t) {
            subject = subject ?? t.subject;
            body = body ?? t.body;
          }
        }
        baseTime = new Date(baseTime.getTime() + waitHours * 3_600_000);
        break;
      }
      waitHours = 0;
    }
  } else if (emailsSent === 0 && c.template_id) {
    const { data: t } = await admin.from('email_templates').select('subject, body').eq('id', c.template_id).maybeSingle();
    if (t) {
      subject = t.subject;
      body = t.body;
    }
  }

  if (!subject || !body) return false;

  const { error } = await admin.from('scheduled_emails').insert({
    workspace_id: c.workspace_id,
    campaign_id: c.id,
    lead_id: leadId,
    mailbox_id: c.mailbox_id,
    sequence_step_id: stepId,
    scheduled_for: baseTime.toISOString(),
    status: 'scheduled',
    subject,
    body,
  });
  if (error) {
    console.error('queueNext insert failed', error.message);
    return false;
  }
  return true;
}

async function enrollLeads(admin: Db, c: CampaignRow, stats: Stats): Promise<void> {
  if (!c.lead_list_id) return;
  const { count } = await admin
    .from('campaign_leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', c.id);
  if (count) return;

  const { data: members } = await admin
    .from('lead_list_members')
    .select('lead_id')
    .eq('list_id', c.lead_list_id)
    .limit(20000);
  if (!members?.length) return;

  const rows = members.map((m) => ({
    campaign_id: c.id,
    lead_id: m.lead_id,
    current_step: 0,
    status: 'pending',
  }));
  for (let i = 0; i < rows.length; i += ENROLL_CHUNK) {
    const { error } = await admin
      .from('campaign_leads')
      .upsert(rows.slice(i, i + ENROLL_CHUNK), { onConflict: 'campaign_id,lead_id', ignoreDuplicates: true });
    if (error) console.error('enroll failed', error.message);
  }
  stats.enrolled += rows.length;
}

async function processJob(admin: Db, c: CampaignRow, job: Record<string, unknown>, stats: Stats): Promise<void> {
  const mailbox = job.mailboxes as Record<string, unknown> | null;
  const lead = job.leads as Record<string, unknown> | null;
  const jobId = job.id as string;
  const leadId = job.lead_id as string;
  const attempts = Number(job.attempts ?? 0);

  const defer = async (when: Date, reason: string) => {
    await admin.from('scheduled_emails').update({ scheduled_for: when.toISOString(), error: reason }).eq('id', jobId);
    stats.deferred++;
  };

  const provider = ((mailbox?.provider as string) ?? 'gmail');
  if (!mailbox || mailbox.status !== 'connected' || !['gmail', 'outlook', 'smtp'].includes(provider)) {
    await defer(new Date(Date.now() + 15 * 60_000), 'mailbox_unavailable');
    return;
  }
  const isMs = provider === 'outlook';
  const isSmtp = provider === 'smtp';

  if (lead?.status === 'unsubscribed' || lead?.unsubscribed_at) {
    await admin
      .from('scheduled_emails')
      .update({ status: 'canceled', error: 'unsubscribed' })
      .eq('id', jobId);
    const { data: cl } = await admin
      .from('campaign_leads')
      .select('id')
      .eq('campaign_id', c.id)
      .eq('lead_id', leadId)
      .maybeSingle();
    if (cl) await admin.from('campaign_leads').update({ status: 'unsubscribed' }).eq('id', cl.id);
    stats.deferred++;
    return;
  }

  const win = windowState(c, new Date());
  if (!win.open) {
    await defer(win.nextOpen, 'outside_sending_window');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: mbFresh } = await admin
    .from('mailboxes')
    .select('sent_today, sent_date')
    .eq('id', mailbox.id as string)
    .maybeSingle();
  let sentToday = Number(mbFresh?.sent_today ?? 0);
  if (String(mbFresh?.sent_date ?? '') < today) {
    sentToday = 0;
    await admin.from('mailboxes').update({ sent_today: 0, sent_date: today }).eq('id', mailbox.id as string);
  }
  const dailyLimit = Number(mailbox.daily_limit ?? c.daily_limit ?? 100);
  if (sentToday >= dailyLimit) {
    await defer(win.nextOpen, 'daily_limit_reached');
    return;
  }

  // Atomically claim a send slot so overlapping runs cannot exceed the limit.
  const { data: claimed } = await admin
    .from('mailboxes')
    .update({ sent_today: sentToday + 1, sent_date: today })
    .eq('id', mailbox.id as string)
    .eq('sent_date', today)
    .lt('sent_today', dailyLimit)
    .select('id');
  if (!claimed?.length) {
    await defer(win.nextOpen, 'daily_limit_reached');
    return;
  }
  const releaseSlot = async () => {
    await admin
      .from('mailboxes')
      .update({ sent_today: Math.max(sentToday, 0), sent_date: today })
      .eq('id', mailbox.id as string);
  };

  const subjectRaw = job.subject as string | null;
  const bodyRaw = job.body as string | null;
  if (!subjectRaw || !bodyRaw) {
    await releaseSlot();
    await admin
      .from('scheduled_emails')
      .update({ status: 'failed', attempts: attempts + 1, error: 'no_content' })
      .eq('id', jobId);
    stats.failed++;
    return;
  }

  const { data: cred } = await admin
    .from('mailbox_credentials')
    .select('access_token, refresh_token, token_expires_at, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password')
    .eq('mailbox_id', mailbox.id as string)
    .maybeSingle();
  if (!cred || (!cred.refresh_token && !isSmtp)) {
    await releaseSlot();
    await admin
      .from('scheduled_emails')
      .update({ status: 'failed', attempts: attempts + 1, error: 'no_credentials' })
      .eq('id', jobId);
    stats.failed++;
    return;
  }

  let accessToken = cred.access_token ?? '';
  if (!isSmtp) {
    const expired = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() < Date.now() + 60_000 : true;
    if (expired || !accessToken) {
      const refreshed = isMs
        ? await refreshMSToken(cred.refresh_token)
        : await refreshGmailToken(cred.refresh_token);
      if (!refreshed?.access_token) {
        await releaseSlot();
        await defer(new Date(Date.now() + 10 * 60_000), 'token_refresh_failed');
        return;
      }
      accessToken = refreshed.access_token;
      await admin
        .from('mailbox_credentials')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + Number(refreshed.expires_in ?? 3500) * 1000).toISOString(),
        })
        .eq('mailbox_id', mailbox.id as string);
    }
  }

  const vars: Record<string, string | null> = {
    first_name: (lead?.first_name as string) ?? null,
    last_name: (lead?.last_name as string) ?? null,
    full_name: [lead?.first_name, lead?.last_name].filter(Boolean).join(' ') || null,
    company: (lead?.company as string) ?? null,
    job_title: (lead?.job_title as string) ?? null,
    email: (lead?.email as string) ?? null,
    location: (lead?.location as string) ?? null,
    industry: (lead?.industry as string) ?? null,
  };

  let subject = renderVars(subjectRaw, vars);
  const renderedBody = renderVars(bodyRaw, vars);
  const uUrl = c.unsubscribe_enabled ? unsubscribeUrl(c.id, leadId) : undefined;

  // Continue the conversation in the same Gmail thread when we already sent to this lead.
  const { data: prevMsg } = await admin
    .from('email_messages')
    .select('thread_id, rfc_id')
    .eq('campaign_id', c.id)
    .eq('lead_id', leadId)
    .eq('direction', 'outbound')
    .not('thread_id', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const threadId = (prevMsg?.thread_id as string) ?? undefined;
  const inReplyTo = (prevMsg?.rfc_id as string) ?? undefined;
  if (threadId && !/^re:/i.test(subject)) subject = `Re: ${subject}`;

  let text = renderedBody;
  if (uUrl) text += `\n\nUnsubscribe: ${uUrl}`;
  const html = wrapHtml(textToHtml(renderedBody), uUrl);

  const outcome = isSmtp
    ? await sendViaSmtpRelay({
        host: cred.smtp_host as string,
        port: Number(cred.smtp_port) || 587,
        secure: cred.smtp_secure !== false,
        username: cred.smtp_username as string,
        password: cred.smtp_password as string,
        from: mailbox.email_address as string,
        to: (lead?.email as string) ?? '',
        subject,
        text,
        html,
        unsubscribeUrl: uUrl,
      })
    : isMs
      ? await sendOutlook({
          accessToken,
          to: (lead?.email as string) ?? '',
          subject,
          text,
          html,
          unsubscribeUrl: uUrl,
          conversationId: threadId,
          inReplyTo,
          references: inReplyTo,
        })
      : await sendGmail({
          accessToken,
          from: mailbox.email_address as string,
          to: (lead?.email as string) ?? '',
          subject,
          text,
          html,
          unsubscribeUrl: uUrl,
          threadId,
          inReplyTo,
        });

  if (!outcome.ok) {
    await releaseSlot();
    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await admin
        .from('scheduled_emails')
        .update({ status: 'failed', attempts: nextAttempts, error: outcome.error ?? 'send_failed' })
        .eq('id', jobId);
      stats.failed++;
    } else {
      await admin
        .from('scheduled_emails')
        .update({
          attempts: nextAttempts,
          error: outcome.error ?? 'send_failed',
          scheduled_for: new Date(Date.now() + 5 * 60_000).toISOString(),
        })
        .eq('id', jobId);
      stats.deferred++;
    }
    return;
  }

  await admin
    .from('scheduled_emails')
    .update({ status: 'sent', attempts: attempts + 1, error: null })
    .eq('id', jobId);

  await admin.from('mailboxes').update({ last_sync_at: new Date().toISOString() }).eq('id', mailbox.id as string);

  await admin.from('email_messages').insert({
    workspace_id: c.workspace_id,
    campaign_id: c.id,
    lead_id: leadId,
    mailbox_id: mailbox.id as string,
    sequence_step_id: job.sequence_step_id ?? null,
    message_id: outcome.messageId ?? null,
    thread_id: outcome.threadId ?? null,
    rfc_id: outcome.rfcId ?? null,
    in_reply_to: inReplyTo ?? null,
    from_address: mailbox.email_address as string,
    to_address: (lead?.email as string) ?? '',
    subject,
    preview_text: renderedBody.slice(0, 140),
    body: renderedBody,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });

  const { data: cl } = await admin
    .from('campaign_leads')
    .select('id, current_step')
    .eq('campaign_id', c.id)
    .eq('lead_id', leadId)
    .maybeSingle();

  const newStep = Number(cl?.current_step ?? 0) + 1;
  if (cl) {
    await admin.from('campaign_leads').update({ current_step: newStep, status: 'active' }).eq('id', cl.id);
  }

  const queued = await queueNext(admin, c, leadId, newStep, new Date());
  if (queued) stats.queued++;
  else if (cl) {
    await admin
      .from('campaign_leads')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', cl.id);
  }
  stats.sent++;
}

async function processCampaign(admin: Db, c: CampaignRow, stats: Stats): Promise<void> {
  await enrollLeads(admin, c, stats);

  const { data: enrolled } = await admin
    .from('campaign_leads')
    .select('id, lead_id, current_step, leads(status, unsubscribed_at)')
    .eq('campaign_id', c.id)
    .limit(5000);
  if (!enrolled?.length) return;

  const leadIds = enrolled.map((e) => e.lead_id);
  const { data: existing } = await admin
    .from('scheduled_emails')
    .select('lead_id')
    .eq('campaign_id', c.id)
    .in('lead_id', leadIds)
    .limit(20000);
  const queuedLeads = new Set((existing ?? []).map((e) => e.lead_id));

  let stagger = 0;
  for (const en of enrolled) {
    if (queuedLeads.has(en.lead_id)) continue;
    const leadRef = en.leads as { status?: string; unsubscribed_at?: string | null } | null;
    if (leadRef?.status === 'unsubscribed' || leadRef?.unsubscribed_at) continue;
    const delaySec = Math.max(Number(c.delay_between_emails ?? 30), 10);
    const ok = await queueNext(admin, c, en.lead_id, Number(en.current_step ?? 0), new Date(Date.now() + stagger * delaySec * 1000));
    if (ok) stats.queued++;
    stagger++;
    if (stagger >= 500) break;
  }

  const nowIso = new Date().toISOString();
  const { data: due } = await admin
    .from('scheduled_emails')
    .select(
      'id, lead_id, sequence_step_id, subject, body, attempts, leads:leads(id, first_name, last_name, email, company, job_title, location, industry, status, unsubscribed_at), mailboxes:mailboxes(id, email_address, provider, status, sent_today, sent_date, daily_limit)'
    )
    .eq('campaign_id', c.id)
    .eq('status', 'scheduled')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(SEND_BATCH);

  for (const job of due ?? []) {
    await processJob(admin, c, job as unknown as Record<string, unknown>, stats);
  }

  const { count: activeLeads } = await admin
    .from('campaign_leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', c.id)
    .neq('status', 'completed');
  const { count: pendingSends } = await admin
    .from('scheduled_emails')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', c.id)
    .in('status', ['scheduled', 'sending']);

  if ((activeLeads ?? 0) === 0 && (pendingSends ?? 0) === 0 && enrolled.length > 0) {
    const allCompleted = enrolled.every((e) => e.current_step !== null);
    if (allCompleted) {
      const { count: notDone } = await admin
        .from('campaign_leads')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', c.id)
        .neq('status', 'completed');
      if ((notDone ?? 0) === 0) {
        await admin
          .from('campaigns')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', c.id);
        stats.completed++;
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (secret && provided !== secret) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const stats: Stats = { activated: 0, enrolled: 0, queued: 0, sent: 0, deferred: 0, failed: 0, completed: 0 };

  const { data: toStart } = await admin
    .from('campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .not('start_date', 'is', null)
    .lte('start_date', new Date().toISOString())
    .limit(20);
  for (const row of toStart ?? []) {
    await admin
      .from('campaigns')
      .update({ status: 'running', launched_at: new Date().toISOString() })
      .eq('id', row.id);
    stats.activated++;
  }

  const { data: running } = await admin
    .from('campaigns')
    .select(
      'id, workspace_id, lead_list_id, mailbox_id, sequence_id, template_id, status, timezone, daily_limit, sending_days, sending_start_time, sending_end_time, delay_between_emails, unsubscribe_enabled, start_date'
    )
    .eq('status', 'running')
    .limit(50);

  for (const row of running ?? []) {
    try {
      await processCampaign(admin, row as unknown as CampaignRow, stats);
    } catch (err) {
      console.error('campaign processing failed', row.id, err);
    }
  }

  return json({ ok: true, ...stats });
});
