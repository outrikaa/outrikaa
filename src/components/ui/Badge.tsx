import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-white/8 text-slate-300 border-white/10',
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  success: 'bg-success-500/15 text-success-300 border-success-500/30',
  warning: 'bg-warning-500/15 text-warning-300 border-warning-500/30',
  error: 'bg-error-500/15 text-error-300 border-error-500/30',
  info: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
  muted: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border whitespace-nowrap',
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}
