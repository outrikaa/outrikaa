// Send an email through a connected Gmail mailbox.
//
// POST { mailboxId, to, subject, body, inReplyTo? }
//   1. verifies the caller's JWT and workspace membership (via service role reads)
//   2. loads + refreshes OAuth tokens from mailbox_credentials
//   3. sends via Gmail API users.messages.send
//
// Deploy:  supabase functions deploy mailbox-send          (verify-jwt ON)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/crypto.ts';
import { refreshGmailToken, sendGmail } from '../_shared/gmail.ts';

interface SendBody {
  mailboxId?: string;
  to?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);
  const user = userData.user;

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const mailboxId = body.mailboxId ?? '';
  const to = (body.to ?? '').trim();
  const subject = (body.subject ?? '').trim();
  const message = body.body ?? '';
  if (!mailboxId || !to || !subject) {
    return json({ error: 'missing_fields', message: 'mailboxId, to and subject are required.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json({ error: 'invalid_recipient', message: 'Recipient email is invalid.' }, 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: mailbox, error: mailboxError } = await admin
    .from('mailboxes')
    .select('id, workspace_id, email_address, provider, status, sent_today')
    .eq('id', mailboxId)
    .maybeSingle();
  if (mailboxError || !mailbox) return json({ error: 'mailbox_not_found' }, 404);
  if (mailbox.status !== 'connected') {
    return json({ error: 'mailbox_not_connected', message: 'Mailbox is not connected.' }, 409);
  }
  if (mailbox.provider !== 'gmail') {
    return json({ error: 'provider_not_supported', message: 'Only Gmail is configured right now.' }, 501);
  }

  const { data: membership } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', mailbox.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return json({ error: 'forbidden', message: 'Not a workspace member.' }, 403);

  const { data: cred } = await admin
    .from('mailbox_credentials')
    .select('access_token, refresh_token, token_expires_at')
    .eq('mailbox_id', mailboxId)
    .maybeSingle();
  if (!cred?.refresh_token) {
    return json({ error: 'mailbox_not_connected', message: 'Reconnect this mailbox.' }, 409);
  }

  let accessToken = cred.access_token ?? '';
  const expired = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() < Date.now() + 60_000 : true;
  if (expired || !accessToken) {
    const refreshed = await refreshGmailToken(cred.refresh_token);
    if (!refreshed?.access_token) {
      return json({ error: 'token_refresh_failed', message: 'Reconnect this mailbox.' }, 401);
    }
    accessToken = refreshed.access_token;
    await admin
      .from('mailbox_credentials')
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + Number(refreshed.expires_in ?? 3500) * 1000).toISOString(),
      })
      .eq('mailbox_id', mailboxId);
  }

  const sent = await sendGmail({
    accessToken,
    from: mailbox.email_address,
    to,
    subject,
    body: message,
    inReplyTo: body.inReplyTo,
  });
  if (!sent.ok) {
    return json({ error: 'gmail_send_failed', message: 'Gmail rejected the message.' }, 502);
  }

  await admin
    .from('mailboxes')
    .update({ sent_today: (mailbox.sent_today ?? 0) + 1, last_sync_at: new Date().toISOString() })
    .eq('id', mailboxId);

  return json({ ok: true, messageId: sent.messageId ?? null });
});
