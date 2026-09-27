import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ className, to = '/', size = 'md' }: { className?: string; to?: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-12' : 'h-10';
  return (
    <Link to={to} className={cn('inline-flex items-center group', className)}>
      <img
        src="/logo.png"
        alt="Outrikaa — AI Powered Email Outreach"
        width={900}
        height={300}
        className={cn(h, 'w-auto select-none')}
        draggable={false}
      />
    </Link>
  );
}
