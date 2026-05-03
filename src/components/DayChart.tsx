import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMemo } from 'react'
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

const STEP = 5

export function DayChart() {
  const { solar, consumers, battery, weekWeather, selectedDate } = useStore()

  const date = new Date(selectedDate + 'T00:00:00')
  const dayOfWeek = date.getDay()
  const mondayIndex = (dayOfWeek + 6) % 7
  const preset = weekWeather[mondayIndex].preset

  const { solarPoints, consumptionPoints, metrics, chartData } = useMemo(() => {
    const solarPoints = computeSolar(solar, selectedDate, preset)
    const consumptionPoints = computeConsumption(consumers, dayOfWeek)
    const batteryPoints = battery.enabled
      ? computeBattery(solarPoints, consumptionPoints, battery)
      : null
    const metrics = computeMetrics(solarPoints, consumptionPoints, batteryPoints, battery.capacityWh)

    const sampled = downsample(solarPoints, STEP)
    const sampledConsumption = downsample(consumptionPoints, STEP)
    const sampledBattery = batteryPoints ? downsample(batteryPoints, STEP) : null

    const activeConsumers = consumers.filter((c) => c.active && c.daysActive.includes(dayOfWeek))

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
      for (const c of activeConsumers) {
        const t = s.minute
        const start = c.startMinute
        const end = c.endMinute >= 1440 ? 1440 : c.endMinute
        row[`consumer_${c.id}`] = t >= start && t < end ? c.watts : 0
      }
      return row
    })

    return { solarPoints, consumptionPoints, metrics, chartData }
  }, [solar, consumers, battery, selectedDate, preset, dayOfWeek])

  const activeConsumers = consumers.filter((c) => c.active && c.daysActive.includes(dayOfWeek))
  const maxWatts = Math.max(
    ...solarPoints.map((p) => p.watts),
    ...consumptionPoints.map((p) => p.watts),
    1000,
  )

  const tooltipFormatter = (value: number, name: string) => {
    if (name === 'soc') return [`${value.toFixed(1)} %`, 'Battery SoC']
    const consumer = activeConsumers.find((c) => `consumer_${c.id}` === name)
    if (consumer) return [`${value} W`, consumer.name]
    const labels: Record<string, string> = {
      solar: 'Solar',
      consumption: 'Total Consumption',
      gridImport: 'Grid Import',
      gridExport: 'Grid Export',
    }
    return [`${value} W`, labels[name] ?? name]
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="minute"
            tickFormatter={minuteLabel}
            ticks={[0, 180, 360, 540, 720, 900, 1080, 1260, 1380]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#374151"
          />
          <YAxis
            yAxisId="power"
            domain={[0, Math.ceil(maxWatts / 500) * 500]}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#374151"
            width={50}
          />
          {battery.enabled && (
            <YAxis
              yAxisId="soc"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#34d399' }}
              stroke="#374151"
              width={45}
            />
          )}
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={(v) => minuteLabel(v as number)}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            itemStyle={{ color: '#e5e7eb' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend
            formatter={(value) => {
              const c = activeConsumers.find((c) => `consumer_${c.id}` === value)
              if (c) return c.name
              const map: Record<string, string> = {
                solar: 'Solar',
                consumption: 'Total Consumption',
                soc: 'Battery SoC',
                gridImport: 'Grid Import',
                gridExport: 'Grid Export',
              }
              return map[value] ?? value
            }}
            wrapperStyle={{ fontSize: 12 }}
          />

          {battery.enabled && (
            <Area
              yAxisId="soc"
              dataKey="soc"
              fill="#065f46"
              stroke="#34d399"
              strokeWidth={1.5}
              dot={false}
              fillOpacity={0.3}
              type="monotone"
            />
          )}

          <Line
            yAxisId="power"
            dataKey="solar"
            stroke="#fbbf24"
            strokeWidth={2.5}
            dot={false}
            type="monotone"
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="power"
            dataKey="consumption"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            type="monotone"
            strokeDasharray="6 3"
          />

          {activeConsumers.map((c) => (
            <Line
              key={c.id}
              yAxisId="power"
              dataKey={`consumer_${c.id}`}
              stroke={c.color}
              strokeWidth={1}
              dot={false}
              type="stepAfter"
              strokeOpacity={0.6}
            />
          ))}

          <ReferenceLine yAxisId="power" y={0} stroke="#374151" />
        </ComposedChart>
      </ResponsiveContainer>

      <MetricsPanel metrics={metrics} />
    </div>
  )
}
