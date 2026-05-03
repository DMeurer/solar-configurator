import { useStore, type Consumer } from '../store'

function minutesToTime(m: number) {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function ConsumerRow({ consumer }: { consumer: Consumer }) {
  const { updateConsumer, removeConsumer } = useStore()
  const upd = (patch: Partial<Consumer>) => updateConsumer(consumer.id, patch)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
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
          <input
            type="time"
            value={minutesToTime(consumer.startMinute)}
            onChange={(e) => upd({ startMinute: timeToMinutes(e.target.value) })}
            className="input text-xs"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-gray-400">End</span>
          <input
            type="time"
            value={minutesToTime(consumer.endMinute >= 1440 ? 1439 : consumer.endMinute)}
            onChange={(e) => upd({ endMinute: timeToMinutes(e.target.value) })}
            className="input text-xs"
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

export function ConsumerList() {
  const { consumers, addConsumer } = useStore()

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Consumers</h3>
      <div className="space-y-2">
        {consumers.map((c) => (
          <ConsumerRow key={c.id} consumer={c} />
        ))}
      </div>
      <button
        onClick={addConsumer}
        className="w-full rounded border border-dashed border-gray-600 py-2 text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        + Add Consumer
      </button>
    </section>
  )
}
