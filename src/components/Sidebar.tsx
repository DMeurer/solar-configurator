import { SolarParams } from './SolarParams'
import { ConsumerList } from './ConsumerList'
import { BatteryParams } from './BatteryParams'
import { WeatherSelector } from './WeatherSelector'

export function Sidebar() {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4 flex flex-col gap-6">
      <SolarParams />
      <hr className="border-gray-800" />
      <ConsumerList />
      <hr className="border-gray-800" />
      <BatteryParams />
      <hr className="border-gray-800" />
      <WeatherSelector />
    </aside>
  )
}
