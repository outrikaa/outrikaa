import { useState, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const nav = [
  {
    label: 'Product',
    items: [
      { to: '/features', label: 'Features', desc: 'Everything in one outreach platform' },
      { to: '/ai-email-writer', label: 'AI Email Writer', desc: 'Generate emails in seconds' },
      { to: '/email-sequences', label: 'Email Sequences', desc: 'Visual multi-step automation' },
      { to: '/lead-management', label: 'Lead Management', desc: 'Import, tag and segment' },
      { to: '/email-analytics', label: 'Email Analytics', desc: 'Opens, replies, conversions' },
      { to: '/deliverability', label: 'Deliverability', desc: 'Stay out of the spam folder' },
    ],
  },
  {
    label: 'Solutions',
    items: [
      { to: '/integrations', label: 'Integrations', desc: 'Gmail, Outlook, Slack and more' },
      { to: '/pricing', label: 'Pricing', desc: 'Plans that scale with you' },
      { to: '/security', label: 'Security', desc: 'How we protect your data' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/blog', label: 'Blog', desc: 'Outreach playbooks and research' },
      { to: '/docs', label: 'Docs', desc: 'Guides and API references' },
      { to: '/help', label: 'Help Center', desc: 'Searchable support articles' },
      { to: '/status', label: 'Status', desc: 'Platform uptime' },
    ],
  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMega(null);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong shadow-lg' : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((group) => (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => setMega(group.label)}
                  onMouseLeave={() => setMega(null)}
                >
                  <button
                    className={cn(
                      'inline-flex items-center gap-1 h-9 px-3 text-sm rounded-lg transition-colors',
                      mega === group.label ? 'text-white bg-white/8' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {group.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', mega === group.label && 'rotate-180')} />
                  </button>
                  {mega === group.label && (
                    <div className="absolute left-0 top-full pt-2 w-[340px] animate-fade-in-down">
                      <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/98 backdrop-blur-xl p-2 shadow-2xl">
                        {group.items.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="block px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors"
                          >
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  cn(
                    'h-9 px-3 text-sm rounded-lg inline-flex items-center transition-colors',
                    isActive ? 'text-white bg-white/8' : 'text-slate-400 hover:text-white'
                  )
                }
              >
                Pricing
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="hidden sm:grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {session ? (
              <Link to="/app" className="hidden sm:block">
                <Button size="sm">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/signup" className="hidden sm:block">
                  <Button size="sm">Get started free</Button>
                </Link>
              </>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/8"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass-strong border-t border-white/10 max-h-[80vh] overflow-y-auto animate-fade-in-down">
          <div className="px-4 py-4 space-y-4">
            {nav.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link key={item.to} to={item.to} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/8">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/pricing" className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/8">
              Pricing
            </Link>
            <div className="flex gap-2 pt-2 border-t border-white/10">
              {session ? (
                <Link to="/app" className="flex-1"><Button className="w-full">Go to dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button className="w-full">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const footerCols: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { to: '/features', label: 'Features' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/ai-email-writer', label: 'AI Email Writer' },
      { to: '/email-sequences', label: 'Email Sequences' },
      { to: '/lead-management', label: 'Lead Management' },
      { to: '/email-analytics', label: 'Email Analytics' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/blog', label: 'Blog' },
      { to: '/contact', label: 'Contact' },
      { to: '/careers', label: 'Careers' },
      { to: '/status', label: 'Status' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/docs', label: 'Documentation' },
      { to: '/help', label: 'Help Center' },
      { to: '/integrations', label: 'Integrations' },
      { to: '/deliverability', label: 'Deliverability' },
      { to: '/security', label: 'Security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/cookie-policy', label: 'Cookie Policy' },
      { to: '/refund-policy', label: 'Refund Policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-base-bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-slate-500 max-w-xs leading-relaxed">
              AI-powered email outreach and sales automation. Turn cold leads into warm conversations.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" /> All systems operational
              </span>
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-slate-500 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} OUTRIKAA. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built for revenue teams that move fast.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
