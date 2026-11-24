import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

const controlBase =
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60';
const controlState = (error?: string): string => (error ? 'border-rose-500' : 'border-line');

function FieldShell({ id, label, error, hint, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describe = (id: string, error?: string, hint?: string): string | undefined => (error || hint ? `${id}-msg` : undefined);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{leftIcon}</span>}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe(fieldId, error, hint)}
          className={cn(controlBase, controlState(error), leftIcon ? 'pl-10' : null, rightSlot ? 'pr-11' : null, className)}
          {...rest}
        />
        {rightSlot && <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>}
      </div>
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fieldId, error, hint)}
        className={cn(controlBase, controlState(error), 'appearance-auto pr-8', className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fieldId, error, hint)}
        className={cn(controlBase, controlState(error), 'resize-y', className)}
        {...rest}
      />
    </FieldShell>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, id, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={cn('flex cursor-pointer items-center gap-2.5 text-sm text-fg', className)}>
      <input ref={ref} id={fieldId} type="checkbox" className="h-4 w-4 rounded border-line accent-brand" {...rest} />
      {label}
    </label>
  );
});
