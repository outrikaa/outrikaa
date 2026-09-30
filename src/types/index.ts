export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  timezone: string;
  role: string;
  is_admin: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string;
  logo_url: string | null;
  industry: string | null;
  company_size: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_email: string | null;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  lead_limit: number;
  email_limit: number;
  mailbox_limit: number;
  campaign_limit: number;
  ai_generation_limit: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  plan_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  linkedin_url: string | null;
  location: string | null;
  industry: string | null;
  company_size: string | null;
  custom_fields: Record<string, unknown>;
  tags: string[];
  status: LeadStatus;
  source: string | null;
  score: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'positive_reply'
  | 'meeting'
  | 'not_interested'
  | 'bounced'
  | 'unsubscribed';

export interface LeadList {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  lead_list_id: string | null;
  mailbox_id: string | null;
  sequence_id: string | null;
  template_id: string | null;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'archived';
  timezone: string;
  daily_limit: number;
  sending_days: string[];
  sending_start_time: string;
  sending_end_time: string;
  delay_between_emails: number;
  track_opens: boolean;
  track_clicks: boolean;
  unsubscribe_enabled: boolean;
  start_date: string | null;
  launched_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sequence {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_type: 'email' | 'wait' | 'condition' | 'stop';
  step_order: number;
  template_id: string | null;
  subject: string | null;
  preview_text: string | null;
  body: string | null;
  wait_days: number;
  wait_hours: number;
  condition_type: string | null;
  condition_value: unknown;
  stop_condition: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body: string;
  tags: string[];
  is_favorite: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mailbox {
  id: string;
  workspace_id: string;
  email_address: string;
  display_name: string | null;
  provider: 'gmail' | 'outlook' | 'smtp' | 'custom';
  status: 'connected' | 'disconnected' | 'needs_attention';
  daily_limit: number;
  sent_today: number;
  sending_days: string[];
  sending_start_time: string;
  sending_end_time: string;
  provider_config: Record<string, unknown>;
  health_score: number;
  bounce_rate: number;
  last_sync_at: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  lead_id: string | null;
  mailbox_id: string | null;
  sequence_step_id: string | null;
  message_id: string | null;
  in_reply_to: string | null;
  thread_id: string | null;
  direction: 'outbound' | 'inbound';
  from_address: string | null;
  to_address: string | null;
  subject: string | null;
  preview_text: string | null;
  body: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';
  is_reply: boolean;
  reply_classification: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailThread {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  campaign_id: string | null;
  subject: string | null;
  last_message_at: string | null;
  message_count: number;
  is_unread: boolean;
  classification: string | null;
  folder: 'all' | 'unread' | 'positive' | 'interested' | 'not_interested' | 'follow_up' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ScheduledEmail {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  lead_id: string | null;
  mailbox_id: string | null;
  sequence_step_id: string | null;
  scheduled_for: string;
  status: 'scheduled' | 'sending' | 'sent' | 'canceled' | 'failed';
  attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: string;
  title: string;
  message: string | null;
  icon: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Integration {
  id: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: 'available' | 'connected' | 'error' | 'coming_soon';
  config: Record<string, unknown>;
  last_synced_at: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  billing_period_start: string | null;
  billing_period_end: string | null;
  stripe_invoice_id: string | null;
  invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  workspace_id: string | null;
  user_id: string;
  subject: string;
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_from_admin: boolean;
  attachments: unknown[];
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  author_id: string | null;
  author_name: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  reading_time_min: number;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  subcategory: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  is_global: boolean;
  rollout_percentage: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  workspace_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  current_step: number;
  status: 'pending' | 'active' | 'completed' | 'bounced' | 'unsubscribed' | 'replied';
  enrolled_at: string;
  completed_at: string | null;
}
