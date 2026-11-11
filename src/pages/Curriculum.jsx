import { useMemo, useState } from 'react'
import { useStore, setState, markTodoKind, getState } from '../lib/store.js'
import { todayKey } from '../lib/date.js'
import { CAT, requiredLessons, skippedLessons, todayCurriculum, lessonById, SOURCE, ALL_LESSONS } from '../lib/curriculum.js'

// Tick a lesson; when all of today's lessons are done, tick the to-do item too
function toggle(id) {
  const today = todayKey()
  setState((s) => {
    const next = { ...s.curri }
    if (next[id]) delete next[id]; else next[id] = today
    return { curri: next }
  })
  const s = getState()
  const { list } = todayCurriculum(s.profile, s.curri, today)
  if (list.length && list.every((l) => s.curri[l.id])) markTodoKind('curri')
}

function LessonRow({ l, done, go }) {
  const pre = l.pre.map(lessonById).filter(Boolean)
  return (
    <li className={done ? 'done' : ''}>
      <label>
        <input type="checkbox" checked={!!done} onChange={() => toggle(l.id)} />
        <span className="check" />
        <span className="grow">
          <span className="todo-text">{CAT[l.cat].icon} {l.name}</span>
          <span className="muted small"> · {l.days >= 6 ? `ôn tập ${l.days} buổi` : `${l.days} buổi`}{pre.length ? ` · cần trước: ${pre.slice(0, 3).map((p) => p.name).join(', ')}${pre.length > 3 ? '…' : ''}` : ''}</span>
        </span>
      </label>
      {l.link && !done && <button className="btn sm blue" onClick={() => go(l.link.page, { ref: l.link.ref })}>Luyện</button>}
    </li>
  )
}

export default function Curriculum({ go }) {
  const { profile, curri } = useStore()
  const today = todayKey()
  const [cat, setCat] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const target = profile.targetScore || 800
  const current = profile.currentScore || null
  const required = useMemo(() => requiredLessons(target, current), [target, current])
  const skipped = useMemo(() => new Set(skippedLessons(target, current).map((l) => l.id)), [target, current])
  const plan = todayCurriculum(profile, curri, today)
  const reqIds = new Set(required.map((l) => l.id))
  const pool = showAll ? ALL_LESSONS : required
  const shown = pool.filter((l) => cat === 'all' || l.cat === cat)
  const pct = Math.round((plan.doneCount / Math.max(1, plan.total)) * 100)

  return (
    <div className="stack">
      <div className="card">
        <div className="row between"><h2>📘 Hôm nay học trong khung kiến thức</h2><span className="pill blue">{plan.list.filter((l) => curri[l.id]).length}/{plan.list.length}</span></div>
        <p className="muted small">Các bài còn lại được chia đều cho {plan.studyDays} ngày học trước ngày thi (tuần cuối để làm đề). Bấm “Luyện” để làm bài tập tương ứng trong app.</p>
        <ul className="todo-list">{plan.list.map((l) => <LessonRow key={l.id} l={l} done={curri[l.id]} go={go} />)}</ul>
        {!plan.list.length && <p className="celebrate">🎉 Đã học hết khung kiến thức cho mục tiêu {target}!</p>}
      </div>

      <div className="card">
        <div className="row between"><h2>🗂️ Toàn bộ khung kiến thức</h2><span className="pill">{plan.doneCount}/{plan.total} · {pct}%</span></div>
        <div className="progress big"><div style={{ width: `${pct}%` }} /></div>
        <div className="chips" style={{ margin: '10px 0' }}>
          {['all', ...Object.keys(CAT)].map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'Tất cả' : `${CAT[c].icon} ${CAT[c].name}`} ({pool.filter((l) => c === 'all' || l.cat === c).length})
            </button>
          ))}
        </div>
        {skipped.size > 0 && <p className="muted small">✅ Đã bỏ qua {skipped.size} bài ở trình độ thấp hơn điểm hiện tại ({current}). Bật ô dưới để xem lại.</p>}
        <label className="row gap-s small"><input type="checkbox" style={{ width: 'auto' }} checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Hiện cả các bài ngoài lộ trình (đã nắm hoặc vượt mục tiêu {target})</label>
        <ul className="todo-list">
          {shown.map((l) => (
            <div key={l.id} className={!reqIds.has(l.id) ? 'extra' : ''}>
              {skipped.has(l.id) && <span className="pill green known-tag">đã nắm</span>}
              <LessonRow l={l} done={curri[l.id]} go={go} />
            </div>
          ))}
        </ul>
        <p className="muted small">Nguồn: <a href={SOURCE.url} target="_blank" rel="noreferrer">{SOURCE.title}</a> — {SOURCE.author}, giấy phép {SOURCE.license}. App chỉ dùng phần TOEIC Listening & Reading.</p>
      </div>
    </div>
  )
}
