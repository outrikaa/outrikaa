import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Users, Mail, Megaphone, CalendarClock, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, EmptyState, Skeleton, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { db, campaignService, messageService } from '@/services/db';
import { analyticsService } from '@/services/analytics';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Users;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

export default function Tasks() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!workspace) {
      setTasks([]);
      return;
    }
    (async () => {
      try {
        const [leadCount, campaignCount, mailboxCount, scheduled, summary] = await Promise.all([
          db.count('leads', { workspace_id: workspace.id }),
          campaignService.list(workspace.id),
          db.count('mailboxes', { workspace_id: workspace.id }),
          messageService.scheduled(workspace.id),
          analyticsService.summary(workspace.id),
        ]);

        const list: Task[] = [];
        if (leadCount === 0) {
          list.push({
            id: 'import-leads',
            title: 'Import your first list of leads',
            description: 'Upload a CSV and map the columns — takes about a minute.',
            href: '/app/leads?import=1',
            icon: Users,
            priority: 'high',
            done: false,
          });
        }
        if (mailboxCount === 0) {
          list.push({
            id: 'connect-mailbox',
            title: 'Connect a sending mailbox',
            description: 'Gmail, Google Workspace, Outlook or Microsoft 365.',
            href: '/app/mailboxes',
            icon: Mail,
            priority: 'high',
            done: false,
          });
        }
        if (campaignCount.length === 0) {
          list.push({
            id: 'create-campaign',
            title: 'Create your first campaign',
            description: 'Pair a list, a mailbox and a sequence, then launch.',
            href: '/app/campaigns/new',
            icon: Megaphone,
            priority: 'medium',
            done: false,
          });
        }
        if (summary.emailsSent > 0 && summary.replyRate < 5) {
          list.push({
            id: 'improve-reply-rate',
            title: 'Improve reply rate',
            description: 'Your reply rate is below the 5% benchmark. Test a shorter first email.',
            href: '/app/ai-writer',
            icon: CheckSquare,
            priority: 'medium',
            done: false,
          });
        }
        if (summary.bounceRate > 5) {
          list.push({
            id: 'clean-list',
            title: 'Clean your list',
            description: `${summary.bounceRate}% bounce rate is hurting sender reputation.`,
            href: '/app/analytics',
            icon: CheckSquare,
            priority: 'high',
            done: false,
          });
        }
        if (scheduled.length > 0) {
          list.push({
            id: 'review-scheduled',
            title: `Review ${scheduled.length} scheduled send${scheduled.length > 1 ? 's' : ''}`,
            description: 'Confirm timing and copy before they go out.',
            href: '/app/campaigns',
            icon: CalendarClock,
            priority: 'low',
            done: false,
          });
        }
        if (list.length === 0) {
          list.push({
            id: 'scale',
            title: 'Scale your best campaign',
            description: 'Duplicate the top performer into a new segment.',
            href: '/app/campaigns',
            icon: Megaphone,
            priority: 'low',
            done: false,
          });
        }
        setTasks(list);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load tasks');
        setTasks([]);
      }
    })();
  }, [workspace, toast]);

  const open = useMemo(() => (tasks ?? []).filter((t) => !done.has(t.id)), [tasks, done]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Recommended actions based on the current state of your workspace."
        actions={<Badge tone="primary">{open.length} open</Badge>}
      />

      {tasks === null ? (
        <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : open.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CheckSquare className="h-6 w-6" />}
              title="You're all caught up"
              description="No outstanding actions. Keep an eye on your analytics for the next recommendation."
              action={<Link to="/app/analytics"><Button size="sm">View analytics</Button></Link>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {open.map((t) => (
            <Card key={t.id} className="hover:border-white/20 transition-all">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn('h-10 w-10 shrink-0 grid place-items-center rounded-xl border', t.priority === 'high' ? 'bg-error-500/15 border-error-500/30 text-error-300' : t.priority === 'medium' ? 'bg-warning-500/15 border-warning-500/30 text-warning-300' : 'bg-primary-500/15 border-primary-500/30 text-primary-300')}>
                  <t.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    <Badge tone={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'muted'}>
                      {t.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setDone((prev) => new Set(prev).add(t.id))}>
                    Dismiss
                  </Button>
                  <Link to={t.href}>
                    <Button size="sm">Open</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5">
        <Link to="/app/campaigns/new">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Start a new campaign</Button>
        </Link>
      </div>
    </div>
  );
}
