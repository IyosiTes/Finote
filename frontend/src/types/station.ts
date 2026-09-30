export type AvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'unknown'

export type StationService = {
  id: string
  name: string
  availability: AvailabilityStatus
  updatedAt: string | null
}

export type Station = {
  id: string
  name: string
  latitude: number
  longitude: number
  services: StationService[]
  updatedAt: string | null
}