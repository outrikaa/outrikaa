import { supabase } from '@/lib/supabase';
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

export interface ConnectResult {
  ok: boolean;
  message: string;
  needsCredentials?: boolean;
}

function messageFrom(error: unknown, fallback: string): string {
  const anyErr = error as { context?: Response; message?: string } | null;
  if (anyErr?.context && typeof anyErr.context === 'object' && 'json' in anyErr.context) {
    return fallback;
  }
  return anyErr?.message || fallback;
}

/**
 * Gmail connection happens through an OAuth redirect:
 * mailbox-connect returns a Google consent URL, the browser navigates there,
 * and mailbox-google-callback lands back on /app/mailboxes.
 */
export const emailService = {
  async connect(provider: MailProvider, config: { email: string; workspaceId: string }): Promise<ConnectResult> {
    try {
      const { data, error } = await supabase.functions.invoke('mailbox-connect', {
        method: 'POST',
        body: { provider, email: config.email, workspaceId: config.workspaceId },
      });

      if (error) {
        const status = (error as { context?: Response }).context?.status;
        if (status === 501) {
          return { ok: false, needsCredentials: true, message: 'Provider credentials are not configured yet.' };
        }
        if (status === 401 || status === 403) {
          return { ok: false, message: messageFrom(error, 'You are not allowed to connect this mailbox.') };
        }
        if (status === 404) {
          return { ok: false, needsCredentials: true, message: 'Provider credentials are not configured yet.' };
        }
        return { ok: false, message: messageFrom(error, 'Could not start the Gmail connection.') };
      }

      if (data?.url) {
        window.location.assign(data.url);
        return { ok: true, message: 'Redirecting to Google…' };
      }
      return { ok: false, needsCredentials: true, message: data?.message ?? 'Provider credentials are not configured yet.' };
    } catch {
      return { ok: false, needsCredentials: true, message: 'Provider credentials are not configured yet.' };
    }
  },

  async status(): Promise<{ configured: boolean }> {
    try {
      const { data, error } = await supabase.functions.invoke('mailbox-connect', { method: 'GET' });
      if (error || !data?.ok) return { configured: false };
      return { configured: Boolean(data.google_configured) };
    } catch {
      return { configured: false };
    }
  },

  async disconnect(_mailboxId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  },

  async send(input: ComposeInput): Promise<SendResult> {
    if (!input.mailboxId) {
      return { ok: false, error: 'Select a mailbox before sending.' };
    }
    try {
      const { data, error } = await supabase.functions.invoke('mailbox-send', {
        method: 'POST',
        body: {
          mailboxId: input.mailboxId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          inReplyTo: input.inReplyTo,
        },
      });
      if (error) {
        const status = (error as { context?: Response }).context?.status;
        if (status === 404 || status === 409) {
          return { ok: false, error: 'This mailbox is not connected. Connect it from Mailboxes.' };
        }
        if (status === 501) {
          return { ok: false, error: messageFrom(error, 'Sending is not configured yet.') };
        }
        return { ok: false, error: messageFrom(error, 'Sending failed. Try again.') };
      }
      if (data?.ok) return { ok: true, messageId: data.messageId ?? undefined };
      return { ok: false, error: data?.message ?? 'Sending failed.' };
    } catch {
      return { ok: false, error: 'Sending failed. Try again.' };
    }
  },

  async schedule(_input: ComposeInput & { scheduledFor: string }): Promise<SendResult> {
    return { ok: false, error: 'Scheduling is not enabled yet.' };
  },

  health(mailbox: Pick<Mailbox, 'status' | 'health_score'>): MailboxHealth {
    if (mailbox.status === 'connected') return { connected: true, message: 'Healthy' };
    if (mailbox.status === 'needs_attention') return { connected: false, message: 'Needs attention — reauthenticate' };
    return { connected: false, message: 'Not connected' };
  },
};
