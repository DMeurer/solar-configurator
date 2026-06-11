import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  type TooltipProps,
} from 'recharts'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Consumer, ConsumerGroup } from '../store'
import { useStore } from '../store'
import { computeSolar } from '../models/solar'
import { computeConsumption } from '../models/consumption'
import { computeBattery, computeMetrics } from '../models/battery'
import { MetricsPanel } from './MetricsPanel'

function minuteLabel(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function downsample<T>(arr: T[], step: number): T[] {
  return arr.filter((_, i) => i % step === 0)
}

const STEP = 1

type ActiveGroup = ConsumerGroup & { activeConsumers: Consumer[] }

function PowerTooltip({ active, payload, label, activeGroups }: TooltipProps<number, string> & { activeGroups: ActiveGroup[] }) {
  const { t } = useTranslation()
  const POWER_LABELS: Record<string, string> = {
    solar: t('chart.solar'),
    consumption: t('chart.totalConsumption'),
    gridImport: t('chart.gridImport'),
    gridExport: t('chart.gridExport'),
  }
  if (!active || !payload?.length) return null
  const visible = payload.filter((p) => (p.value ?? 0) > 0)
  if (!visible.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs space-y-1">
      <div className="text-gray-400 mb-1">{minuteLabel(label as number)}</div>
      {visible.map((p) => {
        const group = activeGroups.find((g) => `group_${g.id}` === p.dataKey)
        const name = group?.name ?? POWER_LABELS[p.dataKey as string] ?? p.dataKey
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-300">{name}</span>
            <span className="ml-auto pl-4 tabular-nums text-white">{p.value} W</span>
          </div>
        )
      })}
    </div>
  )
}

function SocTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const p = payload[0]
  if ((p.value ?? 0) <= 0) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs space-y-1">
      <div className="text-gray-400 mb-1">{minuteLabel(label as number)}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
        <span className="text-gray-300">{t('chart.batterySoc')}</span>
        <span className="ml-auto pl-4 tabular-nums text-white">{(p.value as number).toFixed(1)} %</span>
      </div>
    </div>
  )
}

