import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Chrome, ArrowRight, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, Input, useToast } from '@/components/ui';
import { authService } from '@/services/auth';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email, password);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
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
        <Logo to="/" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white leading-tight max-w-sm">
            Turn cold leads into <span className="gradient-text">warm conversations</span>.
          </h1>
          <p className="mt-4 text-slate-400 max-w-sm text-sm leading-relaxed">
            Manage leads, write emails with AI, automate sequences and track every reply — from one workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success-400" /> 14-day free trial</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success-400" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success-400" /> Cancel anytime</span>
          </div>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} OUTRIKAA</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo to="/" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to continue to your workspace.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-error-400 bg-error-500/10 border border-error-500/25 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" defaultChecked />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-600">or continue with</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <Button variant="outline" className="w-full" size="lg" loading={googleLoading} onClick={google} leftIcon={<Chrome className="h-4 w-4" />}>
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
