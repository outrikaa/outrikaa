import { useEffect, useState } from 'react';
import { RefreshCw, Save, Globe, ShieldAlert, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge, Skeleton, useToast,
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

type FieldKind = 'text' | 'textarea' | 'toggle';

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  description?: string;
  group: 'Site' | 'Access' | 'Legal';
  defaultValue: unknown;
}

const fields: FieldDef[] = [
  { key: 'site_name', label: 'Site name', kind: 'text', placeholder: 'OUTRIKAA', group: 'Site', defaultValue: 'OUTRIKAA', description: 'Shown in the navbar and footer.' },
  { key: 'site_tagline', label: 'Tagline', kind: 'text', placeholder: 'Email outreach, automated.', group: 'Site', defaultValue: 'Email outreach, automated.', description: 'Short line under the logo.' },
  { key: 'meta_description', label: 'Meta description', kind: 'textarea', group: 'Site', defaultValue: '', description: 'Default description for search engines.' },
  { key: 'footer_text', label: 'Footer text', kind: 'textarea', group: 'Site', defaultValue: '', description: 'Extra line rendered in the site footer.' },
  { key: 'support_email', label: 'Support email', kind: 'text', placeholder: 'support@outrikaa.com', group: 'Access', defaultValue: 'support@outrikaa.com' },
  { key: 'signup_enabled', label: 'Open signups', kind: 'toggle', group: 'Access', defaultValue: true, description: 'Turn off to close registrations during incidents.' },
  { key: 'maintenance_mode', label: 'Maintenance mode', kind: 'toggle', group: 'Access', defaultValue: false, description: 'Displays a maintenance notice to non-admin users.' },
  { key: 'privacy_effective_date', label: 'Privacy policy date', kind: 'text', placeholder: 'September 2026', group: 'Legal', defaultValue: 'September 2026' },
  { key: 'terms_effective_date', label: 'Terms effective date', kind: 'text', placeholder: 'September 2026', group: 'Legal', defaultValue: 'September 2026' },
];

export default function AdminCMS() {
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
      const settings = await db.list<SettingRow>('system_settings', { orderBy: { column: 'key', ascending: true }, from: 0, to: 199 });
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
        const value = draft[f.key] ?? f.defaultValue;
        const existing = rows.find((r) => r.key === f.key);
        if (existing) {
          if (JSON.stringify(existing.value) !== JSON.stringify(value)) {
            await db.update('system_settings', existing.id, { value });
          }
        } else {
          await db.insert('system_settings', {
            key: f.key,
            value,
            description: f.description ?? null,
            is_public: f.key.startsWith('site_') || f.key.startsWith('meta_'),
          });
        }
      }
      await load();
      toast.success('Site settings saved');
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
        title="CMS"
        description="Content and presentation settings for the public site."
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
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <LoadError message={error} />
      ) : (
        <div className="space-y-5">
          {(['Site', 'Access', 'Legal'] as const).map((group) => {
            const groupFields = fields.filter((f) => f.group === group);
            const Icon = group === 'Site' ? Globe : group === 'Access' ? ShieldAlert : FileText;
            return (
              <Card key={group}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary-400" /> {group}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {groupFields.map((f) => (
                    <div key={f.key} className={f.kind === 'textarea' ? 'sm:col-span-2' : ''}>
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
                      ) : f.kind === 'textarea' ? (
                        <Textarea
                          rows={3}
                          placeholder={f.placeholder}
                          value={String(draft[f.key] ?? '')}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        />
                      ) : (
                        <Input
                          placeholder={f.placeholder}
                          value={String(draft[f.key] ?? '')}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        />
                      )}
                      {f.description && <p className="mt-1.5 text-[11px] text-slate-600">{f.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle>Raw settings</CardTitle>
            </CardHeader>
            <CardContent>
              {otherRows.length === 0 ? (
                <p className="text-sm text-slate-500">No additional settings stored.</p>
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
        </div>
      )}
    </div>
  );
}
