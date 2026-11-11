import { useState } from 'react'
import { WEEKS, PHASES, planInfo, tasksFor, grammarName } from '../data/plan.js'
import { useStore, setState } from '../lib/store.js'
import { todayKey, addDays, fromKey, VI_DAYS } from '../lib/date.js'

export default function Schedule() {
  const { profile, todos } = useStore()
  const today = todayKey()
  const info = planInfo(profile.startDate, today)
  const [openWeek, setOpenWeek] = useState(info.weekIdx)

  return (
    <div className="page">
      <div className="page-head">
        <h1>🗓️ Lộ trình TOEIC 800 · 3 tháng</h1>
        <p className="muted">3 chặng × 4 tuần. Mỗi ngày ~45 phút, chia thành các bài ngắn 5–10 phút. Việc mỗi ngày sẽ tự vào to-do list ở trang chính.</p>
        <label className="row gap-s">Ngày bắt đầu:
          <input type="date" value={profile.startDate} onChange={(e) => e.target.value && setState((s) => ({ profile: { ...s.profile, startDate: e.target.value } }))} style={{ maxWidth: 180 }} />
        </label>
        <div className="progress big"><div style={{ width: `${Math.min(100, (info.dayIndex / 84) * 100)}%` }} /></div>
        <p className="small muted">Ngày {Math.min(84, info.dayIndex + 1)}/84 · Ngày thi dự kiến: {fromKey(addDays(profile.startDate, 84)).toLocaleDateString('vi-VN')}</p>
      </div>

      {[1, 2, 3].map((p) => (
        <section key={p} className="phase">
          <h2 className="phase-title" style={{ background: PHASES[p].color }}>{PHASES[p].name}</h2>
          {WEEKS.filter((w) => w.phase === p).map((w) => {
            const idx = w.n - 1
            const isNow = idx === info.weekIdx
            const days = Array.from({ length: 7 }, (_, i) => addDays(profile.startDate, idx * 7 + i))
            return (
              <div key={w.n} className={`card week ${isNow ? 'now' : ''} ${idx < info.weekIdx ? 'past' : ''}`}>
                <button className="week-head" onClick={() => setOpenWeek(openWeek === idx ? -1 : idx)}>
                  <span className="week-n">T{w.n}</span>
                  <div className="grow">
                    <b>{w.title}</b>{isNow && <span className="pill yellow"> Tuần này</span>}
                    <div className="muted small">🎯 {w.target}+ · {w.grammar.map(grammarName).join(', ')}</div>
                  </div>
                  <span>{openWeek === idx ? '▴' : '▾'}</span>
                </button>
                {openWeek === idx && (
                  <div className="week-body">
                    <p>📌 {w.focus}</p>
                    <p className="tip">💡 {w.tip}</p>
                    <div className="days">
                      {days.map((d) => {
                        const list = todos[d] || tasksFor(profile.startDate, d)
                        const done = (todos[d] || []).filter((t) => t.done).length
                        return (
                          <div key={d} className={`day ${d === today ? 'today' : ''}`}>
                            <div className="row between"><b>{VI_DAYS[fromKey(d).getDay()]} {fromKey(d).getDate()}/{fromKey(d).getMonth() + 1}</b>{todos[d] && <span className="pill">{done}/{list.length}</span>}</div>
                            <ul>{list.map((t, i) => <li key={i} className={t.done ? 'done' : ''}>{t.text}</li>)}</ul>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
