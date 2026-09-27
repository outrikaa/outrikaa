import { LegalLayout } from './legal';
import { ShieldCheck, Lock, KeyRound, Database, Activity, UserCheck } from 'lucide-react';
import { Section, FeatureBlocks, FaqSection, SectionTitle, FadeIn } from './shared';

export default function Security() {
  return (
    <div>
      <LegalLayout
        title="Security"
        eyebrow="Trust"
        updated="September 2026"
        intro="OUTRIKAA handles contact data and sends email on your behalf. Security is not a feature we bolt on — it shapes how the whole system is built."
        cta={false}
        sections={[
          {
            heading: 'How data is protected',
            body: [
              'All traffic is encrypted in transit with TLS 1.2+. Data at rest is encrypted by the underlying managed database and storage services.',
              'Row Level Security is enabled on every table, so a query from a user session can only ever reach that user\'s workspace data — enforced inside the database, not just the application.',
              'Secrets such as provider API keys and OAuth tokens are stored server-side and never shipped to the browser.',
              'API keys are displayed once and stored hashed; you can revoke them at any time from Settings.',
            ],
          },
          {
            heading: 'Access control',
            body: [
              'Role-based access: owner, admin and member roles limit what each teammate can see and change.',
              'Administrative actions require an admin profile flag checked on every request path that touches admin data.',
              'Staff access to production systems is limited, logged and requires multi-factor authentication.',
              'Every sensitive administrative action is recorded in audit logs with actor, action and timestamp.',
            ],
          },
          {
            heading: 'Operational security',
            body: [
              'Dependencies are reviewed and updated; build-time type checking and linting gate every change.',
              'Rate limiting protects authentication and API endpoints from brute force and abuse.',
              'Backups are taken automatically by the managed database provider and retained on a rolling schedule.',
              'We monitor error rates and failed authentication attempts to detect unusual activity.',
            ],
          },
          {
            heading: 'Email-specific protections',
            body: [
              'Hard bounces add addresses to a permanent suppression list.',
              'Unsubscribe requests are honoured immediately across all campaigns in the workspace.',
              'Sending limits and randomized delays reduce the risk of reputation-damaging volume spikes.',
            ],
          },
          {
            heading: 'Responsible disclosure',
            body: [
              'If you believe you have found a vulnerability, email security@outrikaa.com with reproduction steps. Please do not publicise the issue before we have had a reasonable chance to address it.',
              'We aim to acknowledge reports within 3 business days and will keep you informed as we investigate.',
              'Good-faith research that follows these guidelines will not result in legal action from us.',
            ],
          },
        ]}
      />

      <Section className="pt-0">
        <SectionTitle center sub="The controls behind the policy.">
          At a glance
        </SectionTitle>
        <div className="mt-10">
          <FeatureBlocks
            items={[
              { icon: <Lock className="h-5 w-5" />, title: 'Encryption everywhere', desc: 'TLS in transit, encrypted storage at rest, hashed credentials.' },
              { icon: <Database className="h-5 w-5" />, title: 'RLS isolation', desc: 'Database-enforced workspace boundaries on every query.' },
              { icon: <KeyRound className="h-5 w-5" />, title: 'Server-side secrets', desc: 'Provider keys never reach the client; API keys shown once.' },
              { icon: <UserCheck className="h-5 w-5" />, title: 'RBAC', desc: 'Owner, admin and member roles with enforced admin gating.' },
              { icon: <Activity className="h-5 w-5" />, title: 'Audit trails', desc: 'Administrative actions logged with actor and timestamp.' },
              { icon: <ShieldCheck className="h-5 w-5" />, title: 'Responsible disclosure', desc: 'security@outrikaa.com — acknowledged within 3 business days.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-4">
        <FadeIn>
          <SectionTitle center sub="Security questions we get asked.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'Where is my data hosted?', a: 'On Supabase (Postgres) with infrastructure in the region configured for the project. Contact us for specifics relevant to your procurement process.' },
              { q: 'Do you train AI models on my data?', a: 'No. AI generations use the context you provide and are not retained for model training.' },
              { q: 'Can I export or delete my data?', a: 'Yes — export from Settings, delete your workspace from Settings → Security. Deletion completes within our retention schedule.' },
              { q: 'Do you support SSO?', a: 'SAML/OIDC single sign-on is planned for enterprise plans. Contact sales if you need it for rollout.' },
              { q: 'How do I report a vulnerability?', a: 'Email security@outrikaa.com with clear reproduction steps. We acknowledge within 3 business days.' },
            ]}
          />
        </div>
      </Section>
    </div>
  );
}
