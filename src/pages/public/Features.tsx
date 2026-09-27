import { useEffect } from 'react';
import { Users, Wand2, Workflow, BarChart3, Shield, Mail, Inbox, Plug, Zap, Settings, Sparkles, Layers } from 'lucide-react';
import { PageHero, FeatureBlocks, SplitSection, StepsSection, CTA, Section, SectionTitle, FadeIn } from './shared';

export default function Features() {
  useEffect(() => {
    document.title = 'Features — OUTRIKAA';
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Product"
        title={<>Everything you need to run <span className="gradient-text">outbound</span></>}
        sub="Leads, copy, sequences, sending and analytics in one workspace — with AI woven through every step."
      />

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <Users className="h-5 w-5" />, title: 'Lead management', desc: 'CSV import with column detection, mapping, validation and duplicate handling. Lists, tags, bulk edit and full contact profiles.' },
            { icon: <Wand2 className="h-5 w-5" />, title: 'AI email writer', desc: 'Generate, rewrite, shorten, expand, improve and personalise. Subject line variants, tone control and one-click save to templates.' },
            { icon: <Workflow className="h-5 w-5" />, title: 'Sequence builder', desc: 'Email, wait, condition and stop steps with per-step delays, working days, sending hours and timezone awareness.' },
            { icon: <Mail className="h-5 w-5" />, title: 'Multi-mailbox sending', desc: 'Spread volume across Gmail, Google Workspace, Outlook and Microsoft 365 accounts with individual limits and health scores.' },
            { icon: <BarChart3 className="h-5 w-5" />, title: 'Analytics & insights', desc: 'Sent, delivered, opened, clicked, replied, positive, bounced and unsubscribed — broken down by campaign and mailbox.' },
            { icon: <Inbox className="h-5 w-5" />, title: 'Reply inbox', desc: 'Threads classified into positive, interested, not interested and follow-up with folders, archive and quick reply.' },
            { icon: <Shield className="h-5 w-5" />, title: 'Deliverability tools', desc: 'Suppression list, bounce handling, unsubscribe compliance, configurable limits and real DNS authentication checks.' },
            { icon: <Layers className="h-5 w-5" />, title: 'Templates library', desc: 'Save winning copy with tags and favourites. Reuse across sequences and campaigns with variable placeholders.' },
            { icon: <Plug className="h-5 w-5" />, title: 'Integrations', desc: 'Email providers natively, plus Slack, CRM and webhooks. Unconfigured integrations clearly show coming soon.' },
            { icon: <Settings className="h-5 w-5" />, title: 'Workspace settings', desc: 'Team roles enforced by row-level security, notification preferences, sending defaults, domains and API keys.' },
            { icon: <Sparkles className="h-5 w-5" />, title: 'AI insights', desc: 'Recommendations grounded in your actual metrics — reply rate vs benchmark, timing patterns and list health.' },
            { icon: <Zap className="h-5 w-5" />, title: 'Command menu', desc: 'Cmd/Ctrl + K anywhere to jump to any page or trigger actions without touching the mouse.' },
          ]}
        />
      </Section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <SplitSection
            eyebrow="Workflow"
            title="From list to booked meeting without switching tabs"
            sub="OUTRIKAA keeps the whole motion in one place so your team stops losing context between tools."
            bullets={[
              'Import and dedupe leads in seconds',
              'AI drafts the first touch in your tone',
              'Sequence handles the follow-ups',
              'Replies land in a classified inbox',
              'Analytics shows exactly what to change',
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Set up once, run every week.">
            How teams use OUTRIKAA
          </SectionTitle>
        </FadeIn>
        <div className="mt-12">
          <StepsSection
            steps={[
              { title: 'Define ICP', desc: 'Import a list or build one from your CRM export with tags and segments.' },
              { title: 'Write the angle', desc: 'Use the AI copilot to draft a first touch, two follow-ups and a breakup email.' },
              { title: 'Set the cadence', desc: 'Choose sending days, hours, timezone and a safe daily limit per mailbox.' },
              { title: 'Review and iterate', desc: 'Watch open and reply rates, then let the insights tell you what to test next.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="See every feature in your own workspace" sub="Start a free 14-day trial — no credit card required." />
      </Section>
    </div>
  );
}
