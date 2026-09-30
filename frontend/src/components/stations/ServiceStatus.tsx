import type { AvailabilityStatus } from '../../types/station'

type ServiceStatusProps = {
  status: AvailabilityStatus
}

const statusConfig: Record<
  AvailabilityStatus,
  {
    label: string
    className: string
    dotClassName: string
  }
> = {
  available: {
    label: 'Available',
    className: 'text-[#17634F]',
    dotClassName: 'bg-[#167C80]',
  },
  unavailable: {
    label: 'Unavailable',
    className: 'text-[#89551B]',
    dotClassName: 'bg-[#A65D2D]',
  },
  unknown: {
    label: 'Unknown',
    className: 'text-[#747A77]',
    dotClassName: 'bg-[#747A77]',
  },
}

export default function ServiceStatus({
  status,
}: ServiceStatusProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-widest ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`}
      />

      {config.label}
    </span>
  )
}