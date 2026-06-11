import { create } from 'zustand'

export type WeatherPreset = 'sunny' | 'partial' | 'cloudy' | 'rainy' | 'forecast'

export interface ConsumerGroup {
  id: string
  name: string
  color: string
}

export interface Consumer {
  id: string
  groupId: string
  name: string
  startMinute: number
  endMinute: number
  watts: number
  active: boolean
  daysActive: number[]
}

export interface SolarParams {
  peakWatts: number
  inverterLimit: number
  lat: number
  lon: number
  tilt: number     // panel tilt 0–90°
  azimuth: number  // compass: 0=N, 90=E, 180=S, 270=W
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
  return Array.from({ length: 7 }, () => ({ preset: 'forecast' as WeatherPreset }))
}

export const DEFAULT_GROUPS: ConsumerGroup[] = [
  { id: 'always-on', name: 'Always On', color: '#3b82f6' },
  { id: 'timeable',  name: 'Timeable',  color: '#10b981' },
  { id: 'fixed',     name: 'Fixed Time', color: '#f97316' },
]

function makeConsumer(overrides: Partial<Consumer> = {}): Consumer {
  return {
    id: crypto.randomUUID(),
    groupId: DEFAULT_GROUPS[0].id,
    name: 'New Device',
    startMinute: 8 * 60,
    endMinute: 22 * 60,
    watts: 100,
    active: true,
    daysActive: [0, 1, 2, 3, 4, 5, 6],
    ...overrides,
  }
}

export interface ConfigSnapshot {
  viewMode: ViewMode
  selectedDate: string
  solar: SolarParams
  groups: ConsumerGroup[]
  consumers: Consumer[]
  battery: BatteryParams
  weekWeather: DayWeather[]
}

interface AppState extends ConfigSnapshot {
  forecastData: Record<string, number[]> | null
  setViewMode: (m: ViewMode) => void
  setSelectedDate: (d: string) => void
  setSolar: (p: Partial<SolarParams>) => void
  addGroup: () => void
  updateGroup: (id: string, patch: Partial<ConsumerGroup>) => void
  removeGroup: (id: string) => void
  addConsumer: (overrides?: Partial<Consumer>) => void
  updateConsumer: (id: string, patch: Partial<Consumer>) => void
  removeConsumer: (id: string) => void
  reorderConsumers: (fromId: string, toId: string) => void
  setBattery: (p: Partial<BatteryParams>) => void
  setDayWeather: (dayIndex: number, preset: WeatherPreset) => void
  setForecastData: (data: Record<string, number[]> | null) => void
  loadConfig: (snapshot: ConfigSnapshot) => void
}

export const useStore = create<AppState>((set) => ({
  viewMode: 'day',
  selectedDate: todayString(),
  forecastData: null,
  solar: {
    peakWatts: 5000,
    inverterLimit: 5000,
    lat: 48.11,
    lon: 8.74,
    tilt: 30,
    azimuth: 180,
  },
  groups: [...DEFAULT_GROUPS],
  consumers: [
    makeConsumer({ name: 'Household Base Load', groupId: 'always-on', startMinute: 0, endMinute: 1440, watts: 300 }),
    makeConsumer({ name: 'Heat Pump', groupId: 'fixed', startMinute: 6 * 60, endMinute: 22 * 60, watts: 2000 }),
    makeConsumer({ name: 'EV Charger', groupId: 'timeable', startMinute: 20 * 60, endMinute: 24 * 60, watts: 7400, active: false }),
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

  addGroup: () => set((s) => ({
    groups: [...s.groups, {
      id: crypto.randomUUID(),
      name: 'New Group',
      color: '#8b5cf6',
    }],
  })),
  updateGroup: (id, patch) => set((s) => ({
    groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  })),
  removeGroup: (id) => set((s) => ({
    groups: s.groups.filter((g) => g.id !== id),
    consumers: s.consumers.filter((c) => c.groupId !== id),
  })),

  addConsumer: (overrides = {}) => set((s) => ({
    consumers: [...s.consumers, makeConsumer({ groupId: s.groups[0]?.id, ...overrides })],
  })),
  updateConsumer: (id, patch) =>
    set((s) => ({
      consumers: s.consumers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeConsumer: (id) =>
    set((s) => ({ consumers: s.consumers.filter((c) => c.id !== id) })),
  reorderConsumers: (fromId, toId) =>
    set((s) => {
      const list = [...s.consumers]
      const from = list.findIndex((c) => c.id === fromId)
      const to = list.findIndex((c) => c.id === toId)
      if (from === -1 || to === -1 || from === to) return {}
      list.splice(to, 0, list.splice(from, 1)[0])
      return { consumers: list }
    }),

  setBattery: (p) => set((s) => ({ battery: { ...s.battery, ...p } })),
  setDayWeather: (dayIndex, preset) =>
    set((s) => {
      const weekWeather = [...s.weekWeather]
      weekWeather[dayIndex] = { preset }
      return { weekWeather }
    }),
  setForecastData: (data) => set({ forecastData: data }),

  loadConfig: (snapshot) =>
    set((s) => {
      const groups = snapshot.groups ?? s.groups
      // Migrate old consumers that used `color` instead of `groupId`
      const consumers = snapshot.consumers.map((c) => ({
        ...c,
        groupId: c.groupId ?? groups[0]?.id ?? DEFAULT_GROUPS[0].id,
      }))
      return {
        ...snapshot,
        groups,
        consumers,
        solar: { ...s.solar, ...snapshot.solar },
        forecastData: null,
      }
    }),
}))