export function DayChart() {
  const { t } = useTranslation()
  const { solar, groups, consumers, battery, weekWeather, selectedDate, forecastData } = useStore()

  const date = new Date(selectedDate + 'T00:00:00')
  const dayOfWeek = date.getDay()
  const utcDate = new Date(selectedDate + 'T00:00:00Z')
  const mondayIndex = (utcDate.getUTCDay() + 6) % 7
  const preset = weekWeather[mondayIndex].preset

  const activeGroups: ActiveGroup[] = groups.map((group) => ({
    ...group,
    activeConsumers: consumers.filter(
      (c) => c.groupId === group.id && c.active && c.daysActive.includes(dayOfWeek)
    ),
  })).filter((g) => g.activeConsumers.length > 0)

  const { solarPoints, consumptionPoints, metrics, chartData } = useMemo(() => {
    const forecastDay = forecastData?.[selectedDate]
    const solarPoints = preset === 'forecast'
      ? (forecastDay
          ? forecastDay.map((watts, minute) => ({ minute, watts }))
          : Array.from({ length: 1440 }, (_, minute) => ({ minute, watts: 0 })))
      : computeSolar(solar, selectedDate, preset)
    const consumptionPoints = computeConsumption(consumers, dayOfWeek)
    const batteryPoints = battery.enabled
      ? computeBattery(solarPoints, consumptionPoints, battery)
      : null
    const metrics = computeMetrics(solarPoints, consumptionPoints, batteryPoints, battery.capacityWh)

    const sampled = downsample(solarPoints, STEP)
    const sampledConsumption = downsample(consumptionPoints, STEP)
    const sampledBattery = batteryPoints ? downsample(batteryPoints, STEP) : null

    const groupsSnapshot = groups.map((group) => ({
      ...group,
      activeConsumers: consumers.filter(
        (c) => c.groupId === group.id && c.active && c.daysActive.includes(dayOfWeek)
      ),
    })).filter((g) => g.activeConsumers.length > 0)

    const chartData = sampled.map((s, i) => {
      const row: Record<string, number> = {
        minute: s.minute,
        solar: Math.round(s.watts),
        consumption: Math.round(sampledConsumption[i].watts),
      }
      if (sampledBattery) {
        row.soc = Math.round(sampledBattery[i].soc * 10) / 10
        row.gridImport = Math.round(sampledBattery[i].gridImport)
        row.gridExport = Math.round(sampledBattery[i].gridExport)
      } else {
        const net = s.watts - sampledConsumption[i].watts
        row.gridImport = net < 0 ? Math.round(-net) : 0
        row.gridExport = net > 0 ? Math.round(net) : 0
      }
      const t = s.minute
      for (const group of groupsSnapshot) {
        let total = 0
        for (const c of group.activeConsumers) {
          const end = c.endMinute >= 1440 ? 1440 : c.endMinute
          if (t >= c.startMinute && t < end) total += c.watts
        }
        row[`group_${group.id}`] = total
      }
      return row
    })

    return { solarPoints, consumptionPoints, metrics, chartData }
  }, [solar, groups, consumers, battery, selectedDate, preset, dayOfWeek, forecastData])

  const maxWatts = Math.max(
    ...solarPoints.map((p) => p.watts),
    ...consumptionPoints.map((p) => p.watts),
    1000,
  )

  const X_TICKS = [0, 180, 360, 540, 720, 900, 1080, 1260, 1380]

  const legendMap: Record<string, string> = {
    solar: t('chart.solar'),
    consumption: t('chart.totalConsumption'),
    gridImport: t('chart.gridImport'),
    gridExport: t('chart.gridExport'),
  }

  return (
    <div className="flex flex-col gap-4">
      {preset === 'forecast' && !forecastData?.[selectedDate] && (
        <div className="rounded-lg bg-amber-900/30 border border-amber-700 px-4 py-3 text-sm text-amber-300 text-center">
          ⚠ {t('chart.forecastLimited')}
        </div>
      )}

      {/* Main power chart */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="minute" tickFormatter={minuteLabel} ticks={X_TICKS} tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="#374151" />
          <YAxis
            domain={[0, Math.ceil(maxWatts / 500) * 500]}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#374151"
            width={50}
          />
          <Tooltip content={<PowerTooltip activeGroups={activeGroups} />} />
          <Legend
            formatter={(value) => {
              const group = activeGroups.find((g) => `group_${g.id}` === value)
              if (group) return group.name
              return legendMap[value] ?? value
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            dataKey="solar"
            stroke="#fbbf24"
            strokeWidth={2.5}
            dot={false}
            type="monotone"
            activeDot={{ r: 4 }}
          />
          <Line
            dataKey="consumption"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            type="monotone"
            strokeDasharray="6 3"
          />
          {activeGroups.map((group) => (
            <Line
              key={group.id}
              dataKey={`group_${group.id}`}
              stroke={group.color}
              strokeWidth={1.5}
              dot={false}
              type="stepAfter"
              strokeOpacity={0.75}
            />
          ))}
          <ReferenceLine y={0} stroke="#374151" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Battery SoC chart */}
      {battery.enabled && (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="minute" tickFormatter={minuteLabel} ticks={X_TICKS} tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="#374151" />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#34d399' }}
              stroke="#374151"
              width={50}
            />
            <Tooltip content={<SocTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={() => t('chart.batterySoc')} />
            <Area
              dataKey="soc"
              fill="#065f46"
              stroke="#34d399"
              strokeWidth={1.5}
              dot={false}
              fillOpacity={0.3}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <MetricsPanel metrics={metrics} batteryEnabled={battery.enabled} />
    </div>
  )
}
