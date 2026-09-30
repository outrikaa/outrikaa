import { supabase } from '@/lib/supabase';
import type { Profile, Workspace, WorkspaceMember, Lead, LeadList, Campaign, Sequence, SequenceStep, EmailTemplate, Mailbox, EmailMessage, EmailThread, Notification, Integration, ApiKey, Invoice, SupportTicket, BlogPost, HelpArticle, Testimonial, Plan, ScheduledEmail, CampaignLead } from '@/types';

type AnyRow = Record<string, unknown>;

export const db = {
  async list<T>(table: string, opts: {
    columns?: string;
    filters?: Record<string, unknown>;
    search?: { column: string; value: string };
    orderBy?: { column: string; ascending?: boolean };
    from?: number;
    to?: number;
  } = {}): Promise<T[]> {
    let q = supabase.from(table).select(opts.columns ?? '*');
    if (opts.filters) {
      for (const [k, v] of Object.entries(opts.filters)) {
        if (v === undefined || v === null || v === '') continue;
        q = q.eq(k, v);
      }
    }
    if (opts.search?.value) q = q.ilike(opts.search.column, `%${opts.search.value.replace(/[%_]/g, '')}%`);
    if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? false });
    if (opts.from !== undefined) q = q.range(opts.from, opts.to ?? opts.from + 49);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as T[];
  },

  async count(table: string, filters?: Record<string, unknown>): Promise<number> {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v === undefined || v === null || v === '') continue;
        q = q.eq(k, v);
      }
    }
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  },

  async get<T>(table: string, id: string, columns = '*'): Promise<T | null> {
    const { data, error } = await supabase.from(table).select(columns).eq('id', id).maybeSingle();
    if (error) throw error;
    return data as T | null;
  },

  async insert<T>(table: string, values: AnyRow): Promise<T> {
    const { data, error } = await supabase.from(table).insert(values).select().single();
    if (error) throw error;
    return data as T;
  },

  async insertMany<T>(table: string, values: AnyRow[]): Promise<T[]> {
    const { data, error } = await supabase.from(table).insert(values).select();
    if (error) throw error;
    return (data ?? []) as T[];
  },

  async update<T>(table: string, id: string, values: AnyRow): Promise<T> {
    const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
    if (error) throw error;
    return data as T;
  },

  async remove(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },

  async removeWhere(table: string, filters: Record<string, unknown>): Promise<void> {
    let q = supabase.from(table).delete();
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { error } = await q;
    if (error) throw error;
  },
};

export const workspaceService = {
  async create(name: string, ownerId: string, extra: Partial<Workspace> = {}) {
    const ws = await db.insert<Workspace>('workspaces', { name, owner_id: ownerId, ...extra });
    await db.insert<WorkspaceMember>('workspace_members', {
      workspace_id: ws.id,
      user_id: ownerId,
      role: 'owner',
      status: 'active',
    });
    await db.insert('subscriptions', { workspace_id: ws.id, status: 'trialing', billing_cycle: 'monthly' });
    return ws;
  },

  async members(workspaceId: string) {
    return db.list<WorkspaceMember & { profile?: Profile }>('workspace_members', {
      columns: '*, profile:profiles(*)',
      filters: { workspace_id: workspaceId },
      orderBy: { column: 'created_at', ascending: true },
    });
  },

  async invite(workspaceId: string, email: string, role: string) {
    return db.insert<WorkspaceMember>('workspace_members', {
      workspace_id: workspaceId,
      invited_email: email,
      role,
      status: 'invited',
    });
  },
};

export const leadService = {
  list: (workspaceId: string, opts: Parameters<typeof db.list>[1] = {}) =>
    db.list<Lead>('leads', { filters: { workspace_id: workspaceId }, ...opts }),
  get: (id: string) => db.get<Lead>('leads', id),
  create: (values: Partial<Lead>) => db.insert<Lead>('leads', values),
  createMany: (values: Partial<Lead>[]) => db.insertMany<Lead>('leads', values),
  update: (id: string, values: Partial<Lead>) => db.update<Lead>('leads', id, values),
  remove: (id: string) => db.remove('leads', id),
  lists: (workspaceId: string) =>
    db.list<LeadList>('lead_lists', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false } }),
  createList: (values: Partial<LeadList>) => db.insert<LeadList>('lead_lists', values),
  removeList: (id: string) => db.remove('lead_lists', id),
};

