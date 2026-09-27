import { useEffect, useState } from 'react';
import { MapPin, Clock, Users, Heart, Rocket, Coffee, GraduationCap, Send, Check } from 'lucide-react';
import { Button, Badge, Input, Select, Textarea } from '@/components/ui';
import { PageHero, Section, SectionTitle, FadeIn, CTA, FeatureBlocks } from './shared';

interface Role {
  title: string;
  team: string;
  location: string;
  type: string;
  about: string;
}

const roles: Role[] = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote (UTC−3 to UTC+7)',
    type: 'Full-time',
    about: 'Own features end to end across React, TypeScript and Postgres. You will work on sending pipelines, analytics and the API.',
  },
  {
    title: 'Deliverability Specialist',
    team: 'Infrastructure',
    location: 'Remote',
    type: 'Full-time',
    about: 'Keep customer mailboxes landing in the inbox: authentication guidance, reputation monitoring and provider relationships.',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote',
    type: 'Full-time',
    about: 'Design dense, workflow-heavy screens that stay clear — sequences, tables, dashboards and onboarding.',
  },
  {
    title: 'Customer Success Engineer',
    team: 'Success',
    location: 'Remote (APAC hours)',
    type: 'Full-time',
    about: 'Help teams go from import to first meetings, and turn recurring friction into product improvements.',
  },
  {
    title: 'Technical Writer (Contract)',
    team: 'Docs',
    location: 'Remote',
    type: 'Contract',
    about: 'Turn complex workflows into docs people actually read. Deliverability and API experience a plus.',
  },
];

const benefits = [
  { icon: <Rocket className="h-5 w-5" />, title: 'Real ownership', desc: 'Small team, big surface area — your work ships and users feel it immediately.' },
  { icon: <Clock className="h-5 w-5" />, title: 'Flexible hours', desc: 'Async-first with overlap windows. Outcomes matter more than seat time.' },
  { icon: <GraduationCap className="h-5 w-5" />, title: 'Learning budget', desc: 'Annual budget for courses, books and conferences.' },
  { icon: <Heart className="h-5 w-5" />, title: 'Health & wellness', desc: 'Health coverage support and generous paid time off.' },
  { icon: <Coffee className="h-5 w-5" />, title: 'Home office', desc: 'One-time setup budget plus the hardware you need to do your best work.' },
  { icon: <Users className="h-5 w-5" />, title: 'Team retreats', desc: 'Twice a year we meet in person to build, plan and eat too well.' },
];

const values = [
  'Default to writing things down',
  'Ship small, learn fast',
  'Tell users the truth, especially when it is inconvenient',
  'Protect the customer before protecting the roadmap',
];

export default function Careers() {
  useEffect(() => {
    document.title = 'Careers — OUTRIKAA';
  }, []);

  const [openRole, setOpenRole] = useState<Role | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setApplied(true);
    }, 900);
  };

  return (
    <div>
      <PageHero
        eyebrow="Careers"
        title={<>Build outreach <span className="gradient-text">worth receiving</span></>}
        sub="We are a small, remote team building the outreach platform we wished we had. If that sounds like fun, keep reading."
        badge={<Badge tone="primary">{roles.length} open roles</Badge>}
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <FadeIn>
            <SectionTitle sub="How we work, in plain terms.">
              Life at OUTRIKAA
            </SectionTitle>
            <p className="mt-5 text-slate-400 leading-relaxed">
              We are deliberately small. Everyone talks to customers, everyone ships, and nobody hides behind process.
              Most communication happens in writing, which means good docs and clear decisions are a superpower here.
            </p>
            <ul className="mt-6 space-y-3">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check className="h-4 w-4 text-success-400 shrink-0 mt-0.5" />
                  {v}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="rounded-3xl border border-white/10 bg-base-card/60 p-6 sm:p-8">
              <h3 className="text-base font-semibold text-white">Hiring process</h3>
              <div className="mt-5 space-y-3">
                {[
                  ['Apply', 'Send a short note and your work — links beat attachments.'],
                  ['Intro call', '30 minutes with the hiring manager about your background.'],
                  ['Practical exercise', 'A scoped, paid task that mirrors the actual role.'],
                  ['Team chat', 'Meet two or three people you would work with daily.'],
                  ['Offer', 'Transparent scope, compensation band and start date.'],
                ].map(([t, d], i) => (
                  <div key={t} className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                    <span className="h-7 w-7 grid place-items-center rounded-lg bg-primary-500/20 text-primary-300 text-[11px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-white">{t}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{d}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="If one of these is you, we should talk.">
          Open roles
        </SectionTitle>
        <div className="mt-10 max-w-3xl mx-auto space-y-4">
          {roles.map((r, i) => (
            <FadeIn key={r.title} delay={i * 50}>
              <div className="rounded-2xl border border-white/10 bg-base-card/60 p-6 hover:border-primary-500/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">{r.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.team}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.location}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.type}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">{r.about}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setOpenRole(r); setApplied(false); }}>
                    Apply
                  </Button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="What every role includes.">
          Benefits
        </SectionTitle>
        <div className="mt-10">
          <FeatureBlocks items={benefits} />
        </div>
      </Section>

      {openRole && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpenRole(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-white/12 bg-base-bg-secondary p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {applied ? (
              <div className="text-center py-8">
                <span className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-success-500/15 border border-success-500/30 text-success-300">
                  <Check className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-white">Application received</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Thanks for your interest in {openRole.title}. We review every application and will be in touch.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setOpenRole(null)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{openRole.title}</h3>
                    <p className="text-[12px] text-slate-500 mt-1">{openRole.team} · {openRole.location}</p>
                  </div>
                  <button onClick={() => setOpenRole(null)} className="text-slate-500 hover:text-white text-xl leading-none" aria-label="Close">
                    ×
                  </button>
                </div>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] text-slate-400 mb-1.5">Name</label>
                      <Input required placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-[13px] text-slate-400 mb-1.5">Email</label>
                      <Input required type="email" placeholder="you@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] text-slate-400 mb-1.5">Portfolio / LinkedIn / GitHub</label>
                    <Input required placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-[13px] text-slate-400 mb-1.5">Location & timezone</label>
                    <Select defaultValue="">
                      <option value="" disabled>Select…</option>
                      <option>Asia (UTC+4 to UTC+9)</option>
                      <option>Europe / Africa (UTC−1 to UTC+4)</option>
                      <option>Americas (UTC−8 to UTC−3)</option>
                      <option>Other</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-slate-400 mb-1.5">Why this role?</label>
                    <Textarea rows={5} required placeholder="A few sentences is plenty." />
                  </div>
                  <Button type="submit" loading={loading} className="w-full" rightIcon={<Send className="h-4 w-4" />}>
                    Submit application
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Section className="pb-24">
        <CTA title="Don't see your role?" sub="We are always glad to meet good people — send a note and tell us what you would build." primary="Contact us" primaryTo="/contact" secondary="About us" secondaryTo="/about" />
      </Section>
    </div>
  );
}
