import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, Tag, User } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import { PageHero, Section, FadeIn, CTA } from './shared';
import { contentService } from '@/services/db';
import { format } from 'date-fns';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string;
  read_minutes: number;
}

interface PostRow {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  reading_time_min?: number | null;
}

const fallbackPosts: Post[] = [
  {
    slug: 'cold-email-benchmarks-2026',
    title: 'Cold email benchmarks 2026: what good actually looks like',
    excerpt: 'Open rates, reply rates and bounce rates across industries — plus how to read your own numbers against them.',
    category: 'Deliverability',
    author: 'A. Rahman',
    published_at: '2026-08-12',
    read_minutes: 8,
  },
  {
    slug: 'write-first-line-that-gets-replies',
    title: 'How to write a first line that actually gets replies',
    excerpt: 'The first sentence decides everything. Here is a repeatable structure that avoids the 95% of copy people ignore.',
    category: 'Copywriting',
    author: 'N. Islam',
    published_at: '2026-07-30',
    read_minutes: 6,
  },
  {
    slug: 'sequence-anatomy',
    title: 'Anatomy of a 5-step sequence that books meetings',
    excerpt: 'Why more emails rarely help, where conditions belong, and how to design a breakup email that works.',
    category: 'Sequences',
    author: 'S. Karim',
    published_at: '2026-07-14',
    read_minutes: 10,
  },
  {
    slug: 'mail-privacy-protection-and-open-rates',
    title: 'Mail Privacy Protection ruined open rates (here is what to use instead)',
    excerpt: 'Pixel inflation is only half the story. A practical framework for measuring what your emails really do.',
    category: 'Analytics',
    author: 'T. Ahmed',
    published_at: '2026-06-28',
    read_minutes: 7,
  },
  {
    slug: 'sending-domain-checklist',
    title: 'SPF, DKIM and DMARC without the headache: a checklist',
    excerpt: 'The three records that decide whether you land in the inbox, explained in plain language with real examples.',
    category: 'Deliverability',
    author: 'S. Karim',
    published_at: '2026-06-10',
    read_minutes: 9,
  },
  {
    slug: 'ai-cold-email-without-sounding-ai',
    title: 'Using AI for cold email without sounding like AI',
    excerpt: 'Where AI helps (structure, variants, personalisation) and where it hurts (tone, specificity, trust).',
    category: 'AI',
    author: 'A. Rahman',
    published_at: '2026-05-22',
    read_minutes: 6,
  },
];

export default function Blog() {
  useEffect(() => {
    document.title = 'Blog — OUTRIKAA';
  }, []);

  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    let alive = true;
    contentService
      .posts()
      .then((rows) => {
        if (!alive || !Array.isArray(rows) || rows.length === 0) return;
        const mapped: Post[] = (rows as PostRow[]).map((r) => ({
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt ?? '',
          category: r.category ?? 'General',
          author: r.author_name ?? 'OUTRIKAA',
          published_at: r.published_at || new Date().toISOString(),
          read_minutes: r.reading_time_min ?? 5,
        }));
        if (alive) setPosts(mapped);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const list = posts ?? fallbackPosts;
  const [featured, ...rest] = list;

  return (
    <div>
      <PageHero
        eyebrow="Blog"
        title={<>Notes on <span className="gradient-text">better outreach</span></>}
        sub="Playbooks, benchmarks and product thinking from the OUTRIKAA team."
      />

      <Section className="pt-0">
        {posts === null ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <FadeIn>
              <Link to={`/blog/${featured.slug}`} className="group block rounded-3xl border border-white/12 bg-base-card/70 overflow-hidden hover:border-primary-500/40 transition-colors">
                <div className="h-44 sm:h-56 bg-gradient-brand opacity-90 relative overflow-hidden">
                  <div className="absolute inset-0 grid-bg opacity-60" />
                  <span className="absolute bottom-4 left-5 text-white text-xs font-semibold uppercase tracking-widest">
                    {featured.category}
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 text-[12px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {featured.author}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {format(new Date(featured.published_at), 'MMM d, yyyy')}</span>
                    <span>{featured.read_minutes} min read</span>
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white group-hover:text-primary-300 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{featured.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-300">
                    Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </FadeIn>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <FadeIn key={p.slug} delay={i * 60}>
                  <Link to={`/blog/${p.slug}`} className="group h-full flex flex-col rounded-2xl border border-white/10 bg-base-card/60 p-6 hover:border-primary-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge tone="muted"><Tag className="h-3 w-3 mr-1 inline" />{p.category}</Badge>
                      <span className="text-[11px] text-slate-600">{p.read_minutes} min</span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white leading-snug group-hover:text-primary-300 transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">{p.excerpt}</p>
                    <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between text-[12px] text-slate-500">
                      <span>{p.author}</span>
                      <span>{format(new Date(p.published_at), 'MMM d, yyyy')}</span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section className="pb-24">
        <CTA title="Get the playbook in your inbox" sub="No spam — occasional, actually useful outreach notes." primary="Start free" secondary="Browse docs" secondaryTo="/docs" />
      </Section>
    </div>
  );
}
