import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldOff, RefreshCw, Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Card, CardContent, Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, useToast, Modal, EmptyState,
} from '@/components/ui';
import { db } from '@/services/db';
import type { Profile } from '@/types';
import { StatusBadge, fmtDateTime, timeAgoShort, Row, LoadError } from './shared';

type AdminProfile = Profile;

export default function AdminUsers() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.list<AdminProfile>('profiles', {
        orderBy: { column: 'created_at', ascending: false },
        from: 0,
        to: 299,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (onlyAdmins) out = out.filter((r) => r.is_admin);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          (r.full_name ?? '').toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.company ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, search, onlyAdmins]);

  const toggleAdmin = async (profile: AdminProfile) => {
    setSaving(true);
    try {
      const next = !profile.is_admin;
      const updated = await db.update<AdminProfile>('profiles', profile.id, { is_admin: next });
      setRows((prev) => prev.map((r) => (r.id === profile.id ? updated : r)));
      setSelected((s) => (s && s.id === profile.id ? updated : s));
      toast.success(next ? `${profile.email} is now an admin` : `Admin access removed from ${profile.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every registered account and its administrative access."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search name, email or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full sm:w-80"
        />
        <Button variant={onlyAdmins ? 'primary' : 'outline'} size="sm" onClick={() => setOnlyAdmins((v) => !v)}>
          Admins only
        </Button>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} of {rows.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users match" description="Try a different search or clear the admin filter." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-[13px] text-white truncate">{u.full_name || '—'}</p>
                        <p className="text-[11px] text-slate-600 truncate">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px]">{u.company || '—'}</TableCell>
                    <TableCell>{u.is_admin ? <Badge tone="warning">admin</Badge> : <Badge tone="muted">user</Badge>}</TableCell>
                    <TableCell>
                      {u.onboarding_completed ? (
                        <StatusBadge status="completed" />
                      ) : (
                        <span className="text-xs text-slate-500">step {u.onboarding_step ?? 0}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-500">{timeAgoShort(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(u)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={u.is_admin ? 'outline' : 'primary'}
                          loading={saving}
                          onClick={() => toggleAdmin(u)}
                          leftIcon={u.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        >
                          {u.is_admin ? 'Remove admin' : 'Make admin'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="User details" size="md">
        {selected && (
          <div>
            <Row label="User ID"><code className="text-[11px]">{selected.id}</code></Row>
            <Row label="Email">{selected.email}</Row>
            <Row label="Full name">{selected.full_name || '—'}</Row>
            <Row label="Job title">{selected.job_title || '—'}</Row>
            <Row label="Company">{selected.company || '—'}</Row>
            <Row label="Timezone">{selected.timezone || '—'}</Row>
            <Row label="Internal role">{selected.role || '—'}</Row>
            <Row label="Admin access">{selected.is_admin ? 'Yes' : 'No'}</Row>
            <Row label="Onboarding">{selected.onboarding_completed ? 'Completed' : `Incomplete (step ${selected.onboarding_step ?? 0})`}</Row>
            <Row label="Joined">{fmtDateTime(selected.created_at)}</Row>
            <Row label="Last updated">{fmtDateTime(selected.updated_at)}</Row>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
              <Button
                size="sm"
                variant={selected.is_admin ? 'outline' : 'primary'}
                loading={saving}
                onClick={() => toggleAdmin(selected)}
              >
                {selected.is_admin ? 'Remove admin access' : 'Grant admin access'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
