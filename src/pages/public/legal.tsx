import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CalendarDays } from 'lucide-react';
import { Section, FadeIn, CTA, Eyebrow } from './shared';

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalLayout({
  title,
  eyebrow,
  updated,
  intro,
  sections,
  children,
  cta = true,
}: {
  title: string;
  eyebrow: string;
  updated: string;
  intro: string;
  sections?: LegalSection[];
  children?: React.ReactNode;
  cta?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} — OUTRIKAA`;
  }, [title]);

  return (
    <div>
      <Section className="pt-16">
        <FadeIn>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Eyebrow>{eyebrow}</Eyebrow>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" /> Last updated {updated}
            </span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">{title}</h1>
          <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">{intro}</p>
        </FadeIn>
      </Section>

      <Section className="pt-4">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          <FadeIn className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-white/10 bg-base-card/60 p-5">
              <p className="text-[11px] uppercase tracking-wider text-slate-600 mb-3">On this page</p>
              <nav className="space-y-2">
                {(sections ?? []).map((s, i) => (
                  <a
                    key={s.heading}
                    href={`#s${i}`}
                    className="block text-sm text-slate-500 hover:text-primary-300 transition-colors"
                  >
                    {s.heading}
                  </a>
                ))}
              </nav>
              <div className="mt-5 pt-4 border-t border-white/8 flex items-center gap-2 text-[12px] text-slate-600">
                <ShieldCheck className="h-4 w-4 text-success-400" />
                Questions? <Link to="/contact" className="text-primary-300 hover:underline">Contact us</Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={80} className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-base-card/60 p-6 sm:p-9">
              {children}
              {(sections ?? []).map((s, i) => (
                <section key={s.heading} id={`s${i}`} className="scroll-mt-24">
                  <h2 className="mt-9 first:mt-0 text-xl font-semibold text-white">{s.heading}</h2>
                  {s.body.map((p, j) => (
                    <p key={j} className="mt-3 text-[15.5px] text-slate-400 leading-[1.8]">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>

      {cta && (
        <Section className="pb-24 pt-4">
          <CTA
            title="Questions about this page?"
            sub="We would rather over-explain than leave you guessing."
            primary="Contact us"
            primaryTo="/contact"
            secondary="Security overview"
            secondaryTo="/security"
          />
        </Section>
      )}
    </div>
  );
}
