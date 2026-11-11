import { useEffect, useState } from 'react'
import Personal from './pages/Personal.jsx'
import ToeicHome from './pages/ToeicHome.jsx'
import Schedule from './pages/Schedule.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Listening from './pages/Listening.jsx'
import Practice from './pages/Practice.jsx'
import Vocab from './pages/Vocab.jsx'
import Notebook from './pages/Notebook.jsx'
import Session from './pages/Session.jsx'
import Settings from './pages/Settings.jsx'
import Mascot from './components/Mascot.jsx'
import SelectionPopup from './components/SelectionPopup.jsx'
import QuickNote from './components/QuickNote.jsx'
import { useStreak } from './lib/hooks.js'
import { ensureToeicToday } from './lib/today.js'
import { initCloud, flushNow } from './lib/cloud.js'
import { SyncChip, RemoteToast } from './components/Account.jsx'

// Everything about studying TOEIC lives under one section
const TOEIC_NAV = [
  { id: 'toeic', icon: '🌤️', label: 'Tổng quan' },
  { id: 'plan', icon: '🗓️', label: 'Lộ trình' },
  { id: 'flash', icon: '🃏', label: 'Flashcard' },
  { id: 'listen', icon: '🎧', label: 'Nghe chép' },
  { id: 'practice', icon: '🧠', label: 'Luyện tập' },
  { id: 'vocab', icon: '📚', label: 'Từ vựng' },
  { id: 'notes', icon: '📒', label: 'Sổ tay' },
]
const TOEIC_PAGES = new Set([...TOEIC_NAV.map((n) => n.id), 'session'])
const FLOATERS = ['✨', '🍊', '☁️', '⭐', '🫧', '🌼']
// Each Vercel deployment also has its own URL; data saved there does not carry over
const HOME_HOST = 'capy-toeic.vercel.app'
const PREVIEW_HOST = typeof location !== 'undefined' && location.hostname.endsWith('.vercel.app') && location.hostname !== HOME_HOST

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

  // Add today's TOEIC tasks once a day (also when the app is reopened on a new day)
  useEffect(() => {
    ensureToeicToday()
    initCloud()
    const on = () => {
      if (document.visibilityState === 'visible') ensureToeicToday()
      else flushNow() // push unsaved changes before the app goes to the background
    }
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  const go = (page, params = {}) => {
    window.location.hash = `/${page}${params.ref ? `/${encodeURIComponent(params.ref)}` : ''}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { page, params } = route
  const inToeic = TOEIC_PAGES.has(page)
  const key = `${page}-${params.ref || ''}`
  let content
  switch (page) {
    case 'toeic': content = <ToeicHome go={go} />; break
    case 'plan': content = <Schedule key={key} params={params} go={go} />; break
    case 'flash': content = <Flashcards key={key} />; break
    case 'listen': content = <Listening key={key} params={params} />; break
    case 'practice': content = <Practice key={key} params={params} />; break
    case 'vocab': content = <Vocab key={key} params={params} />; break
    case 'notes': content = <Notebook key={key} params={params} />; break
    case 'session': content = <Session go={go} />; break
    case 'settings': content = <Settings />; break
    default: content = <Personal go={go} />
  }

  const MainBtn = ({ id, icon, label, tone, on }) => (
    <button className={`nav-item ${tone} ${on ? 'on' : ''}`} onClick={() => go(id)}>
      <span className="nav-icon">{icon}</span><span className="nav-label">{label}</span>
    </button>
  )

  return (
    <div className="app">
      <div className="bg-decor" aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        {FLOATERS.map((f, i) => <i key={f} style={{ '--i': i }}>{f}</i>)}
      </div>

      <aside className="sidebar">
        <div className="brand" onClick={() => go('home')}>
          <Mascot size={54} className="bob" />
          <div><b>Capy TOEIC</b><small>Cá nhân & học tập</small></div>
        </div>
        <nav className="main-nav">
          <MainBtn id="home" icon="🏡" label="Cá nhân" tone="t-yellow" on={page === 'home'} />
          <MainBtn id="toeic" icon="🎓" label="TOEIC" tone="t-blue" on={inToeic} />
          <div className={`side-sub ${inToeic ? 'open' : ''}`}>
            {TOEIC_NAV.map((n) => (
              <button key={n.id} className={`sub-item ${page === n.id ? 'on' : ''}`} onClick={() => go(n.id)} tabIndex={inToeic ? 0 : -1}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
          <MainBtn id="settings" icon="⚙️" label="Cài đặt" tone="t-pink" on={page === 'settings'} />
        </nav>
        <SyncChip onClick={() => go('settings')} />
        <div className="side-streak"><span className="flame">🔥</span> {streak} ngày liên tiếp</div>
      </aside>

      <div className="main-col">
        <div className="sticky-head">
          <header className="topbar">
            <div className="brand" onClick={() => go('home')}><Mascot size={38} /><b>Capy TOEIC</b></div>
            <div className="row gap-s">
              <SyncChip onClick={() => go('settings')} />
              <span className="pill streak-pill"><span className="flame">🔥</span> {streak}</span>
            </div>
          </header>
          {inToeic && (
            <nav className="subnav" aria-label="Mục TOEIC">
              {TOEIC_NAV.map((n) => (
                <button key={n.id} className={`chip ${page === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>{n.icon} {n.label}</button>
              ))}
            </nav>
          )}
        </div>
        {PREVIEW_HOST && (
          <div className="host-warn">
            ⚠️ Đây là link xem thử của Vercel — dữ liệu học ở link này <b>tách riêng</b> và có thể mất.
            Hãy luôn mở <a href={`https://${HOME_HOST}/`}>{HOME_HOST}</a> để giữ tiến độ.
          </div>
        )}
        <main>{content}</main>
      </div>
      <RemoteToast />
      <SelectionPopup />
      <QuickNote />
    </div>
  )
}
