import { useEffect } from 'react';
import { Heart, Zap, Shield, Users, Globe, Rocket } from 'lucide-react';
import { Section, SectionTitle, FadeIn, CTA, StepsSection } from './shared';
import { PageHero, FeatureBlocks } from './shared';

const team = [
  { name: 'A. Rahman', role: 'Founder & CEO', bio: 'Previously built outbound systems for a B2B SaaS with 40-person sales teams.' },
  { name: 'S. Karim', role: 'Head of Engineering', bio: 'Deliverability and messaging infrastructure specialist.' },
  { name: 'N. Islam', role: 'Product Design', bio: 'Focused on making complex workflows feel simple.' },
  { name: 'T. Ahmed', role: 'Customer Success', bio: 'Helps teams go from first import to first meeting.' },
];

export default function About() {
  useEffect(() => {
    document.title = 'About — OUTRIKAA';
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="About us"
        title={<>Outreach should feel <span className="gradient-text">human</span>, not spammy</>}
        sub="OUTRIKAA exists because outbound software got bloated, expensive and hard to trust. We are building the opposite."
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <FadeIn>
            <SectionTitle sub="The story behind OUTRIKAA.">
              Why we started
            </SectionTitle>
            <p className="mt-5 text-slate-400 leading-relaxed">
              We ran outbound for years and kept hitting the same wall: a dozen tools duct-taped together — a list tool,
              a writer, a sequencer, a mailbox manager and three spreadsheets. Everything was expensive, nothing talked to
              anything else, and reporting lived somewhere else entirely.
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              OUTRIKAA folds the whole workflow into one place: leads, copy, sequences, mailboxes, analytics and billing —
              with honest pricing and guardrails that protect your sender reputation instead of burning it.
            </p>
          </FadeIn>

          <FadeIn delay={100}>
            <SectionTitle sub="The principles that guide what we ship.">
              Our values
            </SectionTitle>
            <div className="mt-5 space-y-3">
              {[
                { icon: Heart, t: 'Human by default', d: 'Better to send 20 relevant emails than 200 that get ignored.' },
                { icon: Shield, t: 'Honest labels', d: 'We never claim verified, connected or delivered unless it really happened.' },
                { icon: Zap, t: 'Fast over fancy', d: 'Workflows that load quickly and stay out of your way.' },
                { icon: Users, t: 'Support that answers', d: 'Real people, clear answers — most tickets get a reply the same day.' },
              ].map((v) => (
                <div key={v.t} className="flex items-start gap-4 rounded-xl border border-white/10 bg-base-card/60 p-4">
                  <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-300 shrink-0">
                    <v.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{v.t}</span>
                    <span className="block text-sm text-slate-500 mt-1">{v.d}</span>
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="Where we are heading.">
          The road so far
        </SectionTitle>
        <div className="mt-12">
          <StepsSection
            steps={[
              { title: '2024 — First draft', desc: 'Started as an internal tool for running our own outbound campaigns.' },
              { title: '2025 — Private beta', desc: 'Fifty teams onboarded; sequences, AI writer and analytics took shape.' },
              { title: '2026 — Public launch', desc: 'Self-serve signup, public pricing and the admin platform you see today.' },
              { title: 'Next — Platform', desc: 'Public API, marketplace templates and deeper CRM integrations.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="A small team with a big inbox obsession.">
          The people behind OUTRIKAA
        </SectionTitle>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <FadeIn key={m.name} delay={i * 60}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 text-center hover:border-white/20 transition-colors">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-brand grid place-items-center text-lg font-bold text-white">
                  {m.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{m.name}</h3>
                <p className="text-[12px] text-primary-300 mt-1">{m.role}</p>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{m.bio}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <Globe className="h-5 w-5" />, title: 'Remote-first', desc: 'Distributed across time zones with async-first working habits.' },
            { icon: <Rocket className="h-5 w-5" />, title: 'Ship weekly', desc: 'Small, frequent releases over big-bang launches.' },
            { icon: <Shield className="h-5 w-5" />, title: 'Security-minded', desc: 'RLS on every table, least-privilege keys, server-side secrets.' },
            { icon: <Users className="h-5 w-5" />, title: 'Customer-led', desc: 'The roadmap is shaped by what teams actually ask for.' },
          ]}
        />
      </Section>

      <Section className="pb-24">
        <CTA title="Come build outreach worth receiving" sub="Join hundreds of teams already sending better email." secondary="Read the blog" secondaryTo="/blog" />
      </Section>
    </div>
  );
}
