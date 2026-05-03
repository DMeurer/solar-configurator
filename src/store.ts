import { create } from 'zustand'

export type WeatherPreset = 'sunny' | 'partial' | 'cloudy' | 'rainy'

export interface Consumer {
  id: string
  name: string
  startMinute: number
  endMinute: number
  watts: number
  color: string
  active: boolean
  daysActive: number[]
}

export interface SolarParams {
  peakWatts: number
  inverterLimit: number
}

export interface BatteryParams {
  enabled: boolean
  capacityWh: number
  maxChargeW: number
  maxDischargeW: number
  initialSocPct: number
  efficiencyPct: number
}

export type ViewMode = 'day' | 'week'

export interface DayWeather {
  preset: WeatherPreset
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function makeWeekWeather(): DayWeather[] {
  return Array.from({ length: 7 }, () => ({ preset: 'sunny' as WeatherPreset }))
}

export interface ConfigSnapshot {
  viewMode: ViewMode
  selectedDate: string
  solar: SolarParams
  consumers: Consumer[]
  battery: BatteryParams
  weekWeather: DayWeather[]
}

interface AppState extends ConfigSnapshot {
  setViewMode: (m: ViewMode) => void
  setSelectedDate: (d: string) => void
  setSolar: (p: Partial<SolarParams>) => void
  addConsumer: () => void
  updateConsumer: (id: string, patch: Partial<Consumer>) => void
  removeConsumer: (id: string) => void
  setBattery: (p: Partial<BatteryParams>) => void
  setDayWeather: (dayIndex: number, preset: WeatherPreset) => void
  loadConfig: (snapshot: ConfigSnapshot) => void
}

const CONSUMER_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

let colorIndex = 0
function nextColor() {
  return CONSUMER_COLORS[colorIndex++ % CONSUMER_COLORS.length]
}

function makeConsumer(overrides: Partial<Consumer> = {}): Consumer {
  return {
    id: crypto.randomUUID(),
    name: 'New Device',
    startMinute: 7 * 60,
    endMinute: 22 * 60,
    watts: 500,
    color: nextColor(),
    active: true,
    daysActive: [0, 1, 2, 3, 4, 5, 6],
    ...overrides,
  }
}

export const useStore = create<AppState>((set) => ({
  viewMode: 'day',
  selectedDate: todayString(),
  solar: {
    peakWatts: 5000,
    inverterLimit: 5000,
  },
  consumers: [
    makeConsumer({ name: 'Household Base Load', startMinute: 0, endMinute: 1440, watts: 300, color: '#3b82f6' }),
    makeConsumer({ name: 'Heat Pump', startMinute: 6 * 60, endMinute: 22 * 60, watts: 2000, color: '#ef4444' }),
    makeConsumer({ name: 'EV Charger', startMinute: 20 * 60, endMinute: 24 * 60, watts: 7400, color: '#8b5cf6', active: false }),
  ],
  battery: {
    enabled: false,
    capacityWh: 10000,
    maxChargeW: 3000,
    maxDischargeW: 3000,
    initialSocPct: 20,
    efficiencyPct: 90,
  },
  weekWeather: makeWeekWeather(),

  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSolar: (p) => set((s) => ({ solar: { ...s.solar, ...p } })),
  addConsumer: () => set((s) => ({ consumers: [...s.consumers, makeConsumer()] })),
  updateConsumer: (id, patch) =>
    set((s) => ({
      consumers: s.consumers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeConsumer: (id) =>
    set((s) => ({ consumers: s.consumers.filter((c) => c.id !== id) })),
  setBattery: (p) => set((s) => ({ battery: { ...s.battery, ...p } })),
  setDayWeather: (dayIndex, preset) =>
    set((s) => {
      const weekWeather = [...s.weekWeather]
      weekWeather[dayIndex] = { preset }
      return { weekWeather }
    }),
  loadConfig: (snapshot) => set(snapshot),
}))
