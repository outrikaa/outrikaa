import type { Mailbox } from '@/types';

export type MailProvider = 'gmail' | 'outlook' | 'smtp' | 'custom';

export interface ComposeInput {
  mailboxId: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface MailboxHealth {
  connected: boolean;
  message: string;
}

/**
 * Provider abstraction. Real delivery requires OAuth / SMTP credentials
 * configured in Supabase Edge Functions — until then every provider
 * reports `credentials_required` so the UI never fakes a connection.
 */
export const emailService = {
  async connect(_provider: MailProvider, _config: Record<string, unknown>): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailbox-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ provider: _provider, config: _config }),
      });
      if (res.ok) return { ok: true, message: 'Mailbox connected' };
      return { ok: false, message: 'Provider credentials are not configured yet.' };
    } catch {
      return { ok: false, message: 'Provider credentials are not configured yet.' };
    }
  },

  async disconnect(_mailboxId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  },

  async send(_input: ComposeInput): Promise<SendResult> {
    return { ok: false, error: 'Sending requires mailbox credentials (Gmail/Outlook OAuth or SMTP).' };
  },

  async schedule(_input: ComposeInput & { scheduledFor: string }): Promise<SendResult> {
    return { ok: false, error: 'Scheduling requires mailbox credentials (Gmail/Outlook OAuth or SMTP).' };
  },

  health(mailbox: Pick<Mailbox, 'status' | 'health_score'>): MailboxHealth {
    if (mailbox.status === 'connected') return { connected: true, message: 'Healthy' };
    if (mailbox.status === 'needs_attention') return { connected: false, message: 'Needs attention — reauthenticate' };
    return { connected: false, message: 'Not connected' };
  },
};
