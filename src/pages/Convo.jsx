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
  setStart, CEFR, CEFR_VI, MIN_PER_DAY, STAGES, roleUnlocked, INTENSITY, intensityOf, setIntensity, planProgress,
} from '../lib/convo.js'
import { convoStats } from '../lib/convoStats.js'
import { PHRASES, SPEAK_PROMPTS } from '../data/convoPhrases.js'
import { ROLEPLAYS } from '../data/roleplay.js'
import { useRecorder } from './Shadowing.jsx'
import Mascot from '../components/Mascot.jsx'
import Speak from '../components/Speak.jsx'
import { useEnter, LevelUp, AnswerBox, Feedback, shuffle, hash, LANG } from '../components/ConvoKit.jsx'
import { Ring, Sparkline } from '../components/Charts.jsx'
import { EXPLAIN_BY_ID } from '../data/explain.js'
import { gradeExplain, framesFor, KIND_NAME } from '../lib/explain.js'
import ConvoStats from './ConvoStats.jsx'
import ConvoSprint from './ConvoSprint.jsx'
import { LONG_BY_ID, LONG_DLG, TOPIC_VI } from '../data/convoLong.js'
import { LONG_MODES, LONG_MODE_NAME, DLG_MODES, DLG_MODE_NAME, modeOf, gradeLong, chunks, gradeOrder, gapsFor, gradeGaps, gradeReply } from '../lib/longPractice.js'

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
  explain: { icon: '🧩', name: 'Diễn đạt ý', sub: 'Nói/viết vài câu bằng lời của bạn, app chấm đủ ý' },
  long: { icon: '📜', name: 'Dịch câu dài', sub: 'Câu 15–30 từ: dịch, xếp cụm, nghe chép, điền từ, nói' },
  dialog: { icon: '🗣️', name: 'Đối đáp câu dài', sub: 'Nghe người kia nói, trả lời 2–3 ý bằng câu dài' },
}
const ORDER = ['phrases', 'review', 'long', 'dialog', 'role', 'fresh', 'ask', 'reflex', 'explain', 'speak']
// Rough minutes per item, for the time estimate of the day
const MINUTES = { phrases: 0.5, review: 0.6, long: 1.6, dialog: 2.2, role: 4, fresh: 0.8, ask: 0.8, reflex: 0.3, explain: 4, speak: 2 }
// Personal average time to pick a reflex reply over the last 7 days (ms), or null
function myReflexMs() {
  const days = getState().convoDays
  let sum = 0, n = 0
  for (let k = 0; k < 7; k++) { const p = days[addDays(todayKey(), -k)]?.rt; if (p) { sum += p[0]; n += p[1] } }
  return n >= 5 ? sum / n : null
}
// ---------------------------------------------------------------- steps
function PhraseStep({ ids: startIds, onDone, onLevelUp }) {
  const [ids] = useState(startIds) // fixed for this run, even when items are marked done
  const [i, setI] = useState(0)
  const [heard, setHeard] = useState(null)
  const [times, setTimes] = useState(0)
  const p = PHRASE_BY_ID.get(ids[i])
  useEffect(() => { if (p) speak(p.en, { key: `C:${p.id}` }); else onDone(); setHeard(null); setTimes(0) }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
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
  useEnter(!!p, next)
  if (!p) return null
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
      <button className="btn blue wide" onClick={next}>{times ? `Đã nói ${times} lần — tiếp ➜` : 'Tiếp ➜'} <kbd>Enter</kbd></button>
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
  const shownAt = useRef(Date.now())
  const [ms, setMs] = useState(0)
  useEffect(() => {
    setAnswer(''); setResult(null); shownAt.current = Date.now()
    if (item && listenMode) setTimeout(() => speak(item.en[0], { key: `C:${item.id}` }), 300)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!item) onDone() }, [item]) // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => { stopSpeak(); if (i + 1 >= list.length) onDone(); else setI(i + 1) }
  useEnter(!!result && !!item, next)
  if (!item) return null

  const submit = () => {
    if (result || !answer.trim()) return
    const g = grade(answer, listenMode ? [item.en[0], ...item.en.slice(1)] : refs)
    setResult(g)
    const took = Date.now() - shownAt.current
    setMs(took)
    const r = recordAnswer(item.id, kind, g.verdict, { ms: took, skill: listenMode ? 'listen' : undefined })
    if (r.levelUp) onLevelUp(r.levelUp)
    setTimeout(() => speak(g.best, { key: g.best === item.en[0] ? `C:${item.id}` : undefined }), 250) // always hear the right sentence
  }
  const accept = () => {
    recordAnswer(item.id, kind, 'right', { alt: answer.trim() })
    setResult({ ...result, verdict: 'right', score: 1 })
  }

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
          {!listenMode && ms > 0 && result.verdict !== 'wrong' && <p className="small muted think-time">⏱ Bạn nghĩ và trả lời trong <b>{(ms / 1000).toFixed(1)} giây</b>{ms < 8000 ? ' — phản xạ tốt!' : ' — lần ôn sau thử nói nhanh hơn nhé.'}</p>}
          <button className="btn blue wide" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button>
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
  // Time limit follows your own speed: 1.5 × your average, between 4 and 8 seconds
  const [limit] = useState(() => { const m = myReflexMs(); return m ? Math.max(4, Math.min(8, Math.round((m * 1.5) / 1000))) : 8 })
  const [avgMs] = useState(myReflexMs)
  const [left, setLeft] = useState(limit)
  const [took, setTook] = useState(0)
  const [said, setSaid] = useState(null)
  const [showText, setShowText] = useState(cefr <= 1)
  const [vi, setVi] = useState('')
  const started = useRef(0)
  const item = list[i]
  const options = useMemo(() => (item ? shuffle([item.b, ...item.wrong], hash(item.id)) : []), [item])
  useEffect(() => {
    if (!item) { onDone(); return }
    setPick(null); setLeft(limit); setVi(''); setSaid(null); setTook(0)
    speak(item.a, { key: `C:${item.id}:a` }).then(() => { started.current = Date.now() })
    started.current = Date.now() + 99999
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pick !== null || !item) return
    const t = setInterval(() => setLeft(Math.max(0, limit - Math.floor((Date.now() - started.current) / 1000))), 250)
    return () => clearInterval(t)
  }, [pick, item])
  const next = () => { stopSpeak(); if (i + 1 >= list.length) onDone(); else setI(i + 1) }
  useEnter(pick !== null && !!item, next)
  if (!item) return null
  const choose = (o) => {
    if (pick !== null) return
    setPick(o)
    const ok = o === item.b
    const ms = Math.max(0, Date.now() - started.current)
    setTook(ms)
    const fast = ms < Math.min(5000, avgMs || 5000) // quicker than your usual = bonus
    const r = recordAnswer(item.id, 'reflex', ok ? 'right' : 'wrong', { fast: ok && fast, ms })
    if (r.levelUp) onLevelUp(r.levelUp)
    setTimeout(() => speak(item.b, { key: `C:${item.id}:b` }), 300)
  }
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
          <p className={pick === item.b ? 'ok-box small' : 'cause small'}>{pick === item.b ? `✅ Tự nhiên! ⏱ ${(took / 1000).toFixed(1)}s${avgMs ? (took < avgMs ? ` — nhanh hơn mức trung bình ${(avgMs / 1000).toFixed(1)}s của bạn ⚡` : ` (trung bình của bạn ${(avgMs / 1000).toFixed(1)}s)`) : ''}.` : '❌ Câu đáp hợp nhất là câu màu xanh.'} Nghe và <b>nói lại câu đáp</b> 2–3 lần cho quen miệng.</p>
          <div className="row gap-s wrap">
            <button className="btn" onClick={() => speak(item.b, { key: `C:${item.id}:b` })}>🔁 Nghe câu đáp</button>
            {canListen() && <button className="btn" onClick={async () => { try { const t = await listenOnce(LANG); setSaid(t ? { t, g: grade(t, [item.b]) } : { t: '', g: null }) } catch (e) { setSaid({ err: voiceHint(e.code) }) } }}>🎙️ Nói lại câu đáp</button>}
            <button className="link small" onClick={async () => setVi(await translate(`${item.a}\n${item.b}`).catch(() => 'Không dịch được lúc này.'))}>🇻🇳 Xem nghĩa</button>
          </div>
          {vi && <p className="muted small">{vi}</p>}
          {said && <p className={said.g && said.g.verdict !== 'wrong' ? 'ok-box small' : 'cause small'}>{said.err || (said.g ? `Máy nghe: "${said.t}" — khớp ${Math.round(said.g.score * 100)}%${said.g.verdict === 'right' ? ' 👏' : ''}` : 'Không nghe thấy gì — thử lại nhé.')}</p>}
          <button className="btn blue wide" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- explain in your own words
