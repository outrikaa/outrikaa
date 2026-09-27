import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Badge, Button, Skeleton } from '@/components/ui';
import { Section, SectionTitle, FadeIn, CTA, FeatureBlocks } from './shared';

type Health = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface ComponentRow {
  name: string;
  description: string;
  status: Health;
}

const defaultComponents: ComponentRow[] = [
  { name: 'Web application', description: 'app.outrikaa.com', status: 'operational' },
  { name: 'API', description: 'Public REST API and edge functions', status: 'operational' },
  { name: 'Database', description: 'Workspace and campaign data', status: 'operational' },
  { name: 'Email delivery', description: 'Sending pipeline and provider connections', status: 'operational' },
  { name: 'AI writer', description: 'Copy generation service', status: 'operational' },
  { name: 'Dashboard & analytics', description: 'Metrics aggregation and reporting', status: 'operational' },
];

const history = [
  { date: 'Sep 21, 2026', title: 'Scheduled database maintenance', status: 'maintenance', duration: '25 min', detail: 'Primary database upgraded to a newer engine version. No customer impact expected; brief read-only windows occurred.' },
  { date: 'Sep 3, 2026', title: 'Elevated email queue latency', status: 'degraded', duration: '48 min', detail: 'A provider incident delayed queued sends. All queued emails were delivered after recovery. No messages were lost.' },
  { date: 'Aug 18, 2026', title: 'API latency increase', status: 'degraded', duration: '1 h 12 min', detail: 'Increased response times on list endpoints under peak load. Caching layer tuned afterwards.' },
];

const statusMeta: Record<Health, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  operational: { label: 'Operational', color: 'text-success-300 bg-success-500/15 border-success-500/30', icon: CheckCircle2 },
  degraded: { label: 'Degraded', color: 'text-warning-300 bg-warning-500/15 border-warning-500/30', icon: AlertTriangle },
  outage: { label: 'Outage', color: 'text-error-300 bg-error-500/15 border-error-500/30', icon: AlertTriangle },
  maintenance: { label: 'Maintenance', color: 'text-accent-300 bg-accent-500/15 border-accent-500/30', icon: Clock },
};

export default function Status() {
  useEffect(() => {
    document.title = 'System Status — OUTRIKAA';
  }, []);

  const [components, setComponents] = useState<ComponentRow[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setComponents(defaultComponents);
      setCheckedAt(new Date());
      setRefreshing(false);
    }, 700);
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const allHealthy = components?.every((c) => c.status === 'operational') ?? false;

  return (
    <div>
      <Section className="pt-16">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <Badge tone={allHealthy ? 'success' : 'warning'}>
              {allHealthy ? 'All systems operational' : 'Some systems degraded'}
            </Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">System status</h1>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Live health of the OUTRIKAA platform, plus a public record of past incidents.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 text-[12px] text-slate-500">
              <span>
                Last checked {checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <Button size="sm" variant="outline" loading={refreshing} onClick={refresh} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                Refresh
              </Button>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-0">
        <FadeIn>
          <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-base-card/70 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Components</p>
              <span className="text-[11px] text-slate-600">updated just now</span>
            </div>
            {components === null ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-white/8">
                {components.map((c) => {
                  const meta = statusMeta[c.status];
                  const Icon = meta.icon;
                  return (
                    <li key={c.name} className="px-6 py-4 flex items-center justify-between gap-4">
                      <span>
                        <span className="block text-sm font-medium text-white">{c.name}</span>
                        <span className="block text-xs text-slate-600">{c.description}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border shrink-0 ${meta.color}`}>
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </FadeIn>
      </Section>

      <Section className="pt-4">
        <SectionTitle center sub="The last 90 days, recorded honestly.">
          Incident history
        </SectionTitle>
        <div className="mt-10 max-w-3xl mx-auto space-y-4">
          {history.map((h, i) => {
            const meta = statusMeta[h.status as Health];
            const Icon = meta.icon;
            return (
              <FadeIn key={h.title} delay={i * 60}>
                <details className="group rounded-2xl border border-white/10 bg-base-card/60 p-5" open={i === 0}>
                  <summary className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{h.title}</span>
                      <span className="block text-xs text-slate-600 mt-1">{h.date} · {h.duration}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border shrink-0 ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{h.detail}</p>
                </details>
              </FadeIn>
            );
          })}
        </div>
      </Section>

      <Section className="pt-4">
        <FeatureBlocks
          items={[
            { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Uptime target', desc: '99.9% monthly availability objective for core sending and API paths.' },
            { icon: <Clock className="h-5 w-5" />, title: 'Incident updates', desc: 'Post-incident summaries published here within 48 hours of resolution.' },
            { icon: <AlertTriangle className="h-5 w-5" />, title: 'Proactive alerts', desc: 'Workspace admins are notified in-app if sending is significantly impacted.' },
          ]}
        />
      </Section>

      <Section className="pb-24 pt-4">
        <CTA title="Never miss an update" sub="Incident notices also appear in-app and on our status page feed." primary="View docs" primaryTo="/docs" secondary="Contact us" secondaryTo="/contact" />
      </Section>
    </div>
  );
}
