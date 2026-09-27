-- 005: seed data — plans, feature flags, system settings, content
-- -----------------------------------------------------------------------------------
-- Safe to re-run: every statement is idempotent (ON CONFLICT ... DO UPDATE/NOTHING).

-- PLANS ------------------------------------------------------------------------
INSERT INTO public.plans (name, slug, description, monthly_price, yearly_price, lead_limit, email_limit, mailbox_limit, campaign_limit, ai_generation_limit, features, is_active, is_featured, sort_order)
VALUES
  ('Starter', 'starter', 'For founders and solo sellers testing outbound.', 19, 182, 1000, 5000, 2, 5, 100,
   '["1,000 leads","5,000 emails / month","2 mailboxes","1 sequence","AI writer (100 generations)","Basic analytics","Email support"]'::jsonb,
   true, false, 1),
  ('Growth', 'growth', 'For teams running consistent outbound motions.', 59, 566, 10000, 50000, 10, 50, 1000,
   '["10,000 leads","50,000 emails / month","10 mailboxes","Unlimited sequences","AI writer (1,000 generations)","Advanced analytics & insights","Unlimited templates","Priority support"]'::jsonb,
   true, true, 2),
  ('Scale', 'scale', 'For multi-brand and agency operations.', 149, 1430, 1000000, 250000, 1000, 1000000, 1000000,
   '["Unlimited leads","250,000 emails / month","Unlimited mailboxes","Unlimited sequences","Unlimited AI generations","Custom sending domains","API access & webhooks","Dedicated success manager"]'::jsonb,
   true, false, 3)
ON CONFLICT (slug) DO UPDATE
   SET description = EXCLUDED.description,
       monthly_price = EXCLUDED.monthly_price,
       yearly_price = EXCLUDED.yearly_price,
       lead_limit = EXCLUDED.lead_limit,
       email_limit = EXCLUDED.email_limit,
       mailbox_limit = EXCLUDED.mailbox_limit,
       campaign_limit = EXCLUDED.campaign_limit,
       ai_generation_limit = EXCLUDED.ai_generation_limit,
       features = EXCLUDED.features,
       is_featured = EXCLUDED.is_featured,
       sort_order = EXCLUDED.sort_order,
       updated_at = now();

-- FEATURE FLAGS -----------------------------------------------------------------
INSERT INTO public.feature_flags (key, name, description, is_enabled, is_global, rollout_percentage)
VALUES
  ('ai_writer', 'AI Writer', 'Generate and rewrite outreach copy with AI.', true, true, 100),
  ('sequence_builder_v2', 'Sequence builder v2', 'Redesigned drag-and-drop sequence canvas.', false, true, 0),
  ('linkedin_finder', 'LinkedIn profile finder', 'Enrich leads from public LinkedIn profiles.', false, true, 0),
  ('webhooks', 'Outbound webhooks', 'POST events to customer endpoints.', false, true, 0),
  ('inbox_v2', 'Unified inbox v2', 'Threaded conversation view with AI reply drafts.', true, true, 25)
ON CONFLICT (key) DO UPDATE
   SET description = EXCLUDED.description,
       is_enabled = EXCLUDED.is_enabled,
       rollout_percentage = EXCLUDED.rollout_percentage,
       updated_at = now();

-- SYSTEM SETTINGS ---------------------------------------------------------------
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('site_name', '"OUTRIKAA"'::jsonb, 'Public site name', true),
  ('site_tagline', '"Email outreach, automated."'::jsonb, 'Public tagline', true),
  ('meta_description', '"OUTRIKAA is the AI-powered outreach platform for lead management, email sequences and reply analytics."'::jsonb, 'Default meta description', true),
  ('footer_text', '"Built for teams who would rather send fewer, better emails."'::jsonb, 'Extra footer line', true),
  ('support_email', '"support@outrikaa.com"'::jsonb, 'Primary support address', true),
  ('signup_enabled', 'true'::jsonb, 'Whether new registrations are allowed', true),
  ('maintenance_mode', 'false'::jsonb, 'Show maintenance notice to non-admins', true),
  ('privacy_effective_date', '"September 2026"'::jsonb, 'Privacy policy effective date', true),
  ('terms_effective_date', '"September 2026"'::jsonb, 'Terms effective date', true),
  ('platform_maintenance_message', '"We are performing scheduled maintenance."'::jsonb, 'Maintenance notice text', false),
  ('max_workspaces_per_user', '3'::jsonb, 'Workspaces a single user may own', false),
  ('max_import_rows', '5000'::jsonb, 'Max rows accepted per CSV import', false),
  ('session_timeout_hours', '720'::jsonb, 'Session lifetime in hours', false),
  ('ai_provider', '"openai"'::jsonb, 'AI provider key (credentials stored server-side)', false),
  ('ai_model', '"gpt-4o-mini"'::jsonb, 'Default AI model', false),
  ('ai_enabled', 'true'::jsonb, 'AI writer availability', false),
  ('default_daily_send_limit', '50'::jsonb, 'Default per-mailbox daily send limit', false),
  ('smtp_enabled', 'true'::jsonb, 'SMTP sending availability', false),
  ('trial_days', '14'::jsonb, 'Length of the free trial in days', false),
  ('default_plan_slug', '"starter"'::jsonb, 'Plan assigned to new workspaces', false),
  ('stripe_enabled', 'false'::jsonb, 'Stripe billing availability', false)
ON CONFLICT (key) DO NOTHING;

-- TESTIMONIALS ------------------------------------------------------------------
INSERT INTO public.testimonials (name, role, company, quote, rating, is_published, sort_order)
VALUES
  ('Sarah Mitchell', 'Head of Sales', 'Northbeam', 'We replaced four tools with OUTRIKAA. Reply rates went up because the copy is finally consistent across the team.', 5, true, 1),
  ('Daniel Okafor', 'Founder', 'Loopwise', 'The sequence builder is the first one I have used that does not fight me. Import, write, schedule — done in an afternoon.', 5, true, 2),
  ('Priya Nair', 'Growth Lead', 'Cadenza Labs', 'Bounce monitoring alone saved our domain reputation. Clear warnings before we scaled volume.', 5, true, 3),
  ('Marcus Feld', 'RevOps Manager', 'Aperture', 'Analytics that answer questions instead of dumping charts. The insight cards tell us exactly what to change.', 4, true, 4)
ON CONFLICT DO NOTHING;

-- HELP ARTICLES -----------------------------------------------------------------
INSERT INTO public.help_articles (title, slug, content, category, subcategory, sort_order, status)
VALUES
  ('How to create a workspace', 'how-to-create-a-workspace',
   E'Every account starts with a workspace that owns your leads, campaigns and settings.\n\n## Steps\n\n1. Finish the signup flow and confirm your email.\n2. Name your workspace during onboarding.\n3. Invite teammates from Settings → Team.\n\n## Roles\n\nOwners can do everything, admins can manage most settings, members can work on campaigns, and viewers have read-only access.',
   'Getting started', 'Setup', 1, 'published'),
  ('Import your first CSV of leads', 'import-your-first-csv',
   E'Imports are guided and validated before anything is written.\n\n## Required columns\n\nOnly email is required. Everything else maps optionally.\n\n## Steps\n\n1. Open Leads → Import.\n2. Drop your CSV file.\n3. Review the detected column mapping.\n4. Check validation: invalid rows and duplicates are counted, not imported.\n5. Confirm and review the result summary.',
   'Getting started', 'Imports', 2, 'published'),
  ('Connect Gmail, Outlook or M365', 'connect-a-mailbox',
   E'Mailboxes are connected through provider OAuth — we never ask for your password.\n\n## Steps\n\n1. Go to Mailboxes → Connect.\n2. Choose the provider.\n3. Complete the consent screen.\n4. Set a daily sending limit — start conservative and raise it gradually.\n\n## If a mailbox disconnects\n\nReconnect it from the same screen. Queued sends resume automatically.',
   'Getting started', 'Sending', 3, 'published'),
  ('Launch your first campaign', 'launch-first-campaign',
   E'A campaign connects a list, a mailbox and a sequence.\n\n## Steps\n\n1. Create a campaign and give it a name.\n2. Pick the lead list.\n3. Choose the sending mailbox and schedule.\n4. Build the sequence: emails, waits, conditions.\n5. Review the summary and set it live.\n\n## Before you send\n\nConfirm authentication records and start with a low daily limit.',
   'Getting started', 'Campaigns', 4, 'published'),
  ('Email, wait, condition and stop steps', 'sequence-step-types',
   E'Four building blocks cover almost every outreach flow.\n\n## Email\n\nSubject, preview text and body with personalisation variables.\n\n## Wait\n\nDelay in days and hours before the next step.\n\n## Condition\n\nBranch on opened, clicked, replied or not replied.\n\n## Stop\n\nEnd the sequence permanently for that lead.',
   'Campaigns', 'Sequences', 5, 'published'),
  ('Personalisation variables reference', 'personalisation-variables',
   E'Variables are replaced at send time.\n\n## Available\n\n- {{first_name}}, {{last_name}}, {{full_name}}\n- {{email}}, {{company}}, {{job_title}}\n- {{custom.field_name}} for imported custom fields\n\nIf a value is empty the variable renders as an empty string, so write sentences that still read naturally.',
   'Campaigns', 'Variables', 6, 'published'),
  ('Setting sending windows and timezones', 'sending-windows',
   E'Guardrails keep volume human and respectful of local time.\n\n## Per campaign\n\n- Sending days (weekdays by default)\n- Start and end hour\n- Timezone\n- Daily limit and delay between messages\n\nSteps only fire inside the window, on an allowed day.',
   'Campaigns', 'Schedule', 7, 'published'),
  ('Editing a live sequence', 'edit-a-live-sequence',
   E'Sequences can be edited while a campaign is running.\n\n## Safe to change\n\n- Email copy, subject lines and personalisation\n- Wait durations for steps that have not started yet\n- Conditions and branches\n\n## Not safe to change\n\nRemoving a step that leads are currently waiting on will skip them to the next step. Pause the campaign first if you need to restructure the flow.',
   'Campaigns', 'Sequences', 8, 'published'),
  ('Why is my campaign not sending?', 'emails-not-sending',
   E'Check these in order:\n\n## 1. Campaign status\n\nIt must be running, not draft or paused.\n\n## 2. Mailbox health\n\nA disconnected mailbox pauses sends. Reconnect it.\n\n## 3. Daily limit\n\nIf today''s limit is reached the campaign resumes tomorrow.\n\n## 4. Schedule window\n\nSending outside the configured hours waits until the next window.',
   'Troubleshooting', 'Sending', 8, 'published'),
  ('Mailbox shows disconnected', 'mailboxes-disconnected',
   E'Most disconnects come from expired OAuth grants or a password change at the provider.\n\n## Fix\n\n1. Open Mailboxes.\n2. Choose the affected mailbox.\n3. Reconnect and re-grant permissions.\n\nQueued messages are preserved and resume after reconnection.',
   'Troubleshooting', 'Mailboxes', 9, 'published'),
  ('Dealing with a high bounce rate', 'high-bounce-rate',
   E'A bounce rate above 3–5% means the list needs attention.\n\n## Immediate steps\n\n1. Pause the campaign.\n2. Check the source of the imported addresses.\n3. Remove or verify risky rows.\n\n## Ongoing\n\nHard bounces are suppressed automatically, so previously bad addresses will not be emailed again.',
   'Troubleshooting', 'Deliverability', 10, 'published'),
  ('CSV import failed or skipped rows', 'csv-import-failed',
   E'Skips are usually intentional.\n\n## Common causes\n\n- Missing or malformed email addresses\n- Duplicate emails already in the workspace\n- File not UTF-8 or missing a header row\n\nThe result screen reports imported, skipped and invalid counts separately.',
   'Troubleshooting', 'Imports', 11, 'published'),
  ('Change or cancel your plan', 'change-your-plan',
   E'Plan changes are self-serve.\n\n## Upgrade\n\nTakes effect immediately with prorated billing for the remainder of the period.\n\n## Downgrade\n\nApplies at the next renewal so you keep paid features until the period ends.\n\n## Cancel\n\nStops future charges; the workspace stays active until the paid period finishes.',
   'Billing', 'Plans', 12, 'published'),
  ('Download invoices', 'download-invoices',
   E'Invoices live in Billing → Invoices.\n\nEach row shows the amount, status and billing period. Download as PDF for your records. Contact billing@outrikaa.com for VAT details or a custom billing entity.',
   'Billing', 'Invoices', 13, 'published'),
  ('Manage team members and roles', 'manage-team-members',
   E'Invite people from Settings → Team.\n\n## Roles\n\n- Owner: full control including billing\n- Admin: manage workspace settings and content\n- Member: run campaigns, leads and analytics\n- Viewer: read-only access\n\nRole changes apply immediately.',
   'Billing', 'Team', 14, 'published'),
  ('Delete your account and data', 'delete-your-account',
   E'You are in control of your data.\n\n## Steps\n\n1. Export your leads and campaigns from Settings.\n2. Delete the workspace from Settings → Security.\n3. Confirm when prompted.\n\nOperational data is removed within 30 days and backups age out within a further 35 days. Billing records are retained only as long as tax law requires.',
   'Billing', 'Data', 15, 'published')
