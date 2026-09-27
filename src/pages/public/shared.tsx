import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { Section, Eyebrow, SectionTitle, FadeIn, CTA, CheckList, FeatureCard } from './marketing';

export function PageHero({
  eyebrow,
  title,
  sub,
  actions = true,
  badge,
}: {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  actions?: boolean;
  badge?: ReactNode;
}) {
  return (
    <section className="relative pt-16 sm:pt-20 pb-12 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary-600/20 blur-[130px]" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <Eyebrow icon={<span className="h-1 w-1 rounded-full bg-current" />}>{eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={70}>
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
            {title}
          </h1>
        </FadeIn>
        <FadeIn delay={140}>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">{sub}</p>
        </FadeIn>
        {actions && (
          <FadeIn delay={210}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>Start free</Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">View pricing</Button>
              </Link>
            </div>
          </FadeIn>
        )}
        {badge && <div className="mt-6">{badge}</div>}
      </div>
    </section>
  );
}

export function FeatureBlocks({
  items,
}: {
  items: { icon: ReactNode; title: string; desc: string }[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f, i) => (
        <FadeIn key={f.title} delay={i * 60}>
          <FeatureCard icon={f.icon} title={f.title}>
            {f.desc}
          </FeatureCard>
        </FadeIn>
      ))}
    </div>
  );
}

export function SplitSection({
  eyebrow,
  title,
  sub,
  bullets,
  reverse,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  bullets: string[];
  reverse?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cnGrid(reverse)}>
      <FadeIn>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">{title}</h2>
        <p className="mt-4 text-slate-400 leading-relaxed">{sub}</p>
        <CheckList className="mt-6" items={bullets} />
      </FadeIn>
      <FadeIn delay={100}>
        {children ?? (
          <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6 shadow-2xl">
            <div className="space-y-3">
              {bullets.slice(0, 4).map((b, i) => (
                <div key={b} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <span className="h-6 w-6 grid place-items-center rounded-lg bg-primary-500/20 text-primary-300 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-300">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  );
}

function cnGrid(reverse?: boolean) {
  return `grid lg:grid-cols-2 gap-10 items-center ${reverse ? '' : ''}`;
}

export function StepsSection({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-4">
      {steps.map((s, i) => (
        <FadeIn key={s.title} delay={i * 80}>
          <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6">
            <span className="h-9 w-9 grid place-items-center rounded-xl bg-gradient-brand text-white text-sm font-bold">
              {i + 1}
            </span>
            <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

export function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="max-w-3xl mx-auto divide-y divide-white/8 border-y border-white/8">
      {items.map((f, i) => (
        <details key={f.q} className="group py-5" open={i === 0}>
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
            <span className="text-base font-medium text-white">{f.q}</span>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/12 text-slate-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}

export { Section, SectionTitle, FadeIn, CTA, Eyebrow, CheckList };
