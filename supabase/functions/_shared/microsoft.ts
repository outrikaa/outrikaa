// Microsoft OAuth + Graph helpers shared by mailbox-connect, mailbox-send,
// campaign-scheduler and mailbox-sync.

export const MS_SCOPES = [
  'openid',
  'offline_access',
  'email',
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Mail.ReadWrite',
].join(' ');

export interface MSToken {
  access_token: string;
  expires_in?: number;
}

export function msTenant(): string {
  return Deno.env.get('MS_TENANT') || 'common';
}

export function msAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  loginHint?: string;
}): string {
  const url = new URL(`https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id', opts.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', opts.redirectUri);
  url.searchParams.set('scope', MS_SCOPES);
  url.searchParams.set('state', opts.state);
  url.searchParams.set('prompt', 'select_account');
  if (opts.loginHint) url.searchParams.set('login_hint', opts.loginHint);
  return url.toString();
}

export async function exchangeMSCode(code: string, redirectUri: string): Promise<(MSToken & { refresh_token?: string; scope?: string }) | null> {
  const res = await fetch(`https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('OUTLOOK_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: MS_SCOPES,
    }),
  });
  if (!res.ok) {
    console.error('ms token exchange failed', res.status, await res.text());
    return null;
  }
  return await res.json();
}

export async function refreshMSToken(refreshToken: string): Promise<MSToken | null> {
  const res = await fetch(`https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get('OUTLOOK_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '',
      grant_type: 'refresh_token',
      scope: MS_SCOPES,
    }),
  });
  if (!res.ok) {
    console.error('ms token refresh failed', res.status);
    return null;
  }
  return await res.json();
}

export interface OutlookSendInput {
  accessToken: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
  conversationId?: string;
  unsubscribeUrl?: string;
}

export interface OutlookSendOutcome {
  ok: boolean;
  messageId?: string;
  threadId?: string;
  rfcId?: string;
  error?: string;
}

export function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Graph: create a draft, then send it — this yields a stable message id +
// conversation id for threading and reply detection.
export async function sendOutlook(input: OutlookSendInput): Promise<OutlookSendOutcome> {
  const headers: { name: string; value: string }[] = [];
  if (input.unsubscribeUrl) {
    headers.push({ name: 'List-Unsubscribe', value: `<${input.unsubscribeUrl}>` });
    headers.push({ name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' });
  }
  if (input.inReplyTo) {
    headers.push({ name: 'In-Reply-To', value: input.inReplyTo });
    headers.push({ name: 'References', value: input.references ?? input.inReplyTo });
  }

  const message: Record<string, unknown> = {
    subject: input.subject,
    body: {
      contentType: 'HTML',
      content: input.html ?? `<p>${(input.text ?? '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`,
    },
    bodyPreview: (input.text ?? stripHtml(input.html ?? '')).slice(0, 200),
    toRecipients: [{ emailAddress: { address: input.to } }],
    importance: 'normal',
    internetMessageHeaders: headers,
  };

  const draftRes = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!draftRes.ok) {
    const detail = await draftRes.text();
    console.error('outlook draft failed', draftRes.status, detail);
    return { ok: false, error: `outlook_${draftRes.status}` };
  }
  const draft = await draftRes.json();

  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${draft.id}/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.accessToken}` },
  });
  if (!sendRes.ok && sendRes.status !== 202) {
    const detail = await sendRes.text();
    console.error('outlook send failed', sendRes.status, detail);
    return { ok: false, error: `outlook_${sendRes.status}` };
  }

  return {
    ok: true,
    messageId: draft.id ?? null,
    threadId: draft.conversationId ?? input.conversationId ?? null,
    rfcId: draft.internetMessageId ?? null,
  };
}
