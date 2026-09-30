import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Station = {
  id: string
  name: string
}

type StationResponse = {
  success: boolean
  stations: Station[]
}

type ManagerLinkResponse = {
  success: boolean
  manager_link_id: string
  manager_url: string
}

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStationId, setSelectedStationId] =
    useState('')
  const [managerUrl, setManagerUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStations, setLoadingStations] =
    useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    setManagerUrl('')

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        throw error
      }

      if (!data.session?.access_token) {
        throw new Error('No access token returned')
      }

      await loadStations()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Login failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadStations() {
    setLoadingStations(true)
    setError('')

    try {
      const { data, error } =
        await supabase.functions.invoke<StationResponse>(
          'admin-list-stations',
          {
            method: 'GET',
          },
        )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error('Unable to load stations.')
      }

      setStations(data.stations)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load stations.',
      )
    } finally {
      setLoadingStations(false)
    }
  }

  async function handleCreateManagerLink() {
    if (!selectedStationId) {
      setError('Select a station first.')
      return
    }

    setLoading(true)
    setError('')
    setManagerUrl('')

    try {
      const { data, error } =
        await supabase.functions.invoke<ManagerLinkResponse>(
          'admin-create-manager-link',
          {
            body: {
              station_id: selectedStationId,
            },
          },
        )

      if (error) {
        throw error
      }

      if (!data?.success || !data.manager_url) {
        throw new Error(
          'Unable to create manager link.',
        )
      }

      setManagerUrl(data.manager_url)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create manager link.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Finote Admin</h1>

      {!stations.length ? (
        <section>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </section>
      ) : (
        <section>
          <h2>Create manager link</h2>

          {loadingStations ? (
            <p>Loading stations...</p>
          ) : (
            <>
              <select
                value={selectedStationId}
                onChange={(event) =>
                  setSelectedStationId(event.target.value)
                }
              >
                <option value="">
                  Select a station
                </option>

                {stations.map((station) => (
                  <option
                    key={station.id}
                    value={station.id}
                  >
                    {station.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={loading}
                onClick={handleCreateManagerLink}
              >
                {loading
                  ? 'Creating...'
                  : 'Create manager link'}
              </button>
            </>
          )}

          {managerUrl && (
            <p>
              Manager URL:{' '}
              <a
                href={managerUrl}
                target="_blank"
                rel="noreferrer"
              >
                {managerUrl}
              </a>
            </p>
          )}
        </section>
      )}

      {error && <p>{error}</p>}
    </main>
  )
}