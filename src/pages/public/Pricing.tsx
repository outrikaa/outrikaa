import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { Button, Badge, Tabs, Skeleton } from '@/components/ui';
import { PageHero, Section, SectionTitle, FadeIn, CTA, FaqSection } from './shared';
import { billingService } from '@/services/db';
import type { Plan } from '@/types';
import { formatPrice, cn } from '@/lib/utils';

const fallback: (Plan & { price: number })[] = [
  { name: 'Starter', description: 'For founders and solo sellers testing outbound.', price: 19, features: ['1,000 leads', '5,000 emails / month', '2 mailboxes', '1 sequence', 'AI writer (100 generations)', 'Basic analytics', 'Email support'], is_featured: false },
  { name: 'Growth', description: 'For teams running consistent outbound motions.', price: 59, features: ['10,000 leads', '50,000 emails / month', '10 mailboxes', 'Unlimited sequences', 'AI writer (1,000 generations)', 'Advanced analytics & insights', 'Unlimited templates', 'Priority support'], is_featured: true },
  { name: 'Scale', description: 'For multi-brand and agency operations.', price: 149, features: ['Unlimited leads', '250,000 emails / month', 'Unlimited mailboxes', 'Unlimited sequences', 'Unlimited AI generations', 'Custom sending domains', 'API access & webhooks', 'Dedicated success manager'], is_featured: false },
] as unknown as (Plan & { price: number })[];

const comparison: { feature: string; starter: string | boolean; growth: string | boolean; scale: string | boolean }[] = [
  { feature: 'Leads per workspace', starter: '1,000', growth: '10,000', scale: 'Unlimited' },
  { feature: 'Emails per month', starter: '5,000', growth: '50,000', scale: '250,000' },
  { feature: 'Connected mailboxes', starter: '2', growth: '10', scale: 'Unlimited' },
  { feature: 'Active campaigns', starter: '5', growth: '50', scale: 'Unlimited' },
  { feature: 'AI generations / month', starter: '100', growth: '1,000', scale: 'Unlimited' },
  { feature: 'Sequence builder', starter: true, growth: true, scale: true },
  { feature: 'Reply inbox & classification', starter: true, growth: true, scale: true },
  { feature: 'Advanced analytics', starter: false, growth: true, scale: true },
  { feature: 'Custom sending domains', starter: false, growth: false, scale: true },
  { feature: 'API access', starter: false, growth: false, scale: true },
  { feature: 'Webhooks', starter: false, growth: false, scale: true },
  { feature: 'Team roles (RLS enforced)', starter: true, growth: true, scale: true },
  { feature: 'Support', starter: 'Email', growth: 'Priority', scale: 'Dedicated' },
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes — every plan starts with a 14-day free trial and no credit card is required. You can cancel at any time during the trial.' },
  { q: 'What counts as an email?', a: 'Each outbound message sent from a connected mailbox counts as one email. Replies from leads and internal notes are never counted.' },
  { q: 'Do unused emails roll over?', a: 'No. Email allowances reset at the start of each billing period, so we recommend matching your plan to your monthly volume.' },
  { q: 'Can I change plans later?', a: 'Any time. Upgrades take effect immediately with prorated billing; downgrades take effect at the end of the current period.' },
  { q: 'What happens if I exceed a limit?', a: 'We pause new sends rather than overage-billing you, and you will see a clear prompt to upgrade. Nothing is deleted.' },
  { q: 'Do you offer refunds?', a: 'See our refund policy. Annual plans are refundable within 30 days of purchase if usage is under 10% of the allowance.' },
];

export default function Pricing() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<(Plan & { price?: number })[] | null>(null);

  useEffect(() => {
    document.title = 'Pricing — OUTRIKAA';
    billingService
      .plans()
      .then((rows) => {
        if (rows.length) setPlans(rows);
        else setPlans(fallback);
      })
      .catch(() => setPlans(fallback));
  }, []);

  const rows = (plans ?? fallback).map((p) => ({
    ...p,
    monthly: cycle === 'monthly' ? (p.monthly_price || p.price || 0) : (p.yearly_price || Math.round((p.price ?? 0) * 0.8)),
  }));

  return (
    <div>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple pricing that <span className="gradient-text">scales with you</span></>}
        sub="Start free for 14 days. Upgrade when your sending volume grows — never before."
        actions={false}
        badge={
          <Tabs
            tabs={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly −20%' }]}
            value={cycle}
            onChange={(v) => setCycle(v as 'monthly' | 'yearly')}
          />
        }
      />

      <Section className="pt-0">
        {plans === null ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {rows.map((p) => (
              <FadeIn key={p.id ?? p.name}>
                <div className={cn('relative h-full rounded-2xl border p-6 flex flex-col', p.is_featured ? 'border-primary-500/50 bg-base-card shadow-glow-sm' : 'border-white/10 bg-base-card/60')}>
                  {p.is_featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-brand text-[10px] font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1 min-h-[34px]">{p.description}</p>
                  <div className="mt-5 flex items-end gap-1.5">
                    <span className="text-4xl font-bold text-white">{formatPrice(p.monthly * 100)}</span>
                    <span className="text-sm text-slate-500 mb-1.5">/ month</span>
                  </div>
                  {cycle === 'yearly' && <p className="mt-1 text-[11px] text-success-400">billed annually</p>}
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.features?.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                        <Check className="h-4 w-4 text-success-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup" className="mt-6">
                    <Button className="w-full" variant={p.is_featured ? 'primary' : 'outline'}>
                      Start free trial
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Every plan includes the core outreach workflow.">
            Compare plans
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={80}>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500">Feature</th>
                  <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500">Starter</th>
                  <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-primary-300">Growth</th>
                  <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {comparison.map((c) => (
                  <tr key={c.feature} className="hover:bg-white/4">
                    <td className="px-5 py-3 text-sm text-slate-300">{c.feature}</td>
                    {(['starter', 'growth', 'scale'] as const).map((k) => (
                      <td key={k} className="px-5 py-3 text-sm">
                        {typeof c[k] === 'boolean' ? (
                          c[k] ? (
                            <Check className="h-4 w-4 text-success-400" />
                          ) : (
                            <Minus className="h-4 w-4 text-slate-600" />
                          )
                        ) : (
                          <span className="text-slate-300">{c[k] as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Straight answers about billing, limits and upgrades.">
            Frequently asked questions
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection items={faqs} />
        </div>
        <FadeIn delay={80}>
          <div className="mt-8 text-center">
            <Link to="/refund-policy">
              <Badge tone="muted">Read the refund policy</Badge>
            </Link>
          </div>
        </FadeIn>
      </Section>

      <Section className="pb-24">
        <CTA title="Try every feature free for 14 days" sub="No credit card. Cancel with one click." primary="Start free trial" secondary="Talk to sales" secondaryTo="/contact" />
      </Section>
    </div>
  );
}
