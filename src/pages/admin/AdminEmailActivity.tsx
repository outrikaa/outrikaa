import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Mail, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, Select, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { EmailMessage, Workspace } from '@/types';
import { StatusBadge, fmtDateTime, LoadError, timeAgoShort } from './shared';

export default function AdminEmailActivity() {
  const [rows, setRows] = useState<(EmailMessage & { workspace_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [direction, setDirection] = useState('outbound');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [messages, workspaces] = await Promise.all([
        db.list<EmailMessage>('email_messages', { orderBy: { column: 'created_at', ascending: false }, from: 0, to: 149 }),
        db.list<Workspace>('workspaces', { from: 0, to: 999 }),
      ]);
      const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
      setRows(messages.map((m) => ({ ...m, workspace_name: wsMap.get(m.workspace_id) ?? 'Unknown' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load email activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (direction) out = out.filter((m) => m.direction === direction);
    if (statusFilter) out = out.filter((m) => m.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (m) =>
          (m.to_address ?? '').toLowerCase().includes(q) ||
          (m.from_address ?? '').toLowerCase().includes(q) ||
          (m.subject ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, statusFilter, direction]);

  const counts = useMemo(
    () => ({
      sent: rows.filter((m) => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(m.status)).length,
      bounced: rows.filter((m) => m.status === 'bounced').length,
      failed: rows.filter((m) => m.status === 'failed').length,
      replies: rows.filter((m) => m.direction === 'inbound').length,
    }),
    [rows]
  );

  return (
    <div>
      <PageHeader
        title="Email activity"
        description="Recent inbound and outbound messages across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard label="Delivered or better" value={counts.sent} icon={<Mail className="h-4 w-4" />} />
        <StatCard label="Bounced" value={counts.bounced} hint="last 150 messages" />
        <StatCard label="Failed" value={counts.failed} />
        <StatCard label="Inbound replies" value={counts.replies} icon={<ArrowDownLeft className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search recipient, sender or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-40">
          <option value="">All directions</option>
          <option value="outbound">Outbound</option>
          <option value="inbound">Inbound</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {['pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'unsubscribed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No messages match" description="Campaign sends and replies will show up here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dir</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.direction === 'inbound' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-accent-300">
                          <ArrowDownLeft className="h-3.5 w-3.5" /> in
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary-300">
                          <ArrowUpRight className="h-3.5 w-3.5" /> out
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] max-w-[220px] truncate">{m.to_address || '—'}</TableCell>
                    <TableCell className="text-[13px] max-w-[280px] truncate">{m.subject || <span className="text-slate-600">(no subject)</span>}</TableCell>
                    <TableCell className="text-[13px]">{m.workspace_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={m.status} />
                        {m.reply_classification && (
                          <Badge tone={m.reply_classification === 'positive' ? 'success' : 'muted'}>
                            {m.reply_classification}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500 whitespace-nowrap" title={fmtDateTime(m.sent_at ?? m.created_at)}>
                      {timeAgoShort(m.sent_at ?? m.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
