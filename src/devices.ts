export interface DeviceTemplate {
  name: string
  watts: number
  startMinute: number
  endMinute: number
  color: string
  category: string
}

const h = (hour: number, min = 0) => hour * 60 + min

export const DEVICE_LIBRARY: DeviceTemplate[] = [
  // Kitchen
  { name: 'Refrigerator',      watts: 150,  startMinute: 0,        endMinute: 1440,   color: '#06b6d4', category: 'Kitchen' },
  { name: 'Electric Stove',    watts: 3000, startMinute: h(12),    endMinute: h(13),  color: '#f97316', category: 'Kitchen' },
  { name: 'Oven',              watts: 2200, startMinute: h(17),    endMinute: h(19),  color: '#ef4444', category: 'Kitchen' },
  { name: 'Microwave',         watts: 1000, startMinute: h(12),    endMinute: h(12,30), color: '#fb923c', category: 'Kitchen' },
  { name: 'Dishwasher',        watts: 1800, startMinute: h(20),    endMinute: h(22),  color: '#a78bfa', category: 'Kitchen' },
  { name: 'Coffee Machine',    watts: 1200, startMinute: h(7),     endMinute: h(7,30), color: '#92400e', category: 'Kitchen' },

  // Laundry
  { name: 'Washing Machine',   watts: 2000, startMinute: h(9),     endMinute: h(11),  color: '#3b82f6', category: 'Laundry' },
  { name: 'Tumble Dryer',      watts: 2500, startMinute: h(10),    endMinute: h(12),  color: '#6366f1', category: 'Laundry' },
  { name: 'Iron',              watts: 2000, startMinute: h(8),     endMinute: h(8,30), color: '#8b5cf6', category: 'Laundry' },

  // Entertainment
  { name: 'TV',                watts: 150,  startMinute: h(18),    endMinute: h(23),  color: '#10b981', category: 'Entertainment' },
  { name: 'Gaming Console',    watts: 200,  startMinute: h(18),    endMinute: h(22),  color: '#22c55e', category: 'Entertainment' },
  { name: 'Desktop PC',        watts: 300,  startMinute: h(8),     endMinute: h(18),  color: '#84cc16', category: 'Entertainment' },

  // Climate
  { name: 'Heat Pump',         watts: 2000, startMinute: h(6),     endMinute: h(22),  color: '#f43f5e', category: 'Climate' },
  { name: 'Air Conditioner',   watts: 3500, startMinute: h(12),    endMinute: h(20),  color: '#fb7185', category: 'Climate' },
  { name: 'Electric Heater',   watts: 2000, startMinute: h(6),     endMinute: h(8),   color: '#fda4af', category: 'Climate' },
  { name: 'Ventilation',       watts: 200,  startMinute: 0,        endMinute: 1440,   color: '#cbd5e1', category: 'Climate' },

  // Water & Pool
  { name: 'Water Heater',      watts: 2000, startMinute: h(6),     endMinute: h(8),   color: '#0ea5e9', category: 'Water' },
  { name: 'Pool Pump',         watts: 1500, startMinute: h(10),    endMinute: h(14),  color: '#38bdf8', category: 'Water' },
  { name: 'Hot Tub',           watts: 3500, startMinute: h(18),    endMinute: h(21),  color: '#7dd3fc', category: 'Water' },

  // Mobility
  { name: 'EV Charger (7.4kW)', watts: 7400, startMinute: h(20),   endMinute: h(24),  color: '#c084fc', category: 'Mobility' },
  { name: 'EV Charger (11kW)', watts: 11000, startMinute: h(20),   endMinute: h(24),  color: '#a855f7', category: 'Mobility' },
  { name: 'E-Bike Charger',    watts: 100,  startMinute: h(22),    endMinute: h(24),  color: '#d8b4fe', category: 'Mobility' },

  // Other
  { name: 'Lighting',          watts: 200,  startMinute: h(18),    endMinute: h(23),  color: '#fde68a', category: 'Other' },
  { name: 'Vacuum Cleaner',    watts: 1500, startMinute: h(10),    endMinute: h(10,30), color: '#d1d5db', category: 'Other' },
]

export const CATEGORIES = [...new Set(DEVICE_LIBRARY.map((d) => d.category))]
