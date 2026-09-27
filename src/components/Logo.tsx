import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ className, to = '/', size = 'md' }: { className?: string; to?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
  const text = size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-xl' : 'text-[17px]';
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 group', className)}>
      <span className={cn('relative grid place-items-center rounded-lg bg-gradient-brand shadow-glow-sm', dims)}>
        <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%] text-white" aria-hidden>
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 9.8 12 12l4-2.2M12 12v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cn('font-bold tracking-tight text-white group-hover:text-primary-200 transition-colors', text)}>
        OUTRIKAA
      </span>
    </Link>
  );
}
