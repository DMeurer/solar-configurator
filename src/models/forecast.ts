interface OpenMeteoResponse {
  utc_offset_seconds: number
  hourly: {
    time: string[]
    shortwave_radiation: number[]
    direct_normal_irradiance: number[]
    diffuse_radiation: number[]
  }
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function dayOfYear(dateStr: string): number {
  const y = parseInt(dateStr.slice(0, 4), 10)
  const d = new Date(dateStr + 'T00:00:00Z')
  return Math.round((d.getTime() - Date.UTC(y, 0, 0)) / 86_400_000)
}

// Plane-of-Array irradiance for one hourly slot, using isotropic sky model.
// hourUtc is the UTC hour used purely for solar geometry (not for array indexing).
function poaIrradiance(
  ghi: number,
  dni: number,
  dhi: number,
  lat: number,
  lon: number,
  doy: number,
  hourUtc: number,
  tiltDeg: number,
  panelAzimuthOm: number, // 0=South, -90=East, +90=West
): number {
  const tiltRad = toRad(tiltDeg)
  const decl = toRad(23.45 * Math.sin(toRad((360 / 365) * (doy - 80))))
  const latRad = toRad(lat)

  // Hour angle at the midpoint of the hour, corrected for longitude
  const solarNoonUtc = 12 - lon / 15
  const omega = toRad((hourUtc + 0.5 - solarNoonUtc) * 15)

  const cosZenith =
    Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(omega)
  if (cosZenith <= 0) return 0

  const sinZenith = Math.sqrt(Math.max(0, 1 - cosZenith * cosZenith))

  // Solar azimuth from south, positive = west (matches Open-Meteo panel convention)
  let solarAzRad = 0
  if (sinZenith > 1e-4) {
    const sinAz = (Math.cos(decl) * Math.sin(omega)) / sinZenith
    const cosAzVal = (Math.sin(decl) - Math.sin(latRad) * cosZenith) / (Math.cos(latRad) * sinZenith)
    solarAzRad = Math.atan2(sinAz, cosAzVal)
  }

  const cosAOI =
    cosZenith * Math.cos(tiltRad) +
    sinZenith * Math.sin(tiltRad) * Math.cos(solarAzRad - toRad(panelAzimuthOm))

  const beam = dni * Math.max(0, cosAOI)
  const diffuse = dhi * (1 + Math.cos(tiltRad)) / 2
  const reflected = ghi * 0.2 * (1 - Math.cos(tiltRad)) / 2 // albedo = 0.2

  return Math.max(0, beam + diffuse + reflected)
}

// Monotone cubic (Steffen) interpolation — smooth, no overshoot, never negative.
// Input: 24 hourly POA values (W/m²). Output: 1440 per-minute watts.
function pchipToMinutes(hourlyPoa: number[], peakWatts: number, inverterLimit: number): number[] {
  // Append a virtual hour-24 = 0 to anchor the end of day
  const pts = [...hourlyPoa.map((g) => Math.max(0, (g / 1000) * peakWatts)), 0]
  const n = pts.length // 25

  const d = pts.slice(0, -1).map((v, i) => pts[i + 1] - v)
  const tang: number[] = new Array(n).fill(0)
  tang[0] = d[0]
  tang[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      tang[i] = 0
    } else {
      const avg = (d[i - 1] + d[i]) / 2
      tang[i] =
        Math.sign(avg) * Math.min(Math.abs(avg), 3 * Math.min(Math.abs(d[i - 1]), Math.abs(d[i])))
    }
  }

  const result: number[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m++) {
      const t = m / 60
      const t2 = t * t
      const t3 = t2 * t
      const val =
        (2 * t3 - 3 * t2 + 1) * pts[h] +
        (t3 - 2 * t2 + t) * tang[h] +
        (-2 * t3 + 3 * t2) * pts[h + 1] +
        (t3 - t2) * tang[h + 1]
      result.push(Math.max(0, Math.min(inverterLimit, val)))
    }
  }
  return result
}

export async function fetchForecast(
  lat: number,
  lon: number,
  tiltDeg: number,
  azimuthCompass: number,
  peakWatts: number,
  inverterLimit: number,
): Promise<Record<string, number[]>> {
  const omAzimuth = azimuthCompass - 180 // compass → Open-Meteo convention

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('hourly', 'shortwave_radiation,direct_normal_irradiance,diffuse_radiation')
  url.searchParams.set('timezone', 'auto') // returns local time + utc_offset_seconds
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('past_days', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)
  const json = (await res.json()) as OpenMeteoResponse

  const tzOffsetHours = json.utc_offset_seconds / 3600
  const { time: times, shortwave_radiation: ghiArr, direct_normal_irradiance: dniArr, diffuse_radiation: dhiArr } = json.hourly

  // Build per-date arrays of 24 hourly POA values indexed by LOCAL hour
  const poaByDate: Record<string, number[]> = {}

  for (let i = 0; i < times.length; i++) {
    const dateStr = times[i].slice(0, 10)           // local date
    const hourLocal = parseInt(times[i].slice(11, 13), 10)
    const hourUtc = hourLocal - tzOffsetHours        // UTC hour for solar geometry

    if (!poaByDate[dateStr]) poaByDate[dateStr] = new Array(24).fill(0)

    const doy = dayOfYear(dateStr)
    const ghi = Math.max(0, ghiArr[i] ?? 0)
    const dni = Math.max(0, dniArr[i] ?? 0)
    const dhi = Math.max(0, dhiArr[i] ?? 0)

    poaByDate[dateStr][hourLocal] = poaIrradiance(
      ghi, dni, dhi, lat, lon, doy, hourUtc, tiltDeg, omAzimuth,
    )
  }

  // PCHIP-interpolate each day's 24 hourly POA values → 1440 per-minute watts
  const result: Record<string, number[]> = {}
  for (const [date, hourlyPoa] of Object.entries(poaByDate)) {
    result[date] = pchipToMinutes(hourlyPoa, peakWatts, inverterLimit)
  }
  return result
}
