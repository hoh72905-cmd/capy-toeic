import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS, blanksFor, norm } from '../data/listening.js'
import { useStore, setState, logActivity } from '../lib/store.js'
import { speak, stopSpeak, ttsAvailable } from '../lib/speech.js'
import { uid, todayKey } from '../lib/date.js'
import Mascot from '../components/Mascot.jsx'

const ACCENT_NAME = { us: '🇺🇸 Mỹ', uk: '🇬🇧 Anh', au: '🇦🇺 Úc' }
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// Longest common subsequence: which expected words did the learner get?
function diffWords(expected, typed) {
  const a = expected.split(' '); const b = typed.split(' ').filter(Boolean)
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    dp[i][j] = norm(a[i]) === norm(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const ok = Array(a.length).fill(false)
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (norm(a[i]) === norm(b[j])) { ok[i] = true; i++; j++ } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++
  }
  return a.map((w, k) => ({ w, ok: ok[k] }))
}

export default function Listening({ params, onDone }) {
  const { customLessons, listenDone } = useStore()
  const all = useMemo(() => [...LESSONS, ...customLessons], [customLessons])
  const [current, setCurrent] = useState(() => all.find((l) => l.id === params?.ref) || null)
  const [adding, setAdding] = useState(false)

  if (current) return <Player lesson={current} onBack={onDone ? null : () => setCurrent(null)} onDone={onDone} />

  return (
    <div className="page">
      <div className="page-head">
        <h1>🎧 Nghe & chép</h1>
        <p className="muted">Mỗi bài ~10 câu, khoảng 5–6 phút — vừa đủ tập trung rồi đổi chủ đề. Có 2 dạng: <b>đục lỗ</b> (điền từ khóa) và <b>nguyên câu</b>.</p>
        {!ttsAvailable() && <p className="notice">Trình duyệt này chưa hỗ trợ đọc giọng nói. Hãy dùng Chrome hoặc app Android.</p>}
      </div>
      <div className="lesson-grid">
        {all.map((l) => (
          <button key={l.id} className="card lesson-card" onClick={() => setCurrent(l)}>
            <span className="lesson-scene">{l.scene}</span>
            <div>
              <b>{l.title}</b>
              <p className="muted small">{l.part} · {ACCENT_NAME[l.accent]} · {l.s.length} câu</p>
              <div className="row gap-s">
                <span className="pill">{'⭐'.repeat(l.level || 1)}</span>
                {listenDone[l.id] && <span className={`pill ${listenDone[l.id].best >= 80 ? 'green' : 'pink'}`}>Tốt nhất {listenDone[l.id].best}%</span>}
              </div>
            </div>
          </button>
        ))}
        <button className="card lesson-card add" onClick={() => setAdding(true)}>
          <span className="lesson-scene">➕</span><div><b>Tạo bài của riêng bạn</b><p className="muted small">Dán câu tiếng Anh, mỗi dòng một câu</p></div>
        </button>
      </div>
      {adding && <AddLesson onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddLesson({ onClose }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [accent, setAccent] = useState('us')
  const save = () => {
    const lines = text.split('\n').map((x) => x.trim()).filter(Boolean)
    if (!lines.length) return
    const lesson = { id: `c-${uid()}`, title: title || 'Bài của tôi', part: 'Tự tạo', scene: '🌟', accent, level: 1, s: lines.slice(0, 15).map((l) => [l, '']), custom: true }
    setState((s) => ({ customLessons: [...s.customLessons, lesson] }))
    onClose()
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>➕ Tạo bài nghe chép</h3>
        <input placeholder="Tên bài" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={7} placeholder={'Mỗi dòng 1 câu (tối đa 15 câu)\nThe meeting has been moved to Friday.\n…'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row between">
          <select value={accent} onChange={(e) => setAccent(e.target.value)}>
            {Object.entries(ACCENT_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn yellow" onClick={save}>Lưu bài</button>
        </div>
      </div>
    </div>
  )
}

function Player({ lesson, onBack, onDone }) {
  const [mode, setMode] = useState('cloze')
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [blankVals, setBlankVals] = useState({})
  const [checked, setChecked] = useState(null) // { score, parts }
  const [scores, setScores] = useState([])
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)
  const { listenDone } = useStore()

  const [en, vi] = lesson.s[idx]
  const tokens = en.split(/\s+/)
  const blanks = useMemo(() => blanksFor(en), [en])

  useEffect(() => {
    if (finished) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [finished])

  useEffect(() => () => stopSpeak(), [])

  const play = async (r = rate) => {
    setPlaying(true)
    await speak(en, { accent: lesson.accent, rate: r })
    setPlaying(false)
    inputRef.current?.focus()
  }

  // Auto play each new sentence
  useEffect(() => {
    const t = setTimeout(() => play(), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const check = () => {
    let score, parts
    if (mode === 'cloze') {
      const idxs = [...blanks]
      const ok = idxs.filter((i) => norm(blankVals[i] || '') === norm(tokens[i])).length
      score = Math.round((ok / idxs.length) * 100)
      parts = tokens.map((w, i) => ({ w, ok: !blanks.has(i) || norm(blankVals[i] || '') === norm(w), blank: blanks.has(i), typed: blankVals[i] }))
    } else {
      parts = diffWords(en, typed)
      score = Math.round((parts.filter((p) => p.ok).length / parts.length) * 100)
    }
    setChecked({ score, parts })
  }

  const next = () => {
    const newScores = [...scores, checked.score]
    setScores(newScores)
    setChecked(null); setTyped(''); setBlankVals({})
    if (idx + 1 >= lesson.s.length) {
      setFinished(true)
      const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
      const prev = listenDone[lesson.id]?.best || 0
      setState((s) => ({ listenDone: { ...s.listenDone, [lesson.id]: { best: Math.max(prev, avg), last: avg, mode, date: todayKey() } } }))
      logActivity('listen', 1, Math.max(1, Math.round(elapsed / 60)))
    } else setIdx(idx + 1)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); checked ? next() : check() }
  }

  if (finished) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return (
      <div className={onDone ? '' : 'page'}>
        <div className="card center">
          <Mascot mood={avg >= 70 ? 'cheer' : 'think'} size={120} />
          <h2>Hoàn thành “{lesson.title}”</h2>
          <p className="big-score">{avg}%</p>
          <p className="muted">Thời gian: {fmt(elapsed)} · {avg >= 80 ? 'Xuất sắc! Lần sau thử dạng nguyên câu nhé.' : avg >= 60 ? 'Khá lắm! Nghe lại những câu sai để quen âm.' : 'Không sao — bài này sẽ nằm trong mục “Cần ôn lại”.'}</p>
          <div className="row gap-s center-row">
            {onDone ? <button className="btn yellow" onClick={onDone}>Tiếp tục ➜</button> : <>
              <button className="btn" onClick={onBack}>← Danh sách bài</button>
              <button className="btn blue" onClick={() => { setIdx(0); setScores([]); setElapsed(0); setFinished(false); setMode(mode === 'cloze' ? 'full' : 'cloze') }}>Làm lại dạng {mode === 'cloze' ? 'nguyên câu' : 'đục lỗ'}</button>
            </>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={onDone ? '' : 'page'}>
      {onBack && <button className="btn sm" onClick={onBack}>← Danh sách bài</button>}
      <div className="video">
        <div className="video-screen" data-noselect>
          <div className="video-top"><span>{lesson.part}</span><span>⏱ {fmt(elapsed)} / ~6:00</span></div>
          <div className="video-scene">
            <span className={`scene-emoji ${playing ? 'pulse' : ''}`}>{lesson.scene}</span>
            <Mascot size={86} mood={playing ? 'happy' : 'calm'} className={playing ? 'talk' : ''} />
          </div>
          <div className="subtitle">
            {checked ? en : playing ? <span className="wave">♪ ♫ ♪ ♫ ♪</span> : 'Nghe và chép lại nhé…'}
          </div>
          <div className="video-progress"><div style={{ width: `${(idx / lesson.s.length) * 100}%` }} /></div>
        </div>
        <div className="video-controls">
          <button className="btn blue" onClick={() => play()} disabled={playing}>{playing ? '🔉 Đang đọc…' : '▶ Phát'}</button>
          <button className="btn" onClick={() => play(0.7)} disabled={playing}>🐢 Chậm</button>
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Tốc độ">
            <option value={0.85}>0.85x</option><option value={1}>1x</option><option value={1.15}>1.15x</option>
          </select>
          <span className="muted small">Câu {idx + 1}/{lesson.s.length} · {ACCENT_NAME[lesson.accent]}</span>
        </div>
      </div>

      <div className="card">
        <div className="seg">
          <button className={mode === 'cloze' ? 'on' : ''} onClick={() => { setMode('cloze'); setChecked(null) }}>🕳️ Đục lỗ</button>
          <button className={mode === 'full' ? 'on' : ''} onClick={() => { setMode('full'); setChecked(null) }}>✍️ Nguyên câu</button>
        </div>

        {mode === 'cloze' ? (
          <p className="cloze" onKeyDown={onKey}>
            {tokens.map((w, i) => {
              if (!blanks.has(i)) return <span key={i}>{w} </span>
              const part = checked?.parts[i]
              return (
                <span key={i} className="blank-wrap">
                  <input ref={[...blanks][0] === i ? inputRef : null} className={`blank ${part ? (part.ok ? 'ok' : 'bad') : ''}`}
                    style={{ width: `${Math.max(4, w.length + 1)}ch` }} value={blankVals[i] || ''} disabled={!!checked}
                    onChange={(e) => setBlankVals({ ...blankVals, [i]: e.target.value })} autoCapitalize="off" autoComplete="off" spellCheck={false} />
                  {part && !part.ok && <small className="answer">{w}</small>}{' '}
                </span>
              )
            })}
          </p>
        ) : (
          <textarea ref={inputRef} rows={3} value={typed} disabled={!!checked} onChange={(e) => setTyped(e.target.value)} onKeyDown={onKey}
            placeholder="Gõ lại cả câu bạn nghe được…" autoCapitalize="off" spellCheck={false} />
        )}

        {checked && (
          <div className="result">
            {mode === 'full' && <p className="diff">{checked.parts.map((p, i) => <span key={i} className={p.ok ? 'ok' : 'bad'}>{p.w} </span>)}</p>}
            <p><b className={checked.score >= 80 ? 'txt-green' : 'txt-pink'}>{checked.score}%</b> · <span className="en">{en}</span></p>
            {vi && <p className="vi">🇻🇳 {vi}</p>}
          </div>
        )}

        <div className="row between">
          <span className="muted small">Enter để kiểm tra / sang câu</span>
          {checked ? (
            <div className="row gap-s">
              <button className="btn" onClick={() => { setChecked(null); play() }}>🔁 Thử lại</button>
              <button className="btn yellow" onClick={next}>{idx + 1 >= lesson.s.length ? 'Xem kết quả' : 'Câu tiếp ➜'}</button>
            </div>
          ) : <button className="btn yellow" onClick={check}>Kiểm tra</button>}
        </div>
      </div>
    </div>
  )
}
