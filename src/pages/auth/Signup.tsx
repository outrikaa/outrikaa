import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Chrome, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, Input, useToast } from '@/components/ui';
import { authService } from '@/services/auth';
import { workspaceService, db } from '@/services/db';
import { useAuth } from '@/context/AuthContext';
import { isValidEmail, slugify } from '@/lib/utils';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useAuth();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      const { user } = await authService.signUp(email, password, { full_name: name });

      if (user) {
        try {
          await db.insert('profiles', { id: user.id, email, full_name: name });
        } catch {
          /* profile may already exist via trigger */
        }
        try {
          const ws = await workspaceService.create(
            name ? `${name.split(' ')[0]}'s Workspace` : `${slugify(email.split('@')[0])} workspace`,
            user.id,
            { slug: slugify(email.split('@')[0]) }
          );
          await db.insert('notifications', {
            user_id: user.id,
            workspace_id: ws.id,
            type: 'welcome',
            title: 'Welcome to OUTRIKAA',
            message: 'Import your first list of leads to get started.',
            icon: 'sparkles',
            link: '/app/leads',
          });
        } catch (setupErr) {
          console.error('workspace setup failed', setupErr);
          toast.warning('Your account was created but workspace setup failed. Sign in again to retry.', 'Workspace setup');
        }
        await refresh();
      }

      toast.success('Account created', 'Check your inbox to verify your email');
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-dark grid-bg relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-600/25 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-accent-500/15 blur-[100px]" />
        <Logo to="/" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white leading-tight max-w-sm">
            Your outreach, <span className="gradient-text">finally in one place</span>.
          </h1>
          <ul className="mt-6 space-y-3 text-sm text-slate-400">
            {['Import leads from CSV in seconds', 'AI writes your first-touch emails', 'Visual sequences with delays & conditions', 'Real-time open, reply and bounce tracking'].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-1 h-4 w-4 grid place-items-center rounded-full bg-primary-500/20 text-primary-300 text-[10px]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} OUTRIKAA</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo to="/" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1.5">Free 14-day trial. No credit card required.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Input
              label="Full name"
              placeholder="Alex Rivera"
              autoComplete="name"
              leftIcon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimum 8 characters."
              required
            />
            {error && (
              <p className="text-sm text-error-400 bg-error-500/10 border border-error-500/25 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Create account
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-600">or sign up with</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <Button variant="outline" className="w-full" size="lg" loading={googleLoading} onClick={google} leftIcon={<Chrome className="h-4 w-4" />}>
            Google
          </Button>

          <p className="mt-6 text-center text-xs text-slate-600 leading-relaxed">
            By signing up you agree to our{' '}
            <Link to="/terms" className="text-slate-400 underline underline-offset-2">Terms</Link> and{' '}
            <Link to="/privacy" className="text-slate-400 underline underline-offset-2">Privacy Policy</Link>.
          </p>
          <p className="mt-3 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
