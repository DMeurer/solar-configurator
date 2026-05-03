import type { Consumer } from '../store'
import type { DataPoint } from './solar'

export function computeConsumption(consumers: Consumer[], dayOfWeek: number): DataPoint[] {
  const active = consumers.filter((c) => c.active && c.daysActive.includes(dayOfWeek))
  const points: DataPoint[] = []
  for (let t = 0; t < 1440; t++) {
    let watts = 0
    for (const c of active) {
      const start = c.startMinute
      const end = c.endMinute >= 1440 ? 1440 : c.endMinute
      if (t >= start && t < end) watts += c.watts
    }
    points.push({ minute: t, watts })
  }
  return points
}

export function computeIndividual(consumer: Consumer, dayOfWeek: number): DataPoint[] {
  if (!consumer.active || !consumer.daysActive.includes(dayOfWeek)) {
    return Array.from({ length: 1440 }, (_, t) => ({ minute: t, watts: 0 }))
  }
  return Array.from({ length: 1440 }, (_, t) => {
    const start = consumer.startMinute
    const end = consumer.endMinute >= 1440 ? 1440 : consumer.endMinute
    return { minute: t, watts: t >= start && t < end ? consumer.watts : 0 }
  })
}
