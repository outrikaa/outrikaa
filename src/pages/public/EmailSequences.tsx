import { useEffect } from 'react';
import { Mail, Clock, GitBranch, Square, CalendarClock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui';
import { PageHero, FeatureBlocks, SplitSection, FaqSection, CTA, Section, SectionTitle, FadeIn } from './shared';

export default function EmailSequences() {
  useEffect(() => {
    document.title = 'Email Sequences — OUTRIKAA';
  }, []);

  const steps = [
    { type: 'Email', label: 'Day 0 · Introduction', icon: Mail, tone: 'text-primary-300 border-primary-500/30 bg-primary-500/15' },
    { type: 'Wait', label: 'Wait 3 days', icon: Clock, tone: 'text-accent-300 border-accent-500/30 bg-accent-500/15' },
    { type: 'Condition', label: 'Opened previous email?', icon: GitBranch, tone: 'text-warning-300 border-warning-500/30 bg-warning-500/15' },
    { type: 'Email', label: 'Day 4 · Value follow-up', icon: Mail, tone: 'text-primary-300 border-primary-500/30 bg-primary-500/15' },
    { type: 'Wait', label: 'Wait 4 days', icon: Clock, tone: 'text-accent-300 border-accent-500/30 bg-accent-500/15' },
    { type: 'Email', label: 'Day 8 · Breakup email', icon: Mail, tone: 'text-primary-300 border-primary-500/30 bg-primary-500/15' },
    { type: 'Stop', label: 'Stop sequence', icon: Square, tone: 'text-error-300 border-error-500/30 bg-error-500/15' },
  ];

  return (
    <div>
      <PageHero
        eyebrow="Sequences"
        title={<>Follow-ups that run <span className="gradient-text">without reminders</span></>}
        sub="Build multi-step flows with emails, waits, conditions and stop rules — all respecting your sending window and mailbox limits."
        badge={<Badge tone="primary">Visual drag-friendly builder</Badge>}
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <FadeIn>
            <SectionTitle sub="Every sequence is a chain of steps. Add a step, set its timing, and the campaign does the rest.">
              The building blocks
            </SectionTitle>
            <div className="mt-8 space-y-3">
              {[
                { icon: Mail, title: 'Email', desc: 'Subject, preview text and body with {{variables}}, or start from a template.' },
                { icon: Clock, title: 'Wait', desc: 'Delay in days and hours before the next step fires.' },
                { icon: GitBranch, title: 'Condition', desc: 'Branch on opened, clicked, replied or not replied.' },
                { icon: Square, title: 'Stop', desc: 'End the sequence for that lead permanently.' },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-base-card/60 p-4">
                  <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-300 shrink-0">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{s.title}</span>
                    <span className="block text-sm text-slate-500 mt-1">{s.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-white">Example sequence</p>
                <Badge tone="muted">7 steps · 11 days</Badge>
              </div>
              <div className="flex flex-col items-center">
                {steps.map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center w-full">
                    <div className={`w-full sm:w-[320px] flex items-center gap-3 rounded-xl border px-4 py-3 bg-base-card/80 ${s.tone}`}>
                      <s.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium text-white flex-1 truncate">{s.label}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">{s.type}</span>
                    </div>
                    {i < steps.length - 1 && <span className="h-6 w-px bg-gradient-to-b from-primary-500/60 to-accent-500/40" />}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <CalendarClock className="h-5 w-5" />, title: 'Sending windows', desc: 'Choose working days, start and end hours so nothing goes out at 3am.' },
            { icon: <Globe className="h-5 w-5" />, title: 'Timezone aware', desc: 'Each campaign runs on the recipient-friendly timezone you pick.' },
            { icon: <Clock className="h-5 w-5" />, title: 'Per-step delays', desc: 'Days and hours per wait step — no global-only delays.' },
            { icon: <GitBranch className="h-5 w-5" />, title: 'Behaviour branching', desc: 'Send a different email to leads who opened vs those who ignored you.' },
            { icon: <Mail className="h-5 w-5" />, title: 'Template reuse', desc: 'Start any email step from a saved template with variables intact.' },
            { icon: <Square className="h-5 w-5" />, title: 'Auto stop on reply', desc: 'Stop the sequence the moment a lead responds — configurable per campaign.' },
          ]}
        />
      </Section>

      <Section className="pt-0">
        <SplitSection
          eyebrow="Safety"
          title="Protect your sender reputation by design"
          sub="Aggressive cadences burn domains. OUTRIKAA bakes in the guardrails that keep you landing in the inbox."
          bullets={[
            'Per-mailbox daily limits enforced before send',
            'Minimum delay between messages randomized',
            'Automatic stop when a lead replies or unsubscribes',
            'Bounced addresses added to the suppression list',
            'Unsubscribe footer appended when enabled',
          ]}
        />
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Common questions about sequences.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'How many steps can a sequence have?', a: 'As many as you need. Most teams run 3–6 emails over 10–14 days.' },
              { q: 'Can a lead be in more than one campaign?', a: 'Yes, but we recommend excluding leads already receiving emails to avoid double-sends.' },
              { q: 'What happens when someone replies?', a: 'The campaign stops that lead by default, moves them into the inbox and updates their status to replied.' },
              { q: 'Can I edit a live sequence?', a: 'Yes — edits apply to leads that have not yet reached that step. Completed steps are untouched.' },
              { q: 'Are weekends respected?', a: 'Yes. Choose sending days per campaign and steps only fire on those days.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Build your first sequence in minutes" sub="Drag in a few steps, set the delays and let it run." primary="Start free" secondary="See the builder" secondaryTo="/features" />
      </Section>
    </div>
  );
}
