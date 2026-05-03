import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { DayChart } from './components/DayChart'
import { WeekChart } from './components/WeekChart'

export default function App() {
  const { viewMode, setViewMode, selectedDate, setSelectedDate } = useStore()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center gap-4 border-b border-gray-800 bg-gray-900 px-4 py-3 shrink-0">
        <span className="text-yellow-400 text-xl">☀️</span>
        <h1 className="text-lg font-semibold tracking-tight">Solar Dashboard</h1>

        <div className="flex items-center gap-1 ml-4 rounded-lg bg-gray-800 p-1">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === m ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'day' ? 'Day' : '7-Day'}
            </button>
          ))}
        </div>

        {viewMode === 'day' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-sm ml-2"
          />
        )}

        <div className="ml-auto text-sm text-gray-500">
          All calculations run client-side
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-5">
          {viewMode === 'day' ? <DayChart /> : <WeekChart />}
        </main>
      </div>
    </div>
  )
}
