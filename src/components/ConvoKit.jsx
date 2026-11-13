// Pieces shared by the Giao tiếp screens: answer box (type or speak), grader feedback,
// Enter-to-continue, the level-up box and small helpers.
import { useEffect, useRef, useState } from 'react'
import { stopSpeak } from '../lib/speech.js'
import { canListen, listenOnce, stopListening, voiceHint, needsAppUpdate } from '../lib/voice.js'
import { confetti } from '../lib/confetti.js'
import { CEFR, CEFR_VI } from '../lib/convo.js'
import Mascot from './Mascot.jsx'
import Speak from './Speak.jsx'

export const shuffle = (a, seed) => { const r = [...a]; let s = seed; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
export const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7)
export const LANG = 'en-US'

// ---------------------------------------------------------------- shared pieces
// Enter = go on (next sentence / next turn) while `active`. Listens on window in the capture phase so it
// also wins over a focused button (no double click), but leaves typing in an open text box alone.
export function useEnter(active, fn, { modal = false } = {}) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return
      const t = e.target
      if ((t?.tagName === 'TEXTAREA' || t?.tagName === 'INPUT') && !t.disabled) return
      if (!modal && document.querySelector('.modal-back')) return // the level-up box takes Enter first
      e.preventDefault(); e.stopPropagation()
      fnRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, modal])
}

export function LevelUp({ info, onClose }) {
  useEffect(() => { confetti(undefined, undefined, 90) }, [])
  useEnter(true, onClose, { modal: true })
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="card center levelup" onClick={(e) => e.stopPropagation()}>
        <Mascot size={110} mood="cheer" className="bob" />
        <h2>🎉 Lên cấp {info.name}!</h2>
        <p>{info.sub === 1 ? `Chào mừng đến trình độ ${CEFR[info.cefr]} — ${CEFR_VI[info.cefr]}. Câu mới sẽ khó hơn một chút.` : 'Bạn đang tiến bộ rõ rệt. Giữ nhịp mỗi ngày nhé!'}</p>
        <button className="btn yellow" onClick={onClose}>Tiếp tục ➜</button>
      </div>
    </div>
  )
}

// Text box + microphone: type or say the answer
export function AnswerBox({ value, onChange, onSubmit, placeholder, disabled, rows = 2 }) {
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (!disabled) inputRef.current?.focus() }, [disabled])
  const mic = async () => {
    if (busy) { stopListening(); return }
    setHint(''); setBusy(true); stopSpeak()
    try {
      const said = await listenOnce(LANG)
      if (said) onChange(said); else setHint('Không nghe thấy gì — thử nói lại nhé.')
    } catch (e) { setHint(voiceHint(e.code)) }
    setBusy(false)
  }
  return (
    <div className="answer-box">
      <div className="row gap-s">
        <textarea ref={inputRef} rows={rows} value={value} disabled={disabled} placeholder={placeholder} autoCapitalize="sentences" spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }} />
        {(canListen() || needsAppUpdate()) && (
          <button type="button" className={`btn mic ${busy ? 'pink rec' : ''}`} onClick={mic} disabled={disabled} title="Nói câu trả lời">{busy ? '⏺' : '🎙️'}</button>
        )}
      </div>
      {hint && <p className="cause small">{hint}</p>}
    </div>
  )
}

// What the grader thinks, with the accepted ways of saying it
export function Feedback({ result, answer, refs, item, onAccept, onFlag }) {
  const colors = { right: 'fb-right', close: 'fb-close', wrong: 'fb-wrong' }
  const title = { right: '✅ Chính xác!', close: '👍 Gần đúng', wrong: '❌ Chưa đúng' }[result.verdict]
  const miss = new Set(result.missing)
  const extra = new Set(result.extra)
  const others = refs.filter((r) => r !== result.best)
  return (
    <div className={`feedback ${colors[result.verdict]}`}>
      <b>{title}</b> <span className="muted small">khớp {Math.round(result.score * 100)}%</span>
      {answer && result.verdict !== 'right' && (
        <p className="small">Bạn: {answer.split(/\s+/).map((w, i) => <span key={i} className={extra.has(w.toLowerCase().replace(/[^a-z0-9']/g, '')) ? 'w-miss' : ''}>{w} </span>)}</p>
      )}
      <p className="best">
        <Speak text={result.best} small /> {result.best.split(/\s+/).map((w, i) => <span key={i} className={miss.has(w.toLowerCase().replace(/[^a-z0-9']/g, '')) ? 'w-need' : ''}>{w} </span>)}
      </p>
      {others.length > 0 && <p className="small muted">Cách nói khác: {others.slice(0, 3).map((o) => <span key={o} className="alt-ans">{o}</span>)}</p>}
      {item?.vi && <p className="small muted">🇻🇳 {item.vi}</p>}
      <div className="row gap-s wrap">
        {result.verdict !== 'right' && onAccept && <button className="btn sm" onClick={onAccept}>✋ Câu của mình cũng đúng</button>}
        {onFlag && <button className="link small" onClick={onFlag}>⚑ Báo câu lỗi</button>}
      </div>
    </div>
  )
}

