import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Users, Mail, Reply, CalendarCheck, TrendingUp,
  MousePointer, Wand2, Workflow, BarChart3, Shield, Check, Inbox, Send,
} from 'lucide-react';
import { Button, Badge, Tabs } from '@/components/ui';
import { Section, Eyebrow, SectionTitle, FadeIn, CTA, CheckList, Logos, Stars, FeatureCard } from './marketing';
import { cn, formatNumber } from '@/lib/utils';

const floating = [
  { icon: Users, label: 'New lead added', sub: 'jane@acme.com', tone: 'text-primary-300 bg-primary-500/15 border-primary-500/30', pos: 'top-[8%] left-[2%] animate-float', delay: '0s' },
  { icon: Sparkles, label: 'AI email generated', sub: 'Subject: quick question…', tone: 'text-accent-300 bg-accent-500/15 border-accent-500/30', pos: 'top-[4%] right-[4%] animate-float-delayed', delay: '1.2s' },
  { icon: Send, label: 'Campaign sending', sub: '48 / 120 today', tone: 'text-primary-300 bg-primary-500/15 border-primary-500/30', pos: 'bottom-[26%] left-[-2%] animate-float-slow', delay: '.6s' },
  { icon: Reply, label: 'Reply received', sub: '"Sounds interesting!"', tone: 'text-success-300 bg-success-500/15 border-success-500/30', pos: 'bottom-[8%] right-[2%] animate-float', delay: '2s' },
  { icon: TrendingUp, label: 'Open rate', sub: '62.4% this week', tone: 'text-warning-300 bg-warning-500/15 border-warning-500/30', pos: 'top-[46%] right-[-3%] animate-float-slow', delay: '1.6s' },
  { icon: CalendarCheck, label: 'Meeting booked', sub: 'Thu 3:30 PM', tone: 'text-success-300 bg-success-500/15 border-success-500/30', pos: 'bottom-[42%] left-[-4%] animate-float-delayed', delay: '.3s' },
];

const chartData = [28, 42, 36, 58, 47, 72, 65, 88, 74, 96, 85, 112];

