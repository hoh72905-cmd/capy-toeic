import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, setState, getState } from '../lib/store.js'
import { todayKey, addDays, fromKey, VI_DAYS } from '../lib/date.js'
import { speak, stopSpeak, useSpeaking } from '../lib/speech.js'
import { grade } from '../lib/grade.js'
import { canListen, listenOnce, stopListening, voiceHint, needsAppUpdate } from '../lib/voice.js'
import { translate } from '../lib/translate.js'
import { confetti } from '../lib/confetti.js'
import {
  loadConvo, levelInfo, accuracy, streak, todayPlan, recordAnswer, routineBonus, flagItem, placementItems, placementLevel,
  setStart, CEFR, CEFR_VI, MIN_PER_DAY, STAGES, roleUnlocked,
} from '../lib/convo.js'
import { PHRASES, SPEAK_PROMPTS } from '../data/convoPhrases.js'
import { ROLEPLAYS } from '../data/roleplay.js'
import { useRecorder } from './Shadowing.jsx'
import Mascot from '../components/Mascot.jsx'
import Speak from '../components/Speak.jsx'

const PHRASE_BY_ID = new Map(PHRASES.map((p) => [p.id, p]))
const SPEAK_BY_ID = new Map(SPEAK_PROMPTS.map((p) => [p.id, p]))
const ROLE_BY_ID = new Map(ROLEPLAYS.map((r) => [r.id, r]))
const STEP_INFO = {
  phrases: { icon: '📌', name: 'Khởi động: mẫu câu', sub: 'Nghe & nói theo 3 mẫu câu (lặp lại mỗi ngày)' },
  review: { icon: '🔁', name: 'Ôn câu cũ', sub: 'Câu đến hạn ôn — nghe hoặc dịch lại' },
  fresh: { icon: '✍️', name: 'Dịch câu mới', sub: 'Việt → Anh, gõ hoặc nói' },
  ask: { icon: '❓', name: 'Đặt câu hỏi', sub: 'Hỏi lại bằng tiếng Anh' },
  reflex: { icon: '⚡', name: 'Phản xạ', sub: 'Nghe câu nói, chọn câu đáp trong 8 giây' },
  role: { icon: '🎭', name: 'Nhập vai hội thoại', sub: 'Nghe người kia nói, bạn nói lượt của mình' },
  speak: { icon: '💬', name: 'Nói nhanh', sub: 'Nói 30–60 giây theo chủ đề' },
}
const ORDER = ['phrases', 'review', 'role', 'fresh', 'ask', 'reflex', 'speak']
const shuffle = (a, seed) => { const r = [...a]; let s = seed; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7)
const LANG = 'en-US'

// ---------------------------------------------------------------- shared pieces
function LevelUp({ info, onClose }) {
  useEffect(() => { confetti(undefined, undefined, 90) }, [])
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
function AnswerBox({ value, onChange, onSubmit, placeholder, disabled }) {
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
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
        <textarea ref={inputRef} rows={2} value={value} disabled={disabled} placeholder={placeholder} autoCapitalize="sentences" spellCheck={false}
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
function Feedback({ result, answer, refs, item, onAccept, onFlag }) {
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

// ---------------------------------------------------------------- steps
function PhraseStep({ ids: startIds, onDone, onLevelUp }) {
  const [ids] = useState(startIds) // fixed for this run, even when items are marked done
  const [i, setI] = useState(0)
  const [heard, setHeard] = useState(null)
  const [times, setTimes] = useState(0)
  const p = PHRASE_BY_ID.get(ids[i])
  useEffect(() => { if (p) speak(p.en, { key: `C:${p.id}` }); else onDone(); setHeard(null); setTimes(0) }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return null
  const repeat = async () => {
    for (let k = 0; k < 3; k++) { const r = await speak(p.en, { key: `C:${p.id}` }); if (!r.ok) break; await new Promise((r2) => setTimeout(r2, 1400)) }
    setTimes((t) => t + 3)
  }
  const sayIt = async () => {
    try { const said = await listenOnce(LANG); if (said) { setHeard({ said, ...grade(said, [p.en.replace(/…/g, '')]) }); setTimes((t) => t + 1) } } catch (e) { setHeard({ err: voiceHint(e.code) }) }
  }
  const next = () => {
    const r = recordAnswer(p.id, 'phrase', 'right')
    if (r.levelUp) onLevelUp(r.levelUp)
    if (i + 1 >= ids.length) onDone(); else setI(i + 1)
  }
  return (
    <div className="card step-card">
      <p className="muted small">Mẫu câu {i + 1}/{ids.length} · {p.tag} · {CEFR[p.lv]}</p>
      <h2 className="phrase-en">{p.en} <Speak text={p.en} /></h2>
      <p className="phrase-vi">{p.vi}</p>
      <div className="row gap-s wrap">
        <button className="btn yellow" onClick={repeat}>🔁 Nghe & nhắc lại 3 lần</button>
        {canListen() && <button className="btn" onClick={sayIt}>🎙️ Nói thử</button>}
      </div>
      {heard?.said && <p className={heard.verdict === 'wrong' ? 'cause small' : 'ok-box small'}>Máy nghe: "{heard.said}" — khớp {Math.round(heard.score * 100)}%</p>}
      {heard?.err && <p className="cause small">{heard.err}</p>}
      <button className="btn blue wide" onClick={next}>{times ? `Đã nói ${times} lần — tiếp ➜` : 'Tiếp ➜'}</button>
    </div>
  )
}

function TranslateStep({ ids: startIds, kind, D, onDone, onLevelUp }) {
  const [ids] = useState(startIds)
  const byId = useMemo(() => new Map(D.tr.map((x) => [x.id, x])), [D])
  const list = ids.map((id) => byId.get(id)).filter(Boolean)
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const item = list[i]
  const alt = getState().convoItems[item?.id]?.alt || []
  const refs = item ? [...item.en, ...alt] : []
  // Reviews alternate: hear the English and say/type it back (listening), or translate again
  const listenMode = kind === 'review' && i % 2 === 0
  useEffect(() => {
    setAnswer(''); setResult(null)
    if (item && listenMode) setTimeout(() => speak(item.en[0], { key: `C:${item.id}` }), 300)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!item) onDone() }, [item]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!item) return null

  const submit = () => {
    if (result || !answer.trim()) return
    const g = grade(answer, listenMode ? [item.en[0], ...item.en.slice(1)] : refs)
    setResult(g)
    const r = recordAnswer(item.id, kind, g.verdict)
    if (r.levelUp) onLevelUp(r.levelUp)
    setTimeout(() => speak(g.best, { key: g.best === item.en[0] ? `C:${item.id}` : undefined }), 250) // always hear the right sentence
  }
  const accept = () => {
    recordAnswer(item.id, kind, 'right', { alt: answer.trim() })
    setResult({ ...result, verdict: 'right', score: 1 })
  }
  const next = () => { stopSpeak(); if (i + 1 >= list.length) onDone(); else setI(i + 1) }

  return (
    <div className="card step-card">
      <p className="muted small">{STEP_INFO[kind].icon} {STEP_INFO[kind].name} · câu {i + 1}/{list.length} · {CEFR[item.lv]}</p>
      {listenMode ? (
        <>
          <p className="prompt-label">🎧 Nghe rồi nói / gõ lại câu tiếng Anh</p>
          <div className="row gap-s"><button className="btn blue" onClick={() => speak(item.en[0], { key: `C:${item.id}` })}>▶ Nghe lại</button>
            <button className="btn" onClick={() => speak(item.en[0], { key: `C:${item.id}`, rate: 0.75 })}>🐢 Nghe chậm</button></div>
          {result && <p className="phrase-vi">🇻🇳 {item.vi}</p>}
        </>
      ) : (
        <>
          <p className="prompt-label">{kind === 'ask' ? '❓ Hỏi bằng tiếng Anh:' : '✍️ Nói câu này bằng tiếng Anh:'}</p>
          <h2 className="vi-prompt">{item.vi}</h2>
        </>
      )}
      <AnswerBox value={answer} onChange={setAnswer} onSubmit={result ? next : submit} disabled={!!result} placeholder={listenMode ? 'Câu bạn nghe được…' : 'Câu tiếng Anh của bạn…'} />
      {!result && (
        <div className="row between wrap gap-s">
          <button className="link small" onClick={() => setAnswer(item.en[0].split(' ').slice(0, 2).join(' ') + ' ')}>💡 Gợi ý 2 từ đầu</button>
          <button className="btn yellow" onClick={submit} disabled={!answer.trim()}>Kiểm tra ✓</button>
        </div>
      )}
      {result && (
        <>
          <Feedback result={result} answer={answer} refs={refs} item={listenMode ? null : item} onAccept={listenMode ? null : accept}
            onFlag={() => { flagItem(item.id); next() }} />
          <button className="btn blue wide" onClick={next}>Tiếp ➜</button>
        </>
      )}
    </div>
  )
}

function ReflexStep({ ids: startIds, D, onDone, onLevelUp }) {
  const [ids] = useState(startIds)
  const byId = useMemo(() => new Map(D.rf.map((x) => [x.id, x])), [D])
  const list = ids.map((id) => byId.get(id)).filter(Boolean)
  const { cefr } = levelInfo()
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [left, setLeft] = useState(8)
  const [showText, setShowText] = useState(cefr <= 1)
  const [vi, setVi] = useState('')
  const started = useRef(0)
  const item = list[i]
  const options = useMemo(() => (item ? shuffle([item.b, ...item.wrong], hash(item.id)) : []), [item])
  useEffect(() => {
    if (!item) { onDone(); return }
    setPick(null); setLeft(8); setVi('')
    speak(item.a, { key: `C:${item.id}:a` }).then(() => { started.current = Date.now() })
    started.current = Date.now() + 99999
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pick !== null || !item) return
    const t = setInterval(() => setLeft(Math.max(0, 8 - Math.floor((Date.now() - started.current) / 1000))), 250)
    return () => clearInterval(t)
  }, [pick, item])
  if (!item) return null
  const choose = (o) => {
    if (pick !== null) return
    setPick(o)
    const ok = o === item.b
    const fast = Date.now() - started.current < 5000
    const r = recordAnswer(item.id, 'reflex', ok ? 'right' : 'wrong', { fast: ok && fast })
    if (r.levelUp) onLevelUp(r.levelUp)
    setTimeout(() => speak(item.b, { key: `C:${item.id}:b` }), 300)
  }
  const next = () => { stopSpeak(); if (i + 1 >= list.length) onDone(); else setI(i + 1) }
  return (
    <div className="card step-card">
      <div className="row between"><p className="muted small">⚡ Phản xạ · lượt {i + 1}/{list.length} · {CEFR[item.lv]}</p>
        {pick === null && <span className={`pill ${left <= 3 ? 'pink' : 'blue'}`}>⏱ {left}s</span>}</div>
      <p className="prompt-label">Người kia nói:</p>
      <div className="reflex-line">
        <button className="btn blue" onClick={() => speak(item.a, { key: `C:${item.id}:a` })}>▶</button>
        <span className={showText || pick !== null ? '' : 'hidden-text'}>{item.a}</span>
        {!showText && pick === null && <button className="link small" onClick={() => setShowText(true)}>Hiện chữ</button>}
      </div>
      <p className="prompt-label">Bạn đáp lại thế nào cho tự nhiên?</p>
      <div className="options">
        {options.map((o) => {
          let cls = ''
          if (pick !== null) cls = o === item.b ? 'right' : o === pick ? 'wrong' : 'dim'
          return <button key={o} className={`option ${cls}`} onClick={() => choose(o)}>{o}</button>
        })}
      </div>
      {pick !== null && (
        <>
          <p className={pick === item.b ? 'ok-box small' : 'cause small'}>{pick === item.b ? '✅ Tự nhiên!' : '❌ Câu đáp hợp nhất là câu màu xanh.'} Nghe và <b>nói lại câu đáp</b> 2–3 lần cho quen miệng.</p>
          <div className="row gap-s wrap">
            <button className="btn" onClick={() => speak(item.b, { key: `C:${item.id}:b` })}>🔁 Nghe câu đáp</button>
            <button className="link small" onClick={async () => setVi(await translate(`${item.a}\n${item.b}`).catch(() => 'Không dịch được lúc này.'))}>🇻🇳 Xem nghĩa</button>
          </div>
          {vi && <p className="muted small">{vi}</p>}
          <button className="btn blue wide" onClick={next}>Tiếp ➜</button>
        </>
      )}
    </div>
  )
}

function SpeakStep({ id, onDone, onLevelUp }) {
  const p = SPEAK_BY_ID.get(id)
  const mic = useRecorder()
  const [sec, setSec] = useState(0)
  const [checks, setChecks] = useState([false, false, false])
  useEffect(() => {
    if (!mic.recording) return
    setSec(0)
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [mic.recording])
  useEffect(() => { if (!p) onDone() }, [p]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return null
  const finish = () => {
    const r = recordAnswer(p.id, 'speak', 'right')
    if (r.levelUp) onLevelUp(r.levelUp)
    onDone()
  }
  return (
    <div className="card step-card">
      <p className="muted small">💬 Nói nhanh · {CEFR[p.lv]}</p>
      <h2 className="vi-prompt">{p.vi}</h2>
      <p className="muted">{p.en} <Speak text={p.en} small /></p>
      <div className="help-box"><b>Gợi ý mẫu câu:</b>{p.help.map((h) => <span key={h} className="alt-ans">{h} <Speak text={h.replace(/…/g, '')} small /></span>)}</div>
      <p className="small">Nói liền mạch 30–60 giây, đừng sợ sai. Ghi âm để nghe lại mình.</p>
      <div className="row gap-s wrap">
        {!mic.recording ? <button className="btn yellow" onClick={mic.start}>🎙️ Bắt đầu nói</button>
          : <button className="btn pink rec" onClick={mic.stop}>⏺ {sec}s — bấm để dừng</button>}
      </div>
      {mic.err && <p className="cause small">{mic.err}</p>}
      {mic.url && <audio src={mic.url} controls className="my-audio" />}
      <div className="checklist">
        {['Mình nói đủ 3 ý', 'Mình dùng ít nhất 1 mẫu câu gợi ý', 'Mình không dừng quá 3 giây'].map((c, k) => (
          <label key={c} className="row gap-s small"><input type="checkbox" style={{ width: 'auto' }} checked={checks[k]} onChange={() => setChecks((x) => x.map((v, j) => (j === k ? !v : v)))} /> {c}</label>
        ))}
      </div>
      <button className="btn blue wide" onClick={finish}>Xong phần nói ✓</button>
    </div>
  )
}


// ---------------------------------------------------------------- role-play
function RoleplayStep({ id, onDone, onLevelUp, free }) {
  const rp = ROLE_BY_ID.get(id)
  const { cefr } = levelInfo()
  const [idx, setIdx] = useState(0)
  const [log, setLog] = useState([]) // { k, who, text, vi, result? }
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [blur, setBlur] = useState(cefr >= 2)
  const [shown, setShown] = useState({})
  const [replaying, setReplaying] = useState(false)
  const scores = useRef([])
  const endRef = useRef(null)
  const line = rp?.lines[idx]
  const finished = rp && idx >= rp.lines.length
  const key = (k) => `C:${rp.id}:${k}`

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [log.length, result])
  // Their lines: show and play, then move on by themselves
  useEffect(() => {
    if (!line || line.who !== 'them') return
    let off = false
    setLog((l) => [...l, { k: line.k, who: 'them', text: line.en, vi: line.vi }])
    speak(line.en, { key: key(line.k) }).then(() => setTimeout(() => { if (!off) setIdx((i) => i + 1) }, 350))
    return () => { off = true }
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps
  // The end: one review date for the whole dialogue
  useEffect(() => {
    if (!finished) return
    const avg = scores.current.length ? scores.current.reduce((a, b) => a + b, 0) / scores.current.length : 0
    const r = recordAnswer(rp.id, 'role', avg >= 0.85 ? 'right' : avg >= 0.6 ? 'close' : 'wrong')
    if (r.levelUp) onLevelUp(r.levelUp)
    setState((s) => ({ convoItems: { ...s.convoItems, [rp.id]: { ...s.convoItems[rp.id], best: Math.max(s.convoItems[rp.id]?.best || 0, Math.round(avg * 100)) } } }))
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!rp) return null

  const submit = () => {
    if (result || !answer.trim()) return
    const g = grade(answer, line.en)
    setResult(g)
    scores.current.push(g.verdict === 'right' ? 1 : g.verdict === 'close' ? 0.75 : g.score * 0.5)
    const r = recordAnswer(`${rp.id}:${line.k}`, 'roleTurn', g.verdict)
    if (r.levelUp) onLevelUp(r.levelUp)
    setTimeout(() => speak(g.best, { key: g.best === line.en[0] ? key(line.k) : undefined }), 250)
  }
  const accept = () => { scores.current[scores.current.length - 1] = 1; setResult({ ...result, verdict: 'right', score: 1 }) }
  const nextTurn = () => {
    stopSpeak()
    setLog((l) => [...l, { k: line.k, who: 'me', text: answer.trim(), model: result.best, verdict: result.verdict }])
    setAnswer(''); setResult(null); setIdx((i) => i + 1)
  }
  const replay = async () => {
    setReplaying(true)
    for (const l of rp.lines) {
      const r = await speak(l.who === 'them' ? l.en : l.en[0], { key: key(l.k) })
      if (!r.ok) break
      await new Promise((ok) => setTimeout(ok, 300))
    }
    setReplaying(false)
  }
  const restart = () => { stopSpeak(); scores.current = []; setLog([]); setShown({}); setResult(null); setAnswer(''); setIdx(0) }
  const avg = scores.current.length ? Math.round((scores.current.reduce((a, b) => a + b, 0) / scores.current.length) * 100) : 0

  return (
    <div className="card step-card role">
      <div className="row between wrap gap-s">
        <p className="muted small">{rp.scene} <b>{rp.title}</b> · {CEFR[rp.lv]} · bạn là <b>{rp.me}</b>, app là <b>{rp.them}</b></p>
        <label className="row gap-s small"><input type="checkbox" style={{ width: 'auto' }} checked={blur} onChange={(e) => setBlur(e.target.checked)} /> Ẩn chữ (luyện nghe)</label>
      </div>
      <div className="chat">
        {log.map((m, i) => m.who === 'them' ? (
          <div key={i} className="bubble-row them">
            <span className="avatar">{rp.scene}</span>
            <div className="bubble" onClick={() => setShown((x) => ({ ...x, [i]: !x[i] }))}>
              <span className={blur && !shown[i] && !finished ? 'hidden-text' : ''}>{m.text}</span>
              <button className="icon-btn sm" onClick={(e) => { e.stopPropagation(); speak(m.text, { key: key(m.k) }) }}>🔊</button>
              {shown[i] && <small className="muted">{m.vi}</small>}
            </div>
          </div>
        ) : (
          <div key={i} className="bubble-row me">
            <div className={`bubble ${m.verdict}`}>
              {m.text}
              {m.verdict !== 'right' && <small>✔ {m.model}</small>}
            </div>
          </div>
        ))}
        {line?.who === 'me' && (
          <div className="my-turn">
            <p className="prompt-label">🗣️ Lượt của bạn: {line.vi}</p>
            <AnswerBox value={answer} onChange={setAnswer} onSubmit={result ? nextTurn : submit} disabled={!!result} placeholder="Nói hoặc gõ câu của bạn…" />
            {!result ? (
              <div className="row between wrap gap-s">
                <button className="link small" onClick={() => setAnswer(line.en[0].split(' ').slice(0, 2).join(' ') + ' ')}>💡 Gợi ý</button>
                <button className="btn yellow" onClick={submit} disabled={!answer.trim()}>Nói ✓</button>
              </div>
            ) : (
              <>
                <Feedback result={result} answer={answer} refs={line.en} onAccept={accept} />
                <button className="btn blue wide" onClick={nextTurn}>Tiếp hội thoại ➜</button>
              </>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
      {finished && (
        <div className="center">
          <Mascot size={80} mood={avg >= 80 ? 'cheer' : 'think'} />
          <h2>Xong hội thoại · {avg}%</h2>
          <p className="muted small">Bài này sẽ quay lại theo lịch ôn. Nghe lại cả đoạn và nói nhẩm theo để nhớ lâu hơn.</p>
          <div className="row gap-s center-row wrap">
            <button className="btn blue" onClick={replaying ? stopSpeak : replay}>{replaying ? '⏹ Dừng' : '▶ Nghe lại cả đoạn'}</button>
            <button className="btn" onClick={restart}>🔁 Luyện lại</button>
            <button className="btn yellow" onClick={() => { stopSpeak(); onDone() }}>{free ? 'Xong ✓' : 'Tiếp ➜'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleLibrary({ onOpen, onBack }) {
  const { convoItems, convo } = useStore()
  const { cefr } = levelInfo(convo)
  return (
    <div className="page">
      <div className="row between"><button className="btn sm" onClick={onBack}>← Nhiệm vụ</button><span className="pill">🎭 {ROLEPLAYS.length} hội thoại</span></div>
      <h1>🎭 Hội thoại nhập vai</h1>
      <p className="muted">Mở khóa đến cấp {CEFR[Math.min(5, cefr + 1)]}. Lên cấp để mở thêm hội thoại khó hơn.</p>
      {CEFR.map((c, lv) => (
        <div key={c}>
          <h2 className="section-title">{c} · {CEFR_VI[lv]}</h2>
          <div className="lesson-grid">
            {ROLEPLAYS.filter((r) => r.lv === lv).map((r) => {
              const open = roleUnlocked(r, cefr)
              const st = convoItems[r.id]
              return (
                <button key={r.id} className={`card lesson-card ${open ? '' : 'locked'}`} disabled={!open} onClick={() => onOpen(r.id)}>
                  <span className="lesson-scene">{open ? r.scene : '🔒'}</span>
                  <div><b>{r.title}</b><p className="muted small">Bạn: {r.me} · {r.lines.filter((l) => l.who === 'me').length} lượt nói</p>
                    {st?.best != null && <span className={`pill ${st.best >= 80 ? 'green' : 'pink'}`}>Tốt nhất {st.best}%</span>}</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- placement test
function Placement({ D, onDone, onSkip }) {
  const { reflex, trans } = useMemo(() => placementItems(D), [D])
  const [phase, setPhase] = useState('intro')
  const [i, setI] = useState(0)
  const [points, setPoints] = useState({})
  const [answer, setAnswer] = useState('')
  const [pick, setPick] = useState(null)
  const add = (lv, v) => setPoints((p) => ({ ...p, [lv]: (p[lv] || 0) + v }))
  const total = reflex.length + trans.length
  const done = phase === 'reflex' ? i : phase === 'trans' ? reflex.length + i : 0
  useEffect(() => { if (phase === 'reflex' && reflex[i]) speak(reflex[i].a, { key: `C:${reflex[i].id}:a` }) }, [phase, i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro') return (
    <div className="card center">
      <Mascot size={100} mood="happy" />
      <h2>Bài kiểm tra đầu vào (~5 phút)</h2>
      <p>6 câu <b>nghe & phản xạ</b> + 6 câu <b>dịch Việt → Anh</b>, từ dễ (A1) đến khó (C2). Làm hết sức, không đoán bừa — app sẽ xếp bạn vào đúng cấp.</p>
      <div className="row gap-s center-row wrap">
        <button className="btn yellow" onClick={() => setPhase('reflex')}>Bắt đầu ➜</button>
        <button className="btn" onClick={onSkip}>Tự chọn cấp</button>
      </div>
    </div>
  )
  if (phase === 'result') {
    const lv = placementLevel(points)
    return (
      <div className="card center">
        <Mascot size={110} mood="cheer" className="bob" />
        <h2>Cấp của bạn: {CEFR[lv]} — {CEFR_VI[lv]}</h2>
        <p className="muted small">Điểm từng cấp: {CEFR.map((c, k) => `${c} ${(points[k] || 0).toFixed(1)}/2`).join(' · ')}</p>
        <p>Mỗi ngày làm ít nhất {MIN_PER_DAY} câu để giữ chuỗi 🔥. Trả lời càng chính xác, cấp lên càng nhanh.</p>
        <button className="btn yellow" onClick={() => { setStart(lv); onDone() }}>Bắt đầu học ở {CEFR[lv]} ➜</button>
      </div>
    )
  }
  const head = <div className="progress"><div style={{ width: `${(done / total) * 100}%` }} /></div>
  if (phase === 'reflex') {
    const it = reflex[i]
    const opts = shuffle([it.b, ...it.wrong], hash(it.id))
    const choose = (o) => { if (pick) return; setPick(o); if (o === it.b) add(it.lv, 1) }
    const next = () => { setPick(null); if (i + 1 >= reflex.length) { setPhase('trans'); setI(0) } else setI(i + 1) }
    return (
      <div className="card step-card">{head}
        <p className="muted small">Phần 1 · Nghe & phản xạ · câu {i + 1}/{reflex.length}</p>
        <div className="reflex-line"><button className="btn blue" onClick={() => speak(it.a, { key: `C:${it.id}:a` })}>▶ Nghe</button><span className={pick ? '' : 'hidden-text'}>{it.a}</span></div>
        <p className="prompt-label">Câu đáp tự nhiên nhất:</p>
        <div className="options">{opts.map((o) => <button key={o} className={`option ${pick ? (o === it.b ? 'right' : o === pick ? 'wrong' : 'dim') : ''}`} onClick={() => choose(o)}>{o}</button>)}</div>
        {pick && <button className="btn blue wide" onClick={next}>Tiếp ➜</button>}
      </div>
    )
  }
  const it = trans[i]
  const g = pick
  const check = () => { if (g || !answer.trim()) return; const r = grade(answer, it.en); setPick(r); add(it.lv, r.verdict === 'right' ? 1 : r.verdict === 'close' ? 0.6 : 0) }
  const next = () => { setPick(null); setAnswer(''); if (i + 1 >= trans.length) setPhase('result'); else setI(i + 1) }
  return (
    <div className="card step-card">{head}
      <p className="muted small">Phần 2 · Dịch Việt → Anh · câu {i + 1}/{trans.length}</p>
      <h2 className="vi-prompt">{it.vi}</h2>
      <AnswerBox value={answer} onChange={setAnswer} onSubmit={g ? next : check} disabled={!!g} placeholder="Câu tiếng Anh của bạn…" />
      {!g ? (
        <div className="row between"><button className="link small" onClick={() => { setPick({ verdict: 'wrong', score: 0, best: it.en[0], missing: [], extra: [] }) }}>Mình chưa dịch được →</button>
          <button className="btn yellow" onClick={check} disabled={!answer.trim()}>Kiểm tra ✓</button></div>
      ) : <><Feedback result={g} answer={answer} refs={it.en} /><button className="btn blue wide" onClick={next}>Tiếp ➜</button></>}
    </div>
  )
}

function ChooseLevel({ onDone }) {
  return (
    <div className="card">
      <h2>Chọn cấp bắt đầu</h2>
      <div className="level-pick">
        {CEFR.map((c, k) => (
          <button key={c} className="card lesson-card" onClick={() => { setStart(k); onDone() }}>
            <span className="lv-badge">{c}</span><div><b>{CEFR_VI[k]}</b><p className="muted small">{['Chào hỏi, câu ngắn hằng ngày', 'Kể việc, mua sắm, hỏi đường', 'Nêu ý kiến, kể kinh nghiệm', 'Thảo luận, thuyết phục', 'Lập luận, nói tự nhiên', 'Thành ngữ, tinh tế như người bản xứ'][k]}</p></div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- page
export default function Convo() {
  const store = useStore()
  const { convo, convoDays, convoItems } = store
  const [D, setD] = useState(null)
  const [view, setView] = useState('home') // home | run | test | choose | roles | role
  const [freeRole, setFreeRole] = useState(null)
  const [step, setStep] = useState(null) // the step being run
  const [runAll, setRunAll] = useState(false)
  const [levelUp, setLevelUp] = useState(null)
  const [bonus, setBonus] = useState(0)
  useEffect(() => { loadConvo().then(setD) }, [])
  const today = todayKey()
  const plan = convoDays[today]?.plan
  // Today's routine is made once (after the level is known) and kept for the day
  useEffect(() => { if (D && convo.placed && (!plan || !plan.role)) todayPlan(D) }, [D, convo.placed, plan])
  if (!D) return <div className="page center"><Mascot size={90} mood="think" /><p className="muted">Đang tải bài giao tiếp…</p></div>

  if (!convo.placed && view === 'home') return (
    <div className="page">
      <div className="card center talk-hero">
        <Mascot size={110} mood="happy" className="bob" />
        <h1>💬 Tiếng Anh giao tiếp</h1>
        <p>Học <b>phản xạ nói và nghe</b> mỗi ngày 10–15 phút: dịch câu, đáp lời, đặt câu hỏi, nói nhanh. Câu đã học sẽ <b>lặp lại</b> đúng lúc bạn sắp quên. Lên cấp từ A1 đến C2 như chơi game.</p>
        <div className="row gap-s center-row wrap">
          <button className="btn yellow" onClick={() => setView('test')}>📝 Làm bài kiểm tra đầu vào</button>
          <button className="btn" onClick={() => setView('choose')}>Tự chọn cấp</button>
        </div>
      </div>
    </div>
  )
  if (view === 'test') return <div className="page"><Placement D={D} onDone={() => setView('home')} onSkip={() => setView('choose')} /></div>
  if (view === 'choose') return <div className="page"><ChooseLevel onDone={() => setView('home')} /></div>
  if (view === 'roles') return <RoleLibrary onBack={() => setView('home')} onOpen={(id) => { setFreeRole(id); setView('role') }} />
  if (view === 'role' && freeRole) return (
    <div className="page talk-run">
      <button className="btn sm" onClick={() => { stopSpeak(); setView('roles') }}>← Danh sách hội thoại</button>
      <RoleplayStep key={freeRole} id={freeRole} free onDone={() => setView('roles')} onLevelUp={setLevelUp} />
      {levelUp && <LevelUp info={levelUp} onClose={() => setLevelUp(null)} />}
    </div>
  )

  if (!plan) return <div className="page center"><Mascot size={90} mood="think" /><p className="muted">Đang chuẩn bị bài hôm nay…</p></div>
  const day = convoDays[today] || { n: 0, ok: 0, xp: 0, done: {} }
  const lvl = levelInfo(convo)
  const acc = accuracy(convo)
  const st = streak(convoDays)
  const stepLen = (k) => (k === 'speak' ? 1 : k === 'role' ? (plan.role ? 1 : 0) : (plan[k] || []).length)
  const doneKey = (k) => (k === 'phrases' ? 'phrase' : k)
  const stepDone = (k) => Math.min(stepLen(k), (day.done?.[doneKey(k)] || []).length)
  const steps = ORDER.filter((k) => stepLen(k) > 0)
  const allDone = steps.every((k) => stepDone(k) >= stepLen(k))
  const learned = Object.keys(convoItems).filter((id) => id.startsWith('t') && !convoItems[id].bad).length
  const mastered = Object.entries(convoItems).filter(([id, s]) => !id.startsWith('s') && s.box >= 5).length

  const startStep = (k, all = false) => { setRunAll(all); setStep(k); setView('run') }
  const afterStep = () => {
    const s = getState()
    const d = s.convoDays[today] || { done: {} }
    if (runAll) {
      const nextStep = steps.find((k) => (d.done?.[doneKey(k)] || []).length < stepLen(k) && k !== step)
      if (nextStep) { setStep(nextStep); return }
    }
    const finished = steps.every((k) => ((d.done?.[doneKey(k)] || []).length) >= stepLen(k))
    if (finished) { const b = routineBonus(); if (b) { setBonus(b); confetti(undefined, undefined, 80) } }
    setView('home'); setStep(null)
  }
  const remaining = (k) => (k === 'speak' ? [plan.speak] : k === 'role' ? [plan.role] : (plan[k] || []).filter((id) => !(day.done?.[doneKey(k)] || []).includes(id)))

  if (view === 'run' && step) {
    const ids = remaining(step)
    const props = { D, onDone: afterStep, onLevelUp: setLevelUp }
    return (
      <div className="page talk-run">
        <div className="row between wrap gap-s">
          <button className="btn sm" onClick={() => { stopSpeak(); setView('home') }}>← Nhiệm vụ</button>
          <span className="pill yellow">⭐ {lvl.name} · {lvl.into}/{lvl.need} XP</span>
          <span className="pill">🔥 {st} · hôm nay {day.n} câu · +{day.xp} XP</span>
        </div>
        <ol className="stepper mini">
          {steps.map((k) => <li key={k} className={k === step ? 'now' : stepDone(k) >= stepLen(k) ? 'done' : ''}><span className="dot">{STEP_INFO[k].icon}</span></li>)}
        </ol>
        {step === 'phrases' && <PhraseStep key={step} ids={ids} {...props} />}
        {(step === 'review' || step === 'fresh' || step === 'ask') && <TranslateStep key={step} ids={ids} kind={step} {...props} />}
        {step === 'reflex' && <ReflexStep key={step} ids={ids} {...props} />}
        {step === 'speak' && <SpeakStep key={step} id={plan.speak} {...props} />}
        {step === 'role' && <RoleplayStep key={step} id={plan.role} {...props} />}
        {levelUp && <LevelUp info={levelUp} onClose={() => setLevelUp(null)} />}
      </div>
    )
  }

  // 14-day calendar: green = streak day (≥ 5 sentences)
  const days14 = Array.from({ length: 14 }, (_, k) => addDays(today, k - 13))
  return (
    <div className="page talk">
      <section className="card talk-level tint-yellow">
        <div className="lv-big"><span>{CEFR[lvl.cefr]}</span><small>chặng {lvl.sub}/3</small></div>
        <div className="grow">
          <p className="eyebrow">💬 Tiếng Anh giao tiếp · {CEFR_VI[lvl.cefr]}</p>
          <h1>Cấp {lvl.name}</h1>
          <div className="xp-bar"><div style={{ width: `${lvl.pct}%` }} /><span>{lvl.into}/{lvl.need} XP</span></div>
          <div className="stat-row">
            <span className="stat"><b>🔥 {st}</b> ngày liên tiếp</span>
            <span className="stat"><b>🎯 {Math.round(acc * 100)}%</b> chính xác gần đây</span>
            <span className="stat"><b>🧠 {learned}</b> câu đã học · {mastered} thuộc lòng</span>
            <span className="stat"><b>🏁 {lvl.stage + 1}/{STAGES}</b> chặng đến C2</span>
          </div>
        </div>
      </section>

      {bonus > 0 && <div className="ok-box">🎁 Hoàn thành nhiệm vụ hôm nay: +{bonus} XP thưởng{bonus >= 60 ? ' (gấp đôi vì chính xác ≥ 90%)' : ''}!</div>}

      <section className="card">
        <div className="row between wrap gap-s">
          <h2>🗓️ Nhiệm vụ hôm nay</h2>
          <span className={`pill ${day.n >= MIN_PER_DAY ? 'green' : 'pink'}`}>{day.n}/{MIN_PER_DAY} câu tối thiểu {day.n >= MIN_PER_DAY ? '✓ giữ chuỗi' : ''}</span>
        </div>
        <div className="quest-list">
          {steps.map((k) => {
            const ok = stepDone(k) >= stepLen(k)
            return (
              <button key={k} className={`quest ${ok ? 'done' : ''}`} onClick={() => !ok && startStep(k)}>
                <span className="q-icon">{STEP_INFO[k].icon}</span>
                <span className="grow"><b>{STEP_INFO[k].name}</b><small>{STEP_INFO[k].sub}</small></span>
                <span className="pill">{ok ? '✓' : `${stepDone(k)}/${stepLen(k)}`}</span>
              </button>
            )
          })}
        </div>
        {!allDone
          ? <button className="btn start-btn" onClick={() => startStep(steps.find((k) => stepDone(k) < stepLen(k)), true)}><span>▶ Luyện tiếp nhiệm vụ hôm nay</span><small>~10–15 phút · thưởng XP khi xong hết</small></button>
          : <p className="celebrate">🎉 Xong nhiệm vụ hôm nay! Mai quay lại để ôn đúng lúc nhé — sự lặp lại là chìa khóa.</p>}
      </section>

      <button className="card role-entry" onClick={() => setView('roles')}>
        <span className="lesson-scene">🎭</span>
        <span className="grow"><b>Hội thoại nhập vai</b><small>{ROLEPLAYS.filter((r) => roleUnlocked(r, lvl.cefr)).length}/{ROLEPLAYS.length} hội thoại đã mở · luyện thêm bất cứ lúc nào</small></span>
        <span className="pill blue">Mở ➜</span>
      </button>

      <div className="grid-2">
        <section className="card tint-blue">
          <h2>📌 Mẫu câu hôm nay</h2>
          <ul className="phrase-list">
            {plan.phrases.map((id) => { const p = PHRASE_BY_ID.get(id); return p && <li key={id}><Speak text={p.en} small /> <b>{p.en}</b><br /><span className="muted small">{p.vi}</span></li> })}
          </ul>
        </section>
        <section className="card">
          <h2>📈 14 ngày qua</h2>
          <div className="streak-cal">
            {days14.map((d) => {
              const n = convoDays[d]?.n || 0
              return <div key={d} className={`sc ${n >= MIN_PER_DAY ? 'on' : n ? 'half' : ''} ${d === today ? 'today' : ''}`} title={`${d}: ${n} câu`}><span>{VI_DAYS[fromKey(d).getDay()]}</span><b>{n || ''}</b></div>
            })}
          </div>
          <label className="row gap-s small">Câu mới mỗi ngày
            <select value={convo.daily || 7} onChange={(e) => setState((s) => ({ convo: { ...s.convo, daily: Number(e.target.value) } }))} style={{ width: 'auto' }}>
              {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className="link small" onClick={() => setView('test')}>📝 Làm lại bài kiểm tra xếp cấp</button>
        </section>
      </div>
      <p className="muted small source-note">Câu dịch: <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a> (CC BY 2.0 FR) · Hội thoại phản xạ: DailyDialog (Li et al. 2017, CC BY-NC-SA 4.0) · Cấp độ ước lượng theo NGSL (CC BY-SA 4.0) · Mẫu câu & đề nói: Capy TOEIC.</p>
    </div>
  )
}
