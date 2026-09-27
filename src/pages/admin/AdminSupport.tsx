import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Send, LifeBuoy } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Select, Drawer, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { SupportTicket, SupportMessage, Profile } from '@/types';
import { StatusBadge, fmtDateTime, timeAgoShort, LoadError, label, Row } from './shared';

type TicketRow = SupportTicket & { requester_email?: string };

const statusOptions = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
const priorityTone: Record<string, 'error' | 'warning' | 'muted'> = {
  urgent: 'error',
  high: 'warning',
  normal: 'muted',
  low: 'muted',
};

export default function AdminSupport() {
  const toast = useToast();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tickets, profiles] = await Promise.all([
        db.list<SupportTicket>('support_tickets', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 199 }),
        db.list<Profile>('profiles', { from: 0, to: 999 }),
      ]);
      const profileMap = new Map(profiles.map((p) => [p.id, p.email]));
      setRows(tickets.map((t) => ({ ...t, requester_email: profileMap.get(t.user_id) ?? 'Unknown user' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (t) => t.subject.toLowerCase().includes(q) || (t.requester_email ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, statusFilter]);

  const openTicket = async (ticket: TicketRow) => {
    setSelected(ticket);
    setMessagesLoading(true);
    setMessages([]);
    try {
      const msgs = await db.list<SupportMessage>('support_messages', {
        filters: { ticket_id: ticket.id },
        orderBy: { column: 'created_at', ascending: true },
        from: 0,
        to: 199,
      });
      setMessages(msgs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load conversation');
    } finally {
      setMessagesLoading(false);
    }
  };

  const changeStatus = async (ticket: TicketRow, status: SupportTicket['status']) => {
    setSavingId(ticket.id);
    try {
      const updated = await db.update<SupportTicket>('support_tickets', ticket.id, { status });
      setRows((prev) => prev.map((t) => (t.id === ticket.id ? { ...updated, requester_email: ticket.requester_email } : t)));
      setSelected((s) => (s && s.id === ticket.id ? { ...updated, requester_email: ticket.requester_email } : s));
      toast.success(`Ticket marked ${label(status)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update ticket');
    } finally {
      setSavingId(null);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const created = await db.insert<SupportMessage>('support_messages', {
        ticket_id: selected.id,
        message: reply.trim(),
        is_from_admin: true,
      });
      setMessages((prev) => [...prev, created]);
      setReply('');
      if (selected.status === 'open') await changeStatus(selected, 'in_progress');
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSending(false);
    }
  };

  const byStatus = (s: string) => rows.filter((t) => t.status === s).length;

  return (
    <div>
      <PageHeader
        title="Support"
        description="Tickets submitted by users across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Open" value={byStatus('open')} icon={<LifeBuoy className="h-4 w-4" />} />
        <StatCard label="In progress" value={byStatus('in_progress')} />
        <StatCard label="Waiting" value={byStatus('waiting')} />
        <StatCard label="Resolved / closed" value={byStatus('resolved') + byStatus('closed')} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search subject or requester…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No tickets" description="When users contact support, their tickets appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => openTicket(t)}>
                    <TableCell className="text-[13px] text-white">{t.subject}</TableCell>
                    <TableCell className="text-[13px]">{t.requester_email}</TableCell>
                    <TableCell className="text-[13px]">{t.category || '—'}</TableCell>
                    <TableCell>
                      <Badge tone={priorityTone[t.priority ?? 'normal'] ?? 'muted'}>{t.priority ?? 'normal'}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-[12px] text-slate-500">{timeAgoShort(t.updated_at ?? t.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? 'Ticket'}
        className="w-full max-w-lg"
      >
        {selected && (
          <div className="flex flex-col h-full">
            <div>
              <Row label="Requester">{selected.requester_email}</Row>
              <Row label="Category">{selected.category || '—'}</Row>
              <Row label="Priority">{selected.priority ?? 'normal'}</Row>
              <Row label="Status"><StatusBadge status={selected.status} /></Row>
              <Row label="Created">{fmtDateTime(selected.created_at)}</Row>
              <Row label="Updated">{fmtDateTime(selected.updated_at)}</Row>

              <div className="mt-4">
                <label className="block text-[13px] text-slate-400 mb-1.5">Change status</label>
                <Select
                  value={selected.status}
                  disabled={savingId === selected.id}
                  onChange={(e) => changeStatus(selected, e.target.value as SupportTicket['status'])}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-5 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-600 mb-2">Conversation</p>
              {messagesLoading ? (
                <Skeleton className="h-32" />
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages on this ticket yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 ${
                        m.is_from_admin ? 'border-primary-500/30 bg-primary-500/10' : 'border-white/10 bg-white/4'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-400">
                          {m.is_from_admin ? 'OUTRIKAA support' : 'User'}
                        </span>
                        <span className="text-[11px] text-slate-600">{timeAgoShort(m.created_at)}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-slate-300 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/8">
              <Textarea
                rows={3}
                placeholder="Write a reply to the user…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
                <Button size="sm" loading={sending} disabled={!reply.trim()} onClick={sendReply} rightIcon={<Send className="h-4 w-4" />}>
                  Send reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
