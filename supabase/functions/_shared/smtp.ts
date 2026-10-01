// Custom SMTP sending goes through a Vercel serverless function
// (/api/smtp-send) because Supabase Edge Functions cannot open TCP sockets.

export interface SmtpRelayInput {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  unsubscribeUrl?: string;
}

export interface SmtpRelayOutcome {
  ok: boolean;
  error?: string;
}

export async function sendViaSmtpRelay(input: SmtpRelayInput): Promise<SmtpRelayOutcome> {
  const site = Deno.env.get('SITE_URL') ?? 'https://outrikaa.vercel.app';
  const headers: Record<string, string> = {};
  if (input.unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${input.unsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const res = await fetch(`${site}/api/smtp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': Deno.env.get('CRON_SECRET') ?? '',
      },
      body: JSON.stringify({
        host: input.host,
        port: input.port,
        secure: input.secure,
        username: input.username,
        password: input.password,
        from: input.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('smtp relay failed', res.status, detail.slice(0, 300));
      return { ok: false, error: `smtp_relay_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('smtp relay error', err);
    return { ok: false, error: 'smtp_relay_unreachable' };
  }
}
