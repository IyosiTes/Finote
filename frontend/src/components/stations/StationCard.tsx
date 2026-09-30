import type { Station } from '../../types/station'
import ServiceStatus from './ServiceStatus'

type StationCardProps = {
  station: Station
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return 'Update time unavailable'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Update time unavailable'
  }

  return `Updated ${new Intl.DateTimeFormat('en-ET', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)}`
}

export default function StationCard({
  station,
}: StationCardProps) {
  return (
    <article className="bg-surface/65 p-5 transition-colors duration-200 hover:bg-[#FAF9F4]/80 sm:p-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-5">

        <div className="min-w-0">

          <h3 className="wrap-break-words text-lg font-semibold tracking-tight text-ink">
            {station.name}
          </h3>

          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#8A918E]">
            {formatUpdatedAt(station.updatedAt)}
          </p>

        </div>

        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#167C80]">
          Active
        </span>

      </div>


      {/* Services */}
      {station.services.length > 0 ? (
        <div className="mt-7 divide-y divide-[#DEDAD0]">

          {station.services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >

              <div className="min-w-0">

                <p className="text-sm font-medium text-[#405253]">
                  {service.name}
                </p>

                <p className="mt-1 text-[10px] text-[#8A918E]">
                  {formatUpdatedAt(service.updatedAt)}
                </p>

              </div>

              <ServiceStatus
                status={service.availability}
              />

            </div>
          ))}

        </div>
      ) : (
        <p className="mt-7 border border-[#DEDAD0] bg-[#F0EEE7]/50 px-4 py-4 text-sm text-muted">
          No service information available.
        </p>
      )}

    </article>
  )
}