import { supabase } from '../../lib/supabase'
import type {
  AvailabilityStatus,
  Station,
  StationService,
} from '../../types/station'

type StationFuelRow = {
  id: string
  availability: string
  updated_at: string | null
  fuel_types: {
    id: string
    name: string
  } | null
}

type StationRow = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  updated_at: string | null
  station_fuels: StationFuelRow[] | null
}

function normalizeAvailability(
  value: string,
): AvailabilityStatus {
  if (
    value === 'available' ||
    value === 'unavailable' ||
    value === 'unknown'
  ) {
    return value
  }

  return 'unknown'
}

function mapStation(row: StationRow): Station {
  const services: StationService[] =
    (row.station_fuels ?? []).map((fuel) => ({
      id: fuel.id,
      name: fuel.fuel_types?.name ?? 'Unknown service',
      availability: normalizeAvailability(
        fuel.availability,
      ),
      updatedAt: fuel.updated_at,
    }))

  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    services,
    updatedAt: row.updated_at,
  }
}

export async function getActiveStations(): Promise<Station[]> {
  const { data, error } = await supabase
    .from('stations')
    .select(`
      id,
      name,
      latitude,
      longitude,
      status,
      updated_at,
      station_fuels (
        id,
        availability,
        updated_at,
        fuel_types (
          id,
          name
        )
      )
    `)
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error(
      'Failed to fetch stations:',
      error.message,
    )

    throw error
  }

  return ((data ?? []) as unknown as StationRow[]).map(
    mapStation,
  )
}