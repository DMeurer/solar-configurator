import type { SolarParams, WeatherPreset } from '../store'

export interface DataPoint {
  minute: number
  watts: number
}

function lcg(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

function weatherSeed(dateStr: string, preset: WeatherPreset): number {
  let h = 0
  const key = dateStr + preset
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  }
  return h
}

export function computeSolar(
  params: SolarParams,
  dateStr: string,
  preset: WeatherPreset,
): DataPoint[] {
  const { peakWatts, inverterLimit } = params

  const date = new Date(dateStr + 'T12:00:00')
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const latitudeFactor = Math.sin(((dayOfYear - 172) / 365) * 2 * Math.PI) * 0.15

  const sunriseMinute = Math.round((6.0 - latitudeFactor * 1.5) * 60)
  const sunsetMinute = Math.round((20.0 + latitudeFactor * 1.5) * 60)
  const peakMinute = Math.round((sunriseMinute + sunsetMinute) / 2)
  const sigma = (peakMinute - sunriseMinute) / 3

  const presetScale: Record<WeatherPreset, number> = {
    sunny: 1.0,
    partial: 0.75,
    cloudy: 0.4,
    rainy: 0.0,
    forecast: 1.0,
  }
  const scale = presetScale[preset]

  const rand = lcg(weatherSeed(dateStr, preset))
  const numDips = preset === 'partial' ? 4 : preset === 'cloudy' ? 6 : 0
  const dips: Array<{ center: number; depth: number; width: number }> = []
  for (let i = 0; i < numDips; i++) {
    dips.push({
      center: sunriseMinute + rand() * (sunsetMinute - sunriseMinute),
      depth: preset === 'partial' ? 0.2 + rand() * 0.2 : 0.25 + rand() * 0.3,
      width: 15 + rand() * 30,
    })
  }

  const points: DataPoint[] = []
  for (let t = 0; t < 1440; t++) {
    if (t < sunriseMinute || t > sunsetMinute || scale === 0) {
      points.push({ minute: t, watts: 0 })
      continue
    }

    const base = peakWatts * Math.exp(-((t - peakMinute) ** 2) / (2 * sigma ** 2))
    let dipFactor = 1.0
    for (const dip of dips) {
      const dist = Math.abs(t - dip.center)
      if (dist < dip.width * 2) {
        dipFactor -= dip.depth * Math.exp(-(dist ** 2) / (2 * (dip.width / 2) ** 2))
      }
    }

    let noise = 1.0
    if (preset === 'partial') {
      const noiseSeed = weatherSeed(dateStr + String(t), preset)
      const r = lcg(noiseSeed)()
      noise = 0.9 + r * 0.2
    } else if (preset === 'cloudy') {
      const noiseSeed = weatherSeed(dateStr + String(t), preset)
      const r = lcg(noiseSeed)()
      noise = 0.85 + r * 0.3
    }

    const watts = Math.min(inverterLimit, base * scale * dipFactor * noise)
    points.push({ minute: t, watts: Math.max(0, watts) })
  }
  return points
}
