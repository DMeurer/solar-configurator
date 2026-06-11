import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore, type Consumer, type ConsumerGroup } from '../store'
import { DEVICE_LIBRARY, CATEGORIES } from '../devices'

// Mon–Sun display order mapped to JS getDay() values (0=Sun)
const DAY_JS = [1, 2, 3, 4, 5, 6, 0]

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
      className="input text-xs w-16"
    />
  )
}

function GroupBarCell({ group, rowSpan, onDrop }: { group: ConsumerGroup; rowSpan: number; onDrop: () => void }) {
  const { updateGroup, removeGroup } = useStore()
  const colorRef = useRef<HTMLInputElement>(null)
  const [dropTarget, setDropTarget] = useState(false)

  return (
    <td
      rowSpan={rowSpan}
      style={{
        width: 20,
        minWidth: 20,
        padding: 0,
        verticalAlign: 'top',
        position: 'relative',
      }}
    >
      <div
        className="group/bar relative h-full flex flex-col cursor-pointer"
        style={{
          minHeight: 40,
          borderLeft: `3px solid ${group.color}`,
          backgroundColor: dropTarget ? `${group.color}40` : `${group.color}18`,
          transition: 'background-color 0.1s',
        }}
        onClick={() => colorRef.current?.click()}
        title="Click to change color"
        onDragOver={(e) => { e.preventDefault(); setDropTarget(true) }}
        onDragLeave={() => setDropTarget(false)}
        onDrop={(e) => { e.preventDefault(); setDropTarget(false); onDrop() }}
      >
        <input
          ref={colorRef}
          type="color"
          value={group.color}
          onChange={(e) => updateGroup(group.id, { color: e.target.value })}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); removeGroup(group.id) }}
          className="opacity-0 group-hover/bar:opacity-100 absolute top-0.5 inset-x-0 text-center text-gray-500 hover:text-red-400 text-xs leading-none transition-opacity"
        >
          ×
        </button>
        <div className="flex-1" />
      </div>
    </td>
  )
}

