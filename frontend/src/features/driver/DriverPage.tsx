import { useEffect, useState } from 'react'
import type { Station } from '../../types/station'
import { getActiveStations } from './driverService'
import StationDirectory from './StationDirectory'

export default function DriverPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStations() {
      setLoading(true)
      setError('')

      try {
        const data = await getActiveStations()

        if (!cancelled) {
          setStations(data)
        }
      } catch {
        if (!cancelled) {
          setError('We could not load station information. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStations()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen text-ink">
      {/* Framed column: hairline sides and a lighter sheet, like S.M.A */}
      <div className="mx-auto flex min-h-screen max-w-336 flex-col border-x border-border bg-surface/50">
        {/* ───────────── Header (cell bar) ───────────── */}
       {/* ───────────── Header ───────────── */}
<header className="border-b border-[#D9D6CD]/80 bg-surface/60">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">

    {/* Logo + Finote */}
    <div className="flex items-center gap-3">
      <img
        src="/favicon.png"
        alt="Finote"
        className="h-8 w-8 shrink-0 object-contain"
      />

      <div>
        <p className="text-lg font-semibold leading-none tracking-[-0.03em] text-[#167C80]">
          Finote
        </p>

        <p className="mt-1.5 text-[11px] tracking-[0.08em] text-[#747C79]">
          Know before you go.
        </p>
      </div>
    </div>

    {/* Amharic */}
    <span className="text-[10px] uppercase tracking-[0.18em] text-[#929793]">
      ፍኖት
    </span>

  </div>
</header>

        {/* ───────────── Hero ───────────── */}
        <section className="px-5 pb-14 pt-16 sm:px-10 sm:pb-20 sm:pt-24">
          <p className="text-[13px] font-medium text-muted">
            Fuel availability
          </p>

          <h1 className="mt-5 max-w-2xl text-[clamp(2.4rem,7vw,4.75rem)] font-light leading-[1.06] tracking-[-0.045em]">
            Uncertainty
            <br />
            <span className="font-medium text-[#325e60]">is expensive.</span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] font-light leading-7 text-muted">
            See the latest availability reported by fuel station managers
            before you make the trip.
          </p>
        </section>

        {/* ───────────── Stations ───────────── */}
        <section className="flex-1 px-5 pb-16 sm:px-10">
          <div className="border border-border bg-surface/60">
            <div className="flex items-stretch justify-between border-b border-border">
              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-accent" />
                  <h2 className="text-[16px] font-semibold tracking-tight">
                    Active stations
                  </h2>
                </div>
                <p className="mt-1.5 text-[12px] font-light leading-5 text-muted">
                  Latest availability reported by Finote stations.
                </p>
              </div>

              {!loading && !error && (
                <div className="flex items-center bg-taupe px-5 text-[13px] font-semibold text-white">
                  {stations.length}{' '}
                  {stations.length === 1 ? 'station' : 'stations'}
                </div>
              )}
            </div>
                <div className="p-3 sm:p-4">
              <StationDirectory
                stations={stations}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </section>

        {/* ───────────── Footer ───────────── */}
        <footer className="border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-5 py-6 text-[13px] font-light text-muted">
            <span>Finote · ፍኖት</span>
            <span>Fuel information</span>
          </div>
        </footer>
      </div>
    </main>
  )
}