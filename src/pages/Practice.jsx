import { useMemo, useRef, useState } from 'react'
import { GRAMMAR, COACH } from '../data/quiz.js'
import { useStore, setState, getState, logActivity } from '../lib/store.js'
import { freshTopic, pickQuestion, afterAnswer, masteryLabel } from '../lib/adaptive.js'
import { todayKey, diffDays } from '../lib/date.js'
import { planInfo } from '../data/plan.js'
import Mascot from '../components/Mascot.jsx'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Practice({ params, onDone, limit }) {
  const { topics, profile } = useStore()
  const [topicId, setTopicId] = useState(params?.ref || null)
  const today = todayKey()

  const smartPick = () => {
    const week = planInfo(profile, today).week
    const ranked = [...GRAMMAR].sort((a, b) => {
      const sa = topics[a.id], sb = topics[b.id]
      const da = sa ? (sa.due <= today ? 0 : 2) + sa.box * 0.1 : (week.grammar.includes(a.id) ? -1 : 1)
      const db = sb ? (sb.due <= today ? 0 : 2) + sb.box * 0.1 : (week.grammar.includes(b.id) ? -1 : 1)
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
                {st ? `${masteryLabel(st.box)} · ${st.correct}/${st.attempts} đúng` : 'Chưa học'}
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
  const saved = getState().topics[topic.id]
  const [st, setSt] = useState(() => ({ ...freshTopic(), ...saved }))
  const seen = useRef(new Set())
  const [q, setQ] = useState(() => pickQuestion(topic, { ...freshTopic(), ...saved }, seen.current))
  const [phase, setPhase] = useState('question')
  const [chosen, setChosen] = useState(null)
  const [fb, setFb] = useState(null)
  const [count, setCount] = useState(0)
  const [right, setRight] = useState(0)
  const [lang, setLang] = useState('vi')
  const [tc, setTc] = useState(null)
  const [tcPick, setTcPick] = useState(null)
  const [showSteps, setShowSteps] = useState(false)
  const startBox = useMemo(() => saved?.box || 0, [saved])

  const persist = (next) => { setSt(next); setState((s) => ({ topics: { ...s.topics, [topic.id]: next } })) }

  const answer = (i) => {
    if (chosen !== null) return
    setChosen(i)
    const ok = i === q.a
    const r = afterAnswer(st, ok)
    persist(r.st)
    setFb(r)
    setCount((c) => c + 1)
    if (ok) setRight((x) => x + 1)
  }

  const nextQ = () => {
    if (fb?.next === 'theory') { setPhase('theory'); setChosen(null); setFb(null); return }
    if (count >= limit) { finish(); return }
    seen.current.add(q)
    setQ(pickQuestion(topic, st, seen.current))
    setChosen(null); setFb(null); setShowSteps(false)
    setPhase('question')
  }

  const finish = () => {
    logActivity('quiz', count, Math.max(1, Math.round(count * 0.8)))
    setPhase('summary')
  }

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
                <p className="en">🇬🇧 {q.en}</p>
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
              <button className="btn yellow wide" onClick={() => { setPhase('question'); setChosen(null); setQ(pickQuestion(topic, st, seen.current)) }}>Luyện tiếp ➜</button>
            </>
          ) : (
            <>
              <p className="cause">Chưa đúng — đáp án là <b>{tc.o[tc.a]}</b>. Đọc lại phần nền một lần nữa nhé.</p>
              <div className="row gap-s">
                <button className="btn" onClick={() => setPhase('theory')}>📘 Xem lại lý thuyết</button>
                <button className="btn yellow" onClick={() => { setPhase('question'); setChosen(null); setQ(pickQuestion(topic, st, seen.current)) }}>Luyện tiếp</button>
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
              <button className="btn blue" onClick={() => { setCount(0); setRight(0); setPhase('question'); setChosen(null); setFb(null); setQ(pickQuestion(topic, st, seen.current)) }}>Luyện thêm 10 câu</button>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}
