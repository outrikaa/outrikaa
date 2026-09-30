import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox as InboxIcon, Archive, Reply, Tag, RefreshCw, Send, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, Textarea, EmptyState, Skeleton, useToast, Tabs } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { messageService, mailboxService, leadService } from '@/services/db';
import type { EmailThread } from '@/types';
import { timeAgo, cn, truncate } from '@/lib/utils';

const folders = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'positive', label: 'Positive' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'archived', label: 'Archived' },
];

const tone: Record<string, 'success' | 'warning' | 'muted' | 'primary' | 'info' | 'default'> = {
  positive: 'success',
  interested: 'success',
  not_interested: 'warning',
  follow_up: 'info',
  archived: 'muted',
};

export default function Inbox() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<EmailThread | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    messageService
      .threads(workspace.id)
      .then((t) => {
        setThreads(t);
        if (t.length) setActive(t[0]);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load inbox'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const filtered = useMemo(() => {
    let out = threads;
    if (folder === 'unread') out = out.filter((t) => t.is_unread);
    else if (folder !== 'all') out = out.filter((t) => t.folder === folder || t.classification === folder);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((t) => (t.subject ?? '').toLowerCase().includes(q));
    }
    return out;
  }, [threads, folder, search]);

  const updateThread = async (t: EmailThread, values: Partial<EmailThread>) => {
    try {
      const updated = await messageService.updateThread(t.id, values);
      setThreads((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      if (active?.id === t.id) setActive(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active || !workspace) return;
    setSending(true);
    try {
      const [{ emailService }, mailboxes, lead] = await Promise.all([
        import('@/services/email'),
        mailboxService.list(workspace.id),
        active.lead_id ? leadService.get(active.lead_id).catch(() => null) : Promise.resolve(null),
      ]);
      const mailbox = mailboxes.find((m) => m.status === 'connected');
      if (!mailbox) {
        toast.error('Connect a sending mailbox first', 'No mailbox');
        return;
      }
      if (!lead?.email) {
        toast.error('No lead email found for this thread');
        return;
      }
      const res = await emailService.send({
        mailboxId: mailbox.id,
        to: lead.email,
        subject: active.subject ?? '',
        body: reply,
      });
      if (res.ok) {
        toast.success('Reply sent');
        setReply('');
      } else {
        toast.error(res.error ?? 'Could not send');
      }
    } catch {
      toast.error('Could not send the reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Replies from your campaigns, classified and ready to act on."
        actions={
          <Button variant="outline" onClick={() => toast.info('Syncing requires mailbox credentials')}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Sync
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs tabs={folders} value={folder} onChange={setFolder} />
        <div className="ml-auto w-full sm:w-64">
          <Input placeholder="Search subject…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<InboxIcon className="h-6 w-6" />}
                title="No replies yet"
                description="When leads respond to a campaign, their threads land here."
                className="py-12"
              />
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActive(t);
                    if (t.is_unread) updateThread(t, { is_unread: false });
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3.5 border-b border-white/6 transition-colors',
                    active?.id === t.id ? 'bg-primary-500/10' : 'hover:bg-white/5',
                    t.is_unread && 'bg-white/4'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-sm truncate', t.is_unread ? 'font-semibold text-white' : 'text-slate-300')}>
                      {truncate(t.subject ?? '(no subject)', 42)}
                    </span>
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{timeAgo(t.last_message_at)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone={tone[t.folder] ?? 'default'}>{(t.classification ?? t.folder ?? 'all').replace('_', ' ')}</Badge>
                    <span className="text-[11px] text-slate-600">{t.message_count} messages</span>
                    {t.is_unread && <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {!active ? (
            <CardContent>
              <EmptyState icon={<Reply className="h-6 w-6" />} title="Select a conversation" description="Pick a thread on the left to read and reply." />
            </CardContent>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/8">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white truncate">{active.subject}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {active.message_count} messages · last activity {timeAgo(active.last_message_at)}
                    </p>
                  </div>
                  <Badge tone={tone[active.folder] ?? 'default'}>{(active.folder ?? 'all').replace('_', ' ')}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(['positive', 'interested', 'not_interested', 'follow_up'] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={active.folder === f ? 'secondary' : 'outline'}
                      onClick={() => updateThread(active, { folder: f })}
                    >
                      {f.replace('_', ' ')}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await updateThread(active, { folder: 'archived', is_unread: false });
                      toast.success('Archived');
                    }}
                    leftIcon={<Archive className="h-3.5 w-3.5" />}
                  >
                    Archive
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<Tag className="h-3.5 w-3.5" />} onClick={() => toast.info('Tagging is available on the lead record')}>
                    Tag lead
                  </Button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3 max-h-[38vh] overflow-y-auto">
                <div className="rounded-xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">Lead reply</span>
                    <span className="text-[11px] text-slate-600">{timeAgo(active.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {active.classification === 'positive'
                      ? 'Sounds interesting — can you send over some details and a time to talk?'
                      : active.classification === 'not_interested'
                        ? "Thanks, but we're not looking at this right now. Please remove me from your list."
                        : 'Thanks for reaching out. Could you share more information about pricing?'}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-white/8">
                <Textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${active.subject}…`}
                />
                <div className="mt-3 flex items-center justify-between">
                  <Link to="/app/ai-writer" className="text-xs text-primary-400 hover:text-primary-300">
                    Draft with AI →
                  </Link>
                  <Button loading={sending} onClick={sendReply} leftIcon={<Send className="h-4 w-4" />}>
                    Send reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
