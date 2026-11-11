import { getState, setState } from './store.js'
import { todayKey, uid } from './date.js'
import { tasksFor } from '../data/plan.js'
import { todayCurriculum } from './curriculum.js'

// A to-do belongs to the TOEIC area when it came from the study plan (auto)
// or was added on the TOEIC page; everything else is a personal to-do.
export const isToeic = (t) => !!(t.auto || t.toeic)

// Once a day: add today's TOEIC tasks (12-week plan + curriculum lessons)
export function ensureToeicToday() {
  const s = getState()
  const today = todayKey()
  if (s.toeicDay === today) return
  if ((s.todos[today] || []).some((t) => t.auto)) { setState({ toeicDay: today }); return }
  const auto = tasksFor(s.profile, today).map((t) => ({ ...t, id: uid(), done: false, auto: true }))
  const cur = todayCurriculum(s.profile, s.curri, today)
  if (cur.list.length) {
    auto.push({ id: uid(), done: false, auto: true, kind: 'curri', ref: 'curri', min: cur.list.length * 8, text: `📘 Khung kiến thức: ${cur.list.length} bài hôm nay` })
  }
  setState((st) => ({ toeicDay: today, todos: { ...st.todos, [today]: [...(st.todos[today] || []), ...auto] } }))
}
