import { useMemo, useState } from 'react'
import { useStore, setState, getState, logActivity } from '../lib/store.js'
import { ALL_CARDS, TOPICS, TSL_DECKS, TSL_SOURCE } from '../data/vocab.js'
import { review, isDue, INTERVALS, MASTERED_BOX } from '../lib/srs.js'
import { dailyPlan } from '../lib/course.js'
import { todayKey } from '../lib/date.js'
import Speak from '../components/Speak.jsx'
import Mascot from '../components/Mascot.jsx'

const POS = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ', prep: 'giới từ', pron: 'đại từ', interj: 'thán từ', phr: 'cụm từ', 'đã lưu': 'đã lưu' }

// Cards to study now: due reviews first, then saved words, then today's new words (in course order)
function buildQueue(deck, limit) {
  const st = getState()
  const { cards, saved } = st
  const today = todayKey()
  const pool = deck === 'all' ? ALL_CARDS : deck === 'saved' ? [] : ALL_CARDS.filter((c) => c.topic === deck)
  const due = pool.filter((c) => cards[c.id] && isDue(cards[c.id]))
  const savedCards = (deck === 'all' || deck === 'saved')
    ? saved.filter((w) => isDue(w)).map((w) => ({ id: `saved:${w.id}`, w: w.text, vi: w.meaning, pos: 'đã lưu', saved: true }))
    : []
  const plan = dailyPlan(st, today)
  const newLeft = Math.max(0, plan.words.goal - plan.words.doneToday)
  const fresh = deck === 'saved' ? [] : pool.filter((c) => !cards[c.id]).slice(0, deck === 'all' ? newLeft : Math.max(newLeft, 10))
  const q = [...due, ...savedCards, ...fresh]
  return limit ? q.slice(0, limit) : q
}

