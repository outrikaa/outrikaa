import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  title?: string;
}

interface ToastContextValue {
  toast: (message: string, opts?: { tone?: ToastTone; title?: string }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: { tone?: ToastTone; title?: string }) => {
      const id = ++counter;
      setItems((prev) => [...prev.slice(-3), { id, message, tone: opts?.tone ?? 'info', title: opts?.title }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast,
    success: (message, title) => toast(message, { tone: 'success', title }),
    error: (message, title) => toast(message, { tone: 'error', title }),
    info: (message, title) => toast(message, { tone: 'info', title }),
    warning: (message, title) => toast(message, { tone: 'warning', title }),
  };

  const icons: Record<ToastTone, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-success-400" />,
    error: <AlertTriangle className="h-5 w-5 text-error-400" />,
    info: <Info className="h-5 w-5 text-accent-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-400" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
            {items.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 rounded-xl border border-white/12 bg-base-bg-secondary/95 backdrop-blur-xl p-3.5 shadow-2xl animate-slide-in-right"
              >
                <div className="mt-0.5 shrink-0">{icons[t.tone]}</div>
                <div className="flex-1 min-w-0">
                  {t.title && <p className="text-sm font-semibold text-white">{t.title}</p>}
                  <p className="text-sm text-slate-300 leading-snug">{t.message}</p>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-slate-500 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function cnToast(tone: ToastTone) {
  return cn(tone);
}
