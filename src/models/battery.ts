import type { BatteryParams } from '../store'
import type { DataPoint } from './solar'

export interface BatteryPoint {
  minute: number
  soc: number
  gridImport: number
  gridExport: number
}

export function computeBattery(
  solar: DataPoint[],
  consumption: DataPoint[],
  params: BatteryParams,
): BatteryPoint[] {
  const { capacityWh, maxChargeW, maxDischargeW, initialSocPct, efficiencyPct } = params
  const eff = efficiencyPct / 100
  let soc = capacityWh * (initialSocPct / 100)

  const result: BatteryPoint[] = []
  for (let t = 0; t < 1440; t++) {
    const net = solar[t].watts - consumption[t].watts
    let gridImport = 0
    let gridExport = 0

    if (net > 0) {
      const canCharge = Math.min(net, maxChargeW, (capacityWh - soc) * 60)
      soc += canCharge * eff * (1 / 60)
      gridExport = net - canCharge
    } else if (net < 0) {
      const needed = -net
      const canDischarge = Math.min(needed, maxDischargeW, soc * 60)
      soc -= canDischarge * (1 / 60)
      gridImport = needed - canDischarge
    }

    soc = Math.max(0, Math.min(capacityWh, soc))
    result.push({ minute: t, soc: (soc / capacityWh) * 100, gridImport, gridExport })
  }
  return result
}

export interface EnergyMetrics {
  solarKwh: number
  consumptionKwh: number
  selfConsumedKwh: number
  batteryChargedKwh: number
  batteryDischargedKwh: number
  gridImportKwh: number
  gridExportKwh: number
  selfSufficiencyPct: number
}

export function computeMetrics(
  solar: DataPoint[],
  consumption: DataPoint[],
  battery: BatteryPoint[] | null,
  capacityWh = 0,
): EnergyMetrics {
  const solarKwh = solar.reduce((s, p) => s + p.watts, 0) / 60000
  const consumptionKwh = consumption.reduce((s, p) => s + p.watts, 0) / 60000

  let gridImportKwh = 0
  let gridExportKwh = 0
  let batteryChargedKwh = 0
  let batteryDischargedKwh = 0

  if (battery) {
    gridImportKwh = battery.reduce((s, p) => s + p.gridImport, 0) / 60000
    gridExportKwh = battery.reduce((s, p) => s + p.gridExport, 0) / 60000
    for (let i = 1; i < battery.length; i++) {
      const delta = battery[i].soc - battery[i - 1].soc
      if (delta > 0) batteryChargedKwh += (delta / 100) * capacityWh / 1000
      else batteryDischargedKwh += (-delta / 100) * capacityWh / 1000
    }
  } else {
    for (let t = 0; t < 1440; t++) {
      const net = solar[t].watts - consumption[t].watts
      if (net < 0) gridImportKwh += -net / 60000
      else gridExportKwh += net / 60000
    }
  }

  const selfConsumedKwh = Math.max(0, solarKwh - gridExportKwh - batteryChargedKwh)
  const selfSufficiencyPct =
    consumptionKwh > 0
      ? Math.min(100, ((selfConsumedKwh + batteryDischargedKwh) / consumptionKwh) * 100)
      : 0

  return {
    solarKwh,
    consumptionKwh,
    selfConsumedKwh,
    batteryChargedKwh,
    batteryDischargedKwh,
    gridImportKwh,
    gridExportKwh,
    selfSufficiencyPct,
  }
}
