import { useState } from 'react'
import Mascot from '../components/Mascot.jsx'
import Title from '../components/Title.jsx'
import { useStore, setState } from '../lib/store.js'
import { todayKey, addDays, weekKeys, VI_DAYS, fromKey, uid, diffDays } from '../lib/date.js'
import { isToeic } from '../lib/today.js'
import { useStreak, greeting } from '../lib/hooks.js'
import { confetti, confettiAt } from '../lib/confetti.js'
import { examInfo } from '../lib/curriculum.js'

const TAGS = [
  { id: 'life', icon: '🏡', name: 'Cá nhân', color: '#ffd54f' },
  { id: 'study', icon: '📚', name: 'Học tập', color: '#6cc8f5' },
  { id: 'work', icon: '💼', name: 'Công việc', color: '#ffb74d' },
  { id: 'health', icon: '💪', name: 'Sức khỏe', color: '#7cc576' },
  { id: 'fun', icon: '🎉', name: 'Vui chơi', color: '#ffb7c5' },
]
const tagOf = (id) => TAGS.find((t) => t.id === id) || TAGS[0]

const KINDS = [
  { id: 'exam', icon: '📝', name: 'Lịch thi' },
  { id: 'deadline', icon: '⏰', name: 'Deadline' },
  { id: 'event', icon: '🎂', name: 'Sự kiện' },
  { id: 'note', icon: '📌', name: 'Lưu ý' },
]
const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[3]

const SUGGEST = [
  ['💧 Uống đủ 2 lít nước', 'health'], ['🏃 Vận động 15 phút', 'health'], ['📖 Đọc sách 10 trang', 'study'],
  ['🧹 Dọn bàn học', 'life'], ['📞 Gọi điện về nhà', 'life'],
]

const fmtDay = (k) => { const d = fromKey(k); return `${VI_DAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}` }
const fmtLong = (k) => fromKey(k).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

function countdown(d) {
  if (d === null) return null
  if (d < 0) return { label: `Đã qua ${-d} ngày`, urg: 'past' }
  if (d === 0) return { label: 'Hôm nay!', urg: 'hot' }
  if (d === 1) return { label: 'Ngày mai', urg: 'hot' }
  return { label: `Còn ${d} ngày`, urg: d <= 7 ? 'soon' : 'later' }
}

// User reminders + the TOEIC exam date, sorted: upcoming → undated → past/done
function useReminders() {
  const { reminders, profile } = useStore()
  const today = todayKey()
  const list = [...reminders]
  if (profile.examDate) {
    list.push({ id: 'toeic-exam', auto: true, kind: 'exam', date: profile.examDate, title: `Thi TOEIC (mục tiêu ${profile.targetScore || 800})` })
  }
  return list
    .map((r) => { const d = r.date ? diffDays(today, r.date) : null; return { ...r, d, cd: countdown(d) } })
    .sort((a, b) => {
      const g = (r) => (r.done ? 3 : r.d === null ? 1 : r.d >= 0 ? 0 : 2)
      return g(a) - g(b) || Math.abs(a.d ?? 0) - Math.abs(b.d ?? 0)
    })
}

function Ring({ value, size = 62, children }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc107" /><stop offset="1" stopColor="#3aa8dd" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span>{children}</span>
    </div>
  )
}

