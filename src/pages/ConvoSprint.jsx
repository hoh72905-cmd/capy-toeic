// "Thử thách 60 giây": as many quick answers as possible in one minute. Mixes reflex replies
// (someone says A → pick the natural reply) with meaning recall (Vietnamese → pick the English),
// drawn from sentences already studied, so speed grows on what you know. Keys 1–4 work on desktop.
import { useEffect, useRef, useState } from 'react'
import { getState, useStore } from '../lib/store.js'
import { levelInfo, saveSprint } from '../lib/convo.js'
import { speak, stopSpeak } from '../lib/speech.js'
import { confetti } from '../lib/confetti.js'
import { useEnter } from '../components/ConvoKit.jsx'
import { Sparkline } from '../components/Charts.jsx'
import Mascot from '../components/Mascot.jsx'

const SECONDS = 60
const mix = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

function buildDeck(D) {
  const items = getState().convoItems
  const { cefr } = levelInfo()
  const known = (x) => items[x.id] && !items[x.id].bad
  const near = (x) => x.lv <= cefr && x.lv >= cefr - 1
  const rf = [...mix(D.rf.filter((x) => known(x) && x.lv <= cefr + 1)), ...mix(D.rf.filter((x) => !known(x) && near(x)))].slice(0, 40)
  const trAll = D.tr.filter((x) => !x.q && x.en[0].split(' ').length <= 12)
  const tr = [...mix(trAll.filter((x) => known(x) && x.lv <= cefr + 1)), ...mix(trAll.filter((x) => !known(x) && near(x)))].slice(0, 40)
  const qs = []
  for (let i = 0; i < 80; i++) {
    const useRf = i % 2 === 0 ? rf.length : !tr.length
    if (useRf && rf.length) {
      const x = rf.shift()
      qs.push({ kind: 'rf', id: x.id, prompt: x.a, answer: x.b, options: mix([x.b, ...x.wrong]) })
    } else if (tr.length) {
      const x = tr.shift()
      const others = mix(trAll.filter((o) => o.lv === x.lv && o.id !== x.id)).slice(0, 3).map((o) => o.en[0])
      qs.push({ kind: 'tr', id: x.id, prompt: x.vi, answer: x.en[0], options: mix([x.en[0], ...others]) })
    }
  }
  return qs
}

