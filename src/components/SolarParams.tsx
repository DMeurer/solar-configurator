import { useTranslation } from 'react-i18next'
import { useStore } from '../store'

export function SolarParams() {
  const { t } = useTranslation()
  const { solar, setSolar } = useStore()

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400">{t('solar.title')}</h3>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">{t('solar.peakOutput')}</span>
        <input
          type="number"
          className="input"
          value={solar.peakWatts}
          min={0}
          max={100000}
          step={100}
          onChange={(e) => setSolar({ peakWatts: +e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">{t('solar.inverterLimit')}</span>
        <input
          type="number"
          className="input"
          value={solar.inverterLimit}
          min={0}
          max={100000}
          step={100}
          onChange={(e) => setSolar({ inverterLimit: +e.target.value })}
        />
      </label>
    </section>
  )
}
