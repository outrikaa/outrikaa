import { LegalLayout } from './legal';

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      eyebrow="Legal"
      updated="September 2026"
      intro="We want you to be confident when you subscribe. This policy explains when refunds are available, how to request one, and what happens when you cancel."
      sections={[
        {
          heading: '14-day money-back guarantee',
          body: [
            'If you are a first-time subscriber and OUTRIKAA is not right for you, contact billing@outrikaa.com within 14 days of your first payment for a full refund of that payment.',
            'The guarantee applies once per customer. It covers your first subscription payment only — renewals and upgrades are handled under the rules below.',
          ],
        },
        {
          heading: 'Renewals',
          body: [
            'Subscriptions renew automatically unless cancelled before the renewal date. The renewal charge is not refundable once the new period begins, because you retain full access for that period.',
            'Cancel any time from Billing → Manage plan. Cancellation stops future charges; your workspace remains active until the end of the paid period.',
          ],
        },
        {
          heading: 'Upgrades, downgrades and credits',
          body: [
            'Upgrades take effect immediately and are prorated for the remainder of the billing period.',
            'Downgrades take effect at the next renewal. We do not refund the difference for unused time on a higher tier.',
            'If a feature is unavailable for a significant part of your billing period due to an outage on our side, we may apply account credit at our discretion.',
          ],
        },
        {
          heading: 'When we cannot refund',
          body: [
            'Requests made more than 14 days after the first payment (with no qualifying fault on our side).',
            'Change-of-mind cancellations after the guarantee window on a renewal charge.',
            'Partial periods where you continued to use the service after being notified of an issue.',
            'Accounts suspended for violating our Terms of Service.',
            'Fees already paid to third parties (for example payment processing) where refunding would be unlawful.',
          ],
        },
        {
          heading: 'How to request a refund',
          body: [
            'Email billing@outrikaa.com from the address on your account with: workspace name, the payment date and a brief reason for the request.',
            'We acknowledge requests within 2 business days and confirm the outcome within 5 business days.',
            'Approved refunds are issued to the original payment method; bank processing can take 5–10 business days to appear.',
          ],
        },
        {
          heading: 'Cancelling and your data',
          body: [
            'Cancelling does not delete your data. Export your leads, campaigns and analytics from Settings before closing the workspace.',
            'Once a workspace is deleted, data removal follows the retention schedule described in our Privacy Policy.',
          ],
        },
        {
          heading: 'Chargebacks',
          body: [
            'Please contact us before initiating a chargeback — most issues are resolved faster directly. Unwarranted chargebacks may result in account suspension while the dispute is open.',
          ],
        },
        {
          heading: 'Changes and contact',
          body: [
            'We may update this policy; the version in force is the one published on this page at the time of your payment.',
            'Refund questions: billing@outrikaa.com.',
          ],
        },
      ]}
    />
  );
}
