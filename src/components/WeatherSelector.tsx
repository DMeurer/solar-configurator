import { useTranslation } from 'react-i18next'
import { useStore, type WeatherPreset } from '../store'

const PRESETS: { value: WeatherPreset; emoji: string; key: string }[] = [
  { value: 'sunny',   emoji: '☀️', key: 'weather.sunny'   },
  { value: 'partial', emoji: '🌤', key: 'weather.partial' },
  { value: 'cloudy',  emoji: '☁️', key: 'weather.cloudy'  },
  { value: 'rainy',   emoji: '🌧', key: 'weather.rainy'   },
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeatherSelector() {
  const { t } = useTranslation()
  const { viewMode, weekWeather, setDayWeather, selectedDate } = useStore()

  if (viewMode === 'day') {
    const date = new Date(selectedDate + 'T00:00:00')
    const dayIndex = (date.getDay() + 6) % 7
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
                preset === p.value
                  ? 'bg-sky-700 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <span>{p.emoji}</span> {t(p.key)}
            </button>
          ))}
        </div>
      </section>
    )
  }

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
    </section>
  )
}
