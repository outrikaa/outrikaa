// Pull replies from Gmail/Outlook into email_messages / email_threads and mark
// outbound messages + campaign leads as replied (feeds reply rate + Inbox).
//
// POST — authenticated either by x-cron-secret (sync everything) or a
// user JWT (sync that user's workspaces only). Deploy with --no-verify-jwt.
//
// Deploy:  supabase functions deploy mailbox-sync --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/crypto.ts';
import { refreshGmailToken, decodeBase64Url } from '../_shared/gmail.ts';
import { refreshMSToken, stripHtml } from '../_shared/microsoft.ts';

type Db = ReturnType<typeof createClient>;

interface SyncStats {
  mailboxes: number;
  inbound: number;
  threads: number;
  backfilled: number;
  errors: number;
}

// Provider-agnostic inbound message (Gmail or Microsoft Graph).
interface InboundMsg {
  providerId: string;
  threadKey: string | null;
  rfcId: string | null;
  inReplyTo: string | null;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
}

function parseAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function headerMap(headers: { name?: string; value?: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of headers) {
    if (h.name) out[h.name.toLowerCase()] = h.value ?? '';
  }
  return out;
}

function extractBody(msg: Record<string, unknown>): string {
  let out = '';
  const payload = msg.payload as { mimeType?: string; body?: { data?: string }; parts?: unknown[] } | undefined;
  const walk = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      out += decodeBase64Url(part.body.data);
      return;
    }
    for (const child of part.parts ?? []) walk(child as typeof part);
  };
  if (payload) walk(payload);
  const text = out.trim();
  if (text) return text;
  return String(msg.snippet ?? '');
}

function classify(text: string): { classification: string | null; folder: string } {
  const t = (text ?? '').toLowerCase();
  if (/(unsubscribe|remove me|stop (emailing|contacting)|don'?t contact|not interested|leave me alone)/.test(t)) {
    return { classification: 'not_interested', folder: 'not_interested' };
  }
  if (/(interested|sounds (good|great)|let'?s (talk|connect|schedule)|meeting|available|calendar|pricing|quote|demo|send (over|me) (details|info)|call)/.test(t)) {
    return { classification: 'positive', folder: 'positive' };
  }
  return { classification: null, folder: 'all' };
}

async function gmailGet(path: string, accessToken: string, params?: URLSearchParams): Promise<Record<string, unknown> | null> {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`);
  if (params) url.search = params.toString();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.error('gmail get failed', path, res.status);
    return null;
  }
  return await res.json();
}

async function graphGet(path: string, accessToken: string, params?: URLSearchParams): Promise<Record<string, unknown> | null> {
  const url = new URL(`https://graph.microsoft.com/v1.0/${path}`);
  if (params) url.search = params.toString();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.error('graph get failed', path, res.status);
    return null;
  }
  return await res.json();
}

async function getAccessToken(admin: Db, mailboxId: string, provider: string): Promise<string | null> {
  const { data: cred } = await admin
    .from('mailbox_credentials')
    .select('access_token, refresh_token, token_expires_at')
    .eq('mailbox_id', mailboxId)
    .maybeSingle();
  if (!cred?.refresh_token) return null;
  const expired = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() < Date.now() + 60_000 : true;
  if (!expired && cred.access_token) return cred.access_token;
  const refreshed = provider === 'outlook'
    ? await refreshMSToken(cred.refresh_token)
    : await refreshGmailToken(cred.refresh_token);
  if (!refreshed?.access_token) return null;
  await admin
    .from('mailbox_credentials')
    .update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + Number(refreshed.expires_in ?? 3500) * 1000).toISOString(),
    })
    .eq('mailbox_id', mailboxId);
  return refreshed.access_token;
}

