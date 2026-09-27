import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Mail, Clock, GitBranch, Square, Trash2, Save, ArrowDown, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Badge, Input, Textarea, Select, useToast, Skeleton, ErrorState, Modal, ConfirmDialog } from '@/components/ui';
import { sequenceService, templateService } from '@/services/db';
import type { Sequence, SequenceStep, EmailTemplate } from '@/types';
import { cn } from '@/lib/utils';

const stepMeta: Record<SequenceStep['step_type'], { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: 'text-primary-400 bg-primary-500/15 border-primary-500/30' },
  wait: { icon: Clock, label: 'Wait', color: 'text-accent-400 bg-accent-500/15 border-accent-500/30' },
  condition: { icon: GitBranch, label: 'Condition', color: 'text-warning-400 bg-warning-500/15 border-warning-500/30' },
  stop: { icon: Square, label: 'Stop', color: 'text-error-400 bg-error-500/15 border-error-500/30' },
};

export default function SequenceBuilder() {
  const { id } = useParams();
  const toast = useToast();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<SequenceStep['step_type'] | null>(null);
  const [editing, setEditing] = useState<SequenceStep | null>(null);
  const [confirm, setConfirm] = useState<SequenceStep | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [seq, st] = await Promise.all([sequenceService.get(id), sequenceService.steps(id)]);
        if (!seq) throw new Error('Sequence not found');
        setSequence(seq);
        setSteps(st);
        setTemplates(await templateService.list(seq.workspace_id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load sequence');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const addStep = async (type: SequenceStep['step_type']) => {
    if (!id) return;
    try {
      const step = await sequenceService.addStep({
        sequence_id: id,
        step_type: type,
        step_order: steps.length + 1,
        subject: type === 'email' ? 'Follow-up' : null,
        body: type === 'email' ? '' : null,
        wait_days: type === 'wait' ? 3 : 0,
        wait_hours: 0,
      });
      setSteps((prev) => [...prev, step]);
      setAdding(null);
      toast.success('Step added');
      if (type === 'email') setEditing(step);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add step');
    }
  };

  const saveStep = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await sequenceService.updateStep(editing.id, {
        subject: editing.subject,
        preview_text: editing.preview_text,
        body: editing.body,
        template_id: editing.template_id,
        wait_days: editing.wait_days,
        wait_hours: editing.wait_hours,
        condition_type: editing.condition_type,
      });
      setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(null);
      toast.success('Step saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeStep = async () => {
    if (!confirm) return;
    try {
      await sequenceService.removeStep(confirm.id);
      setSteps((prev) => prev.filter((s) => s.id !== confirm.id));
      toast.success('Step removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  if (!sequence) return <ErrorState title="Sequence not found" description="It may have been deleted." />;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/app/sequences" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to sequences
      </Link>

      <PageHeader
        title={sequence.name}
        description={sequence.description || 'Build the steps your leads will move through.'}
        actions={<Badge tone="primary">{steps.length} steps</Badge>}
      />

      <div className="space-y-3">
        {steps.map((step, i) => {
          const meta = stepMeta[step.step_type];
          const Icon = meta.icon;
          return (
            <div key={step.id}>
              <Card className="hover:border-white/20 transition-all">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn('h-10 w-10 shrink-0 grid place-items-center rounded-xl border', meta.color)}>
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {i + 1}. {meta.label}
                        {step.step_type === 'email' && step.subject ? ` — ${step.subject}` : ''}
                      </p>
                      <Badge tone="muted">step {step.step_order}</Badge>
                    </div>
                    {step.step_type === 'email' && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {step.body || 'No body yet — click edit to write it.'}
                      </p>
                    )}
                    {step.step_type === 'wait' && (
                      <p className="text-xs text-slate-500 mt-1">Wait {step.wait_days} day(s) {step.wait_hours} hour(s) before the next step.</p>
                    )}
                    {step.step_type === 'condition' && (
                      <p className="text-xs text-slate-500 mt-1">Branch when {step.condition_type ?? 'reply received'}.</p>
                    )}
                    {step.step_type === 'stop' && <p className="text-xs text-slate-500 mt-1">Ends the sequence for this lead.</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setEditing(step)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirm(step)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}

        {steps.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-slate-400">This sequence has no steps yet.</p>
              <p className="text-xs text-slate-600 mt-1">Add an email to start the flow.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-4">
        <p className="text-xs text-slate-500 mb-3">Add next step</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(stepMeta) as SequenceStep['step_type'][]).map((t) => (
            <Button key={t} size="sm" variant="outline" onClick={() => setAdding(t)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              {stepMeta[t].label}
            </Button>
          ))}
        </div>
      </div>

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title={`Add ${adding ?? ''} step`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdding(null)}>Cancel</Button>
            <Button onClick={() => addStep(adding!)}>Add step</Button>
          </>
        }
      >
        <p className="text-sm text-slate-400">
          {adding === 'email' && 'A follow-up email sent after the previous wait step.'}
          {adding === 'wait' && 'Pause the sequence for a number of days before continuing.'}
          {adding === 'condition' && 'Branch the sequence based on what the lead did.'}
          {adding === 'stop' && 'Stop sending to this lead permanently.'}
        </p>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit step"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={saving} onClick={saveStep} leftIcon={<Save className="h-4 w-4" />}>Save step</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {editing.step_type === 'email' && (
              <>
                <Select
                  label="Start from template"
                  value={editing.template_id ?? ''}
                  onChange={(e) => {
                    const t = templates.find((x) => x.id === e.target.value);
                    setEditing({
                      ...editing,
                      template_id: e.target.value || null,
                      subject: t?.subject ?? editing.subject,
                      body: t?.body ?? editing.body,
                    });
                  }}
                  placeholder="No template"
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                />
                <Input label="Subject" value={editing.subject ?? ''} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
                <Input label="Preview text" value={editing.preview_text ?? ''} onChange={(e) => setEditing({ ...editing, preview_text: e.target.value })} />
                <Textarea
                  label="Body"
                  rows={9}
                  value={editing.body ?? ''}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder="Hi {{first_name}}, …"
                  hint="Variables like {{first_name}}, {{company}} are replaced at send time."
                />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-primary-400" />
                  Need help? Use the{' '}
                  <Link to="/app/ai-writer" className="text-primary-400 underline underline-offset-2">AI Writer</Link>.
                </div>
              </>
            )}

            {editing.step_type === 'wait' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Days to wait" type="number" min={0} value={editing.wait_days} onChange={(e) => setEditing({ ...editing, wait_days: Number(e.target.value) })} />
                <Input label="Hours to wait" type="number" min={0} value={editing.wait_hours} onChange={(e) => setEditing({ ...editing, wait_hours: Number(e.target.value) })} />
              </div>
            )}

            {editing.step_type === 'condition' && (
              <Select
                label="Condition"
                value={editing.condition_type ?? 'opened'}
                onChange={(e) => setEditing({ ...editing, condition_type: e.target.value })}
                options={[
                  { value: 'opened', label: 'Lead opened previous email' },
                  { value: 'clicked', label: 'Lead clicked a link' },
                  { value: 'replied', label: 'Lead replied' },
                  { value: 'not_replied', label: 'Lead has not replied' },
                ]}
              />
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={removeStep}
        title="Remove this step?"
        message="Later steps will shift up to fill the gap."
        confirmLabel="Remove"
      />
    </div>
  );
}
