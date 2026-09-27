import { LegalLayout } from './legal';

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      eyebrow="Legal"
      updated="September 2026"
      intro="These terms form a binding agreement between you (or the organisation you represent) and OUTRIKAA. By creating an account or using the service you agree to them."
      sections={[
        {
          heading: 'The service',
          body: [
            'OUTRIKAA provides tools for managing leads, writing outreach copy, sending scheduled email campaigns and analysing results. Features vary by plan and are described on our pricing page.',
            'We may modify the service to improve it, fix issues or comply with law. We will not materially reduce the core functionality you have paid for during a billing period.',
          ],
        },
        {
          heading: 'Accounts and eligibility',
          body: [
            'You must be at least 18 and able to enter into a contract. Provide accurate information and keep it up to date.',
            'You are responsible for all activity under your account and for keeping your credentials secure. Notify us immediately of any unauthorised use.',
            'One person may not hold multiple accounts to circumvent plan limits or trial restrictions.',
          ],
        },
        {
          heading: 'Acceptable use',
          body: [
            'You must comply with all applicable anti-spam laws, including CAN-SPAM, GDPR and CASL, wherever your recipients are located.',
            'Prohibited: sending unsolicited bulk email without a lawful basis, scraping, transmitting malware, impersonating others, attacking the service, reverse engineering, reselling access without permission, and storing unlawful content.',
            'We may suspend or terminate accounts that endanger deliverability, other users or the platform.',
          ],
        },
        {
          heading: 'Your content and leads',
          body: [
            'You retain all rights to the leads, copy, sequences and data you upload. You grant us only the licence needed to operate the service on your behalf — storing, processing and sending as you direct.',
            'You represent that you have the right to process the personal data you upload and to contact the people in your lists.',
            'We will not use your campaign content for marketing or train third-party models on it.',
          ],
        },
        {
          heading: 'Fees, billing and renewal',
          body: [
            'Paid plans are billed in advance monthly or annually and renew automatically until cancelled. Cancel any time from Billing; changes take effect at the end of the current period.',
            'Usage above plan limits may require an upgrade. We will tell you before charges apply.',
            'Prices may change with at least 30 days notice; changes apply from your next renewal.',
            'Fees are exclusive of taxes. Non-payment may result in suspension after written notice.',
          ],
        },
        {
          heading: 'Refunds',
          body: [
            'Refund eligibility is described in our Refund Policy, which forms part of these terms.',
          ],
        },
        {
          heading: 'Third-party services',
          body: [
            'Connecting Gmail, Outlook, SMTP or other providers means you also agree to those providers\' terms. We are not responsible for their acts or outages.',
          ],
        },
        {
          heading: 'Availability and disclaimers',
          body: [
            'The service is provided "as is" and "as available". We strive for high availability but do not guarantee uninterrupted or error-free operation.',
            'We do not warrant any particular outreach result — reply rates, meetings or revenue depend on your list, offer and execution.',
            'To the maximum extent permitted by law, all implied warranties are disclaimed.',
          ],
        },
        {
          heading: 'Limitation of liability',
          body: [
            'To the maximum extent permitted by law, neither party is liable for indirect, incidental, special, consequential or punitive damages, or lost profits, revenue or data.',
            'Our aggregate liability arising out of these terms is limited to the amount you paid us in the 12 months before the claim. Nothing limits liability that cannot be limited by law.',
          ],
        },
        {
          heading: 'Termination',
          body: [
            'You may stop using the service at any time and delete your workspace from Settings.',
            'We may suspend or terminate immediately for material breach, unlawful activity or risk to the platform, with notice where reasonable.',
            'On termination, your right to access ends. Data deletion follows our retention schedule; export your data before closing a workspace.',
          ],
        },
        {
          heading: 'Governing law and disputes',
          body: [
            'These terms are governed by the laws of Bangladesh, without regard to conflict-of-law rules. Courts of Dhaka have exclusive jurisdiction, subject to mandatory consumer protections in your country of residence.',
            'If a provision is unenforceable, the rest remains in effect. Failure to enforce a provision is not a waiver.',
          ],
        },
        {
          heading: 'Contact',
          body: ['Questions about these terms: legal@outrikaa.com.'],
        },
      ]}
    />
  );
}
