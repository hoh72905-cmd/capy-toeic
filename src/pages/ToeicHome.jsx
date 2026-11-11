import { useState } from 'react'
import Mascot from '../components/Mascot.jsx'
import Title from '../components/Title.jsx'
import ExamSetup from '../components/ExamSetup.jsx'
import { useStore, setState } from '../lib/store.js'
import { todayKey, weekKeys, VI_DAYS, fromKey, uid } from '../lib/date.js'
import { planInfo, dayPicks, grammarName, PHASES } from '../data/plan.js'
import { CARDS } from '../data/vocab.js'
import { GRAMMAR } from '../data/quiz.js'
import { LESSONS } from '../data/listening.js'
import { isDue, MASTERED_BOX } from '../lib/srs.js'
import { todayCurriculum, examInfo } from '../lib/curriculum.js'
import { isToeic } from '../lib/today.js'
import { useStreak, greeting } from '../lib/hooks.js'
import { confetti, confettiAt } from '../lib/confetti.js'

const KIND_PAGE = { flash: 'flash', listen: 'listen', quiz: 'practice', vocab: 'vocab', curri: 'plan' }

// Overview of the TOEIC area: status, today's study tasks, week progress, review
export default function ToeicHome({ go }) {
  const { profile, todos, cards, topics, listenDone, curri } = useStore()
  const today = todayKey()
  const info = planInfo(profile, today)
  const picks = dayPicks(profile, today)
  const exam = examInfo(profile, today)
  const curriToday = todayCurriculum(profile, curri, today)
  const list = (todos[today] || []).filter(isToeic)
  const [text, setText] = useState('')
  const streak = useStreak()

  const update = (fn) => setState((st) => ({ todos: { ...st.todos, [today]: fn(st.todos[today] || []) } }))
  const add = () => {
    if (!text.trim()) return
    update((l) => [...l, { id: uid(), text: text.trim(), done: false, kind: 'custom', toeic: true }])
    setText('')
  }
  const toggle = (t, e) => {
    const check = e.target.closest('li')?.querySelector('.check')
    update((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
    if (!t.done) {
      if (list.every((x) => x.done || x.id === t.id)) confetti(undefined, undefined, 70)
      else confettiAt(check, 14)
    }
  }

  const done = list.filter((t) => t.done).length
  const pct = list.length ? Math.round((done / list.length) * 100) : 0
  const totalMin = list.reduce((a, t) => a + (t.min || 0), 0)

  const dueCards = CARDS.filter((c) => cards[c.id] && isDue(cards[c.id])).length
  const learned = Object.values(cards).filter((c) => c.box >= MASTERED_BOX).length
  const weakTopics = GRAMMAR.filter((g) => topics[g.id] && (topics[g.id].due <= today || topics[g.id].box <= 1))
  const weakLessons = LESSONS.filter((l) => listenDone[l.id] && listenDone[l.id].best < 70)

  const weekData = weekKeys(today).map((k) => {
    const l = (todos[k] || []).filter(isToeic)
    return { k, total: l.length, done: l.filter((t) => t.done).length }
  })
  const weekDone = weekData.reduce((a, d) => a + d.done, 0)
  const weekTotal = weekData.reduce((a, d) => a + d.total, 0) || 1
  const mood = pct === 100 ? 'cheer' : pct > 0 ? 'happy' : 'calm'

  return (
    <div className="page dashboard">
      <section className="card toeic-banner">
        <div className="grow">
          <p className="eyebrow">🎓 Góc học TOEIC</p>
          <h1>{greeting()}, {profile.name}! Học xíu nha~</h1>
          <div className="stat-row">
            {exam.exam && <span className="stat exam-chip only-mobile" onClick={() => go('plan', { ref: 'exam' })}><b>⏳ {Math.max(0, exam.daysLeft)}</b> ngày nữa thi</span>}
            <span className="stat"><b>🔥 {streak}</b> ngày liên tiếp</span>
            <span className="stat"><b>📅 Tuần {info.week.n}</b>/12 · ngày {Math.min(info.total, info.dayIndex + 1)}/{info.total}</span>
            <span className="stat"><b>🎯 {info.target}</b> mục tiêu tuần · đích {exam.target} ({exam.cefr?.cefr})</span>
            <span className="stat"><b>⭐ {learned}</b> từ thành thạo</span>
          </div>
          <p className="phase-tag" style={{ background: PHASES[info.week.phase].color }}>{PHASES[info.week.phase].name} — {info.week.title}</p>
        </div>
        <div className="banner-side">
          {exam.exam && (
            <button className="countdown only-desktop" onClick={() => go('plan', { ref: 'exam' })} title="Đổi ngày thi">
              <b>{Math.max(0, exam.daysLeft)}</b><span>ngày nữa thi</span>
            </button>
          )}
          <Mascot size={96} mood={mood} className="bob" />
        </div>
      </section>

      {!profile.examDate && <ExamSetup compact />}

      <button className="btn start-btn" onClick={() => go('session')}>
        <span>🚀 Bắt đầu buổi học</span>
        <small>Flashcard → Ngữ pháp → Nghe chép → Từ vựng · khoảng 25 phút</small>
      </button>

      <div className="grid-2">
        <section className="card tint-yellow todo-card">
          <div className="row between">
            <Title icon="📝">Việc học hôm nay</Title>
            <span className="pill blue">{done}/{list.length} · {totalMin}p</span>
          </div>
          <div className="progress big"><div style={{ width: `${pct}%` }} /></div>
          <ul className="todo-list">
            {list.map((t) => (
              <li key={t.id} className={t.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={t.done} onChange={(e) => toggle(t, e)} />
                  <span className="check" />
                  <span className="todo-text">{t.text}{t.min ? <em> · {t.min}p</em> : null}</span>
                </label>
                <div className="todo-actions">
                  {KIND_PAGE[t.kind] && !t.done && <button className="btn sm blue" onClick={() => go(KIND_PAGE[t.kind], { ref: t.ref })}>Làm</button>}
                  <button className="icon-btn sm" title="Xóa" onClick={() => update((l) => l.filter((x) => x.id !== t.id))}>🗑️</button>
                </div>
              </li>
            ))}
            {!list.length && <li className="muted">Chưa có việc học nào — thêm ở dưới nhé.</li>}
          </ul>
          <div className="row gap-s">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Thêm việc học TOEIC…" />
            <button className="btn yellow" onClick={add}>Thêm</button>
          </div>
          {pct === 100 && <p className="celebrate">🎉 Học xong hết rồi! Capybara tự hào về bạn lắm!</p>}
          <p className="muted small">Việc riêng (không phải TOEIC) nằm ở mục <button className="link" onClick={() => go('home')}>🏡 Cá nhân</button>.</p>
        </section>

        <div className="stack">
          <section className="card tint-blue">
            <Title icon="🎯">Mục tiêu học hôm nay</Title>
            <ul className="goal-list">
              <li onClick={() => go('flash')}><span>🃏</span> Ôn {dueCards} thẻ đến hạn + {profile.dailyNew} từ mới</li>
              <li onClick={() => go('practice', { ref: picks.topic })}><span>🧠</span> Ngữ pháp: {grammarName(picks.topic)}</li>
              <li onClick={() => go('listen', { ref: picks.lesson.id })}><span>🎧</span> Nghe chép: {picks.lesson.title} (~6p)</li>
              <li onClick={() => go('vocab', { ref: picks.family.id })}><span>📚</span> Word family: <b>{picks.family.words[0][0]}</b></li>
              {curriToday.list.length > 0 && <li onClick={() => go('plan', { ref: 'curri' })}><span>📘</span> Khung kiến thức: {curriToday.list.length} bài · đã xong {curriToday.doneCount}/{curriToday.total}</li>}
            </ul>
            <p className="tip">💡 {info.week.tip}</p>
          </section>

          <section className="card tint-green">
            <div className="row between"><Title icon="📈">Tiến độ tuần</Title><span className="pill">{Math.round((weekDone / weekTotal) * 100)}%</span></div>
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
            <p className="muted small">{weekDone} việc học đã xong trong tuần này</p>
          </section>

          <section className="card tint-pink">
            <Title icon="🔁">Cần ôn lại</Title>
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
