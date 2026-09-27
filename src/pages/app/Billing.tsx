import { useEffect, useState } from 'react';
import { CreditCard, Check, Download, Sparkles, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton, useToast, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { billingService } from '@/services/db';
import type { Plan, Invoice } from '@/types';
import { formatPrice, formatDate, formatNumber, cn } from '@/lib/utils';

interface Sub {
  status?: string;
  billing_cycle?: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  plan?: Plan | null;
}

export default function Billing() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    (async () => {
      try {
        const [p, s, inv] = await Promise.all([
          billingService.plans(),
          billingService.subscription(workspace.id),
          billingService.invoices(workspace.id),
        ]);
        setPlans(p);
        setSub(s as Sub | null);
        setInvoices(inv);

        const [{ count: leads }, { count: campaigns }, { count: mailboxes }] = await Promise.all([
          billingService.usage(workspace.id).then((u) => ({
            count: u
              .filter((r) => (r as { metric?: string }).metric === 'leads')
              .reduce((acc: number, r) => acc + ((r as { value?: number }).value ?? 0), 0),
          })),
          Promise.resolve({ count: 0 }),
          Promise.resolve({ count: 0 }),
        ]);
        void campaigns;
        void mailboxes;
        setUsage({ leads });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load billing');
      } finally {
        setLoading(false);
      }
    })();
  }, [workspace, toast]);

  const currentPlan = sub?.plan ?? plans.find((p) => p.is_featured) ?? plans[0];

  const meter = (used: number, limit: number, label: string) => {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return (
      <div key={label}>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-300">
            {formatNumber(used)} / {limit === 0 ? '∞' : formatNumber(limit)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div className={cn('h-full rounded-full', pct > 90 ? 'bg-error-500' : pct > 70 ? 'bg-warning-500' : 'bg-primary-500')} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Billing" description="Loading…" />
        <Skeleton className="h-40" />
        <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Billing & usage"
        description="Manage your plan, monitor limits and download invoices."
        actions={
          <CycleToggle cycle={cycle} setCycle={setCycle} />
        }
      />

      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge tone={sub?.status === 'active' ? 'success' : sub?.status === 'trialing' ? 'info' : 'warning'}>
              {sub?.status ?? 'trialing'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{currentPlan?.name ?? 'Free'}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {currentPlan
                    ? `${formatPrice(cycle === 'monthly' ? currentPlan.monthly_price : currentPlan.yearly_price)} / ${cycle}`
                    : 'Starter tier with core features'}
                </p>
                {sub?.current_period_end && (
                  <p className="text-xs text-slate-600 mt-2">
                    {sub.cancel_at_period_end ? 'Ends' : 'Renews'} {formatDate(sub.current_period_end)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {sub?.cancel_at_period_end ? (
                  <Button variant="outline" onClick={async () => {
                    toast.info('Reactivation requires Stripe billing to be configured');
                  }}>
                    Resume subscription
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setConfirmCancel(true)}>Cancel plan</Button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/8 grid sm:grid-cols-2 gap-5">
              {[
                { label: 'Leads', used: usage.leads ?? 0, limit: currentPlan?.lead_limit ?? 0 },
                { label: 'Emails / month', used: 0, limit: currentPlan?.email_limit ?? 0 },
                { label: 'Campaigns', used: 0, limit: currentPlan?.campaign_limit ?? 0 },
                { label: 'AI generations', used: 0, limit: currentPlan?.ai_generation_limit ?? 0 },
              ].map((m) => meter(m.used, m.limit, m.label))}
            </div>

            <div className="mt-5 rounded-xl border border-warning-500/25 bg-warning-500/5 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-warning-400 shrink-0 mt-0.5" />
              <p className="text-xs text-warning-200/80 leading-relaxed">
                Usage meters populate as campaigns run. Stripe checkout is wired behind an edge function — add your keys
                to activate real billing.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <EmptyState title="No invoices yet" description="Invoices appear after your first paid cycle." className="py-10" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{formatDate(inv.created_at)}</TableCell>
                      <TableCell>{formatPrice(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'error' : 'warning'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.invoice_url && (
                          <a href={inv.invoice_url} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300">
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = currentPlan?.id === p.id;
          return (
            <Card key={p.id} className={cn('relative', p.is_featured && 'border-primary-500/40 shadow-glow-sm', isCurrent && 'border-success-500/40')}>
              {p.is_featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-brand text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">
                    {formatPrice(cycle === 'monthly' ? p.monthly_price : p.yearly_price)}
                  </span>
                  <span className="text-xs text-slate-500 mb-1">/ {cycle}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className="h-3.5 w-3.5 text-success-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? 'outline' : p.is_featured ? 'primary' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => toast.info('Checkout opens once Stripe keys are configured')}
                >
                  {isCurrent ? 'Current plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {plans.length === 0 && (
          <Card className="lg:col-span-3">
            <CardContent>
              <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No plans configured" description="An admin can add plans from the admin panel." />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Plan limits are enforced at the database level through RLS and SECURITY DEFINER functions — the UI never
          decides what you're allowed to do.
        </p>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          toast.error('Cancellation requires Stripe billing to be configured');
        }}
        title="Cancel your plan?"
        message="Your workspace will move to the free tier at the end of the current billing period."
        confirmLabel="Cancel plan"
        tone="danger"
      />
    </div>
  );
}

function CycleToggle({ cycle, setCycle }: { cycle: 'monthly' | 'yearly'; setCycle: (c: 'monthly' | 'yearly') => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {(['monthly', 'yearly'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCycle(c)}
          className={cn(
            'h-8 px-3.5 text-[13px] font-medium rounded-lg transition-all capitalize',
            cycle === c ? 'bg-primary-500/20 text-primary-200 border border-primary-500/30' : 'text-slate-400 hover:text-white border border-transparent'
          )}
        >
          {c}
          {c === 'yearly' && <span className="ml-1.5 text-[10px] text-success-400">−20%</span>}
        </button>
      ))}
    </div>
  );
}
