import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Copy, Wand2, Minimize2, Maximize2, ThumbsUp, UserPlus, RefreshCw,
  FileText, Send, Save,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, Button, Input, Textarea, Select, Badge, useToast, Skeleton } from '@/components/ui';
import { aiService, type AIGenerateInput } from '@/services/ai';
import { useAuth } from '@/context/AuthContext';
import { templateService } from '@/services/db';

const actions: { id: AIGenerateInput['action']; label: string; icon: typeof Wand2 }[] = [
  { id: 'generate', label: 'Generate', icon: Wand2 },
  { id: 'rewrite', label: 'Rewrite', icon: RefreshCw },
  { id: 'improve', label: 'Improve', icon: ThumbsUp },
  { id: 'shorten', label: 'Shorten', icon: Minimize2 },
  { id: 'expand', label: 'Expand', icon: Maximize2 },
  { id: 'personalize', label: 'Personalize', icon: UserPlus },
];

const tones = ['professional', 'friendly', 'casual', 'formal', 'persuasive'];

export default function AIWriter() {
  const { workspace } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    audience: '',
    industry: '',
    product: 'OUTRIKAA',
    valueProp: '',
    cta: 'a quick 15-minute call',
    tone: 'professional',
    goal: 'Book a discovery call',
    input: '',
    leadName: '',
    leadCompany: '',
  });
  const [action, setAction] = useState<AIGenerateInput['action']>('generate');
  const [output, setOutput] = useState('');
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const run = async (a: AIGenerateInput['action'] = action) => {
    if (a !== 'subject_lines' && !form.valueProp && !form.audience && !form.input) {
      return toast.error('Fill in at least the audience or value proposition');
    }
    setAction(a);
    setLoading(true);
    try {
      const res = await aiService.generate({ ...form, action: a, count: 5 });
      if (a === 'subject_lines') {
        setSubjectLines(res.subjectLines ?? []);
        setOutput(res.subjectLines?.join('\n') ?? '');
      } else {
        setOutput(res.text ?? '');
        setSubjectLines([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const saveAsTemplate = async () => {
    if (!workspace) return;
    if (!templateName.trim()) return toast.error('Give the template a name');
    setSaving(true);
    try {
      const firstLine = output.split('\n').find((l) => l.trim()) ?? 'Email';
      await templateService.create({
        workspace_id: workspace.id,
        name: templateName.trim(),
        subject: subjectLines[0] ?? firstLine.slice(0, 80),
        body: output,
        tags: ['ai-generated'],
        preview_text: form.valueProp || null,
      });
      toast.success('Saved to templates');
      setShowSave(false);
      setTemplateName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Writer"
        description="Describe your audience and offer — the AI drafts outreach copy you can edit, copy or save."
        actions={
          <>
            <Badge tone="muted">Runs via edge function</Badge>
            <Link to="/app/templates"><Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>Templates</Button></Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-400" />
              <p className="text-sm font-semibold text-white">Inputs</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Audience" placeholder="B2B sales leaders" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
              <Select
                label="Industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Select industry"
                options={['SaaS', 'Agency', 'E-commerce', 'Finance', 'Healthcare', 'Recruiting', 'Real estate', 'Other'].map((i) => ({ value: i, label: i }))}
              />
            </div>

            <Input label="Product / service" placeholder="What are you selling?" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
            <Textarea
              label="Value proposition"
              rows={3}
              placeholder="Cuts manual prospecting time in half while lifting reply rates by 40%."
              value={form.valueProp}
              onChange={(e) => setForm({ ...form, valueProp: e.target.value })}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Call to action" placeholder="a quick 15-minute call" value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
              <Select label="Tone" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} options={tones.map((t) => ({ value: t, label: t }))} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Lead name (optional)" placeholder="Jane" value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} />
              <Input label="Lead company (optional)" placeholder="Acme Inc." value={form.leadCompany} onChange={(e) => setForm({ ...form, leadCompany: e.target.value })} />
            </div>

            <Textarea
              label="Source text to rewrite (optional)"
              rows={4}
              placeholder="Paste an existing email to rewrite, shorten or improve it."
              value={form.input}
              onChange={(e) => setForm({ ...form, input: e.target.value })}
            />

            <div className="pt-1">
              <p className="text-[13px] font-medium text-slate-300 mb-2">Actions</p>
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <Button
                    key={a.id}
                    size="sm"
                    variant={action === a.id ? 'secondary' : 'outline'}
                    onClick={() => run(a.id)}
                    disabled={loading}
                    leftIcon={<a.icon className="h-3.5 w-3.5" />}
                  >
                    {a.label}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => run('subject_lines')} disabled={loading}>
                  Subject lines
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Output</p>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={copy} disabled={!output} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSave(true)} disabled={!output} leftIcon={<Save className="h-3.5 w-3.5" />}>
                  Save
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
              </div>
            ) : output ? (
              <div className="rounded-xl border border-white/10 bg-white/4 p-4 flex-1 overflow-y-auto max-h-[520px]">
                {subjectLines.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Subject line ideas</p>
                    {subjectLines.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => navigator.clipboard.writeText(s).then(() => toast.success('Subject copied'))}
                        className="w-full text-left rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{output}</div>
              </div>
            ) : (
              <div className="flex-1 grid place-items-center py-14 text-center">
                <div>
                  <div className="mx-auto h-12 w-12 grid place-items-center rounded-xl bg-primary-500/15 border border-primary-500/25 text-primary-300 mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-400">Your generated copy will appear here.</p>
                  <p className="text-xs text-slate-600 mt-1">Fill in the inputs and hit Generate.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-white/8">
              <Link to="/app/campaigns" className="flex-1 min-w-[160px]">
                <Button variant="outline" className="w-full" disabled={!output} leftIcon={<Send className="h-4 w-4" />}>
                  Insert into campaign
                </Button>
              </Link>
              <Badge tone="info" className="ml-auto">AI generations count toward plan limits</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {showSave && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSave(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/12 bg-base-bg-secondary p-5 animate-scale-in">
            <p className="text-base font-semibold text-white">Save as template</p>
            <p className="text-sm text-slate-500 mt-1">Reuse this copy in any campaign.</p>
            <div className="mt-4">
              <Input label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Cold intro — SaaS CTOs" autoFocus />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSave(false)}>Cancel</Button>
              <Button size="sm" loading={saving} onClick={saveAsTemplate}>Save template</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
