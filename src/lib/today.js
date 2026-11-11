import { getState, setState } from './store.js'
import { todayKey } from './date.js'
import { dayPicks } from '../data/plan.js'
import { todayCurriculum } from './curriculum.js'
import { dailyPlan, nextItems } from './course.js'

// A to-do belongs to the TOEIC area when it came from the study plan (auto)
// or was added on the TOEIC page; everything else is a personal to-do.
export const isToeic = (t) => !!(t.auto || t.toeic)

// The day's study tasks, sized by the course (lib/course.js): new words, Part 5, Part 6/7,
// dictation and shadowing. goalKey/goal: the task ticks itself only when the amount is done.
export function planTasks(state, date) {
  const p = dailyPlan(state, date)
  const { family } = dayPicks(state.profile, date)
  const list = []
  if (p.words.goal) list.push({ text: `🃏 Flashcard: ${p.words.goal} từ mới + ôn thẻ đến hạn`, kind: 'flash', goalKey: 'words', goal: p.words.goal, min: Math.max(5, Math.round(p.words.goal * 0.5)) })
  const p5 = p.part5.goal || p.part5.review
  if (p5) list.push({ text: `🧠 Part 5: ${p5} câu ngữ pháp & từ vựng${p.part5.goal ? '' : ' (ôn câu sai)'}`, kind: 'quiz', goalKey: 'part5', goal: p5, min: Math.round(p5 * 0.8) })
  if (p.part6.goal) list.push({ text: `📄 Part 6: ${p.part6.goal} đoạn văn điền từ`, kind: 'read6', goalKey: 'part6', goal: p.part6.goal, ref: 'p6', min: 8 * p.part6.goal })
  if (p.part7.goal) list.push({ text: `📰 Part 7: ${p.part7.goal} bài đọc hiểu`, kind: 'read7', goalKey: 'part7', goal: p.part7.goal, ref: 'p7', min: 10 * p.part7.goal })
  if (p.listen.goal) {
    const next = nextItems(state, 'listen', date)[0]
    list.push({ text: `🎧 Nghe chép: ${p.listen.goal} bài${next ? ` (${next.title})` : ''}`, kind: 'listen', goalKey: 'listen', goal: p.listen.goal, ref: next?.id, min: 6 * p.listen.goal })
  }
  if (p.shadow.goal) list.push({ text: `🗣️ Shadowing: ${p.shadow.goal} bài nói đuổi theo`, kind: 'shadow', goalKey: 'shadow', goal: p.shadow.goal, min: 8 * p.shadow.goal })
  list.push({ text: `📚 Word family: ${family.words[0][0]}`, kind: 'vocab', min: 5, ref: family.id })
  return list
}

const TASK_VERSION = 2 // tasks sized by the course (older versions had fixed tasks)

// Once a day: add today's TOEIC tasks (course + curriculum lessons)
export function ensureToeicToday() {
  const s = getState()
  const today = todayKey()
  const list = s.todos[today] || []
  const old = list.filter((t) => t.auto && t.kind !== 'curri' && t.v !== TASK_VERSION)
  if (s.toeicDay === today && !old.length) return
  if (list.some((t) => t.auto && t.v === TASK_VERSION)) { setState({ toeicDay: today }); return }
  if (old.length) {
    // Made by an older version today: swap the unfinished ones for the new course tasks
    setState((st) => ({ todos: { ...st.todos, [today]: (st.todos[today] || []).filter((t) => !(t.auto && t.kind !== 'curri' && t.v !== TASK_VERSION && !t.done)) } }))
  }
  // Same ids on every device (web + app), so syncing never duplicates them
  const auto = planTasks(getState(), today).map((t, i) => ({ ...t, id: `auto-${today}-v${TASK_VERSION}-${i}`, v: TASK_VERSION, ts: i, done: false, auto: true }))
  if (old.length || list.some((t) => t.id === `auto-${today}-curri`)) {
    setState((st) => ({ toeicDay: today, todos: { ...st.todos, [today]: [...(st.todos[today] || []), ...auto] } }))
    return
  }
  const cur = todayCurriculum(s.profile, s.curri, today)
  if (cur.list.length) {
    auto.push({ id: `auto-${today}-curri`, ts: 50, done: false, auto: true, kind: 'curri', ref: 'curri', min: cur.list.length * 8, text: `📘 Khung kiến thức: ${cur.list.length} bài hôm nay` })
  }
  setState((st) => ({ toeicDay: today, todos: { ...st.todos, [today]: [...(st.todos[today] || []), ...auto] } }))
}
