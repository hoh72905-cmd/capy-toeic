import { useEffect, useState } from 'react'
import Mascot from '../components/Mascot.jsx'
import { useStore, setState } from '../lib/store.js'
import { todayKey, addDays, weekKeys, VI_DAYS, fromKey, uid } from '../lib/date.js'
import { planInfo, tasksFor, dayPicks, grammarName, PHASES } from '../data/plan.js'
import { CARDS } from '../data/vocab.js'
import { GRAMMAR } from '../data/quiz.js'
import { LESSONS } from '../data/listening.js'
import { isDue, MASTERED_BOX } from '../lib/srs.js'

const KIND_PAGE = { flash: 'flash', listen: 'listen', quiz: 'practice', vocab: 'vocab' }

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function useStreak() {
  const { activity, todos } = useStore()
  const active = (k) => {
    const a = activity[k]
    const t = todos[k]
    return (a && (a.flash || a.listen || a.quiz || a.vocab)) || (t && t.some((x) => x.done))
  }
  let k = todayKey()
  if (!active(k)) k = addDays(k, -1)
  let n = 0
  while (active(k) && n < 400) { n++; k = addDays(k, -1) }
  return n
}

export default function Dashboard({ go }) {
  const s = useStore()
  const today = todayKey()
  const { profile, todos, cards, topics, listenDone } = s
  const info = planInfo(profile.startDate, today)
  const picks = dayPicks(profile.startDate, today)
  const list = todos[today] || []
  const [text, setText] = useState('')
  const streak = useStreak()

  // First visit of the day: fill the to-do list from the 3-month plan
  useEffect(() => {
    if (!todos[today]) {
      const auto = tasksFor(profile.startDate, today).map((t) => ({ ...t, id: uid(), done: false, auto: true }))
      setState((st) => ({ todos: { ...st.todos, [today]: auto } }))
    }
  }, [today, todos, profile.startDate])

  const yesterday = addDays(today, -1)
  const leftover = (todos[yesterday] || []).filter((t) => !t.done && !t.auto && !t.moved)

  const update = (fn) => setState((st) => ({ todos: { ...st.todos, [today]: fn(st.todos[today] || []) } }))
  const add = () => {
    if (!text.trim()) return
    update((l) => [...l, { id: uid(), text: text.trim(), done: false, kind: 'custom' }])
    setText('')
  }
  const moveLeftover = () => setState((st) => ({
    todos: {
      ...st.todos,
      [today]: [...(st.todos[today] || []), ...leftover.map((t) => ({ ...t, id: uid() }))],
      [yesterday]: st.todos[yesterday].map((t) => (leftover.find((x) => x.id === t.id) ? { ...t, moved: true } : t)),
    },
  }))

  const done = list.filter((t) => t.done).length
  const pct = list.length ? Math.round((done / list.length) * 100) : 0
  const totalMin = list.reduce((a, t) => a + (t.min || 0), 0)

  // Review items
  const dueCards = CARDS.filter((c) => cards[c.id] && isDue(cards[c.id])).length
  const learned = Object.values(cards).filter((c) => c.box >= MASTERED_BOX).length
  const weakTopics = GRAMMAR.filter((g) => topics[g.id] && (topics[g.id].due <= today || topics[g.id].box <= 1))
  const weakLessons = LESSONS.filter((l) => listenDone[l.id] && listenDone[l.id].best < 70)

  const week = weekKeys(today)
  const weekData = week.map((k) => {
    const l = todos[k] || []
    return { k, total: l.length, done: l.filter((t) => t.done).length }
  })
  const weekDone = weekData.reduce((a, d) => a + d.done, 0)
  const weekTotal = weekData.reduce((a, d) => a + d.total, 0) || 1
  const mood = pct === 100 ? 'cheer' : pct > 0 ? 'happy' : 'calm'

  return (
    <div className="page dashboard">
      <section className="card hero">
        <div className="hero-photo" role="img" aria-label="Ba bé capybara ngâm suối nước nóng">
          <span className="hero-bubble">{pct === 100 ? 'Xong hết rồi, giỏi quá! 🎉' : 'Học xíu rồi ngâm suối nha~ ♨️'}</span>
        </div>
        <div className="hero-text">
          <p className="eyebrow">{greeting()} ☀️</p>
          <h1>{profile.name} ơi, hôm nay mình cùng học nhé!</h1>
          <div className="stat-row">
            <span className="stat"><b>🔥 {streak}</b> ngày liên tiếp</span>
            <span className="stat"><b>📅 Tuần {info.week.n}</b>/12 · ngày {Math.min(84, info.dayIndex + 1)}/84</span>
            <span className="stat"><b>🎯 {info.week.target}</b> mục tiêu tuần</span>
            <span className="stat"><b>⭐ {learned}</b> từ thành thạo</span>
          </div>
          <p className="phase-tag" style={{ background: PHASES[info.week.phase].color }}>{PHASES[info.week.phase].name} — {info.week.title}</p>
          <Mascot size={64} mood={mood} className="bob hero-mascot" />
        </div>
      </section>

      <button className="btn start-btn" onClick={() => go('session')}>
        <span>🚀 Bắt đầu buổi học</span>
        <small>Flashcard → Ngữ pháp → Nghe chép → Từ vựng · khoảng 25 phút</small>
      </button>

      <div className="grid-2">
        <section className="card todo-card">
          <div className="row between">
            <h2>✅ To-do hôm nay</h2>
            <span className="pill blue">{done}/{list.length} · {totalMin}p</span>
          </div>
          <div className="progress big"><div style={{ width: `${pct}%` }} /></div>
          {leftover.length > 0 && (
            <div className="notice">
              Hôm qua còn {leftover.length} việc chưa xong.
              <button className="btn sm" onClick={moveLeftover}>Chuyển sang hôm nay</button>
            </div>
          )}
          <ul className="todo-list">
            {list.map((t) => (
              <li key={t.id} className={t.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={t.done} onChange={() => update((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                  <span className="check" />
                  <span className="todo-text">{t.text}{t.min ? <em> · {t.min}p</em> : null}</span>
                </label>
                <div className="todo-actions">
                  {KIND_PAGE[t.kind] && !t.done && <button className="btn sm blue" onClick={() => go(KIND_PAGE[t.kind], { ref: t.ref })}>Làm</button>}
                  <button className="icon-btn sm" title="Xóa" onClick={() => update((l) => l.filter((x) => x.id !== t.id))}>🗑️</button>
                </div>
              </li>
            ))}
            {!list.length && <li className="muted">Chưa có việc nào — thêm ở dưới nhé.</li>}
          </ul>
          <div className="row gap-s">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Thêm việc cần làm…" />
            <button className="btn yellow" onClick={add}>Thêm</button>
          </div>
          {pct === 100 && <p className="celebrate">🎉 Xong hết rồi! Capybara tự hào về bạn lắm!</p>}
        </section>

        <div className="stack">
          <section className="card">
            <h2>🎯 Mục tiêu học hôm nay</h2>
            <ul className="goal-list">
              <li onClick={() => go('flash')}><span>🃏</span> Ôn {dueCards} thẻ đến hạn + {profile.dailyNew} từ mới</li>
              <li onClick={() => go('practice', { ref: picks.topic })}><span>🧠</span> Ngữ pháp: {grammarName(picks.topic)}</li>
              <li onClick={() => go('listen', { ref: picks.lesson.id })}><span>🎧</span> Nghe chép: {picks.lesson.title} (~6p)</li>
              <li onClick={() => go('vocab', { ref: picks.family.id })}><span>📚</span> Word family: <b>{picks.family.words[0][0]}</b></li>
            </ul>
            <p className="tip">💡 {info.week.tip}</p>
          </section>

          <section className="card">
            <div className="row between"><h2>📈 Tiến độ tuần</h2><span className="pill">{Math.round((weekDone / weekTotal) * 100)}%</span></div>
            <div className="week-bars">
              {weekData.map((d) => {
                const h = d.total ? (d.done / d.total) * 100 : 0
                return (
                  <div key={d.k} className={`wb ${d.k === today ? 'today' : ''}`}>
                    <div className="wb-track"><div className="wb-fill" style={{ height: `${h}%` }} /></div>
                    <span>{VI_DAYS[fromKey(d.k).getDay()]}</span>
                  </div>
                )
              })}
            </div>
            <p className="muted small">{weekDone} việc đã xong trong tuần này</p>
          </section>

          <section className="card">
            <h2>🔁 Cần ôn lại</h2>
            <ul className="review-list">
              <li onClick={() => go('flash')}><b>{dueCards}</b> flashcard đến hạn</li>
              {weakTopics.slice(0, 4).map((g) => (
                <li key={g.id} onClick={() => go('practice', { ref: g.id })}>{g.emoji} {g.name} <span className="pill pink">cần củng cố</span></li>
              ))}
              {weakLessons.slice(0, 3).map((l) => (
                <li key={l.id} onClick={() => go('listen', { ref: l.id })}>{l.scene} {l.title} <span className="pill">{listenDone[l.id].best}%</span></li>
              ))}
              {!weakTopics.length && !weakLessons.length && <li className="muted">Chưa có chủ điểm yếu — tiếp tục giữ phong độ nhé!</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