function ExplainStep({ id, onDone, onLevelUp }) {
  const p = EXPLAIN_BY_ID.get(id)
  const [answer, setAnswer] = useState('')
  const [tries, setTries] = useState([]) // graded attempts: { answer, g }
  const [editing, setEditing] = useState(true)
  const live = useMemo(() => (p ? gradeExplain(answer, p) : null), [answer, p])
  const last = tries[tries.length - 1]
  const best = tries.reduce((a, t) => (!a || t.g.score > a.g.score ? t : a), null)
  useEffect(() => { if (!p) onDone() }, [p]) // eslint-disable-line react-hooks/exhaustive-deps
  const finish = () => {
    stopSpeak()
    if (best) {
      const r = recordAnswer(p.id, 'explain', best.g.verdict, { score: best.g.score })
      if (r.levelUp) onLevelUp(r.levelUp)
    }
    onDone()
  }
  useEnter(!!p && !editing, finish)
  if (!p) return null
  const submit = () => {
    if (!editing || !answer.trim()) return
    const g = gradeExplain(answer, p)
    setTries((t) => [...t, { answer, g }])
    setEditing(false)
    setTimeout(() => speak(p.model, {}), 400)
  }
  const addFrame = (f) => setAnswer((a) => `${a}${a && !/\s$/.test(a) ? ' ' : ''}${f.replace(/…/g, '').trim()} `)
  const g = editing ? live : last.g
  const title = { right: '🌟 Diễn đạt rõ ràng!', close: '👍 Khá tốt — thêm chút nữa', wrong: '💪 Chưa đủ ý' }[g.verdict]
  return (
    <div className="card step-card explain">
      <p className="muted small">🧩 Diễn đạt ý · {CEFR[p.lv]} · {KIND_NAME[p.kind]}{tries.length > 0 ? ` · lần ${tries.length + (editing ? 1 : 0)}` : ''}</p>
      <h2 className="vi-prompt">{p.vi}</h2>
      {p.ban && <p className="small ban-word">🚫 Không được nói từ <b>{p.ban.split('|')[0].replace(/(\w+)$/, '$1…')}</b> — hãy mô tả nó.</p>}
      <div className="idea-chips" aria-label="Các ý cần có">
        <span className="muted small">Ý cần có:</span>
        {g.ideas.map((it) => <span key={it.label} className={`idea ${it.ok ? 'ok' : ''}`}>{it.ok ? '✓' : '○'} {it.label}</span>)}
      </div>
      {editing && (
        <div className="frames">
          <span className="muted small">Mẫu mở đầu (chạm để chèn):</span>
          {framesFor(p).map((f) => <button key={f} type="button" className="frame" onClick={() => addFrame(f)}>{f}</button>)}
        </div>
      )}
      <AnswerBox rows={4} value={answer} onChange={setAnswer} onSubmit={submit} disabled={!editing} placeholder="Nói 🎙️ hoặc gõ bằng tiếng Anh, theo cách của bạn…" />
      <div className="explain-meters">
        <span className={g.words >= g.target ? 'ok' : ''}>📝 {g.words}/{g.target} từ</span>
        <span className={g.links.length >= g.need ? 'ok' : ''}>🔗 {g.links.length}/{g.need} từ nối{g.links.length ? `: ${g.links.slice(0, 4).join(', ')}` : ''}</span>
        <span className={g.ideas.every((i) => i.ok) ? 'ok' : ''}>💡 {g.ideas.filter((i) => i.ok).length}/{g.ideas.length} ý</span>
      </div>
      {editing ? (
        <div className="row between wrap gap-s">
          <button className="link small" onClick={() => setAnswer(p.model.split(/(?<=[.!?])\s/)[0] + ' ')}>💡 Xem câu mở đầu mẫu</button>
          <button className="btn yellow" onClick={submit} disabled={!answer.trim()}>Kiểm tra ✓</button>
        </div>
      ) : (
        <div className={`feedback explain-fb fb-${g.verdict}`}>
          <div className="row gap-s">
            <Ring pct={g.score} size={64} stroke={7}><b>{Math.round(g.score * 100)}</b></Ring>
            <div className="grow">
              <b>{title}</b>
              {g.vi && <p className="small">Hãy trả lời bằng <b>tiếng Anh</b> nhé.</p>}
              {g.banned && <p className="small">Bạn đã dùng thẳng từ bị cấm — thử giải thích mà không dùng nó.</p>}
              {!g.vi && g.ideas.some((i) => !i.ok) && <p className="small">Còn thiếu: {g.ideas.filter((i) => !i.ok).map((i) => i.label).join(', ')}.</p>}
              {!g.vi && g.links.length < g.need && <p className="small">Nối các ý bằng <i>because, so, but, however…</i> để câu mạch lạc hơn.</p>}
              {tries.length > 1 && <p className="small">Lần 1: {Math.round(tries[0].g.score * 100)} → lần {tries.length}: {Math.round(g.score * 100)} {g.score > tries[0].g.score ? '📈' : ''}</p>}
            </div>
          </div>
          <p className="best"><Speak text={p.model} small /> <b>Câu mẫu:</b> {p.model}</p>
          <p className="small muted">Câu mẫu chỉ là một cách nói — câu của bạn khác vẫn được, miễn đủ ý. Đọc to câu mẫu một lần để học cách nối ý.</p>
        </div>
      )}
      {!editing && (
        <div className="row gap-s wrap">
          {tries.length < 3 && g.verdict !== 'right' && <button className="btn" onClick={() => setEditing(true)}>✍️ Nói lại hay hơn</button>}
          <button className="btn blue grow" onClick={finish}>Tiếp ➜ <kbd>Enter</kbd></button>
        </div>
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
  const finish = () => {
    mic.stop()
    const r = recordAnswer(p.id, 'speak', 'right')
    if (r.levelUp) onLevelUp(r.levelUp)
    onDone()
  }
  useEnter(!!p, finish)
  if (!p) return null
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
      <button className="btn blue wide" onClick={finish}>Xong phần nói ✓ <kbd>Enter</kbd></button>
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
  const nextTurn = () => {
    stopSpeak()
    setLog((l) => [...l, { k: line.k, who: 'me', text: answer.trim(), model: result.best, verdict: result.verdict }])
    setAnswer(''); setResult(null); setIdx((i) => i + 1)
  }
  const leave = () => { stopSpeak(); onDone() }
  useEnter(!!rp && (finished || (!!result && line?.who === 'me')), finished ? leave : nextTurn)
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
                <button className="btn blue wide" onClick={nextTurn}>Tiếp hội thoại ➜ <kbd>Enter</kbd></button>
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
            <button className="btn yellow" onClick={leave}>{free ? 'Xong ✓' : 'Tiếp ➜'} <kbd>Enter</kbd></button>
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
  const nextRef = useRef(null)
  useEnter(!!pick && (phase === 'reflex' || phase === 'trans'), () => nextRef.current?.())
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
    nextRef.current = next
    return (
      <div className="card step-card">{head}
        <p className="muted small">Phần 1 · Nghe & phản xạ · câu {i + 1}/{reflex.length}</p>
        <div className="reflex-line"><button className="btn blue" onClick={() => speak(it.a, { key: `C:${it.id}:a` })}>▶ Nghe</button><span className={pick ? '' : 'hidden-text'}>{it.a}</span></div>
        <p className="prompt-label">Câu đáp tự nhiên nhất:</p>
        <div className="options">{opts.map((o) => <button key={o} className={`option ${pick ? (o === it.b ? 'right' : o === pick ? 'wrong' : 'dim') : ''}`} onClick={() => choose(o)}>{o}</button>)}</div>
        {pick && <button className="btn blue wide" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button>}
      </div>
    )
  }
  const it = trans[i]
  const g = pick
  const check = () => { if (g || !answer.trim()) return; const r = grade(answer, it.en); setPick(r); add(it.lv, r.verdict === 'right' ? 1 : r.verdict === 'close' ? 0.6 : 0) }
  const next = () => { setPick(null); setAnswer(''); if (i + 1 >= trans.length) setPhase('result'); else setI(i + 1) }
  nextRef.current = next
  return (
    <div className="card step-card">{head}
      <p className="muted small">Phần 2 · Dịch Việt → Anh · câu {i + 1}/{trans.length}</p>
      <h2 className="vi-prompt">{it.vi}</h2>
      <AnswerBox value={answer} onChange={setAnswer} onSubmit={g ? next : check} disabled={!!g} placeholder="Câu tiếng Anh của bạn…" />
      {!g ? (
        <div className="row between"><button className="link small" onClick={() => { setPick({ verdict: 'wrong', score: 0, best: it.en[0], missing: [], extra: [] }) }}>Mình chưa dịch được →</button>
          <button className="btn yellow" onClick={check} disabled={!answer.trim()}>Kiểm tra ✓</button></div>
      ) : <><Feedback result={g} answer={answer} refs={it.en} /><button className="btn blue wide" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button></>}
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

// ---------------------------------------------------------------- long sentences
// Each sentence comes back on the review rhythm, and each time as a different exercise
// (translate → put the chunks in order → dictation → fill the gaps → say it). A sentence that went
// wrong comes back once more at the end of the step as a quick drill.
function ModePath({ modes, names, now }) {
  return (
    <div className="mode-path" aria-label="Các dạng luyện của câu này">
      {modes.map((m, k) => <span key={k} className={k === now ? 'now' : ''} title={names[m]}>{names[m].split(' ')[0]}</span>)}
      <small className="muted">{names[modes[now]].replace(/^\S+\s/, '')}</small>
    </div>
  )
}

function LongResult({ item, verdict, children }) {
  const title = { right: '✅ Chính xác!', close: '👍 Gần đúng', wrong: '❌ Chưa đúng' }[verdict]
  return (
    <div className={`feedback fb-${verdict}`}>
      <b>{title}</b>
      {children}
      <p className="best"><Speak text={item.en[0]} small /> {item.en[0]}</p>
      <p className="small muted">🇻🇳 {item.vi}</p>
    </div>
  )
}

function LongStep({ ids: startIds, onDone, onLevelUp }) {
  const [queue, setQueue] = useState(() => startIds.filter((id) => LONG_BY_ID.has(id)).map((id) => {
    const seen = getState().convoItems[id]?.seen || 0
    let mode = modeOf(LONG_MODES, seen)
    if (mode === 'speak' && !canListen()) mode = 'translate'
    return { id, mode, slot: seen % LONG_MODES.length, seen }
  }))
  const [i, setI] = useState(0)
  const q = queue[i]
  const item = q ? LONG_BY_ID.get(q.id) : null
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [hint, setHint] = useState(false)
  const [picked, setPicked] = useState([])
  const [gapVals, setGapVals] = useState([])
  const gapRefs = useRef([])
  const shownAt = useRef(Date.now())
  const parts = useMemo(() => (item ? chunks(item.en[0]) : []), [item])
  const bank = useMemo(() => (item ? shuffle(parts.map((t, k) => ({ t, k })), hash(item.id) + (q?.seen || 0) * 7 + 1) : []), [item, parts]) // eslint-disable-line react-hooks/exhaustive-deps
  const gap = useMemo(() => (item ? gapsFor(item.en[0], item.lv, q?.seen || 0) : null), [item]) // eslint-disable-line react-hooks/exhaustive-deps
  const [shownI, setShownI] = useState(i)
  if (shownI !== i) { setShownI(i); setAnswer(''); setResult(null); setHint(false); setPicked([]); setGapVals([]) }
  useEffect(() => {
    shownAt.current = Date.now()
    if (item && q.mode === 'dictate') setTimeout(() => speak(item.en[0]), 300)
    if (item && q.mode === 'gap') setTimeout(() => gapRefs.current[0]?.focus(), 50)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!item) onDone() }, [item]) // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => { stopSpeak(); if (i + 1 >= queue.length) onDone(); else setI(i + 1) }
  const allPlaced = q?.mode === 'build' && picked.length === parts.length
  const finish = (g) => {
    if (result) return
    const took = Date.now() - shownAt.current
    const verdict = hint && g.verdict === 'right' ? 'close' : g.verdict
    setResult({ ...g, verdict })
    const r = recordAnswer(item.id, q.drill ? 'drill' : 'long', verdict, { ms: took, skill: q.mode === 'dictate' ? 'listen' : undefined })
    if (r.levelUp) onLevelUp(r.levelUp)
    if (!q.drill && verdict !== 'right') setQueue((qs) => [...qs, { id: item.id, mode: q.mode === 'build' ? 'dictate' : 'build', slot: q.slot, seen: q.seen + 1, drill: true }])
    setTimeout(() => speak(item.en[0]), 250)
  }
  const checkBuild = () => allPlaced && finish(gradeOrder(picked.map((k) => bank[k].t), parts))
  useEnter(!!item && (!!result || allPlaced), result ? next : checkBuild)
  // Build mode: Backspace takes the last chunk back
  useEffect(() => {
    if (q?.mode !== 'build' || result) return
    const onKey = (e) => { if (e.key === 'Backspace' && !/INPUT|TEXTAREA/.test(e.target?.tagName)) { e.preventDefault(); setPicked((p) => p.slice(0, -1)) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q, result])
  if (!item || shownI !== i) return null // shownI: the item's state is being reset

  const alt = getState().convoItems[item.id]?.alt || []
  const refs = q.mode === 'dictate' ? [item.en[0]] : [...item.en, ...alt]
  const submitText = () => { if (!result && answer.trim()) finish(gradeLong(answer, refs)) }
  const submitGaps = () => { if (!result) finish(gradeGaps(gapVals, gap.words, gap.gaps)) }
  const accept = () => { recordAnswer(item.id, q.drill ? 'drill' : 'long', 'right', { alt: answer.trim() }); setResult({ ...result, verdict: 'right', score: 1 }) }
  const typed = q.mode === 'translate' || q.mode === 'speak' || q.mode === 'dictate'

  return (
    <div className="card step-card long-card">
      <p className="muted small">📜 Câu dài {i + 1}/{queue.length} · {CEFR[item.lv]} · {TOPIC_VI[item.topic]} · {item.en[0].split(' ').length} từ{q.drill ? ' · 🔁 luyện lại ngay' : ''}</p>
      <ModePath modes={LONG_MODES} names={LONG_MODE_NAME} now={q.drill ? LONG_MODES.indexOf(q.mode) : q.slot} />

      {q.mode === 'dictate' ? (
        <>
          <p className="prompt-label">🎧 Nghe rồi chép lại cả câu</p>
          <div className="row gap-s"><button className="btn blue" onClick={() => speak(item.en[0])}>▶ Nghe lại</button>
            <button className="btn" onClick={() => speak(item.en[0], { rate: 0.7 })}>🐢 Nghe chậm</button></div>
        </>
      ) : (
        <>
          <p className="prompt-label">{q.mode === 'build' ? '🧱 Xếp các cụm thành câu tiếng Anh:' : q.mode === 'gap' ? '🔤 Điền các từ còn thiếu:' : q.mode === 'speak' ? '🎙️ Nói cả câu bằng tiếng Anh (bấm 🎙️, hoặc gõ):' : '✍️ Dịch sang tiếng Anh:'}</p>
          <h2 className="vi-prompt long-vi">{item.vi}</h2>
        </>
      )}

      {typed && <AnswerBox rows={3} value={answer} onChange={setAnswer} onSubmit={result ? next : submitText} disabled={!!result} placeholder={q.mode === 'dictate' ? 'Câu bạn nghe được…' : 'Câu tiếng Anh của bạn…'} />}
      {q.mode === 'translate' && !result && hint && (
        <div className="chunk-bank hint"><span className="muted small">Các cụm (xáo trộn):</span>{bank.map((c, k) => <span key={k} className="chunk ghost">{c.t}</span>)}</div>
      )}

      {q.mode === 'build' && (
        <>
          <div className={`build-line ${result ? `fb-${result.verdict}` : ''}`}>
            {picked.length ? picked.map((k, n) => (
              <button key={n} className={`chunk placed ${result && bank[k].t !== parts[n] ? 'off' : ''}`} disabled={!!result} onClick={() => setPicked((p) => p.filter((_, j) => j !== n))}>{bank[k].t}</button>
            )) : <span className="muted small">Chạm các cụm bên dưới theo đúng thứ tự (Backspace để bỏ cụm cuối)…</span>}
          </div>
          {!result && <div className="chunk-bank">{bank.map((c, k) => <button key={k} className="chunk" disabled={picked.includes(k)} onClick={() => setPicked((p) => [...p, k])}>{c.t}</button>)}</div>}
        </>
      )}

      {q.mode === 'gap' && (
        <p className="gap-text">
          {gap.words.map((w, idx) => {
            const n = gap.gaps.indexOf(idx)
            if (n < 0) return <span key={idx}>{w} </span>
            const [, pre, word, post] = w.match(/^([^A-Za-z'-]*)([A-Za-z'-]+)(.*)$/) || ['', '', w, '']
            const res = result?.res?.[n]
            return (
              <span key={idx} className="gap-wrap">{pre}
                <input ref={(el) => { gapRefs.current[n] = el }} className={`gap ${res ? (res.ok ? 'ok' : 'bad') : ''}`} style={{ width: `${Math.max(4, word.length + 1)}ch` }}
                  value={gapVals[n] || ''} disabled={!!result} placeholder={`${word[0]}…`} autoCapitalize="off" spellCheck={false}
                  onChange={(e) => setGapVals((v) => { const c = [...v]; c[n] = e.target.value; return c })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (n + 1 < gap.gaps.length) gapRefs.current[n + 1]?.focus(); else submitGaps() } }} />
                {res && !res.exact && <small className="gap-fix">{res.want}</small>}{post}{' '}
              </span>
            )
          })}
        </p>
      )}

      {!result && (
        <div className="row between wrap gap-s">
          {q.mode === 'translate' && !hint ? <button className="link small" onClick={() => setHint(true)}>💡 Gợi ý các cụm từ</button> : <span />}
          {q.mode === 'build' ? <button className="btn yellow" onClick={checkBuild} disabled={!allPlaced}>Kiểm tra ✓ {allPlaced && <kbd>Enter</kbd>}</button>
            : q.mode === 'gap' ? <button className="btn yellow" onClick={submitGaps}>Kiểm tra ✓</button>
            : <button className="btn yellow" onClick={submitText} disabled={!answer.trim()}>Kiểm tra ✓</button>}
        </div>
      )}
      {result && (
        <>
          {typed ? <Feedback result={result} answer={answer} refs={refs} item={item} onAccept={q.mode === 'dictate' ? null : accept} />
            : <LongResult item={item} verdict={result.verdict}>
              {q.mode === 'build' && result.wrong > 0 && <p className="small">{result.wrong} cụm chưa đúng chỗ (gạch đỏ ở trên).</p>}
              {q.mode === 'gap' && <p className="small">Đúng {result.res.filter((r) => r.ok).length}/{result.res.length} từ.</p>}
            </LongResult>}
          {!q.drill && result.verdict !== 'right' && <p className="small muted">🔁 Câu này sẽ quay lại cuối phần để luyện thêm một lần ({q.mode === 'build' ? 'nghe & chép' : 'xếp cụm'}).</p>}
          <button className="btn blue wide" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- long replies in a conversation
function DialogStep({ ids: startIds, onDone, onLevelUp }) {
  const [queue, setQueue] = useState(() => startIds.filter((id) => LONG_BY_ID.has(id)).map((id) => {
    const seen = getState().convoItems[id]?.seen || 0
    return { id, mode: modeOf(DLG_MODES, seen), slot: seen % DLG_MODES.length, seen }
  }))
  const [i, setI] = useState(0)
  const q = queue[i]
  const item = q ? LONG_BY_ID.get(q.id) : null
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [retry, setRetry] = useState(false) // writing again after the graded try (not graded again)
  const [pick, setPick] = useState(null)
  const [showText, setShowText] = useState(false)
  const shownAt = useRef(Date.now())
  const options = useMemo(() => {
    if (!item) return []
    const others = shuffle(LONG_DLG.filter((o) => o.id !== item.id && Math.abs(o.lv - item.lv) <= 1 && o.topic !== item.topic), hash(item.id) + q.seen).slice(0, 2).map((o) => o.b)
    return shuffle([item.b, ...others], hash(item.id) * 3 + q.seen)
  }, [item]) // eslint-disable-line react-hooks/exhaustive-deps
  const live = useMemo(() => (item ? gradeReply(answer, item) : null), [answer, item])
  const [shownI, setShownI] = useState(i)
  if (shownI !== i) { setShownI(i); setAnswer(''); setResult(null); setRetry(false); setPick(null); setShowText(false) }
  useEffect(() => {
    shownAt.current = Date.now()
    if (item) setTimeout(() => speak(q.mode === 'shadow' ? item.b : item.a), 300)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!item) onDone() }, [item]) // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => { stopSpeak(); if (i + 1 >= queue.length) onDone(); else setI(i + 1) }
  useEnter(!!item && !!result && !retry, next)
  if (!item || shownI !== i) return null

  const finish = (g) => {
    const took = Date.now() - shownAt.current
    setResult(g)
    const r = recordAnswer(item.id, q.drill ? 'drill' : 'dialog', g.verdict, { ms: took, score: g.score, skill: q.mode === 'shadow' ? 'listen' : undefined })
    if (r.levelUp) onLevelUp(r.levelUp)
    if (!q.drill && g.verdict !== 'right') setQueue((qs) => [...qs, { id: item.id, mode: 'shadow', slot: 2, seen: q.seen + 1, drill: true }])
    setTimeout(() => speak(item.b), 300)
  }
  const submitReply = () => {
    if (!answer.trim()) return
    if (retry) { setResult(gradeReply(answer, item)); setRetry(false); return } // practice only
    if (!result) finish(gradeReply(answer, item))
  }
  const choose = (o) => { if (pick) return; setPick(o); finish({ verdict: o === item.b ? 'right' : 'wrong', score: o === item.b ? 1 : 0 }) }
  const submitShadow = () => { if (!result && answer.trim()) finish(gradeLong(answer, [item.b])) }
  const g = q.mode === 'reply' ? (result && !retry ? result : live) : null

  return (
    <div className="card step-card dlg-card">
      <p className="muted small">🗣️ Đối đáp câu dài {i + 1}/{queue.length} · {CEFR[item.lv]} · {TOPIC_VI[item.topic]}{q.drill ? ' · 🔁 luyện lại ngay' : ''}</p>
      <ModePath modes={DLG_MODES} names={DLG_MODE_NAME} now={q.slot} />
      <div className="bubble-row them">
        <span className="avatar">💬</span>
        <div className="bubble">
          {q.mode === 'shadow' && !result ? <i className="muted">Nghe câu đáp mẫu rồi nhắc lại…</i>
            : q.mode === 'pick' && !showText && !result ? <i className="muted">Nghe người kia nói… <button className="link small" onClick={() => setShowText(true)}>hiện chữ</button></i>
            : <b>{q.mode === 'shadow' ? item.b : item.a}</b>}
          <div className="row gap-s"><button className="btn sm blue" onClick={() => speak(q.mode === 'shadow' ? item.b : item.a)}>▶ Nghe</button>
            <button className="btn sm" onClick={() => speak(q.mode === 'shadow' ? item.b : item.a, { rate: 0.7 })}>🐢 Chậm</button></div>
        </div>
      </div>

      {q.mode === 'reply' && (
        <>
          <p className="prompt-label">🇻🇳 Ý bạn muốn trả lời (nói/viết 2–3 câu bằng tiếng Anh):</p>
          <p className="vi-prompt dlg-vi">{item.vi}</p>
          <div className="idea-chips"><span className="muted small">Ý cần có:</span>
            {g.ideas.map((it) => <span key={it.label} className={`idea ${it.ok ? 'ok' : ''}`}>{it.ok ? '✓' : '○'} {it.label}</span>)}
          </div>
          <AnswerBox rows={4} value={answer} onChange={setAnswer} onSubmit={submitReply} disabled={!!result && !retry} placeholder="Câu trả lời của bạn (gõ hoặc bấm 🎙️ để nói)…" />
          <div className="explain-meters">
            <span className={g.words >= g.target ? 'ok' : ''}>📝 {g.words}/{g.target} từ</span>
            <span className={g.links.length >= g.need ? 'ok' : ''}>🔗 {g.links.length}/{g.need} từ nối{g.links.length ? `: ${g.links.slice(0, 3).join(', ')}` : ''}</span>
            <span className={g.ideas.every((x) => x.ok) ? 'ok' : ''}>💡 {g.ideas.filter((x) => x.ok).length}/{g.ideas.length} ý</span>
          </div>
          {(!result || retry) && <div className="row end"><button className="btn yellow" onClick={submitReply} disabled={!answer.trim()}>{retry ? 'Chấm lại (luyện thêm)' : 'Kiểm tra ✓'}</button></div>}
        </>
      )}

      {q.mode === 'pick' && (
        <div className="options">
          {options.map((o) => <button key={o} className={`option long-opt ${pick ? (o === item.b ? 'right' : o === pick ? 'wrong' : 'dim') : ''}`} onClick={() => choose(o)}>{o}</button>)}
        </div>
      )}

      {q.mode === 'shadow' && (
        <>
          <AnswerBox rows={3} value={answer} onChange={setAnswer} onSubmit={result ? next : submitShadow} disabled={!!result} placeholder="Gõ hoặc nói lại câu đáp bạn nghe được…" />
          {!result && <div className="row end"><button className="btn yellow" onClick={submitShadow} disabled={!answer.trim()}>Kiểm tra ✓</button></div>}
        </>
      )}

      {result && !retry && (
        <>
          <div className={`feedback fb-${result.verdict}`}>
            <b>{{ right: '🌟 Trả lời tốt!', close: '👍 Khá tốt — thêm chút nữa', wrong: '💪 Chưa đạt' }[result.verdict]}</b>
            {q.mode === 'reply' && <span className="muted small"> · {Math.round(result.score * 100)} điểm</span>}
            {q.mode === 'reply' && result.ideas?.some((x) => !x.ok) && <p className="small">Còn thiếu: {result.ideas.filter((x) => !x.ok).map((x) => x.label).join(', ')}.</p>}
            {q.mode === 'shadow' && <p className="small">Khớp {Math.round(result.score * 100)}%.</p>}
            <p className="small muted">Câu đáp mẫu:</p>
            <p className="best"><Speak text={item.b} small /> {item.b}</p>
            {q.mode !== 'reply' && <p className="small muted">🇻🇳 {item.vi}</p>}
          </div>
          {!q.drill && result.verdict !== 'right' && <p className="small muted">🔁 Câu đáp mẫu sẽ quay lại cuối phần để bạn nghe & nhắc lại.</p>}
          <div className="row gap-s wrap">
            {q.mode === 'reply' && <button className="btn" onClick={() => { setRetry(true) }}>✍️ Viết lại theo mẫu</button>}
            <button className="btn blue grow" onClick={next}>Tiếp ➜ <kbd>Enter</kbd></button>
          </div>
        </>
      )}
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
  const [weak, setWeak] = useState(null) // sentence ids picked from the statistics page
  useEffect(() => { loadConvo().then(setD) }, [])
  const today = todayKey()
  const plan = convoDays[today]?.plan
  // Today's routine is made once (after the level is known) and kept for the day
  useEffect(() => { if (D && convo.placed && (!plan || !plan.role || !plan.long)) todayPlan(D) }, [D, convo.placed, plan])
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

  if (view === 'stats') return <ConvoStats D={D} onBack={() => setView('home')} onPractice={(ids) => { setWeak(ids); setView('weak') }} />
  if (view === 'sprint') return <><ConvoSprint D={D} onBack={() => setView('home')} onLevelUp={setLevelUp} />{levelUp && <LevelUp info={levelUp} onClose={() => setLevelUp(null)} />}</>
  if (view === 'weak' && weak) return (
    <div className="page talk-run">
      <button className="btn sm" onClick={() => { stopSpeak(); setView('stats') }}>← Thống kê</button>
      <TranslateStep key={weak.join()} ids={weak} kind="review" D={D} onDone={() => setView('stats')} onLevelUp={setLevelUp} />
      {levelUp && <LevelUp info={levelUp} onClose={() => setLevelUp(null)} />}
    </div>
  )
  if (!plan) return <div className="page center"><Mascot size={90} mood="think" /><p className="muted">Đang chuẩn bị bài hôm nay…</p></div>
  const day = convoDays[today] || { n: 0, ok: 0, xp: 0, done: {} }
  const lvl = levelInfo(convo)
  const acc = accuracy(convo)
  const st = streak(convoDays)
  // Items of each step in today's plan (old plans have a speaking prompt instead of "Diễn đạt ý")
  const planIds = (k) => (k === 'speak' ? (plan.explain || !plan.speak ? [] : [plan.speak]) : k === 'role' || k === 'explain' ? (plan[k] ? [plan[k]] : []) : plan[k] || [])
  const stepLen = (k) => planIds(k).length
  const doneKey = (k) => (k === 'phrases' ? 'phrase' : k)
  const doneIn = (d, k) => planIds(k).filter((id) => (d.done?.[doneKey(k)] || []).includes(id)).length
  const stepDone = (k) => doneIn(day, k)
  const steps = ORDER.filter((k) => stepLen(k) > 0)
  const allDone = steps.every((k) => stepDone(k) >= stepLen(k))
  const learned = Object.keys(convoItems).filter((id) => id.startsWith('t') && !convoItems[id].bad).length
  const mastered = Object.entries(convoItems).filter(([id, s]) => !id.startsWith('s') && s.box >= 5).length

  const startStep = (k, all = false) => { setRunAll(all); setStep(k); setView('run') }
  const afterStep = () => {
    const s = getState()
    const d = s.convoDays[today] || { done: {} }
    if (runAll) {
      const nextStep = steps.find((k) => doneIn(d, k) < stepLen(k) && k !== step)
      if (nextStep) { setStep(nextStep); return }
    }
    const finished = steps.every((k) => doneIn(d, k) >= stepLen(k))
    if (finished) { const b = routineBonus(); if (b) { setBonus(b); confetti(undefined, undefined, 80) } }
    setView('home'); setStep(null)
  }
  const remaining = (k) => planIds(k).filter((id) => !(day.done?.[doneKey(k)] || []).includes(id))

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
        {step === 'explain' && <ExplainStep key={step} id={plan.explain} {...props} />}
        {step === 'long' && <LongStep key={step} ids={ids} {...props} />}
        {step === 'dialog' && <DialogStep key={step} ids={ids} {...props} />}
        {levelUp && <LevelUp info={levelUp} onClose={() => setLevelUp(null)} />}
      </div>
    )
  }

  const S = convoStats(store, today)
  const best = Math.max(0, ...(convo.sprints || []).map((r) => r.r))
  const totalSteps = steps.reduce((a, k) => a + stepLen(k), 0)
  const doneSteps = steps.reduce((a, k) => a + stepDone(k), 0)
  const days14 = Array.from({ length: 14 }, (_, k) => addDays(today, k - 13))
  const QUEST_TONE = { phrases: 'q-yellow', review: 'q-blue', long: 'q-green', dialog: 'q-pink', role: 'q-pink', fresh: 'q-green', ask: 'q-blue', reflex: 'q-yellow', explain: 'q-pink', speak: 'q-green' }
  const todayPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0
  const minutesLeft = Math.max(1, Math.round(steps.reduce((a, k) => a + (stepLen(k) - Math.min(stepDone(k), stepLen(k))) * (MINUTES[k] || 1), 0)))
  const mode = intensityOf(convo)
  return (
    <div className="page talk">
      <section className="card talk-hero2">
        <Ring pct={lvl.pct / 100} size={112} stroke={11} className="lv-ring">
          <b>{CEFR[lvl.cefr]}</b><small>chặng {lvl.sub}/3</small>
        </Ring>
        <div className="grow hero-main">
          <p className="eyebrow">💬 Tiếng Anh giao tiếp · {CEFR_VI[lvl.cefr]}</p>
          <h1>Cấp {lvl.name}</h1>
          <div className="xp-bar"><div style={{ width: `${lvl.pct}%` }} /><span>{lvl.into}/{lvl.need} XP</span></div>
          <div className="cefr-path" aria-label="Lộ trình A1 đến C2">
            {CEFR.map((c, k) => <span key={c} className={k < lvl.cefr ? 'done' : k === lvl.cefr ? 'now' : ''}>{c}</span>)}
          </div>
        </div>
        <div className="hero-chips">
          <span className="chip c-pink"><b>🔥 {st}</b><small>ngày liên tiếp</small></span>
          <span className="chip c-green"><b>🎯 {Math.round(acc * 100)}%</b><small>chính xác gần đây</small></span>
          <span className="chip c-blue"><b>🧠 {learned}</b><small>câu đã học · {mastered} thuộc</small></span>
          <span className="chip c-yellow"><b>⚡ {S.last7.rt ? `${(S.last7.rt / 1000).toFixed(1)}s` : '—'}</b><small>tốc độ phản xạ</small></span>
        </div>
      </section>

      {bonus > 0 && <div className="ok-box">🎁 Hoàn thành nhiệm vụ hôm nay: +{bonus} XP thưởng{bonus >= 60 ? ' (gấp đôi vì chính xác ≥ 90%)' : ''}!</div>}

      <section className="card today-card">
        <div className="row between wrap gap-s">
          <h2>🗓️ Nhiệm vụ hôm nay</h2>
          <span className={`pill ${day.n >= MIN_PER_DAY ? 'green' : 'pink'}`}>{day.n}/{MIN_PER_DAY} câu tối thiểu {day.n >= MIN_PER_DAY ? '✓ giữ chuỗi' : ''}</span>
        </div>
        <div className="today-progress"><div style={{ width: `${todayPct}%` }} /><span><b>{todayPct}%</b> · {doneSteps}/{totalSteps} phần · +{day.xp} XP hôm nay</span></div>
        <div className="intensity" role="group" aria-label="Cường độ luyện tập">
          <span className="muted small">Cường độ:</span>
          {Object.entries(INTENSITY).map(([k, m]) => (
            <button key={k} className={`seg ${mode === k ? 'on' : ''}`} onClick={() => setIntensity(k)} title={`${m.long} câu dài mới + ${m.dlg} đối đáp mỗi ngày`}>
              {k === 'max' ? '🚀 ' : k === 'fast' ? '⚡ ' : ''}{m.name}<small>{m.sub}</small>
            </button>
          ))}
        </div>
        {lvl.cefr < 2 && (
          <p className="tip-box small">🎯 Bạn đã có khoảng <b>TOEIC 550+</b>? Học thẳng từ <b>B1</b> để câu dài và khó hơn ngay:{' '}
            <button className="btn sm yellow" onClick={() => { setStart(2); if (!day.n) setState((s) => { const d = { ...s.convoDays[today] }; delete d.plan; return { convoDays: { ...s.convoDays, [today]: d } } }) }}>Chuyển lên B1</button></p>
        )}
        <div className="quest-grid">
          {steps.map((k) => {
            const ok = stepDone(k) >= stepLen(k)
            return (
              <button key={k} className={`quest2 ${QUEST_TONE[k]} ${ok ? 'done' : ''}`} onClick={() => !ok && startStep(k)}>
                <span className="q-icon">{ok ? '✅' : STEP_INFO[k].icon}</span>
                <b>{STEP_INFO[k].name}</b>
                <small>{STEP_INFO[k].sub}</small>
                <span className="q-bar"><i style={{ width: `${(stepDone(k) / stepLen(k)) * 100}%` }} /></span>
                <span className="q-count">{ok ? 'Xong' : `${stepDone(k)}/${stepLen(k)}`}</span>
              </button>
            )
          })}
        </div>
        {!allDone
          ? <button className="btn start-btn" onClick={() => startStep(steps.find((k) => stepDone(k) < stepLen(k)), true)}><span>▶ Luyện tiếp nhiệm vụ hôm nay</span><small>còn ~{minutesLeft} phút · thưởng XP khi xong hết</small></button>
          : <p className="celebrate">🎉 Xong nhiệm vụ hôm nay! Chơi thêm ⚡ Thử thách 60 giây hoặc mai quay lại ôn đúng lúc nhé.</p>}
      </section>

      <div className="grid-2 even">
        <button className="card feature-card f-yellow" onClick={() => setView('sprint')}>
          <span className="f-icon">⚡</span>
          <span className="grow">
            <b>Thử thách 60 giây</b>
            <small>Luyện phản xạ: trả lời càng nhiều càng tốt trong 1 phút</small>
            <span className="f-meta">🏆 Kỷ lục <b>{best}</b> · {(convo.sprints || []).length} lượt</span>
          </span>
          <Sparkline values={(convo.sprints || []).slice(-12).map((r) => r.r)} />
        </button>
        <button className="card feature-card f-blue" onClick={() => setView('stats')}>
          <span className="f-icon">📊</span>
          <span className="grow">
            <b>Thống kê tiến bộ</b>
            <small>Số câu, độ chính xác, tốc độ phản xạ, độ thuộc</small>
            <span className="f-meta">Tuần này <b>{S.last7.n}</b> câu{S.prev7.n ? ` · tuần trước ${S.prev7.n}` : ''}</span>
          </span>
          <Sparkline values={S.daily.slice(-14).map((d) => d.n)} />
        </button>
      </div>

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
          <h2>📈 14 ngày qua <small className="muted">· % nhiệm vụ đã xong</small></h2>
          <div className="streak-cal">
            {days14.map((d) => {
              const n = convoDays[d]?.n || 0
              const pp = planProgress(convoDays[d])
              const pc = pp ? Math.round(pp.pct * 100) : 0
              return <div key={d} className={`sc ${n >= MIN_PER_DAY ? 'on' : n ? 'half' : ''} ${d === today ? 'today' : ''}`} title={`${d}: ${n} câu · xong ${pc}% nhiệm vụ`}><i style={{ height: `${pc}%` }} /><span>{VI_DAYS[fromKey(d).getDay()]}</span><b>{pc ? `${pc}%` : ''}</b></div>
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
      <p className="muted small source-note">Câu dịch: <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a> (CC BY 2.0 FR) · Hội thoại phản xạ: DailyDialog (Li et al. 2017, CC BY-NC-SA 4.0) · Cấp độ ước lượng theo NGSL (CC BY-SA 4.0) · Mẫu câu, nhập vai, Diễn đạt ý, câu dài & đối đáp: Capy TOEIC.</p>
    </div>
  )
}
