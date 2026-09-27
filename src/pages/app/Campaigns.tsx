import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Play, Pause, Copy, Archive, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, EmptyState, Skeleton, useToast, ConfirmDialog, Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { campaignService } from '@/services/db';
import type { Campaign } from '@/types';
import { formatDate } from '@/lib/utils';

const tone: Record<Campaign['status'], 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  draft: 'muted',
  scheduled: 'info',
  running: 'success',
  paused: 'warning',
  completed: 'primary',
  archived: 'default',
};

export default function Campaigns() {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const refresh = async () => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    try {
      setCampaigns(await campaignService.list(workspace.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const filtered = useMemo(
    () => campaigns.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [campaigns, search]
  );

  const setStatus = async (id: string, status: Campaign['status']) => {
    try {
      await campaignService.update(id, {
        status,
        ...(status === 'running' ? { launched_at: new Date().toISOString() } : {}),
        ...(status === 'paused' ? { paused_at: new Date().toISOString() } : {}),
      });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success(`Campaign ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const duplicate = async (c: Campaign) => {
    if (!workspace) return;
    try {
      const copy = await campaignService.create({
        workspace_id: workspace.id,
        name: `${c.name} (copy)`,
        description: c.description,
        lead_list_id: c.lead_list_id,
        mailbox_id: c.mailbox_id,
        sequence_id: c.sequence_id,
        status: 'draft',
        timezone: c.timezone,
        daily_limit: c.daily_limit,
        sending_days: c.sending_days,
        sending_start_time: c.sending_start_time,
        sending_end_time: c.sending_end_time,
        track_opens: c.track_opens,
        track_clicks: c.track_clicks,
        unsubscribe_enabled: c.unsubscribe_enabled,
      });
      setCampaigns((prev) => [copy, ...prev]);
      toast.success('Campaign duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      await campaignService.remove(confirm.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== confirm.id));
      toast.success('Campaign deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Create, schedule and track your outreach campaigns."
        actions={
          <Link to="/app/campaigns/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
          </Link>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search campaigns…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title={search ? 'No campaigns match your search' : 'No campaigns yet'}
              description="A campaign pairs a lead list with a mailbox and a sequence, then sends on your schedule."
              action={
                <Link to="/app/campaigns/new">
                  <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Create your first campaign</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group hover:border-white/20 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/app/campaigns/${c.id}`} className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description'}</p>
                  </Link>
                  <Badge tone={tone[c.status]} dot={c.status === 'running'}>
                    {c.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/4 border border-white/8 py-2">
                    <p className="text-sm font-semibold text-white">{c.daily_limit}</p>
                    <p className="text-[10px] text-slate-500">daily limit</p>
                  </div>
                  <div className="rounded-lg bg-white/4 border border-white/8 py-2">
                    <p className="text-sm font-semibold text-white">{(c.sending_days ?? []).length || 5}</p>
                    <p className="text-[10px] text-slate-500">send days</p>
                  </div>
                  <div className="rounded-lg bg-white/4 border border-white/8 py-2">
                    <p className="text-sm font-semibold text-white">{c.timezone.split('/')[1]?.replace('_', ' ') ?? 'Local'}</p>
                    <p className="text-[10px] text-slate-500">timezone</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3.5 border-t border-white/8">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span>Created {formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'running')} leftIcon={<Play className="h-3.5 w-3.5" />}>
                        Launch
                      </Button>
                    )}
                    {c.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'paused')} leftIcon={<Pause className="h-3.5 w-3.5" />}>
                        Pause
                      </Button>
                    )}
                    {c.status === 'paused' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'running')} leftIcon={<Play className="h-3.5 w-3.5" />}>
                        Resume
                      </Button>
                    )}
                    <Dropdown
                      trigger={
                        <button className="h-8 w-8 grid place-items-center rounded-lg border border-white/12 text-slate-400 hover:bg-white/10 transition-colors">
                          ⋯
                        </button>
                      }
                    >
                      <DropdownItem onClick={() => duplicate(c)} icon={<Copy className="h-4 w-4" />}>Duplicate</DropdownItem>
                      <DropdownItem onClick={() => navigate(`/app/campaigns/${c.id}`)}>Open details</DropdownItem>
                      <DropdownItem onClick={() => setStatus(c.id, 'archived')} icon={<Archive className="h-4 w-4" />}>Archive</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem danger onClick={() => setConfirm({ id: c.id, name: c.name })} icon={<Trash2 className="h-4 w-4" />}>
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title={`Delete "${confirm?.name ?? ''}"?`}
        message="This removes the campaign and its scheduled sends. Lead data is kept."
        confirmLabel="Delete"
      />
    </div>
  );
}