function WideConsumerRow({
  consumer,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  groupBarCell,
}: {
  consumer: Consumer
  isDragOver: boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  groupBarCell: React.ReactNode
}) {
  const { t } = useTranslation()
  const { updateConsumer, removeConsumer } = useStore()
  const rowRef = useRef<HTMLTableRowElement>(null)
  const upd = (patch: Partial<Consumer>) => updateConsumer(consumer.id, patch)

  // Mon–Sun translated labels
  const dayKeys = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun']

  function toggleDay(jsDay: number) {
    const next = consumer.daysActive.includes(jsDay)
      ? consumer.daysActive.filter((d) => d !== jsDay)
      : [...consumer.daysActive, jsDay]
    upd({ daysActive: next })
  }

  return (
    <tr
      ref={rowRef}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDragEnd={() => { if (rowRef.current) rowRef.current.draggable = false; onDragEnd() }}
      className={`border-b border-gray-800/60 transition-colors ${isDragOver ? 'bg-blue-900/20' : 'hover:bg-gray-800/20'}`}
    >
      {groupBarCell}
      {/* Drag handle — mousedown enables dragging, mouseup cancels if not started */}
      <td
        className="py-1 pl-1 pr-0.5 cursor-grab active:cursor-grabbing"
        onMouseDown={() => { if (rowRef.current) rowRef.current.draggable = true }}
        onMouseUp={() => { if (rowRef.current) rowRef.current.draggable = false }}
      >
        <svg className="w-3 h-3 text-gray-500" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.3" /><circle cx="5" cy="8" r="1.3" /><circle cx="5" cy="12" r="1.3" />
          <circle cx="11" cy="4" r="1.3" /><circle cx="11" cy="8" r="1.3" /><circle cx="11" cy="12" r="1.3" />
        </svg>
      </td>
      {/* Name */}
      <td className="py-1 pr-1.5">
        <input type="text" value={consumer.name} onChange={(e) => upd({ name: e.target.value })} className="input text-xs w-full min-w-[80px]" />
      </td>
      {/* Start */}
      <td className="py-1 pr-1.5">
        <TimeInput minutes={consumer.startMinute} onChange={(m) => upd({ startMinute: m })} />
      </td>
      {/* End */}
      <td className="py-1 pr-1.5">
        <TimeInput minutes={consumer.endMinute >= 1440 ? 1439 : consumer.endMinute} onChange={(m) => upd({ endMinute: m })} />
      </td>
      {/* Watts */}
      <td className="py-1 pr-1.5">
        <input type="number" value={consumer.watts} min={0} step={10} onChange={(e) => upd({ watts: +e.target.value })} className="input text-xs w-20" />
      </td>
      {/* Days */}
      <td className="py-1 pr-1.5">
        <div className="flex gap-0.5">
          {DAY_JS.map((jsDay, i) => {
            const active = consumer.daysActive.includes(jsDay)
            return (
              <button
                key={jsDay}
                onClick={() => toggleDay(jsDay)}
                title={t(dayKeys[i])}
                className={`w-5 h-5 rounded text-xs font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {t(dayKeys[i]).charAt(0)}
              </button>
            )
          })}
        </div>
      </td>
      {/* Active toggle */}
      <td className="py-1 pr-1.5">
        <button
          onClick={() => upd({ active: !consumer.active })}
          className={`px-2 py-0.5 rounded text-xs font-medium ${consumer.active ? 'bg-green-700 text-green-100' : 'bg-gray-600 text-gray-400'}`}
        >
          {consumer.active ? t('consumers.on') : t('consumers.off')}
        </button>
      </td>
      {/* Delete */}
      <td className="py-1">
        <button onClick={() => removeConsumer(consumer.id)} className="text-gray-600 hover:text-red-400 px-1">×</button>
      </td>
    </tr>
  )
}

function NarrowConsumerRow({ consumer, groupColor }: { consumer: Consumer; groupColor: string }) {
  const { t } = useTranslation()
  const { updateConsumer } = useStore()
  return (
    <div className="flex items-center gap-2 py-1 pl-4">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: groupColor }} />
      <span className="text-xs text-gray-200 flex-1 truncate">{consumer.name}</span>
      <button
        onClick={() => updateConsumer(consumer.id, { active: !consumer.active })}
        className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${consumer.active ? 'bg-green-700 text-green-100' : 'bg-gray-600 text-gray-400'}`}
      >
        {consumer.active ? t('consumers.on') : t('consumers.off')}
      </button>
    </div>
  )
}

function DeviceLibrary({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const { addConsumer } = useStore()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const devices = DEVICE_LIBRARY.filter((d) => d.category === activeCategory)

  function addFromTemplate(template: typeof DEVICE_LIBRARY[number]) {
    addConsumer({ name: template.name, watts: template.watts, startMinute: template.startMinute, endMinute: template.endMinute, groupId })
    onClose()
  }

  return (
    <div className="rounded-lg border border-gray-600 bg-gray-800 overflow-hidden mt-1">
      <div className="flex overflow-x-auto border-b border-gray-700 bg-gray-900">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' : 'text-gray-400 hover:text-gray-200'}`}>
            {t(`devices.${cat}`, cat)}
          </button>
        ))}
      </div>
      <div className="p-1.5 grid grid-cols-1 gap-0.5 max-h-48 overflow-y-auto">
        {devices.map((device) => (
          <button key={device.name} onClick={() => addFromTemplate(device)}
            className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-700 transition-colors">
            <span className="text-xs text-gray-200 flex-1">{device.name}</span>
            <span className="text-xs text-gray-500 tabular-nums">
              {device.watts >= 1000 ? `${(device.watts / 1000).toFixed(1)} kW` : `${device.watts} W`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ConsumerList({ wide, onToggleWide }: { wide: boolean; onToggleWide: () => void }) {
  const { t } = useTranslation()
  const { groups, consumers, addGroup, addConsumer, updateConsumer, reorderConsumers } = useStore()
  const [showLibrary, setShowLibrary] = useState(false)

  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function handleDragEnd() {
    if (dragId.current && dragOverId && dragId.current !== dragOverId) {
      reorderConsumers(dragId.current, dragOverId)
    }
    dragId.current = null
    setDragOverId(null)
  }

  const lastGroupId = groups[groups.length - 1]?.id

  if (!wide) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">{t('consumers.title')}</h3>
          <button onClick={onToggleWide} className="text-gray-400 hover:text-white transition-colors text-base leading-none px-2 py-1 rounded hover:bg-gray-700">»</button>
        </div>
        <div className="space-y-4">
          {groups.map((group, i) => {
            const gc = consumers.filter((c) => c.groupId === group.id)
            return (
              <div key={group.id}>
                {i > 0 && <hr className="border-gray-800 mb-3" />}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <span className="text-xs font-medium text-gray-400">{group.name}</span>
                </div>
                {gc.map((c) => <NarrowConsumerRow key={c.id} consumer={c} groupColor={group.color} />)}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">{t('consumers.title')}</h3>
        <button onClick={onToggleWide} className="text-gray-400 hover:text-white transition-colors text-base leading-none px-2 py-1 rounded hover:bg-gray-700">«</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th style={{ width: 20 }} />
              <th style={{ width: 20 }} />
              <th className="pb-1 pr-1.5 text-left text-gray-400 font-normal">{t('consumers.name')}</th>
              <th className="pb-1 pr-1.5 text-left text-gray-400 font-normal">{t('consumers.start')}</th>
              <th className="pb-1 pr-1.5 text-left text-gray-400 font-normal">{t('consumers.end')}</th>
              <th className="pb-1 pr-1.5 text-left text-gray-400 font-normal">{t('consumers.watts')}</th>
              <th className="pb-1 pr-1.5 text-left text-gray-400 font-normal">{t('consumers.days')}</th>
              <th className="pb-1 pr-1.5" />
              <th className="pb-1" />
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((group) => {
              const gc = consumers.filter((c) => c.groupId === group.id)
              if (gc.length === 0) {
                return [(
                  <tr key={`empty-${group.id}`}>
                    <GroupBarCell group={group} rowSpan={1} onDrop={() => { if (dragId.current) { updateConsumer(dragId.current, { groupId: group.id }); dragId.current = null; setDragOverId(null) } }} />
                    <td colSpan={8} style={{ height: 40 }} />
                  </tr>
                )]
              }
              return gc.map((consumer, i) => (
                <WideConsumerRow
                  key={consumer.id}
                  consumer={consumer}
                  isDragOver={dragOverId === consumer.id}
                  onDragStart={() => { dragId.current = consumer.id }}
                  onDragEnter={() => setDragOverId(consumer.id)}
                  onDragEnd={handleDragEnd}
                  groupBarCell={i === 0 ? <GroupBarCell group={group} rowSpan={gc.length} onDrop={() => { if (dragId.current) { updateConsumer(dragId.current, { groupId: group.id }); dragId.current = null; setDragOverId(null) } }} /> : null}
                />
              ))
            })}
          </tbody>
        </table>
      </div>

      {showLibrary && <DeviceLibrary groupId={lastGroupId ?? ''} onClose={() => setShowLibrary(false)} />}

      <div className="flex gap-2 pt-1">
        <button onClick={addGroup}
          className="rounded border border-dashed border-gray-600 py-1.5 px-3 text-xs text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors shrink-0">
          + {t('consumers.addGroup')}
        </button>
        <button onClick={() => addConsumer({ groupId: lastGroupId })}
          className="flex-1 rounded border border-dashed border-gray-600 py-1.5 text-xs text-gray-300 hover:border-green-500 hover:text-green-400 transition-colors">
          + {t('consumers.addBlank')}
        </button>
        <button
          onClick={() => setShowLibrary((v) => !v)}
          className={`rounded border border-dashed py-1.5 px-3 text-xs transition-colors shrink-0 ${showLibrary ? 'border-blue-500 text-blue-400' : 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400'}`}>
          {t('consumers.addFromLibrary')}
        </button>
      </div>
    </section>
  )
}