export default function Home() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    document.title = 'OUTRIKAA — Turn Cold Leads Into Warm Conversations';
  }, []);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative pt-20 sm:pt-28 pb-16">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-primary-600/25 blur-[140px]" />
        <div className="absolute top-40 -left-32 h-72 w-72 rounded-full bg-accent-500/15 blur-[110px]" />
        <div className="absolute top-60 -right-24 h-72 w-72 rounded-full bg-secondary-500/15 blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            <div>
              <FadeIn>
                <Eyebrow icon={<Sparkles className="h-3 w-3" />}>AI-powered outreach platform</Eyebrow>
              </FadeIn>
              <FadeIn delay={80}>
                <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.05] text-white">
                  Turn cold leads into{' '}
                  <span className="gradient-text">warm conversations</span>
                </h1>
              </FadeIn>
              <FadeIn delay={160}>
                <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
                  Import leads, let the AI write your emails, automate multi-step sequences and watch every open, reply
                  and booking land in one place.
                </p>
              </FadeIn>
              <FadeIn delay={240}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/signup">
                    <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>Start free</Button>
                  </Link>
                  <Link to="/features">
                    <Button size="lg" variant="outline">See how it works</Button>
                  </Link>
                </div>
              </FadeIn>
              <FadeIn delay={320}>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success-400" /> 14-day free trial</span>
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success-400" /> No credit card</span>
                  <span className="flex items-center gap-1.5"><Stars /> 4.9/5 from 600+ teams</span>
                </div>
              </FadeIn>
            </div>

            {/* Floating cards + dashboard preview */}
            <div className="relative hidden lg:block h-[540px]">
              {floating.map((f) => (
                <div
                  key={f.label}
                  className={cn('absolute flex items-center gap-2.5 rounded-xl border bg-base-bg-secondary/90 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl', f.pos)}
                  style={{ animationDelay: f.delay }}
                >
                  <span className={cn('h-8 w-8 grid place-items-center rounded-lg border shrink-0', f.tone)}>
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-white whitespace-nowrap">{f.label}</span>
                    <span className="block text-[11px] text-slate-500 whitespace-nowrap">{f.sub}</span>
                  </span>
                </div>
              ))}

              <div className="absolute inset-x-8 top-16 bottom-16 rounded-2xl border border-white/12 bg-base-bg-secondary/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="h-9 border-b border-white/8 flex items-center gap-1.5 px-3.5 bg-white/[0.03]">
                  <span className="h-2.5 w-2.5 rounded-full bg-error-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
                  <span className="ml-3 text-[10px] text-slate-600">app.outrikaa.com/app</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      ['Leads', '2,481'],
                      ['Sent', '1,204'],
                      ['Open', '62%'],
                      ['Replies', '96'],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-lg bg-white/4 border border-white/8 p-2.5">
                        <p className="text-[10px] text-slate-500">{l}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-medium text-slate-400">Sending volume</p>
                      <Badge tone="success" dot>Live</Badge>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {chartData.map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary-600/70 to-primary-400/90 transition-all hover:from-primary-500 hover:to-primary-300"
                          style={{ height: `${(v / 120) * 100}%`, animation: `fadeInUp .5s ease ${i * 45}ms both` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {[
                      ['Jane Cooper · Acme Inc.', 'positive reply', 'success'],
                      ['Marcus Webb · Lumen', 'opened 3×', 'primary'],
                      ['Priya Nair · Vertex', 'meeting booked', 'success'],
                    ].map(([who, what, tone]) => (
                      <div key={who} className="flex items-center justify-between rounded-lg bg-white/4 border border-white/8 px-3 py-2">
                        <span className="text-[11px] text-slate-300 truncate">{who}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-md border',
                            tone === 'success' ? 'text-success-300 bg-success-500/15 border-success-500/30' : 'text-primary-300 bg-primary-500/15 border-primary-500/30'
                          )}
                        >
                          {what}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* mobile preview */}
          <div className="lg:hidden mt-10 rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-4">
            <div className="grid grid-cols-4 gap-2">
              {[['Leads', '2,481'], ['Sent', '1,204'], ['Open', '62%'], ['Replies', '96']].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-white/4 border border-white/8 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500">{l}</p>
                  <p className="text-sm font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-end gap-1.5 h-24">
              {chartData.map((v, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary-600/70 to-primary-400/90" style={{ height: `${(v / 120) * 100}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Logos />

      {/* PROBLEM */}
      <Section>
        <FadeIn>
          <SectionTitle center sub="Outbound breaks down when your tools don't talk to each other.">
            Cold outreach shouldn't feel this fragmented
          </SectionTitle>
        </FadeIn>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🗂️', title: 'Leads live in spreadsheets', desc: 'Lists get stale, duplicates creep in, and nobody knows which version is current.' },
            { icon: '✍️', title: 'Writing every email by hand', desc: 'First touches take 10 minutes each, so volume collapses after week one.' },
            { icon: '🔀', title: 'Sequences spread across tools', desc: 'Mail merge here, a CRM there, reminders in someone\'s head.' },
            { icon: '📉', title: 'No idea what\'s working', desc: 'Opens, replies and bounces scattered across five dashboards.' },
          ].map((p, i) => (
            <FadeIn key={p.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 hover:border-error-500/30 transition-colors">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="mt-4 text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* SOLUTION FLOW */}
      <Section className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
        <FadeIn>
          <SectionTitle center sub="Four steps from raw list to booked meeting.">
            One workflow, start to finish
          </SectionTitle>
        </FadeIn>
        <div className="mt-12 grid gap-5 md:grid-cols-4 relative">
          {[
            { icon: Users, title: '1. Import leads', desc: 'CSV upload with column detection, mapping, validation and duplicate handling.', to: '/lead-management' },
            { icon: Wand2, title: '2. Write with AI', desc: 'Describe your audience and offer — get subject lines and copy in your tone.', to: '/ai-email-writer' },
            { icon: Workflow, title: '3. Automate', desc: 'Visual sequences with waits, conditions and stop rules on your sending window.', to: '/email-sequences' },
            { icon: BarChart3, title: '4. Measure & iterate', desc: 'Open, reply, bounce and meeting metrics with AI-drawn insights.', to: '/email-analytics' },
          ].map((s, i) => (
            <FadeIn key={s.title} delay={i * 90}>
              <Link to={s.to} className="block h-full group">
                <div className="relative h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 transition-all hover:border-primary-500/40 hover:-translate-y-0.5">
                  <span className="h-11 w-11 grid place-items-center rounded-xl bg-gradient-brand text-white shadow-glow-sm">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white group-hover:text-primary-200 transition-colors">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  {i < 3 && (
                    <span className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-base-bg text-slate-500">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* AI COPILOT */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeIn>
            <Eyebrow icon={<Sparkles className="h-3 w-3" />}>AI copilot</Eyebrow>
            <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Your best writer, on call for every segment
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Give the copilot your audience, value proposition and CTA. It drafts, rewrites, shortens, expands and
              personalises — then drops straight into your sequence.
            </p>
            <CheckList
              className="mt-6"
              items={[
                'Generate, rewrite, improve, shorten and expand',
                'Subject line variants with one click',
                'Personalisation tokens for name, company and role',
                'Tone control: professional, friendly, casual, formal, persuasive',
                'Saved directly into your template library',
              ]}
            />
            <Link to="/ai-email-writer" className="inline-block mt-7">
              <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>Try the AI writer</Button>
            </Link>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 h-11 border-b border-white/8 bg-white/[0.03]">
                <span className="flex items-center gap-2 text-[12px] text-slate-400"><Sparkles className="h-3.5 w-3.5 text-primary-400" /> AI Writer</span>
                <Badge tone="primary">generate</Badge>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[['Audience', 'B2B sales leaders'], ['Tone', 'Professional']].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/4 border border-white/8 px-3 py-2">
                      <p className="text-[10px] text-slate-600">{k}</p>
                      <p className="text-[12px] text-slate-300 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-white/4 border border-white/8 px-3 py-2">
                  <p className="text-[10px] text-slate-600">Value proposition</p>
                  <p className="text-[12px] text-slate-300 mt-0.5">Cuts prospecting time in half while lifting reply rates 40%</p>
                </div>
                <div className="rounded-xl border border-primary-500/25 bg-primary-500/5 p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-primary-300 mb-2">Generated output</p>
                  <p className="text-[12.5px] text-slate-300 leading-relaxed">
                    Hi Jane,<br /><br />
                    I noticed Acme's team doubled headcount this quarter — usually that's when spreadsheet-based
                    outreach starts breaking. OUTRIKAA keeps the list, the copy and the replies in one workflow.<br /><br />
                    Worth a quick 15 minutes?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Copy</Button>
                  <Button size="sm" className="flex-1">Save as template</Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* LEAD TABLE PREVIEW */}
      <Section className="pt-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeIn className="order-2 lg:order-1">
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 h-11 border-b border-white/8 bg-white/[0.03]">
                <span className="text-[12px] text-slate-400">Leads · 2,481</span>
                <div className="flex gap-1.5">
                  <Badge tone="primary">all</Badge>
                  <Badge tone="muted">recent</Badge>
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Name', 'Company', 'Status', 'Score'].map((h) => (
                      <th key={h} className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {[
                    ['Jane Cooper', 'Acme Inc.', 'positive reply', 'success', 92],
                    ['Marcus Webb', 'Lumen Labs', 'opened', 'primary', 74],
                    ['Priya Nair', 'Vertex', 'meeting', 'success', 88],
                    ['Tom Fisher', 'Cloudpeak', 'contacted', 'muted', 61],
                    ['Ana Ruiz', 'Brightpath', 'bounced', 'error', 34],
                  ].map(([n, c, s, tone, score]) => (
                    <tr key={n as string} className="hover:bg-white/4">
                      <td className="px-4 py-2.5 text-[12.5px] text-white">{n}</td>
                      <td className="px-4 py-2.5 text-[12.5px] text-slate-400">{c}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border',
                          tone === 'success' ? 'text-success-300 bg-success-500/15 border-success-500/30' :
                          tone === 'primary' ? 'text-primary-300 bg-primary-500/15 border-primary-500/30' :
                          tone === 'error' ? 'text-error-300 bg-error-500/15 border-error-500/30' :
                          'text-slate-400 bg-white/8 border-white/10')}>
                          {s}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-14 rounded-full bg-white/8 overflow-hidden">
                            <span className="block h-full bg-primary-500" style={{ width: `${score}%` }} />
                          </span>
                          <span className="text-[11px] text-slate-500">{score}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>

          <FadeIn delay={100} className="order-1 lg:order-2">
            <Eyebrow icon={<Users className="h-3 w-3" />}>Lead management</Eyebrow>
            <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Every contact, clean and actionable
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Import with smart column mapping, dedupe on the way in, tag and segment, then watch status move from new
              to contacted to replied — automatically as events land.
            </p>
            <CheckList
              className="mt-6"
              items={[
                'CSV import with detect → map → validate → preview → result',
                'Duplicate and invalid email detection before insert',
                'Lists, tags, bulk edit and bulk delete',
                'Full lead profile with activity timeline',
                'Export back to CSV whenever you need it',
              ]}
            />
            <Link to="/lead-management" className="inline-block mt-7">
              <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>Explore lead management</Button>
            </Link>
          </FadeIn>
        </div>
      </Section>

      {/* SEQUENCE DIAGRAM */}
      <Section>
        <FadeIn>
          <SectionTitle center sub="Branch on behaviour, wait the right amount of time, stop when a lead replies.">
            Visual sequence builder
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={100}>
          <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-0">
              {[
                { type: 'Email', label: 'Day 0 · Intro email', icon: Mail, tone: 'text-primary-300 bg-primary-500/15 border-primary-500/30' },
                { type: 'Wait', label: 'Wait 3 days', icon: Check, tone: 'text-accent-300 bg-accent-500/15 border-accent-500/30' },
                { type: 'Condition', label: 'Did they open?', icon: Workflow, tone: 'text-warning-300 bg-warning-500/15 border-warning-500/30' },
                { type: 'Email', label: 'Day 4 · Value follow-up', icon: Mail, tone: 'text-primary-300 bg-primary-500/15 border-primary-500/30' },
                { type: 'Wait', label: 'Wait 4 days', icon: Check, tone: 'text-accent-300 bg-accent-500/15 border-accent-500/30' },
                { type: 'Email', label: 'Day 8 · Breakup email', icon: Mail, tone: 'text-primary-300 bg-primary-500/15 border-primary-500/30' },
                { type: 'Stop', label: 'Stop sequence', icon: Inbox, tone: 'text-error-300 bg-error-500/15 border-error-500/30' },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex flex-col items-center w-full">
                  <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 w-full sm:w-[340px] bg-base-card/80', s.tone)}>
                    <span className="grid place-items-center"><s.icon className="h-4 w-4" /></span>
                    <span className="text-sm font-medium text-white flex-1">{s.label}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">{s.type}</span>
                  </div>
                  {i < arr.length - 1 && <span className="h-7 w-px bg-gradient-to-b from-primary-500/60 to-accent-500/40" />}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ANALYTICS */}
      <Section className="pt-4">
        <FadeIn>
          <SectionTitle center sub="Real numbers from your own workspace — no vanity metrics.">
            Analytics that tell you what to do next
          </SectionTitle>
        </FadeIn>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Emails sent', value: formatNumber(48210), icon: Send, delta: '+18% MoM' },
            { label: 'Open rate', value: '58.4%', icon: MousePointer, delta: '+6.2 pts' },
            { label: 'Reply rate', value: '9.1%', icon: Reply, delta: 'above benchmark' },
            { label: 'Meetings booked', value: '312', icon: CalendarCheck, delta: '+41% MoM' },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 70}>
              <div className="rounded-2xl border border-white/10 bg-base-card/60 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-slate-500">{s.label}</p>
                  <s.icon className="h-4 w-4 text-primary-400/70" />
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-[11px] text-success-400">{s.delta}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={140}>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-base-card/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-white">Campaign performance</p>
                <Badge tone="muted">last 30 days</Badge>
              </div>
              <div className="flex items-end gap-2 h-40">
                {[42, 58, 47, 72, 65, 88, 74, 96, 85, 112, 98, 124, 116, 138].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-t bg-gradient-to-t from-primary-600/60 to-primary-400" style={{ height: `${(v / 140) * 150}px` }} />
                    <div className="w-full rounded-t bg-accent-500/50" style={{ height: `${(v / 140) * 45}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary-500" /> Sent</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent-500" /> Replied</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-base-card/60 p-6">
              <p className="text-sm font-semibold text-white mb-4">AI insights</p>
              <div className="space-y-3">
                {[
                  { t: 'Reply rate above benchmark', d: '9.1% vs 5–8% typical for cold outreach.', tone: 'border-success-500/25 bg-success-500/5' },
                  { t: 'Tuesdays perform best', d: 'Move 20% of your send window to Tue–Wed.', tone: 'border-primary-500/25 bg-primary-500/5' },
                  { t: 'Short subject lines win', d: 'Under 35 chars lifted opens by 11 pts.', tone: 'border-warning-500/25 bg-warning-500/5' },
                ].map((ins) => (
                  <div key={ins.t} className={cn('rounded-xl border p-3.5', ins.tone)}>
                    <p className="text-[13px] font-semibold text-white flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary-400" /> {ins.t}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{ins.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* FEATURES GRID */}
      <Section>
        <FadeIn>
          <SectionTitle center sub="Everything a lean revenue team needs — nothing it doesn't.">
            Built for outbound teams that move fast
          </SectionTitle>
        </FadeIn>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Users className="h-5 w-5" />, title: 'Lead management', desc: 'CSV import with mapping and dedupe, lists, tags, bulk actions and full profiles.', to: '/lead-management' },
            { icon: <Wand2 className="h-5 w-5" />, title: 'AI email writer', desc: 'Generate, rewrite and personalise copy with tone control and subject line variants.', to: '/ai-email-writer' },
            { icon: <Workflow className="h-5 w-5" />, title: 'Email sequences', desc: 'Drag-and-drop steps: email, wait, condition and stop on your sending schedule.', to: '/email-sequences' },
            { icon: <Mail className="h-5 w-5" />, title: 'Multiple mailboxes', desc: 'Spread volume across accounts with per-mailbox limits, windows and health scores.', to: '/deliverability' },
            { icon: <BarChart3 className="h-5 w-5" />, title: 'Email analytics', desc: 'Sent, delivered, opened, clicked, replied, bounced — with campaign and mailbox breakdowns.', to: '/email-analytics' },
            { icon: <Shield className="h-5 w-5" />, title: 'Deliverability first', desc: 'Warm-up friendly limits, suppression list, unsubscribe compliance and DNS checks.', to: '/deliverability' },
          ].map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <FeatureCard icon={f.icon} title={f.title} to={f.to}>
                {f.desc}
              </FeatureCard>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="pt-4">
        <FadeIn>
          <SectionTitle center sub="Real results from teams running outbound on OUTRIKAA.">
            Loved by lean revenue teams
          </SectionTitle>
        </FadeIn>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { q: 'We replaced three tools with OUTRIKAA. Reply rate went from 4% to 11% in six weeks.', n: 'Sarah Lindqvist', r: 'VP Sales, Cloudpeak', s: 5 },
            { q: 'The AI writer gets me 80% there in seconds. I spend my time editing strategy, not sentences.', n: 'Daniel Okafor', r: 'Founder, Brightpath', s: 5 },
            { q: 'Sequence builder plus the reply inbox means nothing falls through the cracks anymore.', n: 'Mei Tanaka', r: 'Head of Growth, Orbital', s: 5 },
          ].map((t, i) => (
            <FadeIn key={t.n} delay={i * 80}>
              <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 flex flex-col">
                <Stars count={t.s} />
                <p className="mt-4 text-[15px] text-slate-300 leading-relaxed flex-1">“{t.q}”</p>
                <div className="mt-5 pt-4 border-t border-white/8 flex items-center gap-3">
                  <span className="h-9 w-9 grid place-items-center rounded-lg bg-gradient-brand text-[11px] font-bold text-white">
                    {t.n.split(' ').map((p) => p[0]).join('')}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{t.n}</span>
                    <span className="block text-xs text-slate-500">{t.r}</span>
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* PRICING PREVIEW */}
      <Section className="pt-4">
        <FadeIn>
          <SectionTitle center sub="Simple pricing that scales with your sending volume.">
            Plans for every stage
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={80}>
          <div className="mt-8 flex justify-center">
            <Tabs
              tabs={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly −20%' }]}
              value={billing}
              onChange={(v) => setBilling(v as 'monthly' | 'yearly')}
            />
          </div>
        </FadeIn>
        <div className="mt-8 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            { name: 'Starter', desc: 'For founders and solo sellers testing outbound.', m: 19, y: 15, features: ['1,000 leads', '5,000 emails / mo', '2 mailboxes', 'AI writer (100 gens)', 'Basic analytics'], featured: false },
            { name: 'Growth', desc: 'For teams running consistent outbound motions.', m: 59, y: 47, features: ['10,000 leads', '50,000 emails / mo', '10 mailboxes', 'AI writer (1,000 gens)', 'Advanced analytics', 'Priority support'], featured: true },
            { name: 'Scale', desc: 'For multi-brand and agency operations.', m: 149, y: 119, features: ['Unlimited leads', '250,000 emails / mo', 'Unlimited mailboxes', 'AI writer (unlimited)', 'Custom domains & API', 'Dedicated success manager'], featured: false },
          ].map((p) => (
            <FadeIn key={p.name}>
              <div className={cn('relative h-full rounded-2xl border p-6 flex flex-col', p.featured ? 'border-primary-500/50 bg-base-card shadow-glow-sm' : 'border-white/10 bg-base-card/60')}>
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-brand text-[10px] font-bold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.desc}</p>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-4xl font-bold text-white">${billing === 'monthly' ? p.m : p.y}</span>
                  <span className="text-sm text-slate-500 mb-1.5">/ month</span>
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className="h-4 w-4 text-success-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-6">
                  <Button className="w-full" variant={p.featured ? 'primary' : 'outline'}>Start free trial</Button>
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={120}>
          <p className="mt-6 text-center text-sm text-slate-500">
            Full comparison on the <Link to="/pricing" className="text-primary-400 hover:text-primary-300">pricing page</Link>.
          </p>
        </FadeIn>
      </Section>

      {/* FINAL CTA */}
      <Section className="pb-24">
        <FadeIn>
          <CTA
            title="Ready to turn cold leads into warm conversations?"
            sub="Set up your workspace, import a list and send your first campaign today."
          />
        </FadeIn>
      </Section>
    </div>
  );
}
