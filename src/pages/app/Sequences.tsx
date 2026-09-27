import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Workflow, Trash2, Copy } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, EmptyState, Skeleton, useToast, Modal, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { sequenceService } from '@/services/db';
import type { Sequence } from '@/types';
import { timeAgo } from '@/lib/utils';

export default function Sequences() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirm, setConfirm] = useState<Sequence | null>(null);

  useEffect(() => {
    if (!workspace) return;
    sequenceService
      .list(workspace.id)
      .then(setSequences)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load sequences'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const create = async () => {
    if (!workspace || !name.trim()) return;
    try {
      const seq = await sequenceService.create({
        workspace_id: workspace.id,
        name: name.trim(),
        description: description || null,
      });
      setSequences((prev) => [seq, ...prev]);
      setName('');
      setDescription('');
      setOpen(false);
      toast.success('Sequence created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create sequence');
    }
  };

  const duplicate = async (s: Sequence) => {
    if (!workspace) return;
    try {
      const copy = await sequenceService.create({
        workspace_id: workspace.id,
        name: `${s.name} (copy)`,
        description: s.description,
      });
      setSequences((prev) => [copy, ...prev]);
      toast.success('Sequence duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Sequences"
        description="Multi-step follow-up flows with waits, conditions and stop rules."
        actions={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>New sequence</Button>}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Workflow className="h-6 w-6" />}
              title="No sequences yet"
              description="A sequence defines what happens after the first email: wait, follow up, branch on reply."
              action={<Button size="sm" onClick={() => setOpen(true)}>Create sequence</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sequences.map((s) => (
            <Card key={s.id} className="group hover:border-white/20 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/app/sequences/${s.id}`} className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description || 'No description'}</p>
                  </Link>
                  <Badge tone="primary">Active</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3.5 border-t border-white/8">
                  <span className="text-[11px] text-slate-600">{timeAgo(s.created_at)}</span>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => duplicate(s)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirm(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New sequence"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create sequence</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Sequence name" value={name} onChange={(e) => setName(e.target.value)} placeholder="3-step follow-up" autoFocus />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this sequence for?" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          await sequenceService.remove(confirm.id);
          setSequences((prev) => prev.filter((s) => s.id !== confirm.id));
          toast.success('Sequence deleted');
          setConfirm(null);
        }}
        title="Delete this sequence?"
        message="Campaigns using this sequence will need a new one assigned."
        confirmLabel="Delete"
      />
    </div>
  );
}
