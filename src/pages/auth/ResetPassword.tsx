import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, Input, useToast } from '@/components/ui';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setError('This reset link is invalid or has expired. Request a new one.');
    });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await authService.updatePassword(password);
      toast.success('Password updated');
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo to="/" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-base-card/80 backdrop-blur-xl p-7">
          <h2 className="text-lg font-semibold text-white">Set a new password</h2>
          <p className="text-sm text-slate-500 mt-1.5">Choose a strong password you haven't used before.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-error-400 bg-error-500/10 border border-error-500/25 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
          <Link
            to="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
