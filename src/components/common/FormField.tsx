import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  error?: string;
  labelClassName?: string;
  inputClassName?: string;
  /** Rendered next to the label (e.g. "Forgot password?"). */
  labelAside?: React.ReactNode;
}

const fieldClass = 'w-full rounded-md bg-[#FFFCF7] text-[#2E2D2B] border border-[#7E7C77]/25 focus:outline-none focus:border-[#6B7B6E] focus:ring-2 focus:ring-[#6B7B6E]/10';

function FieldShell({
  id,
  label,
  error,
  labelClassName = 'text-[#7E7C77] uppercase font-mono',
  labelAside,
  children,
}: Pick<BaseProps, 'label' | 'error' | 'labelClassName' | 'labelAside'> & { id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {labelAside ? (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className={labelClassName}>{label}</label>
          {labelAside}
        </div>
      ) : (
        <label htmlFor={id} className={`block ${labelClassName}`}>{label}</label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-red-400 font-mono">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  labelClassName,
  labelAside,
  inputClassName = 'p-3',
  ...input
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} labelClassName={labelClassName} labelAside={labelAside}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClass} ${inputClassName}`}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  labelClassName,
  inputClassName = 'p-3',
  ...input
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} labelClassName={labelClassName}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClass} ${inputClassName}`}
        {...input}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  options,
  ...select
}: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label}>
      <select id={id} className={`${fieldClass} p-3`} {...select}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </FieldShell>
  );
}