export const campaignService = {
  list: (workspaceId: string, opts: Parameters<typeof db.list>[1] = {}) =>
    db.list<Campaign>('campaigns', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false }, ...opts }),
  get: (id: string) => db.get<Campaign>('campaigns', id),
  create: (values: Partial<Campaign>) => db.insert<Campaign>('campaigns', values),
  update: (id: string, values: Partial<Campaign>) => db.update<Campaign>('campaigns', id, values),
  remove: (id: string) => db.remove('campaigns', id),
  leads: (campaignId: string) =>
    db.list<CampaignLead & { lead?: Lead }>('campaign_leads', {
      columns: '*, lead:leads(*)',
      filters: { campaign_id: campaignId },
    }),
};

export const sequenceService = {
  list: (workspaceId: string) =>
    db.list<Sequence>('sequences', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false } }),
  get: (id: string) => db.get<Sequence>('sequences', id),
  create: (values: Partial<Sequence>) => db.insert<Sequence>('sequences', values),
  update: (id: string, values: Partial<Sequence>) => db.update<Sequence>('sequences', id, values),
  remove: (id: string) => db.remove('sequences', id),
  steps: (sequenceId: string) =>
    db.list<SequenceStep>('sequence_steps', { filters: { sequence_id: sequenceId }, orderBy: { column: 'step_order', ascending: true } }),
  addStep: (values: Partial<SequenceStep>) => db.insert<SequenceStep>('sequence_steps', values),
  updateStep: (id: string, values: Partial<SequenceStep>) => db.update<SequenceStep>('sequence_steps', id, values),
  removeStep: (id: string) => db.remove('sequence_steps', id),
};

export const templateService = {
  list: (workspaceId: string, opts: Parameters<typeof db.list>[1] = {}) =>
    db.list<EmailTemplate>('email_templates', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false }, ...opts }),
  create: (values: Partial<EmailTemplate>) => db.insert<EmailTemplate>('email_templates', values),
  update: (id: string, values: Partial<EmailTemplate>) => db.update<EmailTemplate>('email_templates', id, values),
  remove: (id: string) => db.remove('email_templates', id),
};

export const mailboxService = {
  list: (workspaceId: string) =>
    db.list<Mailbox>('mailboxes', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false } }),
  create: (values: Partial<Mailbox>) => db.insert<Mailbox>('mailboxes', values),
  update: (id: string, values: Partial<Mailbox>) => db.update<Mailbox>('mailboxes', id, values),
  remove: (id: string) => db.remove('mailboxes', id),
};

export const messageService = {
  list: (workspaceId: string, opts: Parameters<typeof db.list>[1] = {}) =>
    db.list<EmailMessage>('email_messages', { filters: { workspace_id: workspaceId }, ...opts }),
  threads: (workspaceId: string) =>
    db.list<EmailThread>('email_threads', { filters: { workspace_id: workspaceId }, orderBy: { column: 'last_message_at', ascending: false } }),
  updateThread: (id: string, values: Partial<EmailThread>) => db.update<EmailThread>('email_threads', id, values),
  scheduled: (workspaceId: string) =>
    db.list<ScheduledEmail & { lead?: Lead; campaign?: Campaign }>('scheduled_emails', {
      columns: '*, lead:leads(first_name,last_name,email), campaign:campaigns(name)',
      filters: { workspace_id: workspaceId, status: 'scheduled' },
      orderBy: { column: 'scheduled_for', ascending: true },
    }),
};

export const notificationService = {
  list: (userId: string) =>
    db.list<Notification>('notifications', { filters: { user_id: userId }, orderBy: { column: 'created_at', ascending: false }, from: 0, to: 29 }),
  markRead: (id: string) => db.update<Notification>('notifications', id, { is_read: true }),
  markAllRead: async (userId: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (error) throw error;
  },
};

