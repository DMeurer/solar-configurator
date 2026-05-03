import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useMemo } from 'react'
import { useStore } from '../store'
import { computeSolar } from '../models/solar'
import { computeConsumption } from '../models/consumption'
import { computeBattery, computeMetrics } from '../models/battery'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function WeekChart() {
  const { solar, consumers, battery, weekWeather, selectedDate } = useStore()

  const startDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    return d.toISOString().slice(0, 10)
  }, [selectedDate])

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i)
      const dow = (i + 1) % 7
      const preset = weekWeather[i].preset
      const solarPoints = computeSolar(solar, date, preset)
      const consumptionPoints = computeConsumption(consumers, dow)
      const batteryPoints = battery.enabled
        ? computeBattery(solarPoints, consumptionPoints, battery)
        : null
      const m = computeMetrics(solarPoints, consumptionPoints, batteryPoints, battery.capacityWh)
      return {
        day: DAY_NAMES[i],
        solar: +m.solarKwh.toFixed(2),
        consumed: +m.consumptionKwh.toFixed(2),
        selfConsumed: +m.selfConsumedKwh.toFixed(2),
        batteryCharged: +m.batteryChargedKwh.toFixed(2),
        batteryDischarged: +m.batteryDischargedKwh.toFixed(2),
        gridImport: +m.gridImportKwh.toFixed(2),
        gridExport: +m.gridExportKwh.toFixed(2),
      }
    })
  }, [solar, consumers, battery, weekWeather, startDate])

  return (
    <div className="flex flex-col gap-4 h-full">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={weekData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#374151" />
          <YAxis
            tickFormatter={(v) => `${v} kWh`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#374151"
            width={60}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(v: number) => [`${v} kWh`]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="solar" name="Solar Generated" fill="#fbbf24" radius={[3, 3, 0, 0]} />
          <Bar dataKey="selfConsumed" name="Self-Consumed" fill="#34d399" radius={[3, 3, 0, 0]} />
          <Bar dataKey="batteryCharged" name="Battery Charged" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="gridExport" name="Grid Export" fill="#60a5fa" radius={[3, 3, 0, 0]} />
          <Bar dataKey="gridImport" name="Grid Import" fill="#f87171" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
