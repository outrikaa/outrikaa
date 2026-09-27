import { useEffect, useState } from 'react';
import { Mail, MessageSquare, MapPin, Clock, Send, Check } from 'lucide-react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { PageHero, Section, SectionTitle, FadeIn, FaqSection, CTA } from './shared';

const offices = [
  { city: 'Dhaka', country: 'Bangladesh', detail: 'Engineering & product' },
  { city: 'Remote', country: 'Worldwide', detail: 'Sales & support' },
];

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact — OUTRIKAA';
  }, []);

  const [form, setForm] = useState({ name: '', email: '', topic: 'support', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  };

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title={<>Talk to a <span className="gradient-text">real person</span></>}
        sub="Support, sales or partnership — send a note and we'll get back to you, usually within one business day."
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          <FadeIn className="lg:col-span-3">
            <div className="rounded-2xl border border-white/12 bg-base-card/70 p-6 sm:p-8">
              {sent ? (
                <div className="text-center py-12">
                  <span className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-success-500/15 border border-success-500/30 text-success-300">
                    <Check className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-white">Message received</h3>
                  <p className="mt-2 text-sm text-slate-400">Thanks — we'll reply to {form.email || 'your email'} shortly.</p>
                  <Button className="mt-6" variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', topic: 'support', message: '' }); }}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] text-slate-400 mb-1.5">Name</label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-slate-400 mb-1.5">Email</label>
                      <Input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] text-slate-400 mb-1.5">Topic</label>
                    <Select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                      <option value="support">Support</option>
                      <option value="sales">Sales & pricing</option>
                      <option value="billing">Billing</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Something else</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-slate-400 mb-1.5">Message</label>
                    <Textarea
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you need…"
                    />
                  </div>
                  <Button type="submit" loading={loading} rightIcon={<Send className="h-4 w-4" />}>
                    Send message
                  </Button>
                </form>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={100} className="lg:col-span-2">
            <div className="space-y-4">
              {[
                { icon: Mail, title: 'Email', desc: 'hello@outrikaa.com', note: 'General enquiries' },
                { icon: MessageSquare, title: 'Support', desc: 'support@outrikaa.com', note: 'Existing customers' },
                { icon: Clock, title: 'Response time', desc: 'Within 1 business day', note: 'Usually much faster' },
              ].map((c) => (
                <div key={c.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-base-card/60 p-4">
                  <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-300 shrink-0">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-600">{c.title}</span>
                    <span className="block text-sm font-medium text-white mt-0.5">{c.desc}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{c.note}</span>
                  </span>
                </div>
              ))}
              <div className="rounded-xl border border-white/10 bg-base-card/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-600">
                  <MapPin className="h-3 w-3" /> Offices
                </span>
                <div className="mt-3 space-y-3">
                  {offices.map((o) => (
                    <div key={o.city}>
                      <p className="text-sm font-medium text-white">
                        {o.city} <span className="text-slate-500 font-normal">· {o.country}</span>
                      </p>
                      <p className="text-xs text-slate-500">{o.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle center sub="Before you write, maybe we already answered it.">
          Quick answers
        </SectionTitle>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'I need help with an existing account', a: 'Email support@outrikaa.com from the address on the account, or open a ticket from Help inside the app.' },
              { q: 'Do you offer demos?', a: 'Yes — mention "demo" in the topic and we will send a scheduling link.' },
              { q: 'Can I get an invoice or VAT receipt?', a: 'Invoices are available in Billing for every paid plan. Contact us for custom billing details.' },
              { q: 'Do you partner with agencies?', a: 'We do. Tell us about your agency in the partnership topic and we will follow up.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Prefer to explore first?" sub="Read the docs or browse the blog before reaching out." primary="View docs" primaryTo="/docs" secondary="Read the blog" secondaryTo="/blog" />
      </Section>
    </div>
  );
}
