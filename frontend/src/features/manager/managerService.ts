import { supabase } from '../../lib/supabase'
import type { AvailabilityStatus } from '../../types/station'

export type ManagerService = {
  id: string
  availability: AvailabilityStatus
  updatedAt: string | null
  fuelType: {
    id: string
    name: string
  }
}

export type ManagerStation = {
  id: string
  name: string
  status: string
  services: ManagerService[]
}

type ManagerStationResponse = {
  success: boolean
  station: {
    id: string
    name: string
    status: string
  }
  services: {
    id: string
    availability: string
    updated_at: string | null
    fuel_type: {
      id: string
      name: string
    }
  }[]
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

export async function getManagerStation(
  token: string,
): Promise<ManagerStation> {
  const { data, error } =
    await supabase.functions.invoke<ManagerStationResponse>(
      'manager-get-station',
      {
        body: { token },
      },
    )

  if (error) {
    throw error
  }

  if (!data?.success || !data.station) {
    throw new Error('Unable to load manager station')
  }

  return {
    id: data.station.id,
    name: data.station.name,
    status: data.station.status,
    services: data.services.map((service) => ({
      id: service.id,
      availability: normalizeAvailability(
        service.availability,
      ),
      updatedAt: service.updated_at,
      fuelType: {
        id: service.fuel_type.id,
        name: service.fuel_type.name,
      },
    })),
  }
}

export async function updateManagerAvailability(
  token: string,
  stationFuelId: string,
  availability: AvailabilityStatus,
) {
  const { data, error } =
    await supabase.functions.invoke(
      'manager-update-availability',
      {
        body: {
          token,
          station_fuel_id: stationFuelId,
          availability,
        },
      },
    )

  if (error) {
    throw error
  }

  if (!data?.success) {
    throw new Error(
      'Unable to update service availability',
    )
  }

  return {
    changed: data.changed,
    availability: normalizeAvailability(
      data.availability,
    ),
  }
}