import { useState } from 'react'
import { WEEKS, PHASES, planInfo, tasksFor, grammarName, weekRange, weekTarget } from '../data/plan.js'
import { useStore } from '../lib/store.js'
import { todayKey, addDays, fromKey, VI_DAYS } from '../lib/date.js'
import ExamSetup from '../components/ExamSetup.jsx'
import Curriculum from './Curriculum.jsx'

export default function Schedule({ params, go }) {
  const [tab, setTab] = useState(params?.ref === 'curri' ? 'curri' : params?.ref === 'exam' ? 'exam' : 'plan')
  return (
    <div className="page">
      <div className="page-head">
        <h1>🗓️ Lộ trình TOEIC</h1>
        <div className="seg">
          <button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>🗓️ 12 tuần</button>
          <button className={tab === 'curri' ? 'on' : ''} onClick={() => setTab('curri')}>📘 Khung kiến thức</button>
          <button className={tab === 'exam' ? 'on' : ''} onClick={() => setTab('exam')}>🎯 Ngày thi</button>
        </div>
      </div>
      {tab === 'plan' && <Weeks />}
      {tab === 'curri' && <Curriculum go={go} />}
      {tab === 'exam' && <ExamSetup />}
    </div>
  )
}

function Weeks() {
  const { profile, todos } = useStore()
  const today = todayKey()
  const info = planInfo(profile, today)
  const [openWeek, setOpenWeek] = useState(info.weekIdx)
  const end = addDays(profile.startDate, info.total)

  return (
    <>
      <div className="card">
        <p className="muted">3 chặng × 4 tuần, co giãn vừa khít đến ngày thi. Mỗi ngày ~45 phút, chia thành các bài ngắn 5–10 phút. Việc mỗi ngày tự vào to-do list ở trang chính.</p>
        <div className="progress big"><div style={{ width: `${Math.min(100, (info.dayIndex / info.total) * 100)}%` }} /></div>
        <p className="small muted">Ngày {Math.min(info.total, info.dayIndex + 1)}/{info.total} · {profile.examDate ? 'Ngày thi' : 'Ngày thi dự kiến (chưa đặt)'}: {fromKey(end).toLocaleDateString('vi-VN')}</p>
      </div>

      {[1, 2, 3].map((p) => (
        <section key={p} className="phase">
          <h2 className="phase-title" style={{ background: PHASES[p].color }}>{PHASES[p].name}</h2>
          {WEEKS.filter((w) => w.phase === p).map((w) => {
            const idx = w.n - 1
            const isNow = idx === info.weekIdx
            const [from, to] = weekRange(profile, idx)
            const days = Array.from({ length: Math.max(0, to - from) }, (_, i) => addDays(profile.startDate, from + i))
            return (
              <div key={w.n} className={`card week ${isNow ? 'now' : ''} ${idx < info.weekIdx ? 'past' : ''}`}>
                <button className="week-head" onClick={() => setOpenWeek(openWeek === idx ? -1 : idx)}>
                  <span className="week-n">T{w.n}</span>
                  <div className="grow">
                    <b>{w.title}</b>{isNow && <span className="pill yellow"> Tuần này</span>}
                    <div className="muted small">🎯 {weekTarget(profile, idx)}+ · {days.length ? `${fromKey(days[0]).getDate()}/${fromKey(days[0]).getMonth() + 1}–${fromKey(days.at(-1)).getDate()}/${fromKey(days.at(-1)).getMonth() + 1}` : ''} · {w.grammar.map(grammarName).join(', ')}</div>
                  </div>
                  <span>{openWeek === idx ? '▴' : '▾'}</span>
                </button>
                {openWeek === idx && (
                  <div className="week-body">
                    <p>📌 {w.focus}</p>
                    <p className="tip">💡 {w.tip}</p>
                    <div className="days">
                      {days.map((d) => {
                        const list = todos[d] || tasksFor(profile, d)
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
    </>
  )
}
