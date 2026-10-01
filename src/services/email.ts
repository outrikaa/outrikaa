import { supabase } from '@/lib/supabase';
import type { Mailbox } from '@/types';

export type MailProvider = 'gmail' | 'google' | 'outlook' | 'microsoft365' | 'smtp' | 'custom';

export interface ComposeInput {
  mailboxId: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  threadId?: string;
  leadId?: string;
  campaignId?: string;
  emailThreadId?: string;
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  threadId?: string;
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
        return { ok: false, message: messageFrom(error, 'Could not start the mailbox connection.') };
      }

      if (data?.url) {
        window.location.assign(data.url);
        return { ok: true, message: 'Redirecting to the provider…' };
      }
      return { ok: false, needsCredentials: true, message: data?.message ?? 'Provider credentials are not configured yet.' };
    } catch {
      return { ok: false, needsCredentials: true, message: 'Provider credentials are not configured yet.' };
    }
  },

  async status(): Promise<{ configured: boolean; outlookConfigured: boolean }> {
    try {
      const { data, error } = await supabase.functions.invoke('mailbox-connect', { method: 'GET' });
      if (error || !data?.ok) return { configured: false, outlookConfigured: false };
      return {
        configured: Boolean(data.google_configured),
        outlookConfigured: Boolean(data.outlook_configured),
      };
    } catch {
      return { configured: false, outlookConfigured: false };
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
          threadId: input.threadId,
          leadId: input.leadId,
          campaignId: input.campaignId,
          emailThreadId: input.emailThreadId,
        },
      });
      if (error) {
        const status = (error as { context?: Response }).context?.status;
        if (status === 404 || status === 409) {
          const ctx = (error as { context?: Response }).context;
          let msg = 'This mailbox is not connected. Connect it from Mailboxes.';
          try {
            const payload = await ctx?.json?.();
            if (payload?.message) msg = payload.message;
          } catch {
            /* keep fallback */
          }
          return { ok: false, error: msg };
        }
        if (status === 501) {
          return { ok: false, error: messageFrom(error, 'Sending is not configured yet.') };
        }
        return { ok: false, error: messageFrom(error, 'Sending failed. Try again.') };
      }
      if (data?.ok) {
        return { ok: true, messageId: data.messageId ?? undefined, threadId: data.threadId ?? undefined };
      }
      return { ok: false, error: data?.message ?? 'Sending failed.' };
    } catch {
      return { ok: false, error: 'Sending failed. Try again.' };
    }
  },

  async sync(): Promise<{ ok: boolean; inbound: number; threads: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('mailbox-sync', { method: 'POST' });
      if (error) {
        const status = (error as { context?: Response }).context?.status;
        if (status === 401) return { ok: false, inbound: 0, threads: 0, error: 'You are not allowed to sync.' };
        return { ok: false, inbound: 0, threads: 0, error: 'Sync failed. Try again.' };
      }
      return { ok: true, inbound: data?.inbound ?? 0, threads: data?.threads ?? 0 };
    } catch {
      return { ok: false, inbound: 0, threads: 0, error: 'Sync failed. Try again.' };
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
