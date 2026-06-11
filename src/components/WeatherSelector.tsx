import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore, type WeatherPreset } from '../store'
import { fetchForecast } from '../models/forecast'

const PRESETS: { value: WeatherPreset; emoji: string; key: string }[] = [
  { value: 'sunny',    emoji: '☀️', key: 'weather.sunny'    },
  { value: 'forecast', emoji: '📡', key: 'weather.forecast' },
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CityResult {
  label: string
  lat: number
  lon: number
}

function ForecastConfig() {
  const { t } = useTranslation()
  const { solar, setSolar, forecastData, setForecastData } = useStore()

  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<CityResult[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = cityQuery.trim()
    if (!q) { setCityResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
        const json = await res.json() as { features: Array<{ geometry: { coordinates: [number, number] }; properties: { name?: string; state?: string; country?: string } }> }
        setCityResults(
          json.features.map((f) => ({
            label: [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(', '),
            lat: Math.round(f.geometry.coordinates[1] * 1000) / 1000,
            lon: Math.round(f.geometry.coordinates[0] * 1000) / 1000,
          }))
        )
      } catch {
        setCityResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [cityQuery])

  function selectCity(r: CityResult) {
    setSolar({ lat: r.lat, lon: r.lon })
    setCityResults([])
    setCityQuery('')
  }

  async function handleFetch() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchForecast(
        solar.lat, solar.lon, solar.tilt, solar.azimuth, solar.peakWatts, solar.inverterLimit,
      )
      setForecastData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 pt-1">
      {/* City search */}
      <div className="space-y-1">
        <input
          type="text"
          className="input text-sm w-full"
          placeholder={t('solar.citySearch')}
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
        />
        {cityResults.length > 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 text-xs overflow-hidden">
            {cityResults.map((r, i) => (
              <button
                key={i}
                onClick={() => selectCity(r)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
              >
                <span className="text-gray-200">{r.label}</span>
                <span className="ml-2 text-gray-500">{r.lat}, {r.lon}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panel config */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-sm">
          <span className="text-gray-400">{t('solar.lat')}</span>
          <input type="number" className="input" value={solar.lat} step={0.001}
            onChange={(e) => setSolar({ lat: +e.target.value })} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm">
          <span className="text-gray-400">{t('solar.lon')}</span>
          <input type="number" className="input" value={solar.lon} step={0.001}
            onChange={(e) => setSolar({ lon: +e.target.value })} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm">
          <span className="text-gray-400">{t('solar.tilt')}</span>
          <input type="number" className="input" value={solar.tilt} min={0} max={90} step={1}
            onChange={(e) => setSolar({ tilt: +e.target.value })} />
        </label>
        <label className="flex flex-col gap-0.5 text-sm">
          <span className="text-gray-400">{t('solar.azimuth')}</span>
          <input type="number" className="input" value={solar.azimuth} min={0} max={360} step={1}
            onChange={(e) => setSolar({ azimuth: +e.target.value })} />
        </label>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="w-full rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
      >
        {loading ? t('solar.forecastLoading') : t('solar.fetchForecast')}
      </button>

      {forecastData && !error && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('solar.forecastActive')}
          </div>
          <button onClick={() => setForecastData(null)} className="text-xs text-gray-500 hover:text-gray-300">
            {t('solar.clearForecast')}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{t('solar.forecastError')}: {error}</p>}
    </div>
  )
}

export function WeatherSelector() {
  const { t } = useTranslation()
  const { viewMode, weekWeather, setDayWeather, selectedDate } = useStore()

  if (viewMode === 'day') {
    const date = new Date(selectedDate + 'T00:00:00Z')
    const dayIndex = (date.getUTCDay() + 6) % 7
    const preset = weekWeather[dayIndex].preset

    return (
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">{t('weather.title')}</h3>
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDayWeather(dayIndex, p.value)}
              className={`rounded px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                preset === p.value ? 'bg-sky-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <span>{p.emoji}</span> {t(p.key)}
            </button>
          ))}
        </div>
        {preset === 'forecast' && <ForecastConfig />}
      </section>
    )
  }

  const hasForecast = weekWeather.some((d) => d.preset === 'forecast')

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">{t('weather.title7day')}</h3>
      <div className="space-y-1">
        {DAY_NAMES.map((day, i) => (
          <div key={day} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-7">{day}</span>
            <div className="flex gap-1 flex-1">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDayWeather(i, p.value)}
                  title={t(p.key)}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    weekWeather[i].preset === p.value
                      ? 'bg-sky-700 text-white'
                      : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasForecast && <ForecastConfig />}
    </section>
  )
}
