import { useEffect } from 'react';
import { Users, Upload, Tag, List, Download, Filter } from 'lucide-react';
import { Badge } from '@/components/ui';
import { PageHero, FeatureBlocks, SplitSection, FaqSection, CTA, Section, SectionTitle, FadeIn, StepsSection } from './shared';

export default function LeadManagement() {
  useEffect(() => {
    document.title = 'Lead Management — OUTRIKAA';
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Lead management"
        title={<>Your list, <span className="gradient-text">clean and organised</span></>}
        sub="Import CSVs with smart mapping, dedupe on the way in, segment with lists and tags, and track every contact's status."
      />

      <Section className="pt-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <FadeIn>
            <SectionTitle sub="Six guided steps from raw file to a usable, deduplicated list.">
              CSV import that catches mistakes first
            </SectionTitle>
            <div className="mt-7 space-y-2.5">
              {[
                ['Upload', 'Drop a .csv file or browse'],
                ['Detect columns', 'Headers read and auto-matched to fields'],
                ['Map', 'Review or change any column mapping'],
                ['Validate', 'Emails checked, duplicates flagged'],
                ['Preview', 'See exactly what will be imported'],
                ['Import result', 'Imported / skipped / invalid counts'],
              ].map(([t, d], i) => (
                <div key={t} className="flex items-center gap-4 rounded-xl border border-white/10 bg-base-card/60 px-4 py-3">
                  <span className="h-7 w-7 grid place-items-center rounded-lg bg-primary-500/20 text-primary-300 text-[11px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-white">{t}</span>
                    <span className="block text-xs text-slate-500">{d}</span>
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] text-slate-400">import-preview.csv</span>
                <Badge tone="success">valid</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['1,204', 'rows', 'text-success-300'], ['38', 'duplicates', 'text-warning-300'], ['7', 'invalid', 'text-error-300']].map(([v, l, c]) => (
                  <div key={l} className="rounded-lg bg-white/4 border border-white/8 p-3 text-center">
                    <p className={`text-lg font-bold ${c}`}>{v}</p>
                    <p className="text-[10px] text-slate-500">{l}</p>
                  </div>
                ))}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Column', 'Maps to'].map((h) => (
                      <th key={h} className="py-2 text-[10px] uppercase tracking-wider text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {[['Full Name', 'first_name + last_name'], ['Work Email', 'email'], ['Company', 'company'], ['Role', 'job_title'], ['Phone (opt.)', 'phone']].map(([c, m]) => (
                    <tr key={c}>
                      <td className="py-2 text-[12.5px] text-slate-400">{c}</td>
                      <td className="py-2 text-[12.5px] text-primary-300">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="pt-0">
        <FeatureBlocks
          items={[
            { icon: <Upload className="h-5 w-5" />, title: 'Smart CSV import', desc: 'Column detection, mapping, validation, preview and a clear result summary.' },
            { icon: <List className="h-5 w-5" />, title: 'Lists & segments', desc: 'Group leads into named lists with colour coding for easy campaign targeting.' },
            { icon: <Tag className="h-5 w-5" />, title: 'Tags', desc: 'Apply and remove tags in bulk to layer segmentation on top of lists.' },
            { icon: <Filter className="h-5 w-5" />, title: 'Filters & search', desc: 'Search by name, email or company; filter by status, list or recency.' },
            { icon: <Download className="h-5 w-5" />, title: 'Export', desc: 'Download any filtered view back to CSV for audits or handoffs.' },
            { icon: <Users className="h-5 w-5" />, title: 'Full profiles', desc: 'Contact details, custom fields, tags, status and a complete activity timeline.' },
          ]}
        />
      </Section>

      <Section className="pt-0">
        <SplitSection
          eyebrow="Status workflow"
          title="Watch each lead move through your funnel"
          sub="Statuses update automatically as email events arrive, so you always know who is warm."
          bullets={[
            'New → Contacted after the first send',
            'Opened / Clicked as engagement lands',
            'Replied → Positive reply from classification',
            'Meeting when a booking is confirmed',
            'Bounced / Unsubscribed handled automatically',
          ]}
          reverse
        >
          <div className="rounded-2xl border border-white/12 bg-base-bg-secondary/95 p-6">
            <div className="space-y-2">
              {[
                ['new', 'muted'], ['contacted', 'info'], ['opened', 'primary'],
                ['replied', 'success'], ['positive_reply', 'success'], ['meeting', 'success'],
                ['bounced', 'error'], ['unsubscribed', 'muted'],
              ].map(([s, tone]) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-4 py-2.5">
                  <span className="text-sm text-slate-300">{s.replace('_', ' ')}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                    tone === 'success' ? 'text-success-300 bg-success-500/15 border-success-500/30' :
                    tone === 'error' ? 'text-error-300 bg-error-500/15 border-error-500/30' :
                    tone === 'primary' ? 'text-primary-300 bg-primary-500/15 border-primary-500/30' :
                    tone === 'info' ? 'text-accent-300 bg-accent-500/15 border-accent-500/30' :
                    'text-slate-400 bg-white/8 border-white/10'}`}>
                    automatic
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SplitSection>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Four steps to a healthy list.">
            Getting started
          </SectionTitle>
        </FadeIn>
        <div className="mt-12">
          <StepsSection
            steps={[
              { title: 'Export your source', desc: 'CRM, spreadsheet or wherever your contacts currently live.' },
              { title: 'Import the CSV', desc: 'Map columns, review validation and confirm what gets created.' },
              { title: 'Segment it', desc: 'Split into lists and tags by industry, size or intent.' },
              { title: 'Assign to a campaign', desc: 'Pick the list when creating a campaign and start sending.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <SectionTitle center sub="Things teams ask about lists and imports.">
            FAQ
          </SectionTitle>
        </FadeIn>
        <div className="mt-10">
          <FaqSection
            items={[
              { q: 'What CSV format do you accept?', a: 'Any UTF-8 CSV with a header row. Required column: email. Everything else is optional and can be mapped.' },
              { q: 'How are duplicates handled?', a: 'Emails are compared case-insensitively against your existing leads and against rows in the same file. Duplicates are skipped and counted.' },
              { q: 'Is there an import limit?', a: 'Imports are chunked automatically. Practical limit is your plan\'s lead allowance — you will be told before exceeding it.' },
              { q: 'Can I import custom fields?', a: 'Yes. Unmapped columns can be stored in the lead\'s custom fields object for use in personalisation.' },
              { q: 'How do I remove leads in bulk?', a: 'Select rows with the checkboxes and use the bulk delete action, or filter first and delete the filtered set.' },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CTA title="Import your list and launch today" sub="Takes about five minutes from CSV to first campaign." />
      </Section>
    </div>
  );
}
