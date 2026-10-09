import { forwardRef, type InputHTMLAttributes } from 'react'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

/** Input de texto con label, ayuda y error accesibles. Los forms de la feature
 *  de perfil lo usan via react-hook-form (register). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, id, name, className = '', ...props }, ref) => {
    const inputId = id ?? name
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined

    const describedBy =
      [errorId, hintId].filter(Boolean).join(' ') || undefined

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`
            mt-2 w-full rounded-lg border px-4 py-3 outline-none transition
            focus:ring-2
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
            }
            ${className}
          `}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

TextField.displayName = 'TextField'
