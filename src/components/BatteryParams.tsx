import { useStore } from '../store'

export function BatteryParams() {
  const { battery, setBattery } = useStore()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Battery</h3>
        <button
          onClick={() => setBattery({ enabled: !battery.enabled })}
          className={`px-2 py-0.5 rounded text-xs font-medium ${battery.enabled ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-600 text-gray-400'}`}
        >
          {battery.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {battery.enabled && (
        <div className="space-y-2">
          {[
            { label: 'Capacity (Wh)', key: 'capacityWh', step: 500 },
            { label: 'Max Charge (W)', key: 'maxChargeW', step: 100 },
            { label: 'Max Discharge (W)', key: 'maxDischargeW', step: 100 },
            { label: 'Initial SoC (%)', key: 'initialSocPct', step: 5, max: 100 },
            { label: 'Efficiency (%)', key: 'efficiencyPct', step: 1, max: 100 },
          ].map(({ label, key, step, max }) => (
            <label key={key} className="flex flex-col gap-0.5 text-sm">
              <span className="text-gray-400">{label}</span>
              <input
                type="number"
                className="input"
                value={battery[key as keyof typeof battery] as number}
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
