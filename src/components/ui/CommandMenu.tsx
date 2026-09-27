import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  icon?: ReactNode;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function CommandMenu({ open, onClose, items }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === 'Enter' && filtered[active]) {
        filtered[active].run();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const g = item.group ?? 'Results';
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/12 bg-base-bg-secondary shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-white/8">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search pages, actions…"
            className="flex-1 h-12 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-500 border border-white/12 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No results found</p>
          )}
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="mb-1">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{group}</p>
              {list.map((item) => {
                const idx = filtered.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      item.run();
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      idx === active ? 'bg-primary-500/15 text-white' : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    {item.icon && <span className="text-slate-400">{item.icon}</span>}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && <span className="text-xs text-slate-600">{item.hint}</span>}
                    {idx === active && <CornerDownLeft className="h-3.5 w-3.5 text-slate-500" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
