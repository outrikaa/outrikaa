// Send an email through a connected Gmail mailbox (Inbox replies, manual sends).
//
// POST { mailboxId, to, subject, body, inReplyTo?, threadId?, leadId?, campaignId?, emailThreadId? }
//
// Deploy:  supabase functions deploy mailbox-send          (verify-jwt ON)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/crypto.ts';
import { refreshGmailToken, sendGmail, wrapHtml, textToHtml, unsubscribeUrl } from '../_shared/gmail.ts';
import { refreshMSToken, sendOutlook } from '../_shared/microsoft.ts';
import { sendViaSmtpRelay } from '../_shared/smtp.ts';

interface SendBody {
  mailboxId?: string;
  to?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
  threadId?: string;
  leadId?: string;
  campaignId?: string;
  emailThreadId?: string;
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
  const rawSubject = (body.subject ?? '').trim();
  const message = body.body ?? '';
  if (!mailboxId || !to || !rawSubject) {
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
  if (mailbox.provider !== 'gmail' && mailbox.provider !== 'outlook' && mailbox.provider !== 'smtp') {
    return json({ error: 'provider_not_supported', message: 'This provider is not configured right now.' }, 501);
  }
  const isMs = mailbox.provider === 'outlook';
  const isSmtp = mailbox.provider === 'smtp';

  const { data: membership } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', mailbox.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return json({ error: 'forbidden', message: 'Not a workspace member.' }, 403);

  if (body.leadId) {
    const { data: unsub } = await admin
      .from('leads')
      .select('id, status, unsubscribed_at')
      .eq('id', body.leadId)
      .maybeSingle();
    if (unsub && (unsub.status === 'unsubscribed' || unsub.unsubscribed_at)) {
      return json({ error: 'lead_unsubscribed', message: 'This lead has unsubscribed.' }, 409);
    }
  }

  const { data: cred } = await admin
    .from('mailbox_credentials')
    .select('access_token, refresh_token, token_expires_at, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password')
    .eq('mailbox_id', mailboxId)
    .maybeSingle();
  if (!cred || (!cred.refresh_token && !isSmtp)) {
    return json({ error: 'mailbox_not_connected', message: 'Reconnect this mailbox.' }, 409);
  }

  let accessToken = cred.access_token ?? '';
  if (!isSmtp) {
    const expired = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() < Date.now() + 60_000 : true;
    if (expired || !accessToken) {
      const refreshed = isMs
        ? await refreshMSToken(cred.refresh_token)
        : await refreshGmailToken(cred.refresh_token);
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
  }

  const subject = /^re:/i.test(rawSubject) ? rawSubject : `Re: ${rawSubject}`;
  const uUrl = body.leadId ? unsubscribeUrl(body.campaignId ?? null, body.leadId) : undefined;
  const text = uUrl ? `${message}\n\nUnsubscribe: ${uUrl}` : message;
  const html = wrapHtml(textToHtml(message), uUrl);

  const outcome = isSmtp
    ? await sendViaSmtpRelay({
        host: cred.smtp_host as string,
        port: Number(cred.smtp_port) || 587,
        secure: cred.smtp_secure !== false,
        username: cred.smtp_username as string,
        password: cred.smtp_password as string,
        from: mailbox.email_address,
        to,
        subject,
        text,
        html,
        unsubscribeUrl: uUrl,
      })
    : isMs
      ? await sendOutlook({
          accessToken,
          to,
          subject,
          text,
          html,
          unsubscribeUrl: uUrl,
          conversationId: body.threadId,
          inReplyTo: body.inReplyTo,
          references: body.inReplyTo,
        })
      : await sendGmail({
          accessToken,
          from: mailbox.email_address,
          to,
          subject,
          text,
          html,
          unsubscribeUrl: uUrl,
          replyTo: mailbox.email_address,
          inReplyTo: body.inReplyTo,
          threadId: body.threadId,
        });
  if (!outcome.ok) {
    return json({ error: 'send_failed', message: 'The provider rejected the message.' }, 502);
  }

  await admin
    .from('mailboxes')
    .update({ sent_today: (mailbox.sent_today ?? 0) + 1, last_sync_at: new Date().toISOString() })
    .eq('id', mailboxId);

  await admin.from('email_messages').insert({
    workspace_id: mailbox.workspace_id,
    campaign_id: body.campaignId ?? null,
    lead_id: body.leadId ?? null,
    mailbox_id: mailboxId,
    email_thread_id: body.emailThreadId ?? null,
    message_id: outcome.messageId ?? null,
    thread_id: outcome.threadId ?? null,
    rfc_id: outcome.rfcId ?? null,
    in_reply_to: body.inReplyTo ?? null,
    direction: 'outbound',
    from_address: mailbox.email_address,
    to_address: to,
    subject,
    preview_text: message.slice(0, 140),
    body: message,
    status: 'sent',
    is_reply: true,
    sent_at: new Date().toISOString(),
  });

  if (body.emailThreadId) {
    await admin
      .from('email_threads')
      .update({ last_message_at: new Date().toISOString(), is_unread: false })
      .eq('id', body.emailThreadId);
    const { count } = await admin
      .from('email_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email_thread_id', body.emailThreadId);
    await admin.from('email_threads').update({ message_count: count ?? 0 }).eq('id', body.emailThreadId);
  }

  return json({ ok: true, messageId: outcome.messageId ?? null, threadId: outcome.threadId ?? null });
});
