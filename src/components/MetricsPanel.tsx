import { useTranslation } from 'react-i18next'
import type { EnergyMetrics } from '../models/battery'

function Metric({ label, value, unit = 'kWh', color = 'text-white' }: {
  label: string
  value: number
  unit?: string
  color?: string
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-800 px-3 py-2 min-w-0">
      <span className={`text-lg font-bold tabular-nums ${color}`}>
        {value.toFixed(2)}
        <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </span>
      <span className="text-xs text-gray-400 text-center leading-tight mt-0.5">{label}</span>
    </div>
  )
}

export function MetricsPanel({ metrics, batteryEnabled }: { metrics: EnergyMetrics; batteryEnabled: boolean }) {
  const { t } = useTranslation()
  const m = metrics
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Metric label={t('metrics.solarGenerated')}    value={m.solarKwh}             color="text-yellow-400" />
      <Metric label={t('metrics.selfConsumed')}      value={m.selfConsumedKwh}       color="text-green-400" />
      {batteryEnabled && <Metric label={t('metrics.batteryCharged')}    value={m.batteryChargedKwh}    color="text-emerald-400" />}
      {batteryEnabled && <Metric label={t('metrics.batteryDischarged')} value={m.batteryDischargedKwh} color="text-teal-400" />}
      <Metric label={t('metrics.gridImport')}        value={m.gridImportKwh}         color="text-red-400" />
      <Metric label={t('metrics.gridExport')}        value={m.gridExportKwh}         color="text-blue-400" />
      <Metric label={t('metrics.selfSufficiency')}   value={m.selfSufficiencyPct}    unit="%" color="text-purple-400" />
    </div>
  )
}
