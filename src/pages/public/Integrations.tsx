import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { PageHero, FaqSection, CTA, Section, SectionTitle, FadeIn } from './shared';

const items = [
  { icon: '✉️', name: 'Gmail', desc: 'Send and sync from personal Google accounts via OAuth.', status: 'available' },
  { icon: '🏢', name: 'Google Workspace', desc: 'Organisational sending with admin consent and shared inboxes.', status: 'available' },
  { icon: '📨', name: 'Outlook', desc: 'Microsoft personal accounts through OAuth consent flow.', status: 'available' },
  { icon: '🪟', name: 'Microsoft 365', desc: 'Tenant-wide mailboxes using the Microsoft Graph API.', status: 'available' },
  { icon: '💬', name: 'Slack', desc: 'Push reply, bounce and campaign alerts into any channel.', status: 'soon' },
  { icon: '🗄️', name: 'CRM sync', desc: 'Two-way contact and activity sync with your CRM of record.', status: 'soon' },
  { icon: '🔗', name: 'Webhooks', desc: 'Stream sent, opened, clicked and replied events to your endpoint.', status: 'soon' },
  { icon: '🌐', name: 'Custom SMTP', desc: 'Any provider that speaks SMTP with app-specific credentials.', status: 'available' },
  { icon: '📊', name: 'Zapier', desc: 'Trigger thousands of apps from campaign and reply events.', status: 'soon' },
];

export default function Integrations() {
  useEffect(() => {
    document.title = 'Integrations — OUTRIKAA';
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Integrations"
        title={<>Connect OUTRIKAA to <span className="gradient-text">the rest of your stack</span></>}
        sub="Email providers work today. Slack, CRM and webhooks are coming — clearly labelled, never faked."
      />

      <Section className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <FadeIn key={it.name} delay={i * 50}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 hover:border-white/20 transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="h-11 w-11 grid place-items-center rounded-xl bg-white/6 border border-white/10 text-xl">
                    {it.icon}
                  </span>
                  <Badge tone={it.status === 'available' ? 'success' : 'muted'}>
                    {it.status === 'available' ? 'available' : 'coming soon'}
                  </Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{it.name}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1">{it.desc}</p>
                <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    {it.status === 'available' ? 'Requires OAuth credentials' : 'In development'}
                  </span>
                  {it.status === 'available' ? (
                    <Link to="/app/integrations">
                      <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Connect</Button>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="h-3 w-3" /> soon
                    </span>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="How the connection flow works.">
          Secure by default
        </SectionTitle>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { title: 'OAuth, not passwords', desc: 'Mailbox connections use provider OAuth consent flows. We never ask for or store your mailbox password.' },
            { title: 'Credentials stay server-side', desc: 'Tokens and provider keys live in edge functions and encrypted storage — never in browser code.' },
            { title: 'Honest status labels', desc: 'An integration shows "coming soon" until it genuinely works. No fake success states.' },
          ].map((s, i) => (
            <FadeIn key={s.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6">
                <span className="h-9 w-9 grid place-items-center rounded-lg bg-gradient-brand text-white text-sm font-bold">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Integration questions.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'Do I need a paid Google account?', a: 'Gmail personal accounts work for light volume. Google Workspace is recommended for teams that send at scale.' },
              { q: 'How many mailboxes can I connect?', a: 'Starter includes 2, Growth 10 and Scale unlimited. Each has its own limits and health score.' },
              { q: 'When will Slack and CRM ship?', a: 'They are on the roadmap and visible in the app as coming soon. We would rather label them honestly than ship a stub.' },
              { q: 'Is there an API?', a: 'API keys can be generated in Settings → API keys today; the public API surface is enabled on the Scale plan.' },
              { q: 'Can I self-host integrations?', a: 'Webhooks will let you push events to any endpoint you control — ideal for custom pipelines.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Connect your mailbox and start sending" sub="Gmail, Google Workspace, Outlook and Microsoft 365 supported today." />
      </Section>
    </div>
  );
}
