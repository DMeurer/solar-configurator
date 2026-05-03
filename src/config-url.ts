import type { SolarParams, BatteryParams, Consumer, DayWeather, ViewMode } from './store'

export interface SerializedConfig {
  v: 1
  viewMode: ViewMode
  selectedDate: string
  solar: SolarParams
  consumers: Consumer[]
  battery: BatteryParams
  weekWeather: DayWeather[]
}

export function serializeConfig(config: Omit<SerializedConfig, 'v'>): string {
  const payload: SerializedConfig = { v: 1, ...config }
  const json = JSON.stringify(payload)
  // btoa works on ASCII; encode to base64url (URL-safe, no padding issues)
  const b64 = btoa(encodeURIComponent(json))
  return b64
}

export function deserializeConfig(raw: string): SerializedConfig | null {
  try {
    const json = decodeURIComponent(atob(raw))
    const parsed = JSON.parse(json) as SerializedConfig
    if (parsed.v !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function readConfigFromUrl(): SerializedConfig | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('c')
  if (!raw) return null
  return deserializeConfig(raw)
}

export function buildShareUrl(config: Omit<SerializedConfig, 'v'>): string {
  const encoded = serializeConfig(config)
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('c', encoded)
  return url.toString()
}