ON CONFLICT (slug) DO NOTHING;

-- BLOG POSTS -------------------------------------------------------------------
INSERT INTO public.blog_posts (title, slug, excerpt, content, category, author_name, status, published_at, reading_time_min, meta_description)
VALUES
  ('Cold email benchmarks 2026: what good actually looks like', 'cold-email-benchmarks-2026',
   'Open rates, reply rates and bounce rates across industries — plus how to read your own numbers against them.',
   E'Cold outreach has never been noisier, which means the basics matter more than ever: a relevant audience, a specific first line, a single clear ask, and a cadence that stops before it annoys.\n\n## What good looks like\n\nAcross B2B SaaS outbound we consistently see open rates between 40–60%, reply rates of 5–8%, and bounce rates under 2%. Numbers above those ranges are usually a signal about list quality rather than copy.\n\n## Read trends, not days\n\nA single day means nothing. Compare week over week, and only change one variable at a time — subject line, first line, or send window.\n\n## Benchmarks are floors, not ceilings\n\nUse them to catch problems early. The real gains come from narrowing the audience until each person has a concrete reason to care.',
   'Deliverability', 'A. Rahman', 'published', now() - interval '45 days', 8, 'How to read cold email benchmarks without fooling yourself.'),
  ('How to write a first line that actually gets replies', 'write-first-line-that-gets-replies',
   'The first sentence decides everything. Here is a repeatable structure that avoids the 95% of copy people ignore.',
   E'The first line earns the second line. If it reads like a template, the rest never gets read.\n\n## The structure\n\n1. One specific observation about them.\n2. Why it matters to someone in their role.\n3. A single, low-friction ask.\n\n## What to avoid\n\nFlattery without evidence, vague claims about their company, and long setup before making a point.\n\n## Test it\n\nIf you removed your company name, would the email still be about them? If not, rewrite.',
   'Copywriting', 'N. Islam', 'published', now() - interval '30 days', 6, 'A repeatable structure for cold email opening lines.'),
  ('Anatomy of a 5-step sequence that books meetings', 'sequence-anatomy',
   'Why more emails rarely help, where conditions belong, and how to design a breakup email that works.',
   E'More steps rarely produce more meetings. Five well-spaced emails usually outperform twelve rushed ones.\n\n## The shape\n\n1. Introduction with one observation.\n2. Value follow-up three days later.\n3. Proof or example after a further four days.\n4. Soft bump with a different angle.\n5. Breakup email that gives permission to say no.\n\n## Conditions belong in the middle\n\nBranch on opens or replies so engaged leads get a different path than cold ones.\n\n## The breakup email\n\nShort, honest, and without guilt. It consistently produces a surprising share of replies.',
   'Sequences', 'S. Karim', 'published', now() - interval '16 days', 10, 'Design a five-step outreach sequence that books meetings.'),
  ('Mail Privacy Protection ruined open rates (here is what to use instead)', 'mail-privacy-protection-and-open-rates',
   'Pixel inflation is only half the story. A practical framework for measuring what your emails really do.',
   E'Apple''s Mail Privacy Protection pre-fetches images, which inflates open rates for a large share of your list. Treating opens as truth will mislead you.\n\n## What to trust instead\n\n- Replies: the only metric that directly pays the bills.\n- Clicks: useful when your offer includes a link.\n- Bounces: a hard signal about list quality.\n\n## What opens are still good for\n\nDirectional comparison between two subject lines sent to similar audiences — never as an absolute number.',
   'Analytics', 'T. Ahmed', 'published', now() - interval '2 days', 7, 'How to measure outreach after open tracking became unreliable.'),
  ('SPF, DKIM and DMARC without the headache: a checklist', 'sending-domain-checklist',
   'The three records that decide whether you land in the inbox, explained in plain language with real examples.',
   E'Authentication is not optional if you want reliable delivery.\n\n## SPF\n\nLists the servers allowed to send for your domain. Keep it to one include per provider to stay under the 10-lookup limit.\n\n## DKIM\n\nA cryptographic signature that proves the message was not altered. Publish the selector your provider gives you.\n\n## DMARC\n\nTells receivers what to do when SPF and DKIM fail. Start with p=none and a reporting address, then tighten to quarantine.\n\n## Verification\n\nOUTRIKAA shows verified only after a real DNS lookup succeeds — never before.',
   'Deliverability', 'S. Karim', 'published', now() - interval '8 days', 9, 'A plain-language checklist for SPF, DKIM and DMARC records.'),
  ('Writing AI-assisted copy that still sounds like you', 'ai-cold-email-without-sounding-ai',
   'AI drafts are a starting point, not a final email. Here is the edit pass that makes the difference.',
   E'Most AI-written outreach fails for the same reason: it is fluent and specific about nothing.\n\n## Use AI for structure, not claims\n\nLet it handle pacing, grammar and alternative phrasings. Never let it invent statistics, customer names or promises.\n\n## The edit pass\n\n1. Add one true detail only you would know.\n2. Cut every sentence that could appear in any other email.\n3. Read it aloud; if it sounds like a press release, shorten it.\n4. Make the ask concrete: a time, a link, a single question.\n\n## Where it pays off\n\nRewrites, subject line variants and follow-up angles — the places where volume of options beats volume of output.',
   'Copywriting', 'N. Islam', 'published', now() - interval '1 day', 6, 'How to keep AI-assisted outreach sounding human.')
ON CONFLICT (slug) DO NOTHING;
