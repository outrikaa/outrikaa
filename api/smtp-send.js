import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const secret = process.env.SMTP_SECRET;
  if (!secret || req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { action, host, port, secure, username, password, from, to, subject, text, html, headers } = req.body || {};

  const buildTransport = () =>
    nodemailer.createTransport({
      host: String(host),
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: username ? { user: String(username), pass: String(password ?? '') } : undefined,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });

  if (action === 'verify') {
    if (!host || !username || !password) {
      return res.status(400).json({ error: 'missing_fields', message: 'SMTP host, username and password are required.' });
    }
    try {
      await buildTransport().verify();
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(502).json({ ok: false, message: String(err?.message || err) });
    }
  }

  if (!host || !to || !subject) {
    return res.status(400).json({ error: 'missing_fields', message: 'host, to and subject are required.' });
  }

  try {
    const info = await buildTransport().sendMail({
      from: from || username,
      to: String(to),
      subject: String(subject),
      text: text || '',
      html: html || undefined,
      headers: headers && typeof headers === 'object' ? headers : undefined,
    });

    return res.status(200).json({ ok: true, messageId: info.messageId ?? null });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err?.message || err) });
  }
}
