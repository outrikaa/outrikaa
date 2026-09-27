import { useEffect, useState } from 'react';
import { RefreshCw, Save, Server, Sparkles, Mail, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Skeleton, useToast,
} from '@/components/ui';
import { db } from '@/services/db';
import { LoadError } from './shared';

interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
}

interface FieldDef {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'toggle';
  placeholder?: string;
  group: 'Platform' | 'AI & email' | 'Billing';
  defaultValue: unknown;
}

const fields: FieldDef[] = [
  { key: 'platform_maintenance_message', label: 'Maintenance notice', kind: 'text', placeholder: 'We are performing scheduled maintenance.', group: 'Platform', defaultValue: 'We are performing scheduled maintenance.' },
  { key: 'max_workspaces_per_user', label: 'Max workspaces per user', kind: 'number', group: 'Platform', defaultValue: 3 },
  { key: 'max_import_rows', label: 'Max rows per CSV import', kind: 'number', group: 'Platform', defaultValue: 5000 },
  { key: 'session_timeout_hours', label: 'Session timeout (hours)', kind: 'number', group: 'Platform', defaultValue: 720 },
  { key: 'ai_provider', label: 'AI provider', kind: 'text', placeholder: 'openai', group: 'AI & email', defaultValue: 'openai' },
  { key: 'ai_model', label: 'AI model', kind: 'text', placeholder: 'gpt-4o-mini', group: 'AI & email', defaultValue: 'gpt-4o-mini' },
  { key: 'ai_enabled', label: 'AI writer enabled', kind: 'toggle', group: 'AI & email', defaultValue: true },
  { key: 'default_daily_send_limit', label: 'Default daily send limit', kind: 'number', group: 'AI & email', defaultValue: 50 },
  { key: 'smtp_enabled', label: 'SMTP sending enabled', kind: 'toggle', group: 'AI & email', defaultValue: true },
  { key: 'trial_days', label: 'Trial length (days)', kind: 'number', group: 'Billing', defaultValue: 14 },
  { key: 'default_plan_slug', label: 'Default plan slug', kind: 'text', placeholder: 'starter', group: 'Billing', defaultValue: 'starter' },
  { key: 'stripe_enabled', label: 'Stripe billing enabled', kind: 'toggle', group: 'Billing', defaultValue: false },
];

const groupIcons = { Platform: Server, 'AI & email': Sparkles, Billing: DollarSign } as const;
void Mail;

export default function AdminSettings() {
  const toast = useToast();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await db.list<SettingRow>('system_settings', { orderBy: { column: 'key', ascending: true }, from: 0, to: 299 });
      setRows(settings);
      const next: Record<string, unknown> = {};
      for (const f of fields) {
        const found = settings.find((s) => s.key === f.key);
        next[f.key] = found ? found.value : f.defaultValue;
      }
      setDraft(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      for (const f of fields) {
        const raw = draft[f.key] ?? f.defaultValue;
        const value = f.kind === 'number' ? Number(raw) || 0 : raw;
        const existing = rows.find((r) => r.key === f.key);
        if (existing) {
          if (JSON.stringify(existing.value) !== JSON.stringify(value)) {
            await db.update('system_settings', existing.id, { value });
          }
        } else {
          await db.insert('system_settings', { key: f.key, value, description: null, is_public: false });
        }
      }
      await load();
      toast.success('System settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const otherRows = rows.filter((r) => !fields.some((f) => f.key === r.key));

  return (
    <div>
      <PageHeader
        title="System settings"
        description="Platform-wide configuration stored as key-value settings."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Reload
            </Button>
            <Button size="sm" onClick={save} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              Save changes
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : (
        <div className="space-y-5">
          {(['Platform', 'AI & email', 'Billing'] as const).map((group) => {
            const Icon = groupIcons[group];
            const groupFields = fields.filter((f) => f.group === group);
            return (
              <Card key={group}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary-400" /> {group}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupFields.map((f) => (
                    <div key={f.key}>
                      <label className="flex items-center gap-2 text-[13px] text-slate-400 mb-1.5">
                        {f.label}
                        <code className="text-[10px] text-slate-600">{f.key}</code>
                      </label>
                      {f.kind === 'toggle' ? (
                        <label className="inline-flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded accent-primary-500"
                            checked={Boolean(draft[f.key])}
                            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
                          />
                          <span className="text-sm text-slate-300">{draft[f.key] ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      ) : (
                        <Input
                          type={f.kind === 'number' ? 'number' : 'text'}
                          placeholder={f.placeholder}
                          value={String(draft[f.key] ?? '')}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              [f.key]: f.kind === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle>All stored settings</CardTitle>
            </CardHeader>
            <CardContent>
              {otherRows.length === 0 ? (
                <p className="text-sm text-slate-500">Only the settings above are stored.</p>
              ) : (
                <div className="space-y-3">
                  {otherRows.map((r) => (
                    <div key={r.id} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <code className="text-[12px] text-primary-300">{r.key}</code>
                        <Badge tone="muted">{r.is_public ? 'public' : 'private'}</Badge>
                      </div>
                      <pre className="mt-2 text-[11px] text-slate-500 overflow-x-auto">{JSON.stringify(r.value, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
            <Badge tone="muted">honesty</Badge>
            These values are configuration only — provider credentials and API keys are stored server-side and never
            displayed here.
          </p>
        </div>
      )}
    </div>
  );
}
