import { useEffect } from 'react';
import { Sparkles, Wand2, Minimize2, Maximize2, UserPlus, Type, Save, Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { PageHero, FeatureBlocks, SplitSection, FaqSection, CTA, Section, SectionTitle, FadeIn, StepsSection } from './shared';

export default function AIEmailWriter() {
  useEffect(() => {
    document.title = 'AI Email Writer — OUTRIKAA';
  }, []);

  const sample = `Hi Jane,

I noticed Acme's team doubled headcount this quarter — usually that's when
spreadsheet-based outreach starts breaking.

OUTRIKAA keeps the list, the copy and the replies in one workflow, so your
team sends fewer, better emails instead of stitching tools together.

Worth a quick 15 minutes?`;

  return (
    <div>
      <PageHero
        eyebrow="AI email writer"
        title={<>Cold emails that sound like <span className="gradient-text">you wrote them</span></>}
        sub="Describe your audience, offer and CTA. Get first drafts, rewrites and subject lines in seconds — then drop them straight into a sequence."
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeIn>
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 h-11 border-b border-white/8 bg-white/[0.03]">
                <span className="flex items-center gap-2 text-[12px] text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-primary-400" /> AI Writer
                </span>
                <Badge tone="success">generated in 1.2s</Badge>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['Audience', 'B2B sales leaders'], ['Industry', 'SaaS'], ['Tone', 'Professional'], ['CTA', '15-minute call']].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/4 border border-white/8 px-3 py-2">
                      <p className="text-[10px] text-slate-600">{k}</p>
                      <p className="text-[12px] text-slate-300 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-primary-500/25 bg-primary-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-primary-300 mb-2">Output</p>
                  <pre className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{sample}</pre>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Copy', 'Shorten', 'Rewrite', 'Save as template'].map((a) => (
                    <span key={a} className="text-[11px] px-2.5 py-1 rounded-lg border border-white/12 bg-white/5 text-slate-400">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <SectionTitle sub="The copilot takes your inputs and returns copy you can actually send.">
              From blank page to send-ready in one click
            </SectionTitle>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Every generation is grounded in what you tell it: audience, industry, value proposition, call to action and
              tone. Rewrite the parts you don't like, or ask for a shorter, longer or more persuasive version.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[['Generate', Wand2], ['Rewrite', Sparkles], ['Shorten', Minimize2], ['Expand', Maximize2], ['Personalize', UserPlus], ['Subject lines', Type]].map(([l, I]) => {
                const Icon = I as typeof Wand2;
                return (
                  <span key={l as string} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-primary-400" /> {l as string}
                  </span>
                );
              })}
            </div>
            <Button className="mt-7" size="lg" rightIcon={<Sparkles className="h-4 w-4" />} onClick={() => (window.location.href = '/signup')}>
              Try it free
            </Button>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Everything the writer can do inside your workspace.">
            Capabilities
          </SectionTitle>
        </FadeIn>
        <div className="mt-12">
          <FeatureBlocks
            items={[
              { icon: <Wand2 className="h-5 w-5" />, title: 'Generate from scratch', desc: 'Give it audience, value prop and CTA — get a complete first-touch email in seconds.' },
              { icon: <Sparkles className="h-5 w-5" />, title: 'Rewrite & improve', desc: 'Paste existing copy and ask for a sharper, friendlier or more persuasive version.' },
              { icon: <Type className="h-5 w-5" />, title: 'Subject line variants', desc: 'Five subject lines ranked by style, ready to A/B test in your next campaign.' },
              { icon: <UserPlus className="h-5 w-5" />, title: 'Personalisation', desc: 'Weave in lead name, company and role so every message reads like a 1:1 note.' },
              { icon: <Minimize2 className="h-5 w-5" />, title: 'Shorten & expand', desc: 'Cold emails perform better short. Expand when you need to add context.' },
              { icon: <Save className="h-5 w-5" />, title: 'Save as template', desc: 'One click stores the copy in your library with tags, ready to reuse in any sequence.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <SplitSection
          eyebrow="Workflow"
          title="Draft, refine, drop into a sequence"
          sub="The writer lives inside your workspace, so the output goes straight where it will be sent."
          bullets={[
            'Pick the audience and offer context',
            'Generate or paste your draft',
            'Refine with rewrite / shorten / expand',
            'Copy or save to the template library',
            'Insert into any sequence step',
          ]}
          reverse
        >
          <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6">
            <div className="space-y-2.5">
              {['1. Inputs filled', '2. Copy generated', '3. Subject lines picked', '4. Saved as template', '5. Inserted into sequence'].map((s, i) => (
                <div key={s} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-success-500/20 text-success-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-slate-300">{s}</span>
                  {i === 4 && <span className="ml-auto text-[11px] text-primary-300">done</span>}
                </div>
              ))}
            </div>
          </div>
        </SplitSection>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="How the writer fits into your week.">
            Three steps
          </SectionTitle>
        </FadeIn>
        <div className="mt-12">
          <StepsSection
            steps={[
              { title: 'Describe once', desc: 'Audience, product, value proposition, CTA and tone — saved as context.' },
              { title: 'Generate and refine', desc: 'Ask for a new angle, a shorter version or five subject lines.' },
              { title: 'Send and learn', desc: 'Drop it in a sequence and let reply data tell you if it worked.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="What teams ask before they start.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'Does the AI know my product?', a: 'It uses the audience, product, value proposition and CTA you provide. The more specific the inputs, the sharper the output.' },
              { q: 'Can I edit what it writes?', a: 'Always. The output opens in an editable field — rewrite, shorten or expand until it sounds like you.' },
              { q: 'Are generations counted against my plan?', a: 'Yes, each generation counts toward your monthly AI allowance. Limits are shown in Billing.' },
              { q: 'Where is my API key stored?', a: 'AI calls run through a server-side function. Provider keys never reach the browser.' },
              { q: 'Can I save outputs as templates?', a: 'Yes — one click stores the copy in your template library with tags for reuse.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Write your next campaign with AI" sub="Start free — your first 100 generations are on us." primary="Start free" secondary="See examples" secondaryTo="/features" />
      </Section>
    </div>
  );
}