export default function Flashcards({ limit, onDone }) {
  const store = useStore()
  const { cards } = store
  const [deck, setDeck] = useState('all')
  const [queue, setQueue] = useState(() => buildQueue('all', limit))
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ good: 0, again: 0 })
  const [logged, setLogged] = useState(false)

  const changeDeck = (d) => { setDeck(d); setQueue(buildQueue(d, limit)); setI(0); setFlipped(false); setLogged(false) }
  const card = queue[i]
  const learned = useMemo(() => Object.values(cards).filter((c) => c.box >= MASTERED_BOX).length, [cards])
  const started = useMemo(() => Object.keys(cards).length, [cards])
  const plan = dailyPlan(store)
  const box = card ? cards[card.id]?.box || 0 : 0

  const grade = (g) => {
    const today = todayKey()
    if (card.saved) {
      const sid = card.id.slice(6)
      setState((s) => ({ saved: s.saved.map((w) => (w.id === sid ? review(w, g) : w)) }))
    } else {
      setState((s) => {
        const prev = s.cards[card.id] || { box: 0, added: today }
        return { cards: { ...s.cards, [card.id]: review(prev, g) } }
      })
    }
    setStats((st) => ({ good: st.good + (g >= 2 ? 1 : 0), again: st.again + (g === 0 ? 1 : 0) }))
    // Forgotten cards come back at the end of this round
    const nextQueue = g === 0 ? [...queue, card] : queue
    if (g === 0) setQueue(nextQueue)
    setFlipped(false)
    setI(i + 1)
    if (i + 1 >= nextQueue.length && !logged) {
      setLogged(true)
      logActivity('flash', 1, Math.max(1, Math.round(nextQueue.length / 3)))
    }
  }

  const finished = !card
  return (
    <div className={onDone ? '' : 'page'}>
      {!onDone && (
        <div className="page-head">
          <h1>🃏 Flashcard</h1>
          <p className="muted">Lặp lại ngắt quãng: thẻ nhớ tốt xuất hiện thưa dần (1 → 2 → 4 → 7 → 15 → 30 ngày). Đã học {started}/{ALL_CARDS.length} từ · thành thạo {learned}.</p>
          <div className="day-goal">
            <span>🎯 Từ mới hôm nay: <b>{plan.words.doneToday}/{plan.words.goal}</b></span>
            <div className="progress"><div style={{ width: `${Math.min(100, (plan.words.doneToday / Math.max(1, plan.words.goal)) * 100)}%` }} /></div>
          </div>
          <div className="row gap-s wrap deck-row">
            <label className="small">Bộ thẻ
              <select value={deck} onChange={(e) => changeDeck(e.target.value)}>
                <option value="all">✨ Theo lộ trình (ôn + từ mới hôm nay)</option>
                <option value="saved">⭐ Từ đã lưu</option>
                <optgroup label="1.259 từ TOEIC hay gặp nhất (xếp theo tần suất)">
                  {TSL_DECKS.map((d) => <option key={d} value={d}>{d}</option>)}
                </optgroup>
                <optgroup label="Word family theo chủ đề">
                  {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              </select>
            </label>
          </div>
        </div>
      )}

      {finished ? (
        <div className="card center">
          <Mascot mood="cheer" size={110} />
          <h2>Xong lượt ôn rồi! 🎉</h2>
          <p>Nhớ: {stats.good} · Quên: {stats.again}</p>
          {onDone ? <button className="btn yellow" onClick={onDone}>Tiếp tục ➜</button>
            : <button className="btn blue" onClick={() => changeDeck(deck)}>Tải thẻ mới</button>}
          {!onDone && plan.words.doneToday >= plan.words.goal && <p className="muted small">Đã đủ từ mới của hôm nay. Muốn học thêm: chọn một bộ "TOEIC …" ở trên.</p>}
        </div>
      ) : (
        <>
          <div className="row between muted small"><span>Thẻ {i + 1}/{queue.length}</span><span>{cards[card.id] ? `Ô ${cards[card.id].box}` : card.saved ? 'Từ đã lưu' : '✨ Từ mới'}{card.rank ? ` · TOEIC #${card.rank}` : ''}</span></div>
          <div className="progress"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>
          {/* key: a new card starts unflipped, without the flip animation showing its answer */}
          <div key={`${card.id}-${i}`} className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
            <div className="fc-face fc-front">
              <span className="pill">{POS[card.pos] || card.pos}</span>
              <h2 className="fc-word">{card.w}</h2>
              <Speak text={card.w} />
              <p className="muted small">Chạm để lật thẻ</p>
            </div>
            <div className="fc-face fc-back">
              <h3>{card.w} <Speak text={card.w} small /></h3>
              <p className="fc-vi">{card.vi}</p>
              {card.def && <p className="fc-def">📖 {card.def}</p>}
              {card.ex && (
                <div className="example">
                  <p className="en">{card.ex[0]} <Speak text={card.ex[0]} small /></p>
                  <p className="vi">{card.ex[1]}</p>
                </div>
              )}
              {card.syn && (
                <div className="syn-ant small">
                  <span>≈ {card.syn.join(', ')}</span>
                  {card.ant?.length ? <span>≠ {card.ant.join(', ')}</span> : null}
                </div>
              )}
            </div>
          </div>
          {flipped ? (
            <div className="grade-row">
              <button className="btn grade g0" onClick={() => grade(0)}>😵 Quên<small>hôm nay</small></button>
              <button className="btn grade g1" onClick={() => grade(1)}>😅 Khó<small>{INTERVALS[Math.max(1, box)]} ngày</small></button>
              <button className="btn grade g2" onClick={() => grade(2)}>🙂 Nhớ<small>{INTERVALS[Math.min(6, box + 1)]} ngày</small></button>
              <button className="btn grade g3" onClick={() => grade(3)}>😎 Dễ<small>{INTERVALS[Math.min(6, box + 2)]} ngày</small></button>
            </div>
          ) : (
            <button className="btn blue wide" onClick={() => setFlipped(true)}>Lật thẻ</button>
          )}
        </>
      )}
      {!onDone && <p className="muted small source-note">Nguồn từ: <a href={TSL_SOURCE.url} target="_blank" rel="noreferrer">TOEIC Service List</a> (Browne & Culligan, {TSL_SOURCE.license}); câu ví dụ từ <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a> (CC BY 2.0 FR).</p>}
    </div>
  )
}
