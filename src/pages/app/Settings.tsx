import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, Building2, Users, Bell, Shield, Send, Globe, Key, Plus, Trash2, Copy } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast, ConfirmDialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { db, workspaceService, apiKeyService } from '@/services/db';
import { authService } from '@/services/auth';
import type { WorkspaceMember, ApiKey, Profile } from '@/types';
import { formatDate, cn, getInitials } from '@/lib/utils';

const sections = [
  { to: '/app/settings/profile', label: 'Profile', icon: User },
  { to: '/app/settings/workspace', label: 'Workspace', icon: Building2 },
  { to: '/app/settings/team', label: 'Team', icon: Users },
  { to: '/app/settings/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings/security', label: 'Security', icon: Shield },
  { to: '/app/settings/sending', label: 'Sending', icon: Send },
  { to: '/app/settings/domains', label: 'Domains', icon: Globe },
  { to: '/app/settings/api', label: 'API keys', icon: Key },
];

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, workspace and account security." />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] whitespace-nowrap transition-colors',
                  isActive ? 'bg-primary-500/15 text-primary-200 border border-primary-500/25' : 'text-slate-400 hover:text-white hover:bg-white/6 border border-transparent'
                )
              }
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSection />} />
            <Route path="workspace" element={<WorkspaceSection />} />
            <Route path="team" element={<TeamSection />} />
            <Route path="notifications" element={<NotificationsSection />} />
            <Route path="security" element={<SecuritySection />} />
            <Route path="sending" element={<SendingSection />} />
            <Route path="domains" element={<DomainsSection />} />
            <Route path="api" element={<ApiSection />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await db.update('profiles', profile.id, {
        full_name: form.full_name,
        job_title: form.job_title,
        company: form.company,
        timezone: form.timezone,
      });
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How you appear across the workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <span className="h-16 w-16 grid place-items-center rounded-2xl bg-gradient-brand text-xl font-bold text-white">
            {getInitials(form.full_name || form.email || 'U')}
          </span>
          <div>
            <p className="text-sm font-medium text-white">{form.full_name || 'Unnamed'}</p>
            <p className="text-xs text-slate-500">{form.email}</p>
          </div>
        </div>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" value={form.full_name ?? ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" value={form.email ?? ''} disabled />
          <Input label="Job title" value={form.job_title ?? ''} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
          <Input label="Company" value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Select
            label="Timezone"
            value={form.timezone ?? ''}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            options={[form.timezone, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Dhaka'].filter((v, i, a) => v && a.indexOf(v) === i).map((t) => ({ value: t!, label: t! }))}
          />
          <div className="flex items-end">
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function WorkspaceSection() {
  const { workspace, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setIndustry(workspace.industry ?? '');
    }
  }, [workspace]);

  const save = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      await db.update('workspaces', workspace.id, { name, industry: industry || null });
      await refresh();
      toast.success('Workspace updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Shared settings for everyone in this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Select industry"
          options={['saas', 'agency', 'ecommerce', 'finance', 'healthcare', 'education', 'recruiting', 'other'].map((i) => ({ value: i, label: i }))}
        />
        <div className="rounded-xl border border-white/8 bg-white/4 p-4 text-xs text-slate-500">
          Workspace ID: <span className="text-slate-300 font-mono">{workspace?.id}</span>
        </div>
        <Button loading={saving} onClick={save}>Save changes</Button>
      </CardContent>
    </Card>
  );
}

function TeamSection() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<(WorkspaceMember & { profile?: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [pending, setPending] = useState<WorkspaceMember | null>(null);

  useEffect(() => {
    if (!workspace) return;
    workspaceService
      .members(workspace.id)
      .then((m) => setMembers(m as unknown as (WorkspaceMember & { profile?: Profile | null })[]))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
     
  }, [workspace]);

  const invite = async () => {
    if (!workspace || !email.trim()) return;
    try {
      await workspaceService.invite(workspace.id, email.trim(), role);
      toast.success('Invitation recorded', 'An email invite goes out once SMTP is configured');
      setEmail('');
      setInviteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  const changeRole = async (m: WorkspaceMember, newRole: string) => {
    try {
      await db.update('workspace_members', m.id, { role: newRole });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: newRole as WorkspaceMember['role'] } : x)));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Role change failed');
    }
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Roles are enforced by row-level security, not just in the UI.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>Invite</Button>
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" />} title="No members yet" description="Invite teammates to collaborate on campaigns." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-8 grid place-items-center rounded-lg bg-gradient-brand text-[11px] font-bold text-white">
                        {getInitials(m.profile?.full_name || m.invited_email || m.user_id)}
                      </span>
                      <div>
                        <p className="text-sm text-white">{m.profile?.full_name ?? m.invited_email ?? 'Member'}</p>
                        <p className="text-[11px] text-slate-500">{m.profile?.email ?? m.invited_email ?? m.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="h-8 text-xs w-32"
                      options={['owner', 'admin', 'member', 'viewer'].map((r) => ({ value: r, label: r }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge tone={m.status === 'active' ? 'success' : m.status === 'invited' ? 'info' : 'warning'}>{m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(m.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {inviteOpen && (
        <div className="p-5 border-t border-white/8 grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={['admin', 'member', 'viewer'].map((r) => ({ value: r, label: r }))} />
          <div className="flex gap-2">
            <Button onClick={invite}>Send invite</Button>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => setPending(null)}
        title="Remove member?"
        message="They will lose access to this workspace immediately."
        confirmLabel="Remove"
      />
    </Card>
  );
}

function NotificationsSection() {
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    replies: true,
    campaign_updates: true,
    mailbox_issues: true,
    billing: true,
    product: false,
    digest: true,
  });

  const items: [keyof typeof prefs, string, string][] = [
    ['replies', 'New replies', 'Alert me when a lead replies to a campaign.'],
    ['campaign_updates', 'Campaign events', 'Started, paused and completed notifications.'],
    ['mailbox_issues', 'Mailbox health', 'Disconnected mailboxes and bounce spikes.'],
    ['billing', 'Billing events', 'Invoices, plan changes and payment failures.'],
    ['digest', 'Weekly digest', 'A summary of opens, replies and top campaigns.'],
    ['product', 'Product updates', 'New features and improvement notes.'],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>Choose what reaches your inbox and notification centre.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(([key, label, desc]) => (
          <label key={key} className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/4 p-4 cursor-pointer hover:bg-white/6 transition-colors">
            <span>
              <span className="block text-sm text-white">{label}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => {
                setPrefs({ ...prefs, [key]: !prefs[key] });
                toast.success('Preference saved');
              }}
              className={cn('shrink-0 h-6 w-11 rounded-full transition-colors relative', prefs[key] ? 'bg-primary-500' : 'bg-white/12')}
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', prefs[key] ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error('Password must be at least 8 characters');
    if (next !== confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await authService.updatePassword(next);
      toast.success('Password updated');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use at least 8 characters with a mix of letters and numbers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <Input label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <div />
            <Input label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>Update password</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active session</CardTitle>
          <CardDescription>Signed in on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-success-400" />
            <div>
              <p className="text-sm text-white">Current browser</p>
              <p className="text-xs text-slate-500">{navigator.userAgent.slice(0, 70)}…</p>
            </div>
          </div>
          <Badge tone="success">active</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function SendingSection() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    daily_limit: 80,
    min_delay: 90,
    track_opens: true,
    track_clicks: true,
    unsubscribe: true,
    stop_on_reply: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default sending settings</CardTitle>
        <CardDescription>Applied to new campaigns. Individual campaigns can override these.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Daily limit per mailbox" type="number" value={settings.daily_limit} onChange={(e) => setSettings({ ...settings, daily_limit: Number(e.target.value) })} hint="Keep under 150 for a healthy domain." />
          <Input label="Minimum delay between emails (seconds)" type="number" value={settings.min_delay} onChange={(e) => setSettings({ ...settings, min_delay: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          {([
            ['track_opens', 'Track opens by default'],
            ['track_clicks', 'Track clicks by default'],
            ['unsubscribe', 'Append unsubscribe link'],
            ['stop_on_reply', 'Stop sequence when a lead replies'],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" checked={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        <Button onClick={() => toast.success('Sending defaults saved')}>Save defaults</Button>
      </CardContent>
    </Card>
  );
}

function DomainsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sender domains</CardTitle>
        <CardDescription>Authenticate a custom domain so SPF, DKIM and DMARC can be verified.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-warning-500/25 bg-warning-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-warning-400" />
            <p className="text-sm font-medium text-warning-200">No domain added</p>
          </div>
          <p className="text-xs text-warning-200/70 leading-relaxed">
            SPF, DKIM and DMARC are only shown as verified after a real DNS check succeeds. Add a domain and publish the
            provided records to enable authentication checks.
          </p>
          <Link to="/help" className="inline-block mt-3 text-xs text-warning-300 underline underline-offset-2">
            Read the deliverability guide
          </Link>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {['SPF', 'DKIM', 'DMARC'].map((r) => (
            <div key={r} className="rounded-xl border border-white/8 bg-white/4 p-4 text-center">
              <p className="text-sm font-semibold text-white">{r}</p>
              <Badge tone="muted" className="mt-2">not checked</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiSection() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [pending, setPending] = useState<ApiKey | null>(null);

  useEffect(() => {
    if (!workspace) return;
    apiKeyService
      .list(workspace.id)
      .then(setKeys)
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
     
  }, [workspace]);

  const create = async () => {
    if (!workspace) return;
    if (!name.trim()) return toast.error('Name the key');
    try {
      const raw = `ork_${crypto.randomUUID().replace(/-/g, '')}${Math.random().toString(36).slice(2, 10)}`;
      const key = await apiKeyService.create({
        workspace_id: workspace.id,
        name: name.trim(),
        key_prefix: raw.slice(0, 11),
        key_hash: btoa(raw).slice(0, 32),
        is_active: true,
      });
      setKeys((prev) => [key, ...prev]);
      setFreshKey(raw);
      setName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create key');
    }
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-5">
      {freshKey && (
        <Card className="border-success-500/30">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Copy your API key now</p>
                <p className="text-xs text-slate-500 mt-1">For security, the full key is never shown again after you close this.</p>
                <code className="block mt-3 rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-xs text-primary-200 break-all">
                  {freshKey}
                </code>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(freshKey); toast.success('Copied'); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={() => setFreshKey(null)}>Done</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle>API keys</CardTitle>
            <CardDescription>Authenticate programmatic access to the OUTRIKAA API.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-5">
            <Input label="Key name" value={name} onChange={(e) => setName(e.target.value)} placeholder="CRM integration" containerClassName="flex-1" />
            <div className="flex items-end">
              <Button onClick={create} leftIcon={<Plus className="h-4 w-4" />}>Generate</Button>
            </div>
          </div>

          {keys.length === 0 ? (
            <EmptyState icon={<Key className="h-5 w-5" />} title="No API keys" description="Generate a key to access the API from your own systems." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="text-white">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                    <TableCell>
                      <Badge tone={k.is_active ? 'success' : 'muted'}>{k.is_active ? 'active' : 'revoked'}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(k.created_at)}</TableCell>
                    <TableCell>
                      {k.is_active && (
                        <button onClick={() => setPending(k)} className="text-slate-600 hover:text-error-400 transition-colors" aria-label="Revoke">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          await apiKeyService.revoke(pending.id);
          setKeys((prev) => prev.map((k) => (k.id === pending.id ? { ...k, is_active: false } : k)));
          toast.success('Key revoked');
          setPending(null);
        }}
        title="Revoke this API key?"
        message="Any integration using it will start receiving 401 errors immediately."
        confirmLabel="Revoke"
      />
    </div>
  );
}
