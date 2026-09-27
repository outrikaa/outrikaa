import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-2xl border border-white/12 bg-base-bg-secondary shadow-2xl animate-scale-in',
          sizes[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start gap-4 px-5 pt-5 pb-4 border-b border-white/8">
            <div className="flex-1 min-w-0">
              {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
              {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1 -m-1 rounded-lg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-white/8 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm rounded-xl border border-white/12 text-slate-300 hover:bg-white/8 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-9 px-4 text-sm rounded-xl font-medium text-white transition-all disabled:opacity-50',
              tone === 'danger'
                ? 'bg-error-600 hover:bg-error-500'
                : 'bg-gradient-brand hover:opacity-90'
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
    </Modal>
  );
}
