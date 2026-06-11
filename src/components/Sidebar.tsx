import { SolarParams } from './SolarParams'
import { ConsumerList } from './ConsumerList'
import { BatteryParams } from './BatteryParams'
import { WeatherSelector } from './WeatherSelector'

interface SidebarProps {
  width: number
  wide: boolean
  onToggleWide: () => void
}

export function Sidebar({ width, wide, onToggleWide }: SidebarProps) {
  return (
    <aside
      style={{ width }}
      className="shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4 flex flex-col gap-6"
    >
      <SolarParams />
      <hr className="border-gray-800" />
      <WeatherSelector />
      <hr className="border-gray-800" />
      <ConsumerList wide={wide} onToggleWide={onToggleWide} />
      <hr className="border-gray-800" />
      <BatteryParams />
    </aside>
  )
}