export default function Personal({ go }) {
  const { profile, todos } = useStore()
  const today = todayKey()
  const streak = useStreak()
  const reminders = useReminders()
  const mine = (todos[today] || []).filter((t) => !isToeic(t))
  const done = mine.filter((t) => t.done).length
  const left = mine.length - done
  const upcoming = reminders.filter((r) => !r.done && r.d !== null && r.d >= 0 && r.d <= 7)
  const urgent = upcoming.filter((r) => r.d <= 2)

  let bubble = 'Hôm nay làm gì ta~ 🍊'
  if (mine.length && left === 0) bubble = 'Xong hết việc rồi, ngâm suối thôi! ♨️'
  else if (urgent.length) bubble = `Nhớ nha: ${urgent[0].title} — ${urgent[0].cd.label.toLowerCase()}!`
  else if (left > 0) bubble = `Còn ${left} việc nữa thôi, cố lên! 💪`

  return (
    <div className="page personal">
      <section className="card hero">
        <div className="hero-photo" role="img" aria-label="Ba bé capybara ngâm suối nước nóng">
          <span className="steam" aria-hidden="true"><i /><i /><i /></span>
          <span className="hero-bubble">{bubble}</span>
        </div>
        <div className="hero-text">
          <p className="eyebrow">{fmtLong(today)}</p>
          <h1>{greeting()}, {profile.name}! <span className="wave-hand">👋</span></h1>
          <div className="stat-row">
            <span className="stat"><b>✅ {done}/{mine.length}</b> việc hôm nay</span>
            <span className="stat"><b>📌 {upcoming.length}</b> nhắc nhở trong 7 ngày</span>
            <span className="stat"><b>🔥 {streak}</b> ngày liên tiếp</span>
          </div>
          <Mascot size={64} mood={mine.length && left === 0 ? 'cheer' : 'happy'} className="bob hero-mascot" />
        </div>
      </section>

      {urgent.length > 0 && (
        <div className="urgent">
          <span className="bell">🔔</span>
          <div className="grow">
            {urgent.map((r) => <div key={r.id}><b>{kindOf(r.kind).icon} {r.title}</b> — {r.cd.label.toLowerCase()} ({fmtDay(r.date)})</div>)}
          </div>
        </div>
      )}

      <div className="grid-2">
        <TodoCard />
        <div className="stack">
          <Reminders items={reminders} go={go} />
          <ToeicMini go={go} />
        </div>
      </div>
    </div>
  )
}

