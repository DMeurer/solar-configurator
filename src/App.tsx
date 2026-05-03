import { useEffect, useState } from 'react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { DayChart } from './components/DayChart'
import { WeekChart } from './components/WeekChart'
import { readConfigFromUrl, buildShareUrl } from './config-url'

export default function App() {
  const { viewMode, setViewMode, selectedDate, setSelectedDate, loadConfig } = useStore()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const config = readConfigFromUrl()
    if (config) loadConfig(config)
  }, [loadConfig])

  function handleShare() {
    const state = useStore.getState()
    const url = buildShareUrl({
      viewMode: state.viewMode,
      selectedDate: state.selectedDate,
      solar: state.solar,
      consumers: state.consumers,
      battery: state.battery,
      weekWeather: state.weekWeather,
    })
    window.history.replaceState(null, '', url)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-700 text-green-100'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
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
