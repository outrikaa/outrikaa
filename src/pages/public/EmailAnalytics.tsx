import { useEffect } from 'react';
import { BarChart3, MousePointer, Reply, AlertTriangle, CalendarClock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';
import { PageHero, FeatureBlocks, SplitSection, FaqSection, CTA, Section, SectionTitle, FadeIn } from './shared';

export default function EmailAnalytics() {
  useEffect(() => {
    document.title = 'Email Analytics — OUTRIKAA';
  }, []);

  const bars = [46, 62, 54, 78, 70, 92, 84, 104, 96, 118, 110, 132];

  return (
    <div>
      <PageHero
        eyebrow="Analytics"
        title={<>Know exactly <span className="gradient-text">what's working</span></>}
        sub="Sent, delivered, opened, clicked, replied, bounced and unsubscribed — with campaign, mailbox and date breakdowns."
        badge={<Badge tone="success">7d / 30d / 90d filters</Badge>}
      />

      <Section className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Emails sent', value: '48,210', icon: BarChart3, note: 'last 30 days' },
            { label: 'Open rate', value: '58.4%', icon: MousePointer, note: '28,156 opens' },
            { label: 'Reply rate', value: '9.1%', icon: Reply, note: '4,387 replies' },
            { label: 'Bounce rate', value: '1.4%', icon: AlertTriangle, note: '675 bounced' },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 60}>
              <div className="rounded-2xl border border-white/10 bg-base-card/60 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-slate-500">{s.label}</p>
                  <s.icon className="h-4 w-4 text-primary-400/70" />
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-[11px] text-slate-600">{s.note}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200}>
          <div className="mt-5 rounded-2xl border border-white/10 bg-base-card/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-white">Daily sending volume</p>
              <div className="flex gap-2">
                {['7d', '30d', '90d'].map((d, i) => (
                  <span key={d} className={`text-[11px] px-2.5 py-1 rounded-lg border ${i === 1 ? 'text-primary-300 bg-primary-500/15 border-primary-500/30' : 'text-slate-500 border-white/10'}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 h-48">
              {bars.map((v, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary-600/60 to-primary-400 hover:from-primary-500 hover:to-primary-300 transition-colors" style={{ height: `${(v / 140) * 100}%` }} />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
              <span className="ml-auto">Peak: 132 sends</span>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <BarChart3 className="h-5 w-5" />, title: 'Full delivery funnel', desc: 'Sent, delivered, opened, clicked, replied, positive, bounced and unsubscribed in one view.' },
            { icon: <CalendarClock className="h-5 w-5" />, title: 'Date range filters', desc: 'Jump between 7, 30 and 90 day windows or export the daily series to CSV.' },
            { icon: <MousePointer className="h-5 w-5" />, title: 'Campaign comparison', desc: 'Rank campaigns by open and reply rate to see which angle lands.' },
            { icon: <Reply className="h-5 w-5" />, title: 'Mailbox performance', desc: 'Per-sender open, reply and bounce rates with health scoring.' },
            { icon: <AlertTriangle className="h-5 w-5" />, title: 'Bounce monitoring', desc: 'Spot list-quality problems before they hurt your domain reputation.' },
            { icon: <Sparkles className="h-5 w-5" />, title: 'AI insights', desc: 'Recommendations computed from your own numbers — never generic advice.' },
          ]}
        />
      </Section>

      <Section className="pt-0">
        <SplitSection
          eyebrow="Insights"
          title="Metrics are useless. Decisions aren't."
          sub="Every chart is paired with an interpretation so you know whether to keep going or change something."
          bullets={[
            'Reply rate compared against the 5–8% benchmark',
            'Bounce rate warnings when list quality slips',
            'Open rate signals when subject lines underperform',
            'Day-of-week patterns for your best send window',
            'Clear next action attached to every insight',
          ]}
          reverse
        >
          <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6 space-y-3">
            {[
              { t: 'Reply rate above benchmark', d: '9.1% vs a typical 5–8% for cold outreach.', c: 'border-success-500/25 bg-success-500/5' },
              { t: 'Bounce rate elevated', d: '3.2% of sends bounced — verify before scaling.', c: 'border-warning-500/25 bg-warning-500/5' },
              { t: 'Tuesdays perform best', d: 'Shift 20% of volume into Tue–Wed.', c: 'border-primary-500/25 bg-primary-500/5' },
            ].map((ins) => (
              <div key={ins.t} className={`rounded-xl border p-4 ${ins.c}`}>
                <p className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary-400" /> {ins.t}
                </p>
                <p className="text-xs text-slate-400 mt-1.5">{ins.d}</p>
              </div>
            ))}
          </div>
        </SplitSection>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Questions about measurement.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'How is open tracking implemented?', a: 'A 1×1 tracking pixel is embedded when track opens is enabled. Disable it per campaign if you prefer raw deliverability data.' },
              { q: 'Why is my open rate lower than expected?', a: 'Mail privacy protection pre-fetches images, which can inflate OR, while some clients block images entirely, which can deflate it. Trends matter more than absolutes.' },
              { q: 'Do you track link clicks?', a: 'Yes, when track clicks is enabled links are rewritten to measure clicks and attribute them to campaigns and leads.' },
              { q: 'Can I export the data?', a: 'Yes — export the daily series or any filtered lead and campaign view to CSV.' },
              { q: 'Where do insights come from?', a: 'They are computed from your workspace metrics compared against outreach benchmarks, not from third-party black boxes.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Measure what matters from day one" sub="Analytics are included on every plan." primary="Start free" secondary="See all features" secondaryTo="/features" />
      </Section>
    </div>
  );
}
