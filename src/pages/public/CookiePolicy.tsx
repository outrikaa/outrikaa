import { LegalLayout } from './legal';

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      eyebrow="Legal"
      updated="September 2026"
      intro="This policy explains the cookies and similar technologies OUTRIKAA uses, why they exist and how you can control them."
      sections={[
        {
          heading: 'What cookies are',
          body: [
            'Cookies are small text files placed on your device by a website. They let a site remember your session, preferences and actions between requests.',
            'We also use local storage, which works similarly but is stored by your browser rather than sent back to us with every request.',
          ],
        },
        {
          heading: 'Strictly necessary',
          body: [
            'Session cookie: keeps you signed in as you navigate the application. Without it you would be logged out on every page.',
            'Authentication tokens: stored locally so the app can restore your session securely after a refresh.',
            'CSRF protection: used to verify that requests genuinely come from the app.',
            'These cannot be switched off because the service does not function without them.',
          ],
        },
        {
          heading: 'Preferences',
          body: [
            'Theme preference (dark or light) is stored in your browser\'s local storage so the interface looks the way you left it.',
            'Dismissed banners and similar UI choices are remembered to avoid showing you the same notice repeatedly.',
          ],
        },
        {
          heading: 'Analytics',
          body: [
            'We use first-party, privacy-respecting analytics to understand which pages are useful and where users struggle. Where a third-party analytics provider is used, it is configured to minimise data collection.',
            'Analytics data is aggregated and does not identify you personally by name.',
          ],
        },
        {
          heading: 'Marketing and advertising',
          body: [
            'We do not run third-party advertising trackers on outrikaa.com. If this changes, we will update this policy and, where required, ask for consent first.',
          ],
        },
        {
          heading: 'Managing cookies',
          body: [
            'You can block or delete cookies through your browser settings. Blocking strictly necessary cookies will prevent you from staying signed in to the application.',
            'Most browsers let you clear site data for a single domain: open site settings for outrikaa.com and remove stored data.',
            'Because we do not use advertising cookies, there is no advertising opt-out to configure.',
          ],
        },
        {
          heading: 'Changes and contact',
          body: [
            'We will update this page when our use of cookies changes, and revise the date above accordingly.',
            'Questions: privacy@outrikaa.com.',
          ],
        },
      ]}
    />
  );
}
