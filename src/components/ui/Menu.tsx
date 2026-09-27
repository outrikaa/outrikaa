import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { value: string; label: string; icon?: ReactNode; count?: number }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value);
  const active = value ?? internal;
  const handle = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => handle(t.value)}
          className={cn(
            'inline-flex items-center gap-2 h-8 px-3 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all',
            active === t.value
              ? 'bg-primary-500/20 text-primary-200 border border-primary-500/30 shadow-glow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          )}
        >
          {t.icon}
          {t.label}
          {typeof t.count === 'number' && (
            <span className={cn('text-[11px] px-1.5 py-0.5 rounded-md', active === t.value ? 'bg-primary-500/30' : 'bg-white/8')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}

export function Dropdown({ trigger, children, align = 'right', className, panelClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[200px] rounded-xl border border-white/12 bg-base-bg-secondary/98 backdrop-blur-xl shadow-2xl animate-scale-in overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-left transition-colors',
        danger ? 'text-error-400 hover:bg-error-500/10' : 'text-slate-300 hover:bg-white/8 hover:text-white'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="h-px bg-white/8 my-1" />;
}