export const billingService = {
  plans: () => db.list<Plan>('plans', { filters: { is_active: true }, orderBy: { column: 'sort_order', ascending: true } }),
  allPlans: () => db.list<Plan>('plans', { orderBy: { column: 'sort_order', ascending: true } }),
  subscription: async (workspaceId: string) => {
    const { data } = await supabase.from('subscriptions').select('*, plan:plans(*)').eq('workspace_id', workspaceId).maybeSingle();
    return data;
  },
  invoices: (workspaceId: string) =>
    db.list<Invoice>('invoices', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false } }),
  usage: (workspaceId: string) =>
    db.list('usage_records', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false }, from: 0, to: 99 }),
};

export const integrationService = {
  list: (workspaceId: string) =>
    db.list<Integration>('integrations', { filters: { workspace_id: workspaceId } }),
  update: (id: string, values: Partial<Integration>) => db.update<Integration>('integrations', id, values),
};

export const apiKeyService = {
  list: (workspaceId: string) =>
    db.list<ApiKey>('api_keys', { filters: { workspace_id: workspaceId }, orderBy: { column: 'created_at', ascending: false } }),
  create: (values: Partial<ApiKey>) => db.insert<ApiKey>('api_keys', values),
  revoke: (id: string) => db.update<ApiKey>('api_keys', id, { is_active: false }),
};

export const supportService = {
  tickets: async (userId?: string) => {
    if (userId) return db.list<SupportTicket>('support_tickets', { filters: { user_id: userId }, orderBy: { column: 'created_at', ascending: false } });
    return db.list<SupportTicket>('support_tickets', { orderBy: { column: 'created_at', ascending: false } });
  },
  create: (values: Partial<SupportTicket>) => db.insert<SupportTicket>('support_tickets', values),
  update: (id: string, values: Partial<SupportTicket>) => db.update<SupportTicket>('support_tickets', id, values),
};

export const contentService = {
  posts: () => db.list<BlogPost>('blog_posts', { filters: { status: 'published' }, orderBy: { column: 'published_at', ascending: false } }),
  allPosts: () => db.list<BlogPost>('blog_posts', { orderBy: { column: 'created_at', ascending: false } }),
  postBySlug: async (slug: string) => {
    const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    return data as BlogPost | null;
  },
  createPost: (values: Partial<BlogPost>) => db.insert<BlogPost>('blog_posts', values),
  updatePost: (id: string, values: Partial<BlogPost>) => db.update<BlogPost>('blog_posts', id, values),
  removePost: (id: string) => db.remove('blog_posts', id),
  help: () => db.list<HelpArticle>('help_articles', { filters: { status: 'published' }, orderBy: { column: 'sort_order', ascending: true } }),
  helpBySlug: async (slug: string) => {
    const { data } = await supabase.from('help_articles').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    return data as HelpArticle | null;
  },
  allHelp: () => db.list<HelpArticle>('help_articles', { orderBy: { column: 'created_at', ascending: false } }),
  createHelp: (values: Partial<HelpArticle>) => db.insert<HelpArticle>('help_articles', values),
  updateHelp: (id: string, values: Partial<HelpArticle>) => db.update<HelpArticle>('help_articles', id, values),
  removeHelp: (id: string) => db.remove('help_articles', id),
  testimonials: () => db.list<Testimonial>('testimonials', { filters: { is_published: true }, orderBy: { column: 'sort_order', ascending: true } }),
  allTestimonials: () => db.list<Testimonial>('testimonials', { orderBy: { column: 'sort_order', ascending: true } }),
  createTestimonial: (values: Partial<Testimonial>) => db.insert<Testimonial>('testimonials', values),
  updateTestimonial: (id: string, values: Partial<Testimonial>) => db.update<Testimonial>('testimonials', id, values),
  removeTestimonial: (id: string) => db.remove('testimonials', id),
};

export type { Profile, Workspace };
