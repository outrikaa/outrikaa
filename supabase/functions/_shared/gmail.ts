// Gmail sending helpers shared by mailbox-send and campaign-scheduler.

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

export function buildMime(opts: { from: string; to: string; subject: string; body: string; inReplyTo?: string }): string {
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject.startsWith('Re:') ? opts.subject : `Re: ${opts.subject}`}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (opts.inReplyTo) headers.push(`In-Reply-To: ${opts.inReplyTo}`, `References: ${opts.inReplyTo}`);
  return `${headers.join('\r\n')}\r\n\r\n${opts.body}`;
}

export interface SendOutcome {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendGmail(opts: {
  accessToken: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}): Promise<SendOutcome> {
  const raw = encodeBase64Url(
    buildMime({ from: opts.from, to: opts.to, subject: opts.subject, body: opts.body, inReplyTo: opts.inReplyTo })
  );
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('gmail send failed', res.status, detail);
    return { ok: false, error: `gmail_${res.status}` };
  }
  const data = await res.json();
  return { ok: true, messageId: data.id ?? null };
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

export function unsubscribeFooter(): string {
  return "\n\nIf you no longer wish to receive emails from me, reply with \"unsubscribe\" and I won't write again.";
}
