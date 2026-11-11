import { useEffect, useMemo, useState } from 'react'
import { useStore, setState, getState, logActivity } from '../lib/store.js'
import { PART6 } from '../data/reading6.js'
import { PART7 } from '../data/reading7.js'
import { DICT, ALL_CARDS } from '../data/vocab.js'
import { dailyPlan, nextItems } from '../lib/course.js'
import { todayKey, uid } from '../lib/date.js'
import Speak from '../components/Speak.jsx'
import Mascot from '../components/Mascot.jsx'

const LETTERS = ['A', 'B', 'C', 'D']
const LEVEL = { 1: '⭐ Cơ bản', 2: '⭐⭐ Trung bình', 3: '⭐⭐⭐ Nâng cao' }
const CARD_BY_WORD = new Map(ALL_CARDS.map((c) => [c.w.toLowerCase(), c]))
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// The dictionary form of a word in the text (offices → office, scheduled → schedule)
function lemma(token) {
  const t = token.toLowerCase().replace(/[’']s$/, '')
  if (DICT.has(t)) return t
  const tries = [t.replace(/ies$/, 'y'), t.replace(/es$/, ''), t.replace(/s$/, ''), t.replace(/ied$/, 'y'), t.replace(/ed$/, ''), t.replace(/d$/, ''),
    t.replace(/ing$/, ''), t.replace(/ing$/, 'e'), t.replace(/ly$/, ''), t.replace(/([a-z])\1(ed|ing)$/, '$1')]
  return tries.find((x) => x.length > 2 && DICT.has(x)) || null
}

// Text with TOEIC words highlighted (tap to see the meaning) and Part 6 blanks shown as chips
function RichText({ text, onWord, answers, qs, highlight }) {
  const lines = text.split('\n')
  return (
    <div className="passage">
      {lines.map((line, li) => (
        <p key={li}>
          {line.split(/(\[\d\]|[A-Za-zÀ-ÿ’'-]+)/).map((part, i) => {
            const blank = part.match(/^\[(\d)\]$/)
            if (blank) {
              const n = Number(blank[1]); const pick = answers?.[n - 1]
              const q = qs?.[n - 1]
              return <span key={i} className={`blank ${pick != null ? 'filled' : ''}`}>({n}) {pick != null && q && q.o[pick].length < 30 ? q.o[pick] : '_____'}</span>
            }
            if (highlight && /^[A-Za-z]/.test(part)) {
              const l = lemma(part)
              if (l) return <button type="button" key={i} className="vocab-hit" onClick={() => onWord(l)}>{part}</button>
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      ))}
    </div>
  )
}

function WordBar({ word, onClose }) {
  const { saved } = useStore()
  if (!word) return null
  const d = DICT.get(word)
  const isSaved = saved.some((s) => s.text.toLowerCase() === word)
  const save = () => setState((s) => ({ saved: [{ id: uid(), text: d.w, meaning: d.vi, date: todayKey(), ts: Date.now(), box: 0, due: todayKey() }, ...s.saved] }))
  return (
    <div className="word-bar">
      <div><b>{d.w}</b> <span className="muted small">({d.pos})</span> — {d.vi}</div>
      <div className="row gap-s">
        <Speak text={d.w} small />
        <button className="btn sm yellow" onClick={save} disabled={isSaved}>{isSaved ? '✓ Đã lưu' : '⭐ Lưu'}</button>
        <button className="icon-btn sm" onClick={onClose} title="Đóng">✕</button>
      </div>
    </div>
  )
}

function Exercise({ item, part, onBack }) {
  const { reading } = useStore()
  const [answers, setAnswers] = useState(() => item.qs.map(() => null))
  const [checked, setChecked] = useState(false)
  const [word, setWord] = useState(null)
  const [highlight, setHighlight] = useState(true)
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (checked) return
    const t = setInterval(() => setSec((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [checked])

  const text = part === 6 ? item.text : null
  // TOEIC words met in this text that are not in the flashcards yet
  const words = useMemo(() => {
    const all = (part === 6 ? item.text : item.docs.map((d) => d.text).join(' ')).match(/[A-Za-z’'-]+/g) || []
    return [...new Set(all.map(lemma).filter(Boolean))]
  }, [item, part])
  const { cards } = useStore()
  const newWords = words.filter((w) => CARD_BY_WORD.has(w) && !cards[CARD_BY_WORD.get(w).id])
  const addWords = () => {
    const today = todayKey()
    setState((s) => {
      const next = { ...s.cards }
      for (const w of newWords) { const c = CARD_BY_WORD.get(w); if (!next[c.id]) next[c.id] = { box: 0, added: today, due: today } }
      return { cards: next }
    })
  }

  const check = () => {
    const right = item.qs.filter((q, i) => answers[i] === q.a).length
    const score = Math.round((right / item.qs.length) * 100)
    const prev = getState().reading[item.id]
    setState((s) => ({ reading: { ...s.reading, [item.id]: { score, best: Math.max(score, prev?.best || 0), date: prev?.date || todayKey(), last: todayKey(), sec } } }))
    logActivity(part === 6 ? 'read6' : 'read7', 1, Math.max(1, Math.round(sec / 60)))
    setChecked(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const right = item.qs.filter((q, i) => answers[i] === q.a).length
  const target = item.qs.length * (part === 6 ? 30 : 60) // TOEIC pace: ~30 s per Part 6 blank, ~1 min per Part 7 question

  return (
    <div className="page reading">
      <div className="row between wrap gap-s">
        <button className="btn sm" onClick={onBack}>← Danh sách</button>
        <span className="pill">{part === 6 ? '📄 Part 6' : '📰 Part 7'} · {LEVEL[item.level]}</span>
        <span className={`pill ${sec > target ? 'pink' : 'blue'}`}>⏱ {fmt(sec)} / {fmt(target)}</span>
      </div>
      <h1 className="reading-title">{item.title}</h1>
      {checked && (
        <div className="card center tint-yellow">
          <Mascot size={70} mood={right === item.qs.length ? 'cheer' : 'think'} />
          <h2>Đúng {right}/{item.qs.length} câu · {fmt(sec)}</h2>
          {reading[item.id]?.best > right / item.qs.length * 100 && <p className="muted small">Điểm tốt nhất trước đó: {reading[item.id].best}%</p>}
        </div>
      )}
      <div className="row between wrap gap-s">
        <label className="row gap-s small"><input type="checkbox" style={{ width: 'auto' }} checked={highlight} onChange={(e) => setHighlight(e.target.checked)} /> Tô sáng từ TOEIC ({words.length} từ) — chạm để xem nghĩa</label>
        {newWords.length > 0 && <button className="btn sm blue" onClick={addWords}>➕ Thêm {newWords.length} từ mới vào flashcard</button>}
      </div>

      {part === 6 ? (
        <div className="card doc"><span className="doc-type">{item.type}</span><RichText text={text} answers={answers} qs={item.qs} onWord={setWord} highlight={highlight} /></div>
      ) : (
        item.docs.map((d, i) => (
          <div key={i} className="card doc"><span className="doc-type">{item.docs.length > 1 ? `Văn bản ${i + 1} · ` : ''}{d.type}</span><RichText text={d.text} onWord={setWord} highlight={highlight} /></div>
        ))
      )}

      <div className="card">
        {item.qs.map((q, qi) => (
          <div key={qi} className="r-question">
            <p className="question">{part === 6 ? `(${qi + 1})` : `${qi + 1}.`} {q.q || (q.o.some((o) => o.length > 30) ? 'Chọn câu phù hợp nhất để điền vào chỗ trống.' : 'Chọn từ / cụm từ đúng.')}</p>
            <div className="options">
              {q.o.map((o, i) => {
                let cls = answers[qi] === i ? 'picked' : ''
                if (checked) cls = i === q.a ? 'right' : answers[qi] === i ? 'wrong' : 'dim'
                return (
                  <button key={i} className={`option ${cls}`} disabled={checked} onClick={() => setAnswers((a) => a.map((x, k) => (k === qi ? i : x)))}>
                    <span className="letter">{LETTERS[i]}</span>{o}
                  </button>
                )
              })}
            </div>
            {checked && <p className={answers[qi] === q.a ? 'ok-box small' : 'cause small'}>{answers[qi] === q.a ? '✅ ' : `❌ Đáp án đúng: ${LETTERS[q.a]}. `}{q.vi}</p>}
          </div>
        ))}
        {!checked
          ? <button className="btn yellow wide" disabled={answers.some((a) => a === null)} onClick={check}>{answers.some((a) => a === null) ? `Còn ${answers.filter((a) => a === null).length} câu chưa chọn` : 'Nộp bài ✓'}</button>
          : <button className="btn blue wide" onClick={onBack}>Bài tiếp theo ➜</button>}
      </div>
      <WordBar word={word} onClose={() => setWord(null)} />
    </div>
  )
}

export default function Reading({ params }) {
  const store = useStore()
  const { reading } = store
  const [part, setPart] = useState(params?.ref === 'p7' ? 7 : 6)
  const [open, setOpen] = useState(null)
  const plan = dailyPlan(store)
  const all = part === 6 ? PART6 : PART7
  const today = nextItems(store, part === 6 ? 'part6' : 'part7')

  if (open) return <Exercise key={open.id} item={open} part={part} onBack={() => setOpen(null)} />

  const Row = ({ item }) => {
    const r = reading[item.id]
    return (
      <button className="card lesson-card" onClick={() => setOpen(item)}>
        <span className="lesson-scene">{part === 6 ? '📄' : item.docs?.length > 1 ? '📚' : '📰'}</span>
        <div>
          <b>{item.title}</b>
          <p className="muted small">{part === 6 ? item.type : item.docs.map((d) => d.type).join(' + ')} · {item.qs.length} câu · {LEVEL[item.level]}</p>
          {r && <span className={`pill ${r.best >= 75 ? 'green' : 'pink'}`}>Tốt nhất {r.best}%</span>}
        </div>
      </button>
    )
  }
  const g = plan[part === 6 ? 'part6' : 'part7']

  return (
    <div className="page">
      <div className="page-head">
        <h1>📖 Đọc hiểu Part 6 – 7</h1>
        <p className="muted">Part 6: điền từ/câu vào đoạn văn. Part 7: đọc email, thông báo, bài báo, tin nhắn… rồi trả lời câu hỏi. Từ vựng TOEIC trong bài được tô sáng — chạm để xem nghĩa và lưu lại.</p>
        <div className="seg">
          <button className={part === 6 ? 'on' : ''} onClick={() => setPart(6)}>📄 Part 6 ({PART6.length})</button>
          <button className={part === 7 ? 'on' : ''} onClick={() => setPart(7)}>📰 Part 7 ({PART7.length})</button>
        </div>
        <div className="day-goal">
          <span>🎯 Hôm nay: <b>{g.doneToday}/{g.goal}</b> bài · đã làm {g.learned}/{g.total} bài trong lộ trình{!g.goal && g.learned < g.total ? ' — hôm nay không có bài mới, làm thêm nếu muốn' : ''}</span>
        </div>
      </div>
      {today.length > 0 && <>
        <h2 className="section-title">⭐ Bài của hôm nay</h2>
        <div className="lesson-grid">{today.map((x) => <Row key={x.id} item={x} />)}</div>
      </>}
      <h2 className="section-title">Tất cả bài {part === 6 ? 'Part 6' : 'Part 7'}</h2>
      <div className="lesson-grid">{all.map((x) => <Row key={x.id} item={x} />)}</div>
      <p className="muted small">Bài đọc do Capy TOEIC soạn theo đúng dạng đề, dùng nhiều từ trong danh sách 1.259 từ TOEIC hay gặp nhất.</p>
    </div>
  )
}
