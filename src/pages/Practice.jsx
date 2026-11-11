import { useRef, useState } from 'react'
import { GRAMMAR, COACH } from '../data/quiz.js'
import { useStore, setState, getState, logActivity } from '../lib/store.js'
import { freshTopic, pickQuestion, afterAnswer, masteryLabel } from '../lib/adaptive.js'
import { todayKey, diffDays } from '../lib/date.js'
import { planInfo } from '../data/plan.js'
import { dailyPlan } from '../lib/course.js'
import Mascot from '../components/Mascot.jsx'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Practice({ params, onDone, limit }) {
  const store = useStore()
  const { topics, profile, qDone } = store
  const [topicId, setTopicId] = useState(params?.ref || null)
  const plan = dailyPlan(store)
  const p5 = plan.part5
  const today = todayKey()

  const smartPick = () => {
    const week = planInfo(profile, today).week
    // Due / weak topics first, then topics of this week, and only topics that still have unseen questions
    const left = (g) => g.qs.filter((q) => !qDone[q.id]).length
    const ranked = [...GRAMMAR].sort((a, b) => {
      const sa = topics[a.id], sb = topics[b.id]
      const da = (sa ? (sa.due <= today ? 0 : 2) + sa.box * 0.1 : (week.grammar.includes(a.id) ? -1 : 1)) + (left(a) ? 0 : 5)
      const db = (sb ? (sb.due <= today ? 0 : 2) + sb.box * 0.1 : (week.grammar.includes(b.id) ? -1 : 1)) + (left(b) ? 0 : 5)
      return da - db
    })
    setTopicId(ranked[0].id)
  }

  if (topicId) {
    const topic = GRAMMAR.find((g) => g.id === topicId)
    return <Session key={topicId} topic={topic} limit={limit || 10} onExit={onDone || (() => setTopicId(null))} embedded={!!onDone} />
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>🧠 Luyện ngữ pháp thích ứng</h1>
        <p className="muted">Đúng → tăng độ khó / chuyển sang dạng vận dụng. Sai → chỉ ra nguyên nhân. Sai nhiều lần → quay lại kiến thức nền. Hiểu lý thuyết mà vẫn sai → bài tập ứng dụng từng bước. Thành thạo → giãn lịch ôn.</p>
        <div className="day-goal">
          <span>🎯 Part 5 hôm nay: <b>{p5.doneToday}/{p5.goal || p5.review}</b> câu{p5.review ? ' (đã làm hết ngân hàng câu, đang ôn lại câu sai)' : ''} · đã làm {p5.learned}/{p5.total} câu trong lộ trình</span>
          <div className="progress"><div style={{ width: `${Math.min(100, (p5.doneToday / Math.max(1, p5.goal || p5.review)) * 100)}%` }} /></div>
        </div>
        <button className="btn yellow" onClick={smartPick}>✨ Ôn thông minh (chọn giúp mình)</button>
      </div>
      <div className="topic-grid">
        {GRAMMAR.map((g) => {
          const st = topics[g.id]
          const due = st && st.due <= today
          return (
            <button key={g.id} className="card topic-card" onClick={() => setTopicId(g.id)}>
              <span className="topic-emoji">{g.emoji}</span>
              <b>{g.name}</b>
              <div className="mastery"><div style={{ width: `${((st?.box || 0) / 6) * 100}%` }} /></div>
              <span className="muted small">
                {st ? `${masteryLabel(st.box)} · ${st.correct}/${st.attempts} đúng` : 'Chưa học'} · còn {g.qs.filter((q) => !qDone[q.id]).length}/{g.qs.length} câu mới
                {st && (due ? ' · 🔔 đến hạn ôn' : ` · ôn lại sau ${diffDays(today, st.due)} ngày`)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Coach({ events, mood }) {
  if (!events?.length) return null
  return (
    <div className="coach">
      <Mascot size={58} mood={mood} />
      <div className="bubble">
        {events.map((e) => COACH[e] && (
          <p key={e}><b>{COACH[e].vi}</b><br /><i className="muted">{COACH[e].en}</i></p>
        ))}
      </div>
    </div>
  )
}

function Session({ topic, limit, onExit, embedded }) {
  const [saved] = useState(() => getState().topics[topic.id]) // state at the start of this session
  const [st, setSt] = useState(() => ({ ...freshTopic(), ...saved }))
  const seen = useRef(new Set())
  const pick = (stNow) => pickQuestion(topic, stNow, seen.current, getState().qDone || {})
  const [q, setQ] = useState(() => pick({ ...freshTopic(), ...saved }))
  const [phase, setPhase] = useState('question')
  const [chosen, setChosen] = useState(null)
  const [fb, setFb] = useState(null)
  const [count, setCount] = useState(0)
  const [right, setRight] = useState(0)
  const [lang, setLang] = useState('vi')
  const [tc, setTc] = useState(null)
  const [tcPick, setTcPick] = useState(null)
  const [showSteps, setShowSteps] = useState(false)
  const startBox = saved?.box || 0

  const persist = (next) => { setSt(next); setState((s) => ({ topics: { ...s.topics, [topic.id]: next } })) }

  const answer = (i) => {
    if (chosen !== null) return
    setChosen(i)
    const ok = i === q.a
    const r = afterAnswer(st, ok)
    persist(r.st)
    seen.current.add(q)
    // Remember the question for the course (first date) and whether the last try was right
    setState((s) => ({ qDone: { ...s.qDone, [q.id]: { d: s.qDone?.[q.id]?.d || todayKey(), ok } } }))
    logActivity('quiz', 1, 1)
    setFb(r)
    setCount((c) => c + 1)
    if (ok) setRight((x) => x + 1)
  }

  const nextQ = () => {
    if (fb?.next === 'theory') { setPhase('theory'); setChosen(null); setFb(null); return }
    if (count >= limit) { finish(); return }
    setQ(pick(st))
    setChosen(null); setFb(null); setShowSteps(false)
    setPhase('question')
  }

  const finish = () => setPhase('summary')

  const startCheck = () => {
    setTc(topic.tc[Math.floor(Math.random() * topic.tc.length)])
    setTcPick(null)
    setPhase('theoryCheck')
  }

  const answerTc = (i) => {
    if (tcPick !== null) return
    setTcPick(i)
    persist({ ...st, theoryOK: i === tc.a })
  }

  const guided = st.mode === 'guided'
  const coachMood = fb ? (fb.events.includes('wrong') ? 'think' : 'cheer') : 'happy'

  return (
    <div className={embedded ? '' : 'page'}>
      <div className="row between">
        {!embedded ? <button className="btn sm" onClick={onExit}>← Chủ điểm</button> : <span />}
        <span className="pill">{topic.emoji} {topic.name}</span>
      </div>
      <div className="row gap-s level-row">
        <span className="pill blue">Cấp {st.level}/3</span>
        <span className={`pill ${st.mode === 'apply' ? 'green' : st.mode === 'guided' ? 'pink' : ''}`}>
          {st.mode === 'apply' ? '💼 Vận dụng' : st.mode === 'guided' ? '🪜 Ứng dụng từng bước' : '📝 Luyện tập'}
        </span>
        <span className="pill">{masteryLabel(st.box)}</span>
        {phase !== 'summary' && <span className="muted small">Câu {Math.min(count + (chosen === null ? 1 : 0), limit)}/{limit}</span>}
      </div>

      {phase === 'question' && (
        <div className="card">
          {guided && (
            <div className="steps">
              <b>🪜 Làm theo các bước:</b>
              <ol>{topic.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          )}
          {!guided && chosen === null && (
            <button className="link small" onClick={() => setShowSteps((v) => !v)}>{showSteps ? 'Ẩn gợi ý' : '💡 Gợi ý cách làm'}</button>
          )}
          {showSteps && !guided && <ol className="steps small">{topic.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
          <p className={`question ${q.t === 'a' ? 'context' : ''}`}>{q.q}</p>
          <div className="options">
            {q.o.map((o, i) => {
              let cls = ''
              if (chosen !== null) { if (i === q.a) cls = 'right'; else if (i === chosen) cls = 'wrong'; else cls = 'dim' }
              return (
                <button key={i} className={`option ${cls}`} onClick={() => answer(i)}>
                  <span className="letter">{LETTERS[i]}</span>{o}
                  {chosen !== null && (i === chosen || i === q.a) && <small className="why">{q.why[i]}</small>}
                </button>
              )
            })}
          </div>
          {fb && (
            <>
              {chosen !== q.a && (
                <div className="cause">
                  <b>🔍 Nguyên nhân sai:</b> {q.why[chosen]}
                </div>
              )}
              <div className="explain">
                <p>🇻🇳 {q.vi}</p>
                {q.en && <p className="en">🇬🇧 {q.en}</p>}
              </div>
              <Coach events={fb.events.filter((e) => e !== 'correct' || fb.events.length === 1)} mood={coachMood} />
              <div className="row between">
                <span className="muted small">Đúng {right}/{count}</span>
                <button className="btn yellow" onClick={nextQ}>{fb.next === 'theory' ? '📘 Xem kiến thức nền' : count >= limit ? 'Xem kết quả' : 'Câu tiếp ➜'}</button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'theory' && (
        <div className="card">
          <Coach events={['foundation']} mood="think" />
          <div className="seg">
            <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>Tiếng Việt</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>
          <div className="theory">{topic.theory[lang]}</div>
          <button className="btn blue wide" onClick={startCheck}>Mình hiểu rồi → Kiểm tra nhanh</button>
        </div>
      )}

      {phase === 'theoryCheck' && tc && (
        <div className="card">
          <Coach events={['theoryCheck']} mood="think" />
          <p className="question">{tc.q}</p>
          <div className="options">
            {tc.o.map((o, i) => {
              let cls = ''
              if (tcPick !== null) { if (i === tc.a) cls = 'right'; else if (i === tcPick) cls = 'wrong'; else cls = 'dim' }
              return <button key={i} className={`option ${cls}`} onClick={() => answerTc(i)}><span className="letter">{LETTERS[i]}</span>{o}</button>
            })}
          </div>
          {tcPick !== null && (tcPick === tc.a ? (
            <>
              <p className="ok-box">✅ Bạn nắm lý thuyết rồi! Nếu làm bài vẫn sai, app sẽ chuyển sang bài tập ứng dụng từng bước.</p>
              <button className="btn yellow wide" onClick={() => { setPhase('question'); setChosen(null); setQ(pick(st)) }}>Luyện tiếp ➜</button>
            </>
          ) : (
            <>
              <p className="cause">Chưa đúng — đáp án là <b>{tc.o[tc.a]}</b>. Đọc lại phần nền một lần nữa nhé.</p>
              <div className="row gap-s">
                <button className="btn" onClick={() => setPhase('theory')}>📘 Xem lại lý thuyết</button>
                <button className="btn yellow" onClick={() => { setPhase('question'); setChosen(null); setQ(pick(st)) }}>Luyện tiếp</button>
              </div>
            </>
          ))}
        </div>
      )}

      {phase === 'summary' && (
        <div className="card center">
          <Mascot size={110} mood={right / Math.max(1, count) >= 0.7 ? 'cheer' : 'think'} />
          <h2>Kết quả: {right}/{count} câu đúng</h2>
          <p>Mức độ: <b>{masteryLabel(startBox)}</b> → <b>{masteryLabel(st.box)}</b></p>
          <p className="muted">Lần ôn tới: {diffDays(todayKey(), st.due) <= 0 ? 'ngay hôm nay' : `sau ${diffDays(todayKey(), st.due)} ngày`} {st.box >= 5 && '— đã thành thạo nên giãn lịch ôn 🌟'}</p>
          <div className="row gap-s center-row">
            {embedded ? <button className="btn yellow" onClick={onExit}>Tiếp tục ➜</button> : <>
              <button className="btn" onClick={onExit}>← Chủ điểm khác</button>
              <button className="btn blue" onClick={() => { setCount(0); setRight(0); setPhase('question'); setChosen(null); setFb(null); setQ(pick(st)) }}>Luyện thêm 10 câu</button>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}
