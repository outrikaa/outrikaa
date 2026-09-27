import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button, useToast } from '@/components/ui';
import { authService } from '@/services/auth';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as { email?: string } | null)?.email ?? '';
  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authService.resendVerification(email);
      toast.success('Verification email resent');
    } catch {
      toast.error('Could not resend — try again shortly');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary-600/20 blur-[110px]" />
      <div className="relative w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <Logo to="/" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-base-card/80 backdrop-blur-xl p-7">
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-xl bg-primary-500/15 border border-primary-500/30 text-primary-300 mb-4">
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-white">Verify your email</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-white">{email || 'your inbox'}</span>. Click it to activate your account, then sign in.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue to sign in
          </Button>
          {email && (
            <Button variant="ghost" className="mt-2 w-full" loading={resending} onClick={resend}>
              Resend verification email
            </Button>
          )}
          <p className="mt-5 text-xs text-slate-600">
            Wrong address?{' '}
            <Link to="/signup" className="text-slate-400 underline underline-offset-2">
              Create a new account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
