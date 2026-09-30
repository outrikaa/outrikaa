import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email');
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 grid place-items-center rounded-xl bg-success-500/15 border border-success-500/30 text-success-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-white">Check your inbox</h2>
              <p className="text-sm text-slate-400 mt-2">
                We sent a password reset link to <span className="text-white">{email}</span>. The link expires in 60 minutes.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white">Reset your password</h2>
              <p className="text-sm text-slate-500 mt-1.5">
                Enter your account email and we'll send you a reset link.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-sm text-error-400 bg-error-500/10 border border-error-500/25 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" loading={loading} className="w-full">
                  Send reset link
                </Button>
              </form>
            </>
          )}
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
