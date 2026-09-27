import { useEffect } from 'react';
import { Shield, Gauge, Mail, Ban, Globe, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui';
import { PageHero, FeatureBlocks, SplitSection, FaqSection, CTA, Section, SectionTitle, FadeIn } from './shared';

export default function Deliverability() {
  useEffect(() => {
    document.title = 'Email Deliverability — OUTRIKAA';
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Deliverability"
        title={<>Land in the inbox, <span className="gradient-text">not the spam folder</span></>}
        sub="Sending limits, authentication checks, suppression handling and mailbox health — the guardrails that keep outbound working."
        badge={<Badge tone="warning">Only claims verified after a real DNS check</Badge>}
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            { icon: Gauge, title: 'Volume guardrails', desc: 'Daily limits per mailbox with randomized minimum delays between sends.' },
            { icon: Shield, title: 'Authentication', desc: 'SPF, DKIM and DMARC status only shown as verified after a successful lookup.' },
            { icon: Ban, title: 'Suppression list', desc: 'Bounced and unsubscribed addresses are automatically excluded from future sends.' },
          ].map((s, i) => (
            <FadeIn key={s.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6">
                <span className="h-10 w-10 grid place-items-center rounded-xl bg-success-500/15 border border-success-500/25 text-success-300">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeIn>
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-white">Domain authentication</p>
                <Badge tone="muted">not checked</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { rec: 'SPF', lookup: 'v=spf1 include:_spf.google.com ~all' },
                  { rec: 'DKIM', lookup: 'selector=outrikaa._domainkey' },
                  { rec: 'DMARC', lookup: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@…' },
                ].map((r) => (
                  <div key={r.rec} className="rounded-xl border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{r.rec}</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <RefreshCw className="h-3 w-3" /> awaiting DNS check
                      </span>
                    </div>
                    <code className="block mt-2 text-[11px] text-slate-500 font-mono break-all">{r.lookup}</code>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning-500/25 bg-warning-500/5 p-3.5">
                <AlertTriangle className="h-4 w-4 text-warning-400 shrink-0 mt-0.5" />
                <p className="text-xs text-warning-200/80 leading-relaxed">
                  We never show "verified" until the record lookup actually succeeds.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <SectionTitle sub="Reputation is earned slowly and lost quickly. These defaults protect it.">
              Built-in reputation protection
            </SectionTitle>
            <ul className="mt-6 space-y-3">
              {[
                'Start conservative: 50 emails/day per mailbox by default',
                'Randomized delay between messages to mimic human sending',
                'Hard bounces suppress the address permanently',
                'Unsubscribe footer appended when the option is on',
                'Stop-on-reply prevents thread stretching',
                'Per-mailbox health score surfaced in Mailboxes',
                'Split volume across mailboxes instead of hammering one',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check className="h-4 w-4 text-success-400 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <Gauge className="h-5 w-5" />, title: 'Configurable limits', desc: 'Set daily caps per mailbox and campaign — enforced before a send is queued.' },
            { icon: <Ban className="h-5 w-5" />, title: 'Suppression & bounce list', desc: 'Every hard bounce and opt-out is excluded automatically from future campaigns.' },
            { icon: <Mail className="h-5 w-5" />, title: 'Unsubscribe compliance', desc: 'One-click opt-out footer on every campaign, plus unsubscribe status on the lead.' },
            { icon: <Globe className="h-5 w-5" />, title: 'Custom domains', desc: 'Authenticate your own sending domain (Scale plan) once DNS records are published.' },
            { icon: <RefreshCw className="h-5 w-5" />, title: 'Health monitoring', desc: 'Mailbox health score combines bounce rate, volume and connection status.' },
            { icon: <AlertTriangle className="h-5 w-5" />, title: 'Warnings that matter', desc: 'Clear alerts when bounce rate, volume or reply patterns drift outside safe ranges.' },
          ]}
        />
      </Section>

      <Section className="pt-0">
        <SplitSection
          eyebrow="Warm-up"
          title="Ramp up like a human, not a robot"
          sub="New mailboxes should not send 500 emails on day one. OUTRIKAA's defaults keep the ramp gentle."
          bullets={[
            'Begin at 20–50 emails/day and increase gradually',
            'Spread volume across several mailboxes',
            'Respect local sending hours and weekdays',
            'Watch bounce and reply rates before scaling',
            'Pause automatically when health degrades',
          ]}
        />
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Deliverability questions we hear constantly.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'Do you warm up mailboxes?', a: 'You control the ramp by setting conservative daily limits and raising them as health stays strong. Automated warm-up pools are on the roadmap.' },
              { q: 'How do you verify SPF/DKIM/DMARC?', a: 'A DNS lookup is performed against your domain. Status shows verified only when the record resolves and matches expectations.' },
              { q: 'What happens on a hard bounce?', a: 'The address is suppressed automatically so no future campaign can email it again.' },
              { q: 'Can leads unsubscribe?', a: 'Yes — when enabled, every campaign includes a compliant unsubscribe link and the lead status updates to unsubscribed.' },
              { q: 'Shared IPs or dedicated?', a: 'Sending happens from your connected mailboxes, so you control the reputation directly rather than sharing a pool.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Protect your reputation while you scale" sub="Start with safe defaults and raise limits as your health scores improve." />
      </Section>
    </div>
  );
}
