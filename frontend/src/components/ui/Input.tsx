
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      id,
      className = '',
      containerClassName = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = `${inputId}-hint`
    const errorId = `${inputId}-error`

    const describedBy = [
      hint ? hintId : undefined,
      error ? errorId : undefined,
      props['aria-describedby'],
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className={`flex w-full flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'min-h-11 w-full rounded-xl border bg-surface px-3.5 py-2.5',
            'text-sm text-ink placeholder:text-muted',
            'outline-none transition',
            'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
            'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
            error
              ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-200'
              : 'border-border',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input