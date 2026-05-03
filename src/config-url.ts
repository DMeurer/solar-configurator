import type { ConfigSnapshot } from './store'

type VersionedConfig = ConfigSnapshot & { v: 1 }

export function serializeConfig(config: ConfigSnapshot): string {
  const payload: VersionedConfig = { v: 1, ...config }
  return btoa(encodeURIComponent(JSON.stringify(payload)))
}

export function deserializeConfig(raw: string): ConfigSnapshot | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(raw))) as VersionedConfig
    if (parsed.v !== 1) return null
    const { v: _v, ...config } = parsed
    return config
  } catch {
    return null
  }
}

export function readConfigFromUrl(): ConfigSnapshot | null {
  const raw = new URLSearchParams(window.location.search).get('c')
  return raw ? deserializeConfig(raw) : null
}

export function buildShareUrl(config: ConfigSnapshot): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('c', serializeConfig(config))
  return url.toString()
}
