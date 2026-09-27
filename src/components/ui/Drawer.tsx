import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function Drawer({ open, onClose, title, children, footer, side = 'right', className }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'absolute top-0 h-full w-[min(440px,100vw)] bg-base-bg-secondary border-white/12 flex flex-col animate-slide-in-right',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          side === 'left' && 'animate-slide-in-left',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/8">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