export default function ConvoSprint({ D, onBack, onLevelUp }) {
  const { convo } = useStore()
  const runs = convo.sprints || []
  const best = Math.max(0, ...runs.map((r) => r.r))
  const [phase, setPhase] = useState('intro')
  const [deck, setDeck] = useState([])
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(SECONDS)
  const [score, setScore] = useState({ right: 0, wrong: 0, combo: 0, maxCombo: 0, times: [] })
  const [flash, setFlash] = useState(null) // chosen option while showing right/wrong
  const [sound, setSound] = useState(true)
  const [result, setResult] = useState(null)
  const shownAt = useRef(0)
  const endAt = useRef(0)
  const q = deck[i]

  const start = () => {
    setDeck(buildDeck(D)); setI(0); setLeft(SECONDS); setFlash(null); setResult(null)
    setScore({ right: 0, wrong: 0, combo: 0, maxCombo: 0, times: [] })
    endAt.current = Date.now() + SECONDS * 1000
    setPhase('run')
  }
  // Clock
  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => {
      const l = Math.max(0, (endAt.current - Date.now()) / 1000)
      setLeft(l)
      if (l <= 0) setPhase('end')
    }, 100)
    return () => clearInterval(t)
  }, [phase])
  // New question: note the time, read reflex lines aloud
  useEffect(() => {
    if (phase !== 'run' || !q) return
    shownAt.current = Date.now()
    if (q.kind === 'rf' && sound) speak(q.prompt, { key: `C:${q.id}:a` })
    if (i >= deck.length - 1) setPhase('end')
  }, [phase, i]) // eslint-disable-line react-hooks/exhaustive-deps
  // Finished: save once
  useEffect(() => {
    if (phase !== 'end' || result) return
    stopSpeak()
    const t = score.times
    const ms = t.length ? t.reduce((a, b) => a + b, 0) / t.length : 0
    const r = saveSprint({ right: score.right, wrong: score.wrong, ms })
    if (r.levelUp) onLevelUp(r.levelUp)
    if (score.right > best && score.right > 0) confetti(undefined, undefined, 80)
    setResult({ ...r, ms, record: score.right > best && score.right > 0 })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (o) => {
    if (phase !== 'run' || flash || !q) return
    const ok = o === q.answer
    const ms = Date.now() - shownAt.current
    setFlash(o)
    setScore((s) => {
      const combo = ok ? s.combo + 1 : 0
      return { right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), combo, maxCombo: Math.max(s.maxCombo, combo), times: ok ? [...s.times, ms] : s.times }
    })
    setTimeout(() => { setFlash(null); setI((n) => n + 1) }, ok ? 280 : 900) // a wrong answer shows the right one a little longer
  }
  // Keys 1–4
  useEffect(() => {
    if (phase !== 'run') return
    const onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= 4 && q?.options[n - 1]) { e.preventDefault(); choose(q.options[n - 1]) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => () => stopSpeak(), [])
  useEnter(phase !== 'run', start)

  if (phase === 'intro') return (
    <div className="page talk-run">
      <button className="btn sm" onClick={onBack}>← Giao tiếp</button>
      <div className="card center sprint-intro">
        <Mascot size={96} mood="happy" className="bob" />
        <h1>⚡ Thử thách 60 giây</h1>
        <p>Trả lời <b>càng nhiều càng tốt</b> trong 1 phút: nghe câu nói rồi chọn câu đáp tự nhiên, hoặc nhìn câu tiếng Việt rồi chọn câu tiếng Anh đúng. Câu lấy từ những gì bạn đã học, nên càng luyện càng nhanh.</p>
        <div className="sprint-best">
          <span>🏆 Kỷ lục <b>{best}</b></span>
          <span>🕹️ Đã chơi <b>{runs.length}</b> lượt</span>
          <Sparkline values={runs.slice(-12).map((r) => r.r)} />
        </div>
        <label className="row gap-s small center-row"><input type="checkbox" style={{ width: 'auto' }} checked={sound} onChange={(e) => setSound(e.target.checked)} /> Đọc to câu nói (luyện nghe)</label>
        <button className="btn yellow big" onClick={start}>Bắt đầu ➜ <kbd>Enter</kbd></button>
        <p className="muted small">Trên máy tính: bấm phím 1–4 để chọn nhanh.</p>
      </div>
    </div>
  )

  if (phase === 'end') {
    const total = score.right + score.wrong
    return (
      <div className="page talk-run">
        <div className="card center sprint-end">
          <Mascot size={100} mood={score.right >= best ? 'cheer' : 'happy'} className="bob" />
          <h1>{result?.record ? '🏆 Kỷ lục mới!' : 'Hết giờ!'}</h1>
          <div className="sprint-score"><b>{score.right}</b><span>câu đúng</span></div>
          <div className="tile-grid small-tiles">
            <div className="stat-tile t-green"><span className="st-label">Chính xác</span><b className="st-value">{total ? Math.round((score.right / total) * 100) : 0}%</b></div>
            <div className="stat-tile t-blue"><span className="st-label">Tốc độ / câu</span><b className="st-value">{result ? (result.ms / 1000).toFixed(1) : '—'}s</b></div>
            <div className="stat-tile t-pink"><span className="st-label">Combo dài nhất</span><b className="st-value">×{score.maxCombo}</b></div>
            <div className="stat-tile t-yellow"><span className="st-label">XP nhận</span><b className="st-value">+{result?.xp || 0}</b></div>
          </div>
          <p className="small muted">{best > 0 && !result?.record ? `Kỷ lục của bạn: ${best}. ` : ''}XP từ thử thách tối đa 30 mỗi ngày — luyện thêm vẫn giúp phản xạ nhanh hơn.</p>
          <div className="row gap-s center-row wrap">
            <button className="btn yellow" onClick={start}>🔁 Chơi lại <kbd>Enter</kbd></button>
            <button className="btn" onClick={onBack}>Về Giao tiếp</button>
          </div>
        </div>
      </div>
    )
  }

  if (!q) return null
  return (
    <div className="page talk-run sprint">
      <div className="sprint-top">
        <span className="pill yellow">✅ {score.right}</span>
        {score.combo >= 3 && <span className="pill pink combo">🔥 Combo ×{score.combo}</span>}
        <span className={`pill ${left <= 10 ? 'pink' : 'blue'}`}>⏱ {Math.ceil(left)}s</span>
      </div>
      <div className="time-bar"><div style={{ width: `${(left / SECONDS) * 100}%` }} className={left <= 10 ? 'low' : ''} /></div>
      <div className="card step-card sprint-card" key={i}>
        <p className="prompt-label">{q.kind === 'rf' ? '💬 Người kia nói — bạn đáp:' : '🇻🇳 Câu tiếng Anh đúng nghĩa:'}</p>
        <h2 className={q.kind === 'rf' ? 'sprint-en' : 'vi-prompt'}>{q.prompt}</h2>
        <div className="options">
          {q.options.map((o, k) => {
            let cls = ''
            if (flash) cls = o === q.answer ? 'right' : o === flash ? 'wrong' : 'dim'
            return <button key={o} className={`option ${cls}`} onClick={() => choose(o)}><kbd className="opt-key">{k + 1}</kbd>{o}</button>
          })}
        </div>
      </div>
      <button className="link small" onClick={() => setPhase('end')}>Dừng sớm</button>
    </div>
  )
}
