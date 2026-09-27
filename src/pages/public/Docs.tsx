import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Rocket, Users, Send, Workflow, BarChart3, Settings, Shield, Terminal, Webhook } from 'lucide-react';
import { Input, Badge, Button } from '@/components/ui';
import { PageHero, Section, FadeIn, CTA } from './shared';

interface DocGroup {
  title: string;
  icon: typeof Rocket;
  items: { title: string; desc: string }[];
}

const groups: DocGroup[] = [
  {
    title: 'Getting started',
    icon: Rocket,
    items: [
      { title: 'Create your workspace', desc: 'Sign up, name your workspace and finish onboarding.' },
      { title: 'Import your first list', desc: 'CSV upload, column mapping, validation and dedupe.' },
      { title: 'Connect a mailbox', desc: 'Gmail, Google Workspace, Outlook or Microsoft 365 via OAuth.' },
      { title: 'Launch a campaign', desc: 'Pick a list, write copy, build the sequence and schedule sends.' },
    ],
  },
  {
    title: 'Leads & lists',
    icon: Users,
    items: [
      { title: 'Required CSV columns', desc: 'email is required; everything else maps optionally.' },
      { title: 'Lists vs tags', desc: 'Lists segment a lead once; tags layer multiple attributes.' },
      { title: 'Custom fields', desc: 'Store extra attributes for personalisation variables.' },
      { title: 'Statuses explained', desc: 'new, contacted, opened, replied, meeting, bounced, unsubscribed.' },
    ],
  },
  {
    title: 'Campaigns & sequences',
    icon: Workflow,
    items: [
      { title: 'Sequence steps', desc: 'Email, wait, condition and stop — what each one does.' },
      { title: 'Personalisation variables', desc: '{{first_name}}, {{company}}, {{custom.*}} syntax.' },
      { title: 'Sending windows', desc: 'Working days, start/end hours and timezone handling.' },
      { title: 'Stop-on-reply', desc: 'How sequences pause automatically when a lead responds.' },
    ],
  },
  {
    title: 'Sending & deliverability',
    icon: Send,
    items: [
      { title: 'Daily limits', desc: 'Per-mailbox caps and why conservative defaults matter.' },
      { title: 'SPF, DKIM & DMARC', desc: 'Records to publish and how we verify them.' },
      { title: 'Bounces & suppression', desc: 'Hard bounce handling and the suppression list.' },
      { title: 'Unsubscribe compliance', desc: 'Automatic footer and lead status updates.' },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    items: [
      { title: 'Reading your dashboard', desc: 'Sent, delivered, opened, clicked, replied, bounced.' },
      { title: 'Campaign performance', desc: 'Comparing campaigns by open and reply rate.' },
      { title: 'Mailbox health', desc: 'Per-sender scores and what triggers warnings.' },
      { title: 'Exporting data', desc: 'CSV export of series, leads and campaign views.' },
    ],
  },
  {
    title: 'API & webhooks',
    icon: Terminal,
    items: [
      { title: 'API keys', desc: 'Create and revoke keys from Settings → API keys.' },
      { title: 'Authentication', desc: 'Bearer token usage and rate limits.' },
      { title: 'Core endpoints', desc: 'Leads, campaigns and messages resources.' },
      { title: 'Webhooks (coming soon)', desc: 'Push sent/opened/clicked/replied events to your endpoint.' },
    ],
  },
  {
    title: 'Security & admin',
    icon: Shield,
    items: [
      { title: 'Roles & permissions', desc: 'Owner, admin and member access levels.' },
      { title: 'Row Level Security', desc: 'How workspace data stays isolated at the database.' },
      { title: 'Audit logs', desc: 'Who changed what, and when.' },
      { title: 'Data export & deletion', desc: 'Export your workspace or delete it entirely.' },
    ],
  },
  {
    title: 'Billing',
    icon: Settings,
    items: [
      { title: 'Plans & limits', desc: 'Starter, Growth and Scale feature comparison.' },
      { title: 'Usage records', desc: 'How emails and AI generations are counted.' },
      { title: 'Invoices', desc: 'Downloading invoices for every billing cycle.' },
      { title: 'Refund policy', desc: 'When refunds are available and how to request one.' },
    ],
  },
];

export default function Docs() {
  useEffect(() => {
    document.title = 'Documentation — OUTRIKAA';
  }, []);

  const [q, setQ] = useState('');
  const filtered = q
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              it.title.toLowerCase().includes(q.toLowerCase()) ||
              it.desc.toLowerCase().includes(q.toLowerCase()) ||
              g.title.toLowerCase().includes(q.toLowerCase())
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups;

  return (
    <div>
      <PageHero
        eyebrow="Documentation"
        title={<>Everything you need to <span className="gradient-text">get going</span></>}
        sub="Setup guides, feature references and troubleshooting — organised by the job you are trying to do."
        badge={<Badge tone="primary">v1.0</Badge>}
      />

      <Section className="pt-0">
        <FadeIn>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search docs — try 'CSV', 'DKIM' or 'sequence'…"
                className="pl-11 h-12"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {['CSV import', 'DKIM', 'sequence steps', 'API keys', 'refunds'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s.split(' ')[0])}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-500 hover:text-primary-300 hover:border-primary-500/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((g, i) => (
            <FadeIn key={g.title} delay={i * 40}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-300">
                    <g.icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-semibold text-white">{g.title}</h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {g.items.map((it) => (
                    <li key={it.title} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 hover:border-primary-500/30 transition-colors">
                      <p className="text-sm font-medium text-white">{it.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{it.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/12">
            <p className="text-slate-400">No docs match "{q}".</p>
            <Button className="mt-4" variant="outline" onClick={() => setQ('')}>Clear search</Button>
          </div>
        )}
      </Section>

      <Section className="pt-4 pb-24">
        <FadeIn>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary-500/10 to-accent-500/10 p-8 sm:p-10 text-center">
            <Webhook className="h-8 w-8 mx-auto text-primary-300" />
            <h2 className="mt-4 text-xl font-bold text-white">Can't find what you need?</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
              Check the Help Centre for short answers, or contact support and we will point you in the right direction.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/help"><Button variant="outline">Help Centre</Button></Link>
              <Link to="/contact"><Button>Contact support</Button></Link>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="pb-24 pt-0">
        <CTA title="Ready to put the docs to work?" sub="Create a free workspace — no card required." />
      </Section>
    </div>
  );
}
