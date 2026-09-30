import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Star, Sparkles, Zap } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20', className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-300">
      {icon}
      {children}
    </span>
  );
}

export function SectionTitle({ children, sub, center }: { children: ReactNode; sub?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-[1.15]">{children}</h2>
      {sub && <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">{sub}</p>}
    </div>
  );
}

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(18px)', transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.16,1,.3,1) ${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function CTA({ title, sub, primary = 'Start free', primaryTo = '/signup', secondary = 'See how it works', secondaryTo = '/features' }: {
  title: string;
  sub?: string;
  primary?: string;
  primaryTo?: string;
  secondary?: string;
  secondaryTo?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-base-bg-secondary p-8 sm:p-14 text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
      <div className="relative">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h2>
        {sub && <p className="mt-4 text-slate-400 max-w-xl mx-auto">{sub}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryTo}>
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>{primary}</Button>
          </Link>
          <Link to={secondaryTo}>
            <Button size="lg" variant="outline">{secondary}</Button>
          </Link>
        </div>
        <p className="mt-5 text-xs text-slate-500">14-day free trial · No credit card required · Cancel anytime</p>
      </div>
    </div>
  );
}

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
          <span className="mt-0.5 h-4 w-4 shrink-0 grid place-items-center rounded-full bg-success-500/15 text-success-400">
            <Check className="h-2.5 w-2.5" />
          </span>
          {i}
        </li>
      ))}
    </ul>
  );
}

export function Logos() {
  const names = ['Northwind', 'Lumen Labs', 'Vertex', 'Cloudpeak', 'Brightpath', 'Nimbus', 'Orbital', 'Kavara'];
  return (
    <div className="border-y border-white/8 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-600 mb-6">
          Trusted by revenue teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span key={n} className="text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-400 transition-colors tracking-tight">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 text-warning-400 fill-warning-400" />
      ))}
    </span>
  );
}

export function FeatureCard({ icon, title, children, to }: { icon: ReactNode; title: string; children: ReactNode; to?: string }) {
  const inner = (
    <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 transition-all hover:border-primary-500/40 hover:bg-base-card hover:-translate-y-0.5">
      <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary-500/15 border border-primary-500/25 text-primary-300 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400 mt-2 leading-relaxed">{children}</p>
      {to && (
        <span className="inline-flex items-center gap-1 mt-4 text-[13px] text-primary-400 group-hover:text-primary-300">
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
  return to ? <Link to={to} className="block h-full group">{inner}</Link> : <div className="h-full">{inner}</div>;
}

export function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
      <p className={cn('text-lg font-bold', tone ?? 'text-white')}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export function AISparkBadge() {
  return (
    <Badge tone="primary" className="gap-1">
      <Sparkles className="h-3 w-3" /> AI-native
    </Badge>
  );
}

export function PriceRow({ amount, period }: { amount: number; period: string }) {
  return (
    <div className="flex items-end gap-1.5">
      <span className="text-4xl font-bold text-white">${amount}</span>
      <span className="text-sm text-slate-500 mb-1.5">/ {period}</span>
    </div>
  );
}

export { Zap, Star, ArrowRight, Check, Sparkles };
