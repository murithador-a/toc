import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertTriangle } from './icons'

const controlBase =
  'w-full border bg-white px-4 py-3 font-sans text-[0.9375rem] text-charcoal transition-colors duration-200 placeholder:text-stone-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500'

const controlState = (invalid: boolean) =>
  invalid
    ? 'border-[#9c3b2e] focus:border-[#9c3b2e]'
    : 'border-stone-300 hover:border-stone-400 focus:border-charcoal'

type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  optionalLabel?: string
  children: ReactNode
  className?: string
}

export function Field({ id, label, hint, error, required, optionalLabel, children, className = '' }: FieldProps) {
  return (
    <div className={`${className}`}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 font-sans text-[0.8125rem] font-semibold text-charcoal">
        <span>
          {label}
          {required ? (
            <span className="ml-1 text-bronze" aria-hidden="true">
              *
            </span>
          ) : (
            <span className="ml-2 font-normal text-stone-500">{optionalLabel ?? 'optional'}</span>
          )}
        </span>
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 font-sans text-[0.8125rem] leading-relaxed text-stone-500">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 font-sans text-[0.8125rem] text-[#9c3b2e]">
          <AlertTriangle className="mt-[0.15rem] h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

export function TextInput({
  id,
  invalid = false,
  hint,
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { id: string; invalid?: boolean; hint?: string; error?: string }) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlBase} ${controlState(invalid)} ${className}`}
      {...rest}
    />
  )
}

export function SelectInput({
  id,
  invalid = false,
  hint,
  error,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; invalid?: boolean; hint?: string; error?: string }) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlBase} ${controlState(invalid)} appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23242724%27%20stroke-width%3D%271.5%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E")] bg-[length:1.05rem] bg-[right_1rem_center] bg-no-repeat pr-11 ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}

export function TextArea({
  id,
  invalid = false,
  hint,
  error,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; invalid?: boolean; hint?: string; error?: string }) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlBase} ${controlState(invalid)} min-h-[8.5rem] resize-y leading-relaxed ${className}`}
      {...rest}
    />
  )
}

export function CheckboxField({
  id,
  checked,
  onChange,
  invalid = false,
  error,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  invalid?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`mt-[0.2rem] h-4 w-4 shrink-0 cursor-pointer appearance-none border bg-white transition-colors checked:border-charcoal checked:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 ${
            invalid ? 'border-[#9c3b2e]' : 'border-stone-400'
          } checked:bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23F5F2EC%27%20stroke-width%3D%273%27%3E%3Cpath%20d%3D%27m4%2012%205%205L20%206%27%2F%3E%3C%2Fsvg%3E")] checked:bg-[length:0.9rem] checked:bg-center checked:bg-no-repeat`}
        />
        <label htmlFor={id} className="font-sans text-[0.8125rem] leading-relaxed text-stone-600">
          {children}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 font-sans text-[0.8125rem] text-[#9c3b2e]">
          <AlertTriangle className="mt-[0.15rem] h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