async function backfillSent(admin: Db, mailboxId: string, accessToken: string, provider: string, stats: SyncStats): Promise<void> {
  const { data: missing } = await admin
    .from('email_messages')
    .select('id, message_id')
    .eq('mailbox_id', mailboxId)
    .eq('direction', 'outbound')
    .is('thread_id', null)
    .not('message_id', 'is', null)
    .limit(20);
  if (!missing?.length) return;

  if (provider === 'outlook') {
    // Graph draft ids stay stable when the draft moves to Sent Items.
    const list = await graphGet(
      'me/mailFolders/sentitems/messages',
      accessToken,
      new URLSearchParams({ $top: '40', $select: 'id,conversationId,internetMessageId' })
    );
    const items = (list?.value ?? []) as { id: string; conversationId?: string; internetMessageId?: string }[];
    const byId = new Map(items.map((m) => [m.id, m]));
    for (const row of missing) {
      const m = byId.get(row.message_id as string);
      if (!m) continue;
      await admin
        .from('email_messages')
        .update({ thread_id: m.conversationId ?? null, rfc_id: m.internetMessageId ?? null })
        .eq('id', row.id);
      stats.backfilled++;
    }
    return;
  }

  const params = new URLSearchParams({ q: 'in:sent', maxResults: '40' });
  const list = await gmailGet('messages', accessToken, params);
  const ids = ((list?.messages ?? []) as { id: string }[]).map((m) => m.id);
  const need = missing.filter((m) => ids.includes(m.message_id as string));

  for (const row of need) {
    const meta = await gmailGet(`messages/${row.message_id}`, accessToken, new URLSearchParams({
      format: 'metadata',
      metadataHeaders: 'Message-ID',
    }));
    if (!meta) continue;
    const headers = headerMap((meta.payload as { headers?: { name?: string; value?: string }[] })?.headers ?? []);
    await admin
      .from('email_messages')
      .update({ thread_id: (meta.threadId as string) ?? null, rfc_id: headers['message-id'] ?? null })
      .eq('id', row.id);
    stats.backfilled++;
  }
}

async function listGmailInbound(admin: Db, mailboxId: string, accessToken: string): Promise<InboundMsg[]> {
  const params = new URLSearchParams({ q: 'in:inbox', maxResults: '30' });
  const list = await gmailGet('messages', accessToken, params);
  const ids = ((list?.messages ?? []) as { id: string }[]).map((m) => m.id);
  if (!ids.length) return [];

  const { data: known } = await admin
    .from('email_messages')
    .select('message_id')
    .eq('mailbox_id', mailboxId)
    .in('message_id', ids);
  const knownSet = new Set((known ?? []).map((k) => k.message_id));
  const fresh = ids.filter((id) => !knownSet.has(id));

  const out: InboundMsg[] = [];
  for (const gmailId of fresh) {
    const msg = await gmailGet(`messages/${gmailId}`, accessToken, new URLSearchParams({ format: 'full' }));
    if (!msg) continue;
    const headers = headerMap((msg.payload as { headers?: { name?: string; value?: string }[] })?.headers ?? []);
    out.push({
      providerId: gmailId,
      threadKey: (msg.threadId as string) ?? null,
      rfcId: headers['message-id'] ?? null,
      inReplyTo: headers['in-reply-to'] ?? null,
      from: parseAddress(headers.from ?? ''),
      to: parseAddress(headers.to ?? ''),
      subject: headers.subject ?? '(no subject)',
      body: extractBody(msg),
      receivedAt: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString(),
    });
  }
  return out;
}

async function listOutlookInbound(admin: Db, mailboxId: string, accessToken: string): Promise<InboundMsg[]> {
  const list = await graphGet(
    'me/mailFolders/inbox/messages',
    accessToken,
    new URLSearchParams({
      $top: '30',
      $select: 'id,conversationId,internetMessageId,subject,body,bodyPreview,from,toRecipients,receivedDateTime,lastModifiedDateTime',
      $orderby: 'receivedDateTime desc',
    })
  );
  const items = (list?.value ?? []) as Record<string, unknown>[];
  const ids = items.map((m) => m.id as string);
  if (!ids.length) return [];

  const { data: known } = await admin
    .from('email_messages')
    .select('message_id')
    .eq('mailbox_id', mailboxId)
    .in('message_id', ids);
  const knownSet = new Set((known ?? []).map((k) => k.message_id));
  const fresh = items.filter((m) => !knownSet.has(m.id as string));

  return fresh.map((m) => {
    const bodyObj = m.body as { contentType?: string; content?: string } | null;
    const raw = bodyObj?.contentType?.toLowerCase() === 'html'
      ? stripHtml(bodyObj.content ?? '')
      : (bodyObj?.content ?? '');
    const from = ((m.from as { emailAddress?: { address?: string } } | null)?.emailAddress?.address ?? '').toLowerCase();
    const to = (((m.toRecipients as { emailAddress?: { address?: string } }[] | undefined) ?? [])[0]?.emailAddress?.address ?? '').toLowerCase();
    return {
      providerId: m.id as string,
      threadKey: (m.conversationId as string) ?? null,
      rfcId: (m.internetMessageId as string) ?? null,
      inReplyTo: null,
      from,
      to,
      subject: String(m.subject ?? '(no subject)'),
      body: (raw || String(m.bodyPreview ?? '')).trim(),
      receivedAt: String(m.receivedDateTime ?? m.lastModifiedDateTime ?? new Date().toISOString()),
    };
  });
}

