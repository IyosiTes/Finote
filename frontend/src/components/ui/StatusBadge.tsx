
import type { HTMLAttributes } from 'react'

export type AvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'unknown'

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: AvailabilityStatus
  showDot?: boolean
}

const statusStyles: Record<
  AvailabilityStatus,
  { label: string; classes: string; dot: string }
> = {
  available: {
    label: 'Available',
    classes: 'bg-teal-50 text-teal-800 ring-teal-200',
    dot: 'bg-teal-600',
  },
  unavailable: {
    label: 'Unavailable',
    classes: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-600',
  },
  unknown: {
    label: 'Unknown',
    classes: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-500',
  },
}

export default function StatusBadge({
  status,
  showDot = true,
  className = '',
  ...props
}: StatusBadgeProps) {
  const config = statusStyles[status]

  return (
    <span
      className={[
        'inline-flex min-h-7 items-center gap-2 rounded-full px-3 py-1',
        'text-xs font-semibold ring-1 ring-inset',
        config.classes,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`}
        />
      )}

      {config.label}
    </span>
  )
}