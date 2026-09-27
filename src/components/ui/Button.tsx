import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-brand text-white hover:opacity-90 shadow-glow-primary active:scale-[0.98]',
  secondary:
    'bg-primary-500/15 text-primary-300 border border-primary-500/30 hover:bg-primary-500/25',
  outline:
    'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/25',
  ghost: 'text-slate-300 hover:bg-white/8 hover:text-white',
  danger: 'bg-error-600 text-white hover:bg-error-500 shadow-[0_4px_20px_rgba(239,68,68,0.25)]',
  success: 'bg-success-600 text-white hover:bg-success-500',
  link: 'text-primary-400 hover:text-primary-300 underline-offset-4 hover:underline px-0',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 whitespace-nowrap',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';
