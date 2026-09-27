import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft, Compass } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Section, FadeIn } from './shared';

const suggestions = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/features', label: 'Features', icon: Compass },
  { to: '/pricing', label: 'Pricing', icon: Compass },
  { to: '/docs', label: 'Documentation', icon: Search },
  { to: '/help', label: 'Help Centre', icon: Search },
  { to: '/contact', label: 'Contact support', icon: Compass },
];

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found — OUTRIKAA';
  }, []);

  return (
    <Section className="pt-16 pb-24 min-h-[70vh] flex items-center">
      <div className="w-full max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-7xl sm:text-8xl font-extrabold gradient-text leading-none">404</p>
          <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-white">This page went off-sequence</h1>
          <p className="mt-3 text-slate-400 leading-relaxed">
            The link may be broken, or the page has moved. Here are the paths that actually work.
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <form
            className="mt-8 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get('q');
              window.location.href = value ? `/docs?q=${encodeURIComponent(String(value))}` : '/docs';
            }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input name="q" placeholder="Search the docs…" className="pl-11 h-12" />
            </div>
          </form>
        </FadeIn>

        <FadeIn delay={140}>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map((s) => (
              <Link
                key={s.to + s.label}
                to={s.to}
                className="group rounded-xl border border-white/10 bg-base-card/60 px-4 py-3 text-sm text-slate-400 hover:text-white hover:border-primary-500/40 transition-colors"
              >
                <s.icon className="h-4 w-4 mx-auto mb-1.5 text-slate-500 group-hover:text-primary-300 transition-colors" />
                {s.label}
              </Link>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button rightIcon={<ArrowLeft className="h-4 w-4" />}>Back to home</Button>
            </Link>
            <Link to="/app">
              <Button variant="outline">Open the app</Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
