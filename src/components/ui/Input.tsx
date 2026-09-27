import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full bg-white/5 border border-white/10 rounded-xl px-3.5 text-sm text-slate-100 placeholder:text-slate-500 ' +
  'transition-all duration-200 focus:outline-none focus:border-primary-500/60 focus:bg-white/8 focus:ring-2 focus:ring-primary-500/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, containerClassName, id, ...props }, ref) => (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(base, leftIcon && 'pl-9', error && 'border-error-500/60', className)}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-error-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(base, 'min-h-[96px] py-2.5 resize-y', error && 'border-error-500/60', className)}
        {...props}
      />
      {error ? (
        <p className="text-xs text-error-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(base, 'appearance-none pr-9 bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke=\'%2394A3B8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat', error && 'border-error-500/60', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-error-400">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