async function processInbound(admin: Db, mailbox: Record<string, unknown>, m: InboundMsg, stats: SyncStats): Promise<void> {
  const mailboxId = mailbox.id as string;
  const workspaceId = mailbox.workspace_id as string;
  const threadKey = m.threadKey;
  const fromAddress = m.from;
  const { subject, body } = m;
  const receivedAt = m.receivedAt;

  // Context: same thread as one of our sent messages, else match lead by address.
  let anchor: { workspace_id: string; campaign_id: string | null; lead_id: string | null } | null = null;
  if (threadKey) {
    const { data: sameThread } = await admin
      .from('email_messages')
      .select('id, workspace_id, campaign_id, lead_id')
      .eq('mailbox_id', mailboxId)
      .eq('thread_id', threadKey)
      .eq('direction', 'outbound')
      .order('sent_at', { ascending: false })
      .limit(1);
    if (sameThread?.length && sameThread[0].lead_id) anchor = sameThread[0];
  }
  if (!anchor) {
    const { data: lead } = await admin
      .from('leads')
      .select('id, workspace_id')
      .eq('workspace_id', workspaceId)
      .ilike('email', fromAddress)
      .maybeSingle();
    if (!lead) return; // Not a reply from a known lead — keep it out of the campaign inbox.
    const { data: lastOut } = await admin
      .from('email_messages')
      .select('campaign_id')
      .eq('workspace_id', workspaceId)
      .eq('lead_id', lead.id)
      .eq('direction', 'outbound')
      .order('sent_at', { ascending: false })
      .limit(1);
    anchor = { workspace_id: workspaceId, campaign_id: lastOut?.[0]?.campaign_id ?? null, lead_id: lead.id };
  }

  const { classification, folder } = classify(`${subject}\n${body}`);
  const isUnsub = classification === 'not_interested';

  // Thread row (create or refresh).
  let threadRow: { id: string } | null = null;
  if (threadKey) {
    const { data: existing } = await admin
      .from('email_threads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('gmail_thread_id', threadKey)
      .maybeSingle();
    if (existing) {
      threadRow = existing;
      await admin
        .from('email_threads')
        .update({
          last_message_at: receivedAt,
          is_unread: true,
          lead_id: anchor.lead_id ?? undefined,
          campaign_id: anchor.campaign_id ?? undefined,
        })
        .eq('id', existing.id);
    } else {
      const { data: created } = await admin
        .from('email_threads')
        .insert({
          workspace_id: workspaceId,
          lead_id: anchor.lead_id,
          campaign_id: anchor.campaign_id,
          gmail_thread_id: threadKey,
          subject,
          last_message_at: receivedAt,
          message_count: 0,
          is_unread: true,
          classification,
          folder,
        })
        .select('id')
        .single();
      threadRow = created;
      stats.threads++;
    }
  }

  const { error: insertError } = await admin.from('email_messages').insert({
    workspace_id: anchor.workspace_id,
    campaign_id: anchor.campaign_id,
    lead_id: anchor.lead_id,
    mailbox_id: mailboxId,
    email_thread_id: threadRow?.id ?? null,
    message_id: m.providerId,
    thread_id: threadKey,
    rfc_id: m.rfcId,
    in_reply_to: m.inReplyTo,
    direction: 'inbound',
    from_address: fromAddress,
    to_address: m.to || (mailbox.email_address as string),
    subject,
    preview_text: body.slice(0, 140),
    body,
    status: 'replied',
    is_reply: true,
    reply_classification: classification,
    replied_at: receivedAt,
    sent_at: receivedAt,
  });
  if (insertError) {
    console.error('inbound insert failed', insertError.message);
    stats.errors++;
    return;
  }
  stats.inbound++;

  // Link every message of this thread to the thread row (Inbox view + counts).
  if (threadRow && threadKey) {
    await admin
      .from('email_messages')
      .update({ email_thread_id: threadRow.id })
      .eq('mailbox_id', mailboxId)
      .eq('thread_id', threadKey)
      .is('email_thread_id', null);
    const { count } = await admin
      .from('email_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email_thread_id', threadRow.id);
    await admin.from('email_threads').update({ message_count: count ?? 0 }).eq('id', threadRow.id);
  }

  // Mark our sent message as replied + advance campaign state.
  if (anchor.lead_id) {
    if (threadKey) {
      await admin
        .from('email_messages')
        .update({ status: 'replied', replied_at: new Date().toISOString() })
        .eq('mailbox_id', mailboxId)
        .eq('thread_id', threadKey)
        .eq('direction', 'outbound')
        .is('replied_at', null);
    }
    if (anchor.campaign_id) {
      await admin
        .from('campaign_leads')
        .update({ status: 'replied' })
        .eq('campaign_id', anchor.campaign_id)
        .eq('lead_id', anchor.lead_id)
        .neq('status', 'unsubscribed');
    }
    await admin
      .from('leads')
      .update({ status: 'replied' })
      .eq('id', anchor.lead_id)
      .in('status', ['new', 'contacted', 'opened', 'clicked']);

    if (isUnsub) {
      await admin
        .from('leads')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('id', anchor.lead_id);
      await admin
        .from('scheduled_emails')
        .update({ status: 'canceled', error: 'unsubscribed' })
        .eq('lead_id', anchor.lead_id)
        .eq('status', 'scheduled');
    }
  }
}

async function syncMailbox(admin: Db, mailbox: Record<string, unknown>, stats: SyncStats): Promise<void> {
  const mailboxId = mailbox.id as string;
  const provider = (mailbox.provider as string) ?? 'gmail';
  const accessToken = await getAccessToken(admin, mailboxId, provider);
  if (!accessToken) {
    stats.errors++;
    return;
  }
  await backfillSent(admin, mailboxId, accessToken, provider, stats);
  const inbound = provider === 'outlook'
    ? await listOutlookInbound(admin, mailboxId, accessToken)
    : await listGmailInbound(admin, mailboxId, accessToken);
  for (const m of inbound) {
    await processInbound(admin, mailbox, m, stats);
  }
  await admin.from('mailboxes').update({ last_sync_at: new Date().toISOString() }).eq('id', mailboxId);
  stats.mailboxes++;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const stats: SyncStats = { mailboxes: 0, inbound: 0, threads: 0, backfilled: 0, errors: 0 };

  const secret = Deno.env.get('CRON_SECRET');
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  let scope: 'all' | { workspaceIds: string[] };

  if (secret && cronHeader === secret) {
    scope = 'all';
  } else {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'unauthorized' }, 401);
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);
    const { data: memberships } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userData.user.id);
    scope = { workspaceIds: (memberships ?? []).map((m) => m.workspace_id) };
    if (!scope.workspaceIds.length) return json({ ok: true, ...stats });
  }

  let query = admin
    .from('mailboxes')
    .select('id, workspace_id, email_address, provider, status')
    .in('provider', ['gmail', 'outlook'])
    .eq('status', 'connected')
    .limit(25);
  if (scope !== 'all') query = query.in('workspace_id', scope.workspaceIds);
  const { data: mailboxes } = await query;

  for (const mailbox of mailboxes ?? []) {
    try {
      await syncMailbox(admin, mailbox as unknown as Record<string, unknown>, stats);
    } catch (err) {
      console.error('mailbox sync failed', mailbox.id, err);
      stats.errors++;
    }
  }

  return json({ ok: true, ...stats });
});
