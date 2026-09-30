// Gmail helpers shared by mailbox-send, campaign-scheduler, mailbox-sync.

export const GMAIL_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

export interface GmailToken {
  access_token: string;
  expires_in?: number;
}

export async function refreshGmailToken(refreshToken: string): Promise<GmailToken | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      grant_type: 'refresh_token',
      scope: GMAIL_SCOPES,
    }),
  });
  if (!res.ok) return null;
  return await res.json();
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeBase64Url(text: string): string {
  return toBase64Url(new TextEncoder().encode(text));
}

export function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (data.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function rfcMessageId(): string {
  return `<${crypto.randomUUID()}@outrikaa.vercel.app>`;
}

function encodeHeaderValue(value: string): string {
  // RFC 2047 for non-ASCII subjects; plain otherwise.
  // eslint-disable-next-line no-control-regex
  if (!/[^\x00-\x7F]/.test(value)) return value;
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(value)));
  return `=?UTF-8?B?${b64}?=`;
}

export function escapeHtml(text: string): string {
  return (text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textToHtml(text: string): string {
  const escaped = escapeHtml(text ?? '');
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#111827">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return paragraphs || '<p style="margin:0 0 16px;line-height:1.6;color:#111827"><br></p>';
}

export function unsubscribeUrl(campaignId: string | null, leadId: string): string {
  const fn = `${Deno.env.get('SUPABASE_URL')}/functions/v1/unsubscribe`;
  const params = new URLSearchParams({ l: leadId });
  if (campaignId) params.set('c', campaignId);
  return `${fn}?${params.toString()}`;
}

export function wrapHtml(bodyHtml: string, unsubscribe?: string): string {
  const footer = unsubscribe
    ? `<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center">
        <a href="${escapeHtml(unsubscribe)}" style="display:inline-block;background:#f3f4f6;color:#6b7280;padding:8px 18px;border-radius:8px;font-size:12px;font-family:Arial,sans-serif;text-decoration:none">Unsubscribe</a>
        <p style="margin:10px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif">You are receiving this email because you were contacted as a business prospect.</p>
      </div>`
    : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;font-size:14px;color:#111827">${bodyHtml}${footer}</div>
</body></html>`;
}

export interface MimeInput {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
  unsubscribeUrl?: string;
}

export function buildMime(input: MimeInput): string {
  const boundary = `----outrikaa-${crypto.randomUUID()}`;
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: ${input.messageId ?? rfcMessageId()}`,
    `Reply-To: ${input.replyTo ?? input.from}`,
    'MIME-Version: 1.0',
  ];
  if (input.unsubscribeUrl) {
    headers.push(`List-Unsubscribe: <${input.unsubscribeUrl}>`);
    headers.push('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
  }
  if (input.inReplyTo) {
    headers.push(`In-Reply-To: ${input.inReplyTo}`);
    headers.push(`References: ${input.references ?? input.inReplyTo}`);
  }

  const htmlBody = input.html ?? wrapHtml(textToHtml(input.text), input.unsubscribeUrl);
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  return [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.text,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export interface SendOutcome {
  ok: boolean;
  messageId?: string;
  threadId?: string;
  rfcId?: string;
  error?: string;
}

export async function sendGmail(input: MimeInput & { accessToken: string; threadId?: string }): Promise<SendOutcome> {
  const rfcId = input.messageId ?? rfcMessageId();
  const raw = encodeBase64Url(buildMime({ ...input, messageId: rfcId }));
  const body: Record<string, string> = { raw };
  if (input.threadId) body.threadId = input.threadId;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('gmail send failed', res.status, detail);
    return { ok: false, error: `gmail_${res.status}` };
  }
  const data = await res.json();
  return { ok: true, messageId: data.id ?? null, threadId: data.threadId ?? input.threadId ?? null, rfcId };
}

const VAR_RE = /\{\{\s*(first_name|last_name|full_name|company|job_title|email|location|industry)\s*\}\}/g;

export function renderVars(text: string, vars: Record<string, string | null | undefined>): string {
  return (text ?? '').replace(VAR_RE, (whole, key: string) => {
    const value = vars[key];
    if (value && String(value).trim()) return String(value);
    if (key === 'first_name' || key === 'last_name') return '';
    return whole;
  });
}