function TodoCard() {
  const { todos } = useStore()
  const today = todayKey()
  const [sel, setSel] = useState(today)
  const [text, setText] = useState('')
  const [tag, setTag] = useState('life')
  const [star, setStar] = useState(false)
  const [time, setTime] = useState('')
  const [editing, setEditing] = useState(null)

  const mine = (todos[sel] || []).filter((t) => !isToeic(t))
  const done = mine.filter((t) => t.done).length
  const pct = mine.length ? done / mine.length : 0
  const sorted = [...mine].sort((a, b) => (a.done - b.done) || ((b.star ? 1 : 0) - (a.star ? 1 : 0)) || (a.time || '99').localeCompare(b.time || '99'))

  const update = (fn, day = sel) => setState((st) => ({ todos: { ...st.todos, [day]: fn(st.todos[day] || []) } }))
  const add = (txt = text, tg = tag) => {
    if (!txt.trim()) return
    update((l) => [...l, { id: uid(), text: txt.trim(), done: false, kind: 'custom', tag: tg, star, time: time || undefined }])
    setText(''); setStar(false); setTime('')
  }
  const toggle = (t, e) => {
    const check = e.target.closest('li')?.querySelector('.check')
    update((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
    if (!t.done) {
      if (mine.every((x) => x.done || x.id === t.id)) confetti(undefined, undefined, 70)
      else confettiAt(check, 14)
    }
  }
  const patch = (id, p) => update((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const yesterday = addDays(today, -1)
  const leftover = sel === today ? (todos[yesterday] || []).filter((t) => !t.done && !isToeic(t) && !t.moved) : []
  const moveLeftover = () => setState((st) => ({
    todos: {
      ...st.todos,
      [today]: [...(st.todos[today] || []), ...leftover.map((t) => ({ ...t, id: uid() }))],
      [yesterday]: st.todos[yesterday].map((t) => (leftover.find((x) => x.id === t.id) ? { ...t, moved: true } : t)),
    },
  }))

  const selLabel = sel === today ? 'Hôm nay' : sel === addDays(today, 1) ? 'Ngày mai' : sel === yesterday ? 'Hôm qua' : fmtDay(sel)

  return (
    <section className="card tint-yellow todo-card">
      <div className="row between">
        <div>
          <Title icon="✅">Việc của mình</Title>
          <span className="pill yellow day-pill">📆 {selLabel}{sel !== today ? ` · ${fmtDay(sel)}` : ''}</span>
        </div>
        <Ring value={pct}>{done}/{mine.length}</Ring>
      </div>

      <div className="row gap-s">
        <button className="icon-btn" onClick={() => setSel(addDays(sel, -7))} aria-label="Tuần trước">‹</button>
        <div className="week-strip grow">
          {weekKeys(sel).map((k) => {
            const l = (todos[k] || []).filter((t) => !isToeic(t))
            const r = l.length ? l.filter((t) => t.done).length / l.length : 0
            return (
              <button key={k} className={`ws-day ${k === sel ? 'sel' : ''} ${k === today ? 'today' : ''}`} onClick={() => setSel(k)}>
                {VI_DAYS[fromKey(k).getDay()]}<b>{fromKey(k).getDate()}</b>
                <span className="ws-dot">{l.length > 0 && <i style={{ width: `${Math.max(12, r * 100)}%` }} />}</span>
              </button>
            )
          })}
        </div>
        <button className="icon-btn" onClick={() => setSel(addDays(sel, 7))} aria-label="Tuần sau">›</button>
      </div>
      {sel !== today && <button className="link small" onClick={() => setSel(today)}>↩ Về hôm nay</button>}

      <div className="add-form">
        <div className="row gap-s">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={`Thêm việc cho ${selLabel.toLowerCase()}…`} />
          <button className="btn yellow" onClick={() => add()}>＋ Thêm</button>
        </div>
        <div className="row gap-s wrap add-opts">
          {TAGS.map((tg) => (
            <button key={tg.id} className={`chip tagchip ${tag === tg.id ? 'on' : ''}`} style={{ '--tag': tg.color }} onClick={() => setTag(tg.id)}>{tg.icon} {tg.name}</button>
          ))}
          <button className={`chip star ${star ? 'on' : ''}`} onClick={() => setStar(!star)}>⭐ Quan trọng</button>
          <input type="time" className="time-input" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Giờ làm" />
        </div>
      </div>

      {leftover.length > 0 && (
        <div className="notice">
          Hôm qua còn {leftover.length} việc chưa xong.
          <button className="btn sm" onClick={moveLeftover}>Chuyển sang hôm nay</button>
        </div>
      )}

      <ul className="todo-list personal">
        {sorted.map((t) => {
          const tg = tagOf(t.tag)
          if (editing === t.id) {
            return (
              <li key={t.id} style={{ '--tag': tg.color }}>
                <input className="edit-input" autoFocus defaultValue={t.text}
                  onBlur={(e) => { if (e.target.value.trim()) patch(t.id, { text: e.target.value.trim() }); setEditing(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(null) }} />
              </li>
            )
          }
          return (
            <li key={t.id} className={`${t.done ? 'done' : ''} ${t.star ? 'star' : ''}`} style={{ '--tag': tg.color }}>
              <label>
                <input type="checkbox" checked={t.done} onChange={(e) => toggle(t, e)} />
                <span className="check" />
                <span className="tag-dot" title={tg.name}>{tg.icon}</span>
                <span className="todo-text">{t.text}</span>
              </label>
              <div className="todo-actions">
                {t.time && <span className="pill blue">⏰ {t.time}</span>}
                <button className={`icon-btn sm star-btn ${t.star ? 'on' : ''}`} title="Quan trọng" onClick={() => patch(t.id, { star: !t.star })}>{t.star ? '⭐' : '☆'}</button>
                <button className="icon-btn sm" title="Sửa" onClick={() => setEditing(t.id)}>✏️</button>
                <button className="icon-btn sm" title="Xóa" onClick={() => update((l) => l.filter((x) => x.id !== t.id))}>🗑️</button>
              </div>
            </li>
          )
        })}
      </ul>

      {!mine.length && (
        <div className="empty">
          <Mascot size={84} mood="think" className="bob" />
          <p className="muted">Chưa có việc nào cho {selLabel.toLowerCase()}. Thử thêm nhanh một việc nhé:</p>
          <div className="suggest">
            {SUGGEST.map(([s, tg]) => <button key={s} className="chip" onClick={() => add(s, tg)}>{s}</button>)}
          </div>
        </div>
      )}
      {mine.length > 0 && done === mine.length && <p className="celebrate">🎉 Xong hết rồi! Capybara tự hào về bạn lắm!</p>}
    </section>
  )
}

function Reminders({ items, go }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [kind, setKind] = useState('deadline')
  const add = () => {
    if (!title.trim()) return
    setState((s) => ({ reminders: [...s.reminders, { id: uid(), title: title.trim(), date: date || null, kind, done: false }] }))
    setTitle(''); setDate('')
  }
  const patch = (id, p) => setState((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...p } : r)) }))

  return (
    <section className="card tint-pink">
      <Title icon="📌">Nhắc nhở & lưu ý</Title>
      <p className="muted small">Có lịch thi, deadline hay điều gì cần nhớ thì ghi vào đây nè — app sẽ đếm ngược giúp bạn.</p>
      <div className="rem-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="VD: Thi cuối kỳ Kinh tế vi mô, nộp báo cáo nhóm…" />
        <div className="row gap-s wrap">
          {KINDS.map((k) => <button key={k.id} className={`chip ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>{k.icon} {k.name}</button>)}
        </div>
        <div className="row gap-s">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Ngày" />
          <button className="btn yellow" onClick={add}>Ghi lại</button>
        </div>
      </div>

      <ul className="rem-list">
        {items.map((r) => {
          const k = kindOf(r.kind)
          return (
            <li key={r.id} className={`rem ${r.cd?.urg || ''} ${r.done ? 'done' : ''}`}>
              <span className="rem-icon">{k.icon}</span>
              <div className="grow">
                <b>{r.title}</b>
                <div className="rem-meta">
                  {r.cd && !r.done && <span className={`cd ${r.cd.urg}`}>{r.cd.label}</span>}
                  <span className="muted small">{k.name}{r.date ? ` · ${fmtDay(r.date)}` : ''}{r.auto ? ' · từ mục TOEIC' : ''}</span>
                </div>
              </div>
              <div className="rem-actions">
                {r.auto ? (
                  <button className="icon-btn sm" title="Đổi ngày thi" onClick={() => go('plan', { ref: 'exam' })}>✏️</button>
                ) : (
                  <>
                    <button className="icon-btn sm" title={r.done ? 'Bỏ đánh dấu' : 'Đã xong'} onClick={(e) => { if (!r.done) confettiAt(e.currentTarget, 12); patch(r.id, { done: !r.done }) }}>{r.done ? '↩️' : '✔️'}</button>
                    <button className="icon-btn sm" title="Xóa" onClick={() => setState((s) => ({ reminders: s.reminders.filter((x) => x.id !== r.id) }))}>🗑️</button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {!items.length && <div className="empty"><Mascot size={70} mood="think" /><p className="muted small">Chưa có nhắc nhở nào. Ghi lịch thi hoặc deadline đầu tiên ở trên nhé!</p></div>}
    </section>
  )
}

function ToeicMini({ go }) {
  const { todos, profile } = useStore()
  const today = todayKey()
  const list = (todos[today] || []).filter(isToeic)
  const done = list.filter((t) => t.done).length
  const exam = examInfo(profile, today)
  return (
    <section className="card tint-blue">
      <div className="row between"><Title icon="🎓">TOEIC hôm nay</Title><span className="pill blue">{done}/{list.length}</span></div>
      <div className="progress big"><div style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} /></div>
      <ul className="mini-list">
        {list.slice(0, 4).map((t) => <li key={t.id} className={t.done ? 'done' : ''}>{t.text}</li>)}
        {list.length > 4 && <li className="more">… và {list.length - 4} việc nữa</li>}
      </ul>
      <div className="row between wrap">
        <span className="small">{exam.exam ? <>⏳ Còn <b>{Math.max(0, exam.daysLeft)}</b> ngày thi · đích {exam.target}</> : 'Chưa đặt ngày thi'}</span>
        <button className="btn blue" onClick={() => go('toeic')}>Vào học ➜</button>
      </div>
    </section>
  )
}
