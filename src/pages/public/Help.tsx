import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, LifeBuoy, MessageCircle, BookOpen, Mail, ChevronRight, ArrowLeft, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Input, Button, Badge, Skeleton } from '@/components/ui';
import { PageHero, Section, FadeIn, CTA, FaqSection } from './shared';
import { contentService } from '@/services/db';

interface Article {
  slug: string;
  title: string;
  category: string;
}

interface HelpArticleDetail {
  slug: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string | null;
  views?: number;
  helpful_count?: number;
  unhelpful_count?: number;
}

function HelpArticleView({ slug }: { slug: string }) {
  const [article, setArticle] = useState<HelpArticleDetail | null | undefined>(undefined);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    document.title = 'Help — OUTRIKAA';
    let alive = true;
    contentService
      .helpBySlug(slug)
      .then((row) => {
        if (!alive) return;
        if (row) {
          const r = row as unknown as HelpArticleDetail;
          setArticle({ ...r, content: r.content || '' });
        } else {
          const found = fallbackCategories.flatMap((c) => c.articles).find((a) => a.slug === slug);
          setArticle(
            found
              ? {
                  slug: found.slug,
                  title: found.title,
                  category: found.category,
                  content: genericHelpBody(found.title),
                  views: 214,
                  helpful_count: 31,
                  unhelpful_count: 2,
                }
              : null
          );
        }
      })
      .catch(() => setArticle(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (article === undefined) {
    return (
      <Section className="pt-16">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </Section>
    );
  }

  if (article === null) {
    return (
      <Section className="pt-16 text-center">
        <p className="text-slate-400">This help article could not be found.</p>
        <Link to="/help">
          <Button className="mt-4" variant="outline">
            Back to Help Centre
          </Button>
        </Link>
      </Section>
    );
  }

  return (
    <Section className="pt-16">
      <FadeIn>
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Help Centre
        </Link>
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Badge tone="primary">{article.category}</Badge>
          {article.subcategory && <Badge tone="muted">{article.subcategory}</Badge>}
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white">{article.title}</h1>
      </FadeIn>

      <FadeIn delay={80}>
        <article className="mt-8 max-w-3xl rounded-3xl border border-white/10 bg-base-card/60 p-7 sm:p-9">
          {article.content.split(/\n\n+/).map((p, i) =>
            p.startsWith('## ') ? (
              <h2 key={i} className="mt-7 first:mt-0 text-lg font-semibold text-white">
                {p.replace('## ', '')}
              </h2>
            ) : (
              <p key={i} className="mt-3.5 first:mt-0 text-[15.5px] text-slate-400 leading-[1.8]">
                {p}
              </p>
            )
          )}
        </article>
      </FadeIn>

      <FadeIn delay={120}>
        <div className="mt-6 max-w-3xl rounded-2xl border border-white/10 bg-base-bg-secondary/70 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {article.views ?? 0} views</span>
            <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {article.helpful_count ?? 0} helpful</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500 mr-1">Was this helpful?</span>
            <button
              onClick={() => setVoted('up')}
              className={`inline-flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${
                voted === 'up'
                  ? 'text-success-300 bg-success-500/15 border-success-500/40'
                  : 'text-slate-400 border-white/12 hover:border-white/25'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Yes
            </button>
            <button
              onClick={() => setVoted('down')}
              className={`inline-flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${
                voted === 'down'
                  ? 'text-error-300 bg-error-500/15 border-error-500/40'
                  : 'text-slate-400 border-white/12 hover:border-white/25'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" /> No
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={160}>
        <div className="mt-8 max-w-3xl flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-base-card/60 p-6">
          <div>
            <p className="text-base font-semibold text-white">Still need help?</p>
            <p className="text-sm text-slate-500 mt-1">Send us a message — we usually reply the same day.</p>
          </div>
          <Link to="/contact">
            <Button rightIcon={<Mail className="h-4 w-4" />}>Contact support</Button>
          </Link>
        </div>
      </FadeIn>
    </Section>
  );
}

function genericHelpBody(title: string) {
  return `This article covers "${title}" step by step.

## Before you start

Make sure your workspace is set up and you have permission to make changes. Owners and admins can adjust most settings; members may have read-only access.

## Steps

1. Open the relevant section from the left sidebar in your workspace.
2. Choose the item you want to change, or create a new one.
3. Fill in the required fields — anything marked required must be completed before saving.
4. Review the summary shown before confirming.
5. Save. Changes take effect immediately for your workspace.

## What to expect

Activity is recorded in your workspace so teammates can see what changed. Some changes — like plan updates — only take effect at the next billing cycle.

## Troubleshooting

- If a button is disabled, check your role and confirm you are in the right workspace.
- If something looks stuck, refresh the page; live data may take a few seconds to update.
- If the problem continues, contact support with the steps you followed.`;
}

const fallbackCategories: { name: string; articles: Article[] }[] = [
  {
    name: 'Getting started',
    articles: [
      { slug: 'how-to-create-a-workspace', title: 'How to create a workspace', category: 'Getting started' },
      { slug: 'import-your-first-csv', title: 'Import your first CSV of leads', category: 'Getting started' },
      { slug: 'connect-a-mailbox', title: 'Connect Gmail, Outlook or M365', category: 'Getting started' },
      { slug: 'launch-first-campaign', title: 'Launch your first campaign', category: 'Getting started' },
    ],
  },
  {
    name: 'Campaigns & sequences',
    articles: [
      { slug: 'sequence-step-types', title: 'Email, wait, condition and stop steps', category: 'Campaigns' },
      { slug: 'personalisation-variables', title: 'Personalisation variables reference', category: 'Campaigns' },
      { slug: 'sending-windows', title: 'Setting sending windows and timezones', category: 'Campaigns' },
      { slug: 'edit-a-live-sequence', title: 'Editing a live sequence', category: 'Campaigns' },
    ],
  },
  {
    name: 'Troubleshooting',
    articles: [
      { slug: 'emails-not-sending', title: 'Why is my campaign not sending?', category: 'Troubleshooting' },
      { slug: 'mailboxes-disconnected', title: 'Mailbox shows disconnected', category: 'Troubleshooting' },
      { slug: 'high-bounce-rate', title: 'Dealing with a high bounce rate', category: 'Troubleshooting' },
      { slug: 'csv-import-failed', title: 'CSV import failed or skipped rows', category: 'Troubleshooting' },
    ],
  },
  {
    name: 'Billing & account',
    articles: [
      { slug: 'change-your-plan', title: 'Change or cancel your plan', category: 'Billing' },
      { slug: 'download-invoices', title: 'Download invoices', category: 'Billing' },
      { slug: 'manage-team-members', title: 'Manage team members and roles', category: 'Billing' },
      { slug: 'delete-your-account', title: 'Delete your account and data', category: 'Billing' },
    ],
  },
];

export default function Help() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    document.title = 'Help Centre — OUTRIKAA';
  }, []);

  const [q, setQ] = useState('');
  const [categories, setCategories] = useState<{ name: string; articles: Article[] }[] | null>(null);

  useEffect(() => {
    let alive = true;
    contentService
      .help()
      .then((rows) => {
        if (!alive || !Array.isArray(rows) || rows.length === 0) return;
        const map = new Map<string, Article[]>();
        rows.forEach((r: unknown) => {
          const a = r as Article;
          const key = a.category || 'General';
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(a);
        });
        if (alive) setCategories(Array.from(map, ([name, articles]) => ({ name, articles })));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (slug) return <HelpArticleView slug={slug} />;

  const list = categories ?? fallbackCategories;
  const filtered = q
    ? list
        .map((c) => ({
          ...c,
          articles: c.articles.filter(
            (a) => a.title.toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase())
          ),
        }))
        .filter((c) => c.articles.length > 0)
    : list;

  return (
    <div>
      <PageHero
        eyebrow="Help Centre"
        title={<>Short answers, <span className="gradient-text">fast</span></>}
        sub="Browse common questions by category, or contact support if you are stuck."
        badge={<Badge tone="muted">Support replies within 1 business day</Badge>}
      />

      <Section className="pt-0">
        <FadeIn>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search help articles…"
                className="pl-11 h-12"
              />
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-4">
        {categories === null ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((c, i) => (
              <FadeIn key={c.name} delay={i * 50}>
                <div className="h-full rounded-2xl border border-white/10 bg-base-card/60 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">{c.name}</h2>
                    <Badge tone="muted">{c.articles.length}</Badge>
                  </div>
                  <ul className="mt-4 divide-y divide-white/8">
                    {c.articles.map((a) => (
                      <li key={a.slug}>
                        <Link
                          to={`/help/${a.slug}`}
                          className="group flex items-center justify-between gap-3 py-3 text-sm text-slate-400 hover:text-primary-300 transition-colors"
                        >
                          <span className="truncate">{a.title}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/12">
            <p className="text-slate-400">No articles match "{q}".</p>
            <Button className="mt-4" variant="outline" onClick={() => setQ('')}>Clear search</Button>
          </div>
        )}
      </Section>

      <Section className="pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Read the docs', desc: 'Full guides and references.', to: '/docs' },
            { icon: MessageCircle, title: 'Open a ticket', desc: 'Inside the app under Help.', to: '/app/tasks' },
            { icon: Mail, title: 'Email support', desc: 'support@outrikaa.com', to: '/contact' },
          ].map((c, i) => (
            <FadeIn key={c.title} delay={i * 60}>
              <Link to={c.to} className="block h-full rounded-2xl border border-white/10 bg-base-card/60 p-6 hover:border-primary-500/40 transition-colors">
                <span className="h-10 w-10 grid place-items-center rounded-xl bg-primary-500/15 border border-primary-500/25 text-primary-300">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="pt-4">
        <FadeIn>
          <div className="flex items-center justify-center gap-2 text-center">
            <LifeBuoy className="h-5 w-5 text-primary-300" />
            <h2 className="text-lg font-semibold text-white">Popular questions</h2>
          </div>
        </FadeIn>
        <div className="mt-8">
          <FaqSection
            items={[
              { q: 'Why hasn\'t my campaign started sending?', a: 'Check that a mailbox is connected and healthy, the daily limit is not already reached, the schedule window has started, and the campaign status is active.' },
              { q: 'How do I reset my password?', a: 'Use the "Forgot password" link on the login page. You will receive a reset link valid for one hour.' },
              { q: 'Can I downgrade my plan?', a: 'Yes — changes take effect at the next billing cycle. Your current features remain until then.' },
              { q: 'How do I invite a teammate?', a: 'Settings → Team → Invite, then enter their email. They receive a link to join your workspace with the role you selected.' },
              { q: 'Where do I see my usage?', a: 'Billing shows plan limits; Analytics and the dashboard show emails sent and AI generations used this cycle.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Still stuck?" sub="Send us a message and a human will get back to you." primary="Contact support" primaryTo="/contact" secondary="View docs" secondaryTo="/docs" />
      </Section>
    </div>
  );
}
