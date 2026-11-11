import { useMemo, useState } from 'react'
import { useStore, setState, getState, logActivity } from '../lib/store.js'
import { CARDS, TOPICS } from '../data/vocab.js'
import { review, isDue, INTERVALS, MASTERED_BOX } from '../lib/srs.js'
import { todayKey } from '../lib/date.js'
import Speak from '../components/Speak.jsx'
import Mascot from '../components/Mascot.jsx'

function buildQueue(topic, limit) {
  const { cards, saved, profile } = getState()
  const today = todayKey()
  const pool = topic === 'all' ? CARDS : topic === 'saved' ? [] : CARDS.filter((c) => c.topic === topic)
  const due = pool.filter((c) => cards[c.id] && isDue(cards[c.id]))
  const savedCards = (topic === 'all' || topic === 'saved')
    ? saved.filter((w) => isDue(w)).map((w) => ({ id: `saved:${w.id}`, w: w.text, vi: w.meaning, pos: 'đã lưu', saved: true }))
    : []
  const addedToday = Object.values(cards).filter((c) => c.added === today).length
  const newLeft = Math.max(0, profile.dailyNew - addedToday)
  const fresh = topic === 'saved' ? [] : pool.filter((c) => !cards[c.id]).slice(0, newLeft)
  const q = [...due, ...savedCards, ...fresh]
  return limit ? q.slice(0, limit) : q
}

export default function Flashcards({ limit, onDone }) {
  const { cards } = useStore()
  const [topic, setTopic] = useState('all')
  const [queue, setQueue] = useState(() => buildQueue('all', limit))
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ good: 0, again: 0 })

  const changeTopic = (t) => { setTopic(t); setQueue(buildQueue(t, limit)); setI(0); setFlipped(false) }
  const card = queue[i]
  const learned = useMemo(() => Object.values(cards).filter((c) => c.box >= MASTERED_BOX).length, [cards])

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
    if (g === 0) setQueue((q) => [...q, card])
    setFlipped(false)
    const next = i + 1
    setI(next)
    if (next >= queue.length + (g === 0 ? 1 : 0)) {
      logActivity('flash', 1, Math.max(1, Math.round(queue.length / 3)))
    }
  }

  const finished = !card
  return (
    <div className={onDone ? '' : 'page'}>
      {!onDone && (
        <div className="page-head">
          <h1>🃏 Flashcard</h1>
          <p className="muted">Lặp lại ngắt quãng: thẻ nhớ tốt sẽ xuất hiện thưa dần (1 → 2 → 4 → 7 → 15 → 30 ngày). Đã thành thạo {learned}/{CARDS.length} từ.</p>
          <div className="chips">
            {['all', ...TOPICS, 'saved'].map((t) => (
              <button key={t} className={`chip ${topic === t ? 'on' : ''}`} onClick={() => changeTopic(t)}>
                {t === 'all' ? 'Tất cả' : t === 'saved' ? '⭐ Từ đã lưu' : t}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished ? (
        <div className="card center">
          <Mascot mood="cheer" size={110} />
          <h2>Xong lượt ôn rồi! 🎉</h2>
          <p>Nhớ: {stats.good} · Quên: {stats.again}</p>
          {onDone ? <button className="btn yellow" onClick={onDone}>Tiếp tục ➜</button>
            : <button className="btn blue" onClick={() => changeTopic(topic)}>Tải thẻ mới</button>}
        </div>
      ) : (
        <>
          <div className="row between muted small"><span>Thẻ {i + 1}/{queue.length}</span><span>{cards[card.id] ? `Ô ${cards[card.id].box}` : card.saved ? 'Từ đã lưu' : '✨ Từ mới'}</span></div>
          <div className="progress"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
            <div className="fc-face fc-front">
              <span className="pill">{card.pos}</span>
              <h2 className="fc-word">{card.w}</h2>
              <Speak text={card.w} />
              <p className="muted small">Chạm để lật thẻ</p>
            </div>
            <div className="fc-face fc-back">
              <h3>{card.w} <Speak text={card.w} small /></h3>
              <p className="fc-vi">{card.vi}</p>
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
              <button className="btn grade g1" onClick={() => grade(1)}>😅 Khó<small>{INTERVALS[Math.max(1, cards[card.id]?.box || 0)]} ngày</small></button>
              <button className="btn grade g2" onClick={() => grade(2)}>🙂 Nhớ<small>{INTERVALS[Math.min(6, (cards[card.id]?.box || 0) + 1)]} ngày</small></button>
              <button className="btn grade g3" onClick={() => grade(3)}>😎 Dễ<small>{INTERVALS[Math.min(6, (cards[card.id]?.box || 0) + 2)]} ngày</small></button>
            </div>
          ) : (
            <button className="btn blue wide" onClick={() => setFlipped(true)}>Lật thẻ</button>
          )}
        </>
      )}
    </div>
  )
}
