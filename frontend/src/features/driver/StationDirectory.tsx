import type { Station } from '../../types/station'
import StationCard from '../../components/stations/StationCard'

type StationDirectoryProps = {
  stations: Station[]
  loading: boolean
  error: string
}

export default function StationDirectory({
  stations,
  loading,
  error,
}: StationDirectoryProps) {
  if (loading) {
    return (
      <div className="grid gap-px border border-border bg-surface sm:grid-cols-2">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse bg-surface"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-border bg-surface/60 px-5 py-6 text-sm text-[#89551B]">
        {error}
      </div>
    )
  }

  if (stations.length === 0) {
    return (
      <div className="border border-border bg-surface/50 px-5 py-12 text-center">
        <h3 className="text-base font-semibold text-ink">
          No active stations
        </h3>

        <p className="mt-2 text-sm text-[#7A827F]">
          There are currently no active fuel stations to display.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
        />
      ))}
    </div>
  )
}