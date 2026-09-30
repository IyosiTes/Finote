import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AvailabilityStatus } from '../../types/station'
import {
  getManagerStation,
  updateManagerAvailability,
  type ManagerStation,
} from './managerService'

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function statusLabel(status: AvailabilityStatus) {
  if (status === 'available') return 'Available'
  if (status === 'unavailable') return 'Unavailable'
  return 'Unknown'
}

function statusClasses(status: AvailabilityStatus) {
  if (status === 'available') {
    return {
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
    }
  }

  if (status === 'unavailable') {
    return {
      badge: 'bg-slate-100 text-slate-700 ring-slate-200',
      dot: 'bg-slate-500',
    }
  }

  return {
    badge: 'bg-gray-50 text-gray-600 ring-gray-200',
    dot: 'bg-gray-400',
  }
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#F6F8F9] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />

            <div>
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
            </div>
          </div>

          <div className="h-8 w-24 rounded-full bg-slate-200" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="mt-3 h-7 w-48 rounded bg-slate-200" />
          <div className="mt-5 h-4 w-36 rounded bg-slate-200" />
        </div>

        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-5 w-24 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-28 rounded bg-slate-200" />
                </div>

                <div className="h-7 w-20 rounded-full bg-slate-200" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="h-11 rounded-xl bg-slate-200" />
                <div className="h-11 rounded-xl bg-slate-200" />
                <div className="h-11 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

function InlineSpinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function IconCircle({
  children,
  tone = 'teal',
}: {
  children: React.ReactNode
  tone?: 'teal' | 'amber' | 'red'
}) {
  const classes = {
    teal: 'bg-[#E8F5F5] text-[#167C80]',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${classes[tone]}`}
    >
      {children}
    </div>
  )
}

export default function ManagerPage() {
  const { token: routeToken } = useParams<{ token: string }>()
  const token = routeToken ?? ''

  const [station, setStation] = useState<ManagerStation | null>(null)
const [loading, setLoading] = useState(Boolean(token))
const [error, setError] = useState('')
const [savingServiceId, setSavingServiceId] = useState<string | null>(null)

useEffect(() => {
  if (!token) return

  let cancelled = false

  async function loadStation() {
    try {
      const data = await getManagerStation(token)

      if (cancelled) return

      setStation(data)
      setLoading(false)
    } catch {
      if (cancelled) return

      setError(
        'This manager link is invalid, expired, or unavailable.',
      )
      setLoading(false)
    }
  }

  void loadStation()

  return () => {
    cancelled = true
  }
}, [token])

  async function handleAvailabilityChange(
    serviceId: string,
    availability: AvailabilityStatus,
  ) {
    if (!token || !station) return

    setSavingServiceId(serviceId)
    setError('')

    try {
      const result = await updateManagerAvailability(
        token,
        serviceId,
        availability,
      )

      setStation((current) => {
        if (!current) return current

        return {
          ...current,
          services: current.services.map((service) =>
            service.id === serviceId
              ? {
                  ...service,
                  availability: result.availability,
                  updatedAt: new Date().toISOString(),
                }
              : service,
          ),
        }
      })
    } catch {
      setError(
        'We could not update the availability. Please try again.',
      )
    } finally {
      setSavingServiceId(null)
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8F9] px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <IconCircle tone="amber">
            <span className="text-lg font-bold">!</span>
          </IconCircle>

          <div className="mt-5">
            <h1 className="text-lg font-semibold tracking-tight text-[#172033]">
              Manager link unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This manager link is missing or invalid. Please use the
              link provided by Finote.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (loading) {
    return <LoadingState />
  }

  if (error && !station) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8F9] px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto">
            <IconCircle tone="amber">
              <span className="text-lg font-bold">!</span>
            </IconCircle>
          </div>

          <h1 className="mt-5 text-lg font-semibold tracking-tight text-[#172033]">
            Manager link unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            If you believe this is a mistake, contact the station
            administrator.
          </p>
        </div>
      </main>
    )
  }

  if (!station) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8F9] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <span className="text-lg font-semibold text-slate-400">
              —
            </span>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Station unavailable
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please try again later.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F6F8F9] text-[#172033]">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#167C80] text-white shadow-sm">
              <span className="text-sm font-bold tracking-tight">
                F
              </span>
            </div>

            <div>
              <div className="text-[17px] font-semibold tracking-tight text-[#172033]">
                Finote
              </div>

              <div className="text-[11px] font-medium text-slate-400">
                Station manager
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="text-[#167C80]">✓</span>
            Secure link
          </div>
        </header>

        {/* Station overview */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                Station
              </p>

              <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-[#172033]">
                {station.name}
              </h1>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600 ring-1 ring-slate-200">
              {station.status}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <span className="text-[#167C80]">•</span>
            <span>Update your station availability below.</span>
          </div>
        </section>

        {/* Error banner */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
              !
            </span>

            <p className="leading-5">{error}</p>
          </div>
        )}

        {/* Availability section */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#172033]">
                Fuel availability
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Keep customers informed in real time.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {station.services.length}{' '}
              {station.services.length === 1 ? 'service' : 'services'}
            </span>
          </div>

          <div className="space-y-4">
            {station.services.map((service) => {
              const styles = statusClasses(service.availability)
              const saving = savingServiceId === service.id

              return (
                <article
                  key={service.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    {/* Service header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-[#172033]">
                          {service.fuelType.name}
                        </h3>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="text-slate-300">•</span>

                          <span>
                            {service.updatedAt
                              ? `Updated ${formatUpdatedAt(
                                  service.updatedAt,
                                )}`
                              : 'No update recorded'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                        />

                        {statusLabel(service.availability)}
                      </span>
                    </div>

                    {/* Availability controls */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        aria-label={`Mark ${service.fuelType.name} as available`}
                        onClick={() =>
                          handleAvailabilityChange(
                            service.id,
                            'available',
                          )
                        }
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition active:scale-[0.98] ${
                          service.availability === 'available'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {saving &&
                        service.availability !== 'available' ? (
                          <InlineSpinner />
                        ) : (
                          <span className="text-sm">✓</span>
                        )}

                        <span>Available</span>
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        aria-label={`Mark ${service.fuelType.name} as unavailable`}
                        onClick={() =>
                          handleAvailabilityChange(
                            service.id,
                            'unavailable',
                          )
                        }
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition active:scale-[0.98] ${
                          service.availability === 'unavailable'
                            ? 'border-slate-300 bg-slate-100 text-slate-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {saving &&
                        service.availability !== 'unavailable' ? (
                          <InlineSpinner />
                        ) : (
                          <span className="text-sm">×</span>
                        )}

                        <span>Unavailable</span>
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        aria-label={`Mark ${service.fuelType.name} as unknown`}
                        onClick={() =>
                          handleAvailabilityChange(
                            service.id,
                            'unknown',
                          )
                        }
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition active:scale-[0.98] ${
                          service.availability === 'unknown'
                            ? 'border-gray-200 bg-gray-50 text-gray-600'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {saving &&
                        service.availability !== 'unknown' ? (
                          <InlineSpinner />
                        ) : (
                          <span className="text-sm font-bold">?</span>
                        )}

                        <span>Unknown</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Trust / explanation */}
        <section className="mt-6 rounded-3xl border border-[#D8EAEA] bg-[#F1F8F8] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#167C80] shadow-sm">
              i
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#172033]">
                Keep availability accurate
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Drivers use Finote to decide where to refuel. Update
                the status whenever availability changes.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-2 py-8 text-center">
          <p className="text-xs leading-5 text-slate-400">
            Finote helps drivers know what's available before they
            arrive.
          </p>

          <p className="mt-1 text-[11px] text-slate-300">
            Real-time availability for better journeys.
          </p>
        </footer>
      </div>
    </main>
  )
}

