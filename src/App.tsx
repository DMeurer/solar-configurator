import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { DayChart } from './components/DayChart'
import { WeekChart } from './components/WeekChart'
import { readConfigFromUrl, buildShareUrl } from './config-url'

export default function App() {
  const { t, i18n: i18nInstance } = useTranslation()
  const { viewMode, setViewMode, selectedDate, setSelectedDate, loadConfig, solar, consumers, battery, weekWeather } = useStore()
  const [copied, setCopied] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(288)
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  function onDragStart(e: React.MouseEvent) {
    dragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      const next = Math.min(520, Math.max(180, dragStartWidth.current + e.clientX - dragStartX.current))
      setSidebarWidth(next)
    }
    function onUp() {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    const config = readConfigFromUrl()
    if (config) loadConfig(config)
  }, [loadConfig])

  useEffect(() => {
    const timer = setTimeout(() => {
      const url = buildShareUrl({ viewMode, selectedDate, solar, consumers, battery, weekWeather })
      window.history.replaceState(null, '', url)
    }, 500)
    return () => clearTimeout(timer)
  }, [viewMode, selectedDate, solar, consumers, battery, weekWeather])

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
        <h1 className="text-lg font-semibold tracking-tight">{t('header.title')}</h1>

        <div className="flex items-center gap-1 ml-4 rounded-lg bg-gray-800 p-1">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === m ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'day' ? t('header.day') : t('header.week')}
            </button>
          ))}
        </div>

        {viewMode === 'day' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-sm ml-2 w-36"
          />
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-800 p-1">
            {(['en', 'de'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-2 py-0.5 rounded text-xs font-medium uppercase transition-colors ${
                  i18nInstance.language === lang
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
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
                {t('header.copied')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {t('header.share')}
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar width={sidebarWidth} />
        <div
          onMouseDown={onDragStart}
          className="w-1 shrink-0 cursor-col-resize bg-gray-800 hover:bg-blue-500 transition-colors"
        />
        <main className="flex-1 overflow-y-auto p-5">
          {viewMode === 'day' ? <DayChart /> : <WeekChart />}
        </main>
      </div>
    </div>
  )
}
