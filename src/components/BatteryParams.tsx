import { useTranslation } from 'react-i18next'
import { useStore } from '../store'

export function BatteryParams() {
  const { t } = useTranslation()
  const { battery, setBattery } = useStore()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{t('battery.title')}</h3>
        <button
          onClick={() => setBattery({ enabled: !battery.enabled })}
          className={`px-2 py-0.5 rounded text-xs font-medium ${battery.enabled ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-600 text-gray-400'}`}
        >
          {battery.enabled ? t('battery.on') : t('battery.off')}
        </button>
      </div>
      {battery.enabled && (
        <div className="space-y-2">
          {([
            { label: t('battery.capacity'),    key: 'capacityWh',    step: 500, max: undefined },
            { label: t('battery.maxCharge'),   key: 'maxChargeW',    step: 100, max: undefined },
            { label: t('battery.maxDischarge'),key: 'maxDischargeW', step: 100, max: undefined },
            { label: t('battery.initialSoc'),  key: 'initialSocPct', step: 5,   max: 100 },
            { label: t('battery.efficiency'),  key: 'efficiencyPct', step: 1,   max: 100 },
          ] as const).map(({ label, key, step, max }) => (
            <label key={key} className="flex flex-col gap-0.5 text-sm">
              <span className="text-gray-400">{label}</span>
              <input
                type="number"
                className="input"
                value={battery[key] as number}
                min={0}
                max={max}
                step={step}
                onChange={(e) => setBattery({ [key]: +e.target.value })}
              />
            </label>
          ))}
        </div>
      )}
    </section>
  )
}
