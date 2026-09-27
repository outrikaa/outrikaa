import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, User, Clock, ArrowRight } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import { Section, CTA, FadeIn } from './shared';
import { contentService } from '@/services/db';
import { format } from 'date-fns';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  published_at: string;
  read_minutes: number;
}

interface PostRow {
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  reading_time_min?: number | null;
}

const fallback: Record<string, Post> = {
  'cold-email-benchmarks-2026': {
    slug: 'cold-email-benchmarks-2026',
    title: 'Cold email benchmarks 2026: what good actually looks like',
    excerpt: 'Open rates, reply rates and bounce rates across industries — plus how to read your own numbers against them.',
    category: 'Deliverability',
    author: 'A. Rahman',
    published_at: '2026-08-12',
    read_minutes: 8,
  },
  'write-first-line-that-gets-replies': {
    slug: 'write-first-line-that-gets-replies',
    title: 'How to write a first line that actually gets replies',
    excerpt: 'The first sentence decides everything.',
    category: 'Copywriting',
    author: 'N. Islam',
    published_at: '2026-07-30',
    read_minutes: 6,
  },
  'sequence-anatomy': {
    slug: 'sequence-anatomy',
    title: 'Anatomy of a 5-step sequence that books meetings',
    excerpt: 'Why more emails rarely help.',
    category: 'Sequences',
    author: 'S. Karim',
    published_at: '2026-07-14',
    read_minutes: 10,
  },
};

const genericBody = `Cold outreach has never been noisier, which means the basics matter more than ever: a
relevant audience, a specific first line, a single clear ask, and a cadence that stops before it
annoys.

This article walks through the framework we use at OUTRIKAA when reviewing campaigns that underperform —
starting with list quality, then message-market fit, then timing, and only then copy variants.

## Start with the list

If the audience is wrong, no amount of copywriting fixes it. Segment until each group shares a real
reason to care about what you offer. Narrow beats broad in almost every cold email dataset we have seen.

## One idea per email

The best-performing first touches we see contain a single observation and a single ask. Anything more
and the reader has to decide what the email is about — which most people resolve by not replying.

## Let the sequence do the work

Your first email does not need to close. It needs to earn the next one. Space steps days apart, branch
on behaviour, and end with a breakup email that gives people permission to say no.

## Measure honestly

Open rates are noisy, bounce rates are signal, and replies are the metric that actually pays the bills.
Read them as trends over weeks, not headlines from a single day.`;

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    document.title = 'Blog — OUTRIKAA';
  }, []);

  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    contentService
      .postBySlug(slug)
      .then((row) => {
        if (!alive) return;
        if (row && row.slug) {
          const r = row as unknown as PostRow;
          setPost({
            slug: r.slug,
            title: r.title,
            excerpt: r.excerpt ?? '',
            content: r.content ?? undefined,
            category: r.category ?? 'General',
            author: r.author_name ?? 'OUTRIKAA',
            published_at: r.published_at || new Date().toISOString(),
            read_minutes: r.reading_time_min ?? 5,
          });
        } else {
          setPost(fallback[slug] ?? null);
        }
      })
      .catch(() => {
        if (alive) setPost(fallback[slug] ?? null);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (post === undefined) {
    return (
      <Section className="pt-16">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded mt-4" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </Section>
    );
  }

  if (post === null || !slug) return <Navigate to="/blog" replace />;

  const paragraphs = (post.content ?? genericBody).split(/\n\n+/);

  return (
    <div>
      <Section className="pt-16">
        <FadeIn>
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-300 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Badge tone="primary">{post.category}</Badge>
            <span className="text-[12px] text-slate-500 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.read_minutes} min read</span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white leading-tight max-w-3xl">{post.title}</h1>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed max-w-3xl">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-4 text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {format(new Date(post.published_at), 'MMM d, yyyy')}</span>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <article className="mt-10 max-w-3xl rounded-3xl border border-white/10 bg-base-card/60 p-7 sm:p-10">
            {paragraphs.map((p, i) =>
              p.startsWith('## ') ? (
                <h2 key={i} className="mt-8 first:mt-0 text-xl font-semibold text-white">{p.replace('## ', '')}</h2>
              ) : (
                <p key={i} className="mt-4 first:mt-0 text-[15.5px] text-slate-400 leading-[1.8]">
                  {p}
                </p>
              )
            )}
          </article>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="mt-10 max-w-3xl flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-base-bg-secondary/70 p-6">
            <div>
              <p className="text-base font-semibold text-white">Put this into practice</p>
              <p className="text-sm text-slate-500 mt-1">Create a free workspace and run your first campaign today.</p>
            </div>
            <Link to="/signup">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-300 hover:text-primary-200 transition-colors">
                Start free <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </FadeIn>
      </Section>

      <Section className="pb-24 pt-4">
        <CTA title="Ready to send better email?" sub="Lead import, AI copy, sequences and analytics in one workspace." />
      </Section>
    </div>
  );
}
