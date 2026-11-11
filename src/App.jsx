import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Schedule from './pages/Schedule.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Listening from './pages/Listening.jsx'
import Practice from './pages/Practice.jsx'
import Vocab from './pages/Vocab.jsx'
import Notebook from './pages/Notebook.jsx'
import Session from './pages/Session.jsx'
import Mascot from './components/Mascot.jsx'
import SelectionPopup from './components/SelectionPopup.jsx'
import QuickNote from './components/QuickNote.jsx'
import { useStreak } from './pages/Dashboard.jsx'

const NAV = [
  { id: 'home', icon: '🏠', label: 'Hôm nay' },
  { id: 'plan', icon: '🗓️', label: 'Lộ trình' },
  { id: 'flash', icon: '🃏', label: 'Flashcard' },
  { id: 'listen', icon: '🎧', label: 'Nghe chép' },
  { id: 'practice', icon: '🧠', label: 'Luyện tập' },
  { id: 'vocab', icon: '📚', label: 'Từ vựng' },
  { id: 'notes', icon: '📒', label: 'Sổ tay' },
]

function readHash() {
  const [page, ref] = window.location.hash.replace('#/', '').split('/')
  return { page: page || 'home', params: ref ? { ref: decodeURIComponent(ref) } : {} }
}

export default function App() {
  const [route, setRoute] = useState(readHash)
  const streak = useStreak()

  useEffect(() => {
    const on = () => setRoute(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const go = (page, params = {}) => {
    window.location.hash = `/${page}${params.ref ? `/${encodeURIComponent(params.ref)}` : ''}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { page, params } = route
  const key = `${page}-${params.ref || ''}`
  let content
  switch (page) {
    case 'plan': content = <Schedule key={key} params={params} go={go} />; break
    case 'flash': content = <Flashcards key={key} />; break
    case 'listen': content = <Listening key={key} params={params} />; break
    case 'practice': content = <Practice key={key} params={params} />; break
    case 'vocab': content = <Vocab key={key} params={params} />; break
    case 'notes': content = <Notebook params={params} />; break
    case 'session': content = <Session go={go} />; break
    default: content = <Dashboard go={go} />
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand" onClick={() => go('home')}>
          <Mascot size={52} />
          <div><b>Capy TOEIC</b><small>Mục tiêu 800+</small></div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>
              <span className="nav-icon">{n.icon}</span><span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-streak">🔥 {streak} ngày</div>
      </aside>
      <header className="topbar">
        <div className="brand" onClick={() => go('home')}><Mascot size={38} /><b>Capy TOEIC</b></div>
        <span className="pill">🔥 {streak}</span>
      </header>
      <main>{content}</main>
      <SelectionPopup />
      <QuickNote />
    </div>
  )
}
