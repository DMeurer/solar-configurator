import { useRef, useState } from 'react'
import { useStore, type Consumer } from '../store'
import { DEVICE_LIBRARY, CATEGORIES } from '../devices'

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseHHMM(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

function TimeInput({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const displayed = draft ?? toHHMM(minutes)

  function commit(value: string) {
    const parsed = parseHHMM(value)
    if (parsed !== null) onChange(parsed)
    setDraft(null)
  }

  return (
    <input
      type="text"
      value={displayed}
      placeholder="HH:MM"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value) }}
      className="input text-xs w-full"
    />
  )
}

function ConsumerRow({
  consumer,
  index,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  consumer: Consumer
  index: number
  isDragOver: boolean
  onDragStart: (i: number) => void
  onDragEnter: (i: number) => void
  onDragEnd: () => void
}) {
  const { updateConsumer, removeConsumer } = useStore()
  const upd = (patch: Partial<Consumer>) => updateConsumer(consumer.id, patch)
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={cardRef}
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={() => { if (cardRef.current) cardRef.current.draggable = false; onDragEnd() }}
      onDragOver={(e) => e.preventDefault()}
      className={`rounded-lg border bg-gray-800/60 p-3 space-y-2 transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <svg
          onMouseDown={() => { if (cardRef.current) cardRef.current.draggable = true }}
          onMouseUp={() => { if (cardRef.current) cardRef.current.draggable = false }}
          className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="5" cy="4" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="5" cy="12" r="1.2" />
          <circle cx="11" cy="4" r="1.2" />
          <circle cx="11" cy="8" r="1.2" />
          <circle cx="11" cy="12" r="1.2" />
        </svg>
        <input
          type="color"
          value={consumer.color}
          onChange={(e) => upd({ color: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={consumer.name}
          onChange={(e) => upd({ name: e.target.value })}
          className="input flex-1 text-sm"
        />
        <button
          onClick={() => upd({ active: !consumer.active })}
          className={`px-2 py-0.5 rounded text-xs font-medium ${consumer.active ? 'bg-green-700 text-green-100' : 'bg-gray-600 text-gray-400'}`}
        >
          {consumer.active ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => removeConsumer(consumer.id)} className="text-gray-500 hover:text-red-400 text-sm px-1">
          ×
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-gray-400">Start</span>
          <TimeInput minutes={consumer.startMinute} onChange={(m) => upd({ startMinute: m })} />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-gray-400">End</span>
          <TimeInput
            minutes={consumer.endMinute >= 1440 ? 1439 : consumer.endMinute}
            onChange={(m) => upd({ endMinute: m })}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-gray-400">Watts</span>
          <input
            type="number"
            value={consumer.watts}
            min={0}
            step={10}
            onChange={(e) => upd({ watts: +e.target.value })}
            className="input text-xs"
          />
        </label>
      </div>
    </div>
  )
}

function DeviceLibrary({ onClose }: { onClose: () => void }) {
  const { addConsumer, updateConsumer } = useStore()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])

  function addFromTemplate(template: typeof DEVICE_LIBRARY[number]) {
    addConsumer()
    // addConsumer pushes a new consumer; grab its id from the store after the fact
    const consumers = useStore.getState().consumers
    const newId = consumers[consumers.length - 1].id
    updateConsumer(newId, {
      name: template.name,
      watts: template.watts,
      startMinute: template.startMinute,
      endMinute: template.endMinute,
      color: template.color,
    })
    onClose()
  }

  const devices = DEVICE_LIBRARY.filter((d) => d.category === activeCategory)

  return (
    <div className="rounded-lg border border-gray-600 bg-gray-800 overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-gray-700 bg-gray-900">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Device grid */}
      <div className="p-2 grid grid-cols-1 gap-1">
        {devices.map((device) => (
          <button
            key={device.name}
            onClick={() => addFromTemplate(device)}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-gray-700 transition-colors group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: device.color }}
            />
            <span className="text-sm text-gray-200 flex-1">{device.name}</span>
            <span className="text-xs text-gray-500 tabular-nums">
              {device.watts >= 1000 ? `${(device.watts / 1000).toFixed(1)} kW` : `${device.watts} W`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ConsumerList() {
  const { consumers, addConsumer, reorderConsumers } = useStore()
  const [showLibrary, setShowLibrary] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(i: number) {
    dragIndex.current = i
  }

  function handleDragEnter(i: number) {
    setDragOverIndex(i)
  }

  function handleDragEnd() {
    if (dragIndex.current !== null && dragOverIndex !== null && dragIndex.current !== dragOverIndex) {
      reorderConsumers(dragIndex.current, dragOverIndex)
    }
    dragIndex.current = null
    setDragOverIndex(null)
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Consumers</h3>
      <div className="space-y-2">
        {consumers.map((c, i) => (
          <ConsumerRow
            key={c.id}
            consumer={c}
            index={i}
            isDragOver={dragOverIndex === i}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addConsumer}
          className="flex-1 rounded border border-dashed border-gray-600 py-2 text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
        >
          + Blank
        </button>
        <button
          onClick={() => setShowLibrary((v) => !v)}
          className={`flex-1 rounded border border-dashed py-2 text-sm transition-colors ${
            showLibrary
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
          }`}
        >
          + From Library
        </button>
      </div>

      {showLibrary && <DeviceLibrary onClose={() => setShowLibrary(false)} />}
    </section>
  )
}
