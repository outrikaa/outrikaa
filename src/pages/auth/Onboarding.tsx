import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Upload, Mail, Megaphone, Sparkles, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, Input, Select, useToast } from '@/components/ui';
import { db } from '@/services/db';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const steps = ['Your profile', 'Your goal', 'Import leads', 'Connect mailbox', 'First campaign'];

const goals = [
  { id: 'pipeline', label: 'Generate more pipeline', desc: 'Book more meetings with cold outbound' },
  { id: 'recruiting', label: 'Recruiting outreach', desc: 'Reach candidates and keep responses organised' },
  { id: 'partnerships', label: 'Partnerships', desc: 'Develop strategic and channel partners' },
  { id: 'fundraising', label: 'Fundraising', desc: 'Connect with investors and stakeholders' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('pipeline');
  const [saving, setSaving] = useState(false);
  const { profile, workspace, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (profile && profile.full_name && fullName === '') {
    setFullName(profile.full_name);
  }

  const finish = async () => {
    setSaving(true);
    try {
      if (profile) {
        await db.update('profiles', profile.id, {
          full_name: fullName || profile.full_name,
          company: company || profile.company,
          job_title: role || profile.job_title,
          onboarding_completed: true,
          onboarding_step: 4,
        });
      }
      if (workspace && industry) {
        await db.update('workspaces', workspace.id, { industry });
      }
      await refresh();
      toast.success('Workspace ready', 'Let’s build your first campaign');
      navigate('/app');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
      setSaving(false);
    }
  };

  const nextFromProfile = (e: FormEvent) => {
    e.preventDefault();
    setStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-primary-600/20 blur-[130px]" />
      <header className="relative border-b border-white/8">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <Logo to="/" size="sm" />
          <button onClick={finish} className="text-xs text-slate-500 hover:text-white transition-colors">
            Skip setup
          </button>
        </div>
      </header>

      <div className="relative flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i < step ? 'bg-primary-500' : i === step ? 'bg-primary-500/60' : 'bg-white/10'
                  )}
                />
                <p className={cn('mt-2 text-[10px] truncate', i === step ? 'text-primary-300' : 'text-slate-600')}>
                  {s}
                </p>
              </div>
            ))}
          </div>

          {step === 0 && (
            <form onSubmit={nextFromProfile} className="animate-fade-in-up">
              <h1 className="text-2xl font-bold text-white">Tell us about yourself</h1>
              <p className="text-sm text-slate-500 mt-1.5">This personalises your workspace and AI outputs.</p>
              <div className="mt-7 space-y-4">
                <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Rivera" required />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
                  <Input label="Job title" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Head of Sales" />
                </div>
                <Select
                  label="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Select industry"
                  options={[
                    { value: 'saas', label: 'SaaS / Software' },
                    { value: 'agency', label: 'Agency' },
                    { value: 'ecommerce', label: 'E-commerce' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'healthcare', label: 'Healthcare' },
                    { value: 'education', label: 'Education' },
                    { value: 'recruiting', label: 'Recruiting' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <Button type="submit" className="mt-7 w-full" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            </form>
          )}

          {step === 1 && (
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-bold text-white">What's your primary goal?</h1>
              <p className="text-sm text-slate-500 mt-1.5">We'll tailor templates and insights to it.</p>
              <div className="mt-7 grid gap-3">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      'text-left rounded-xl border p-4 transition-all',
                      goal === g.id
                        ? 'border-primary-500/50 bg-primary-500/10 shadow-glow-sm'
                        : 'border-white/10 bg-white/4 hover:bg-white/8'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{g.label}</p>
                      {goal === g.id && <Check className="h-4 w-4 text-primary-300" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{g.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-7 flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <div className="h-12 w-12 grid place-items-center rounded-xl bg-primary-500/15 border border-primary-500/25 text-primary-300 mb-4">
                <Upload className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-white">Import your leads</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Upload a CSV with names, emails and companies — we'll detect and map the columns for you.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/4 p-6 text-center">
                <p className="text-sm text-slate-400">You can do this any time from the Leads page.</p>
              </div>
              <div className="mt-7 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => navigate('/app/leads?import=1')}>
                  <Users className="h-4 w-4 mr-1.5" /> Import leads now
                </Button>
                <Button variant="ghost" onClick={() => setStep(3)}>
                  Skip
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up">
              <div className="h-12 w-12 grid place-items-center rounded-xl bg-accent-500/15 border border-accent-500/25 text-accent-300 mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-white">Connect a mailbox</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Link Gmail, Google Workspace, Outlook or Microsoft 365 to start sending. OAuth credentials are required
                before a mailbox can go live.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {['Gmail', 'Google Workspace', 'Outlook', 'Microsoft 365'].map((p) => (
                  <div key={p} className="rounded-xl border border-white/10 bg-white/4 p-4 text-sm text-slate-300 flex items-center justify-between">
                    {p}
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">OAuth</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => navigate('/app/mailboxes')}>
                  <Mail className="h-4 w-4 mr-1.5" /> Connect mailbox
                </Button>
                <Button variant="ghost" onClick={() => setStep(4)}>
                  Skip
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in-up">
              <div className="h-12 w-12 grid place-items-center rounded-xl bg-success-500/15 border border-success-500/25 text-success-300 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-white">Create your first campaign</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Pick a lead list, write (or let AI write) your first email, set a schedule and launch.
              </p>
              <div className="mt-6 space-y-2">
                {['Choose a lead list', 'AI drafts your email', 'Set sending window', 'Launch and track'].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg bg-white/4 border border-white/8 px-3.5 py-2.5">
                    <span className="h-5 w-5 grid place-items-center rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => navigate('/app/campaigns/new')} leftIcon={<Megaphone className="h-4 w-4" />}>
                  Create campaign
                </Button>
                <Button variant="ghost" loading={saving} onClick={finish}>
                  Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
