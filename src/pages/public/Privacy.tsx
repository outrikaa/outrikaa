import { LegalLayout } from './legal';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      eyebrow="Legal"
      updated="September 2026"
      intro="This policy explains what information OUTRIKAA collects, why we collect it, who we share it with, and the choices you have. It applies to our website, application and related services."
      sections={[
        {
          heading: 'Information we collect',
          body: [
            'Account information: name, email address, password hash, workspace name and role. Collected when you create an account or are invited to a workspace.',
            'Lead and campaign data: the contacts, lists, email copy, sequences and analytics you or your workspace create inside the product. This data belongs to your workspace.',
            'Mailbox connection data: provider identifiers, display names and OAuth tokens needed to send and sync email. We do not store your mailbox password.',
            'Technical data: IP address, browser type, device information and pages visited, collected through first-party analytics for security and product improvement.',
            'Billing data: plan, subscription status and invoice history. Payment card numbers are handled by our payment processor and never touch our servers.',
          ],
        },
        {
          heading: 'How we use information',
          body: [
            'To provide the service: send campaign email, sync replies, calculate analytics and generate AI copy on your behalf.',
            'To secure the product: detect abuse, spam and unauthorised access, and enforce rate limits.',
            'To support you: respond to tickets and investigate issues you report.',
            'To improve the product: aggregated, non-identifying analysis of feature usage and performance.',
            'We do not sell your personal information or your leads\' information, and we do not use your campaign content to train third-party AI models.',
          ],
        },
        {
          heading: 'Legal bases (EEA/UK users)',
          body: [
            'Contract: processing needed to deliver the service you signed up for.',
            'Legitimate interests: securing the platform, preventing fraud and improving core functionality, balanced against your rights.',
            'Consent: marketing emails and non-essential cookies, which you can withdraw at any time.',
          ],
        },
        {
          heading: 'Sharing and disclosure',
          body: [
            'Subprocessors: infrastructure, email delivery, analytics and payment providers acting under contract, listed on request.',
            'Legal requirements: when required by law, or to protect the rights, safety and property of OUTRIKAA, our users or the public.',
            'Business transfers: if OUTRIKAA is involved in a merger or acquisition, we will notify you before your information becomes subject to a different policy.',
          ],
        },
        {
          heading: 'Data retention',
          body: [
            'Workspace data is retained while your workspace is active. When a workspace is deleted, operational data is removed within 30 days and backups age out within a further 35 days.',
            'Billing records are retained for the period required by tax law.',
            'Security logs are retained for up to 12 months.',
          ],
        },
        {
          heading: 'Your rights and choices',
          body: [
            'Access, correction, export and deletion requests can be made from Settings or by contacting privacy@outrikaa.com.',
            'Workspace owners control lead and campaign data; if you are a contact in someone else\'s list, contact that workspace first, or us if unresolved.',
            'You can unsubscribe from any marketing email we send using the link in the footer.',
            'Cookie choices can be changed in your browser; see our Cookie Policy for details.',
          ],
        },
        {
          heading: 'Security',
          body: [
            'Data is encrypted in transit with TLS and at rest where the underlying service supports it.',
            'Access to production systems requires multi-factor authentication and is limited to engineers who need it.',
            'Row Level Security ensures workspace isolation at the database layer; API keys are stored hashed.',
            'No system is perfectly secure. If we become aware of a breach affecting you, we will notify you and the relevant authorities without undue delay.',
          ],
        },
        {
          heading: 'International transfers',
          body: [
            'We process data in the country where our infrastructure resides, which may be outside your own. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses.',
          ],
        },
        {
          heading: 'Children',
          body: ['OUTRIKAA is a business tool and is not directed at children under 16. We do not knowingly collect their information.'],
        },
        {
          heading: 'Changes and contact',
          body: [
            'We will post any material changes here and update the date at the top of this page. Continued use after a change means you accept the revised policy.',
            'Questions: privacy@outrikaa.com, or write to OUTRIKAA, Dhaka, Bangladesh.',
          ],
        },
      ]}
    />
  );
}
