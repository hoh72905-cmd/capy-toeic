import { todayKey, addDays } from './date.js'
import { INTERVALS } from './srs.js'

// Per-topic learner state:
// level 1–3, streak (correct in a row), wrongs (recent misses),
// mode: normal | apply (applied business context) | guided (step-by-step practice),
// theoryOK: passed the theory check, box: review spacing (higher = less often)
export const freshTopic = () => ({ level: 1, streak: 0, wrongs: 0, mode: 'normal', theoryOK: null, box: 0, due: todayKey(), attempts: 0, correct: 0 })

export function pickQuestion(topic, st, seen) {
  let pool
  if (st.mode === 'apply') pool = topic.qs.filter((q) => q.t === 'a')
  else if (st.mode === 'guided') pool = topic.qs.filter((q) => q.t === 'p' && q.lv <= Math.max(2, st.level))
  else pool = topic.qs.filter((q) => q.t === 'p' && q.lv === st.level)
  if (!pool.length) pool = topic.qs
  const fresh = pool.filter((q) => !seen.has(q))
  const list = fresh.length ? fresh : pool
  return list[Math.floor(Math.random() * list.length)]
}

// Apply the rules after an answer. Returns { st, events, next }
// next: 'question' | 'theory'
export function afterAnswer(st, isCorrect) {
  const s = { ...st, attempts: st.attempts + 1 }
  const events = []
  let next = 'question'
  if (isCorrect) {
    s.correct += 1
    s.streak += 1
    s.wrongs = Math.max(0, s.wrongs - 1)
    events.push('correct')
    if (s.mode === 'guided' && s.streak >= 2) { s.mode = 'normal'; events.push('levelUp') }
    else if (s.streak >= 2 && s.mode === 'normal' && s.level < 3) { s.level += 1; s.streak = 0; events.push('levelUp') }
    else if (s.streak >= 2 && s.mode === 'normal' && s.level >= 3) { s.mode = 'apply'; s.streak = 0; events.push('toApply') }
    else if (s.mode === 'apply' && s.streak >= 2) {
      s.box = Math.min(6, s.box + 1)
      s.streak = 0
      events.push('mastered')
    }
  } else {
    s.streak = 0
    s.wrongs += 1
    s.box = Math.max(0, s.box - 1)
    events.push('wrong')
    if (s.wrongs >= 3) {
      events.push('foundation')
      s.wrongs = 0
      s.level = Math.max(1, s.level - 1)
      s.mode = 'normal'
      s.theoryOK = null
      next = 'theory'
    } else if (s.theoryOK) {
      if (s.mode !== 'guided') events.push('guided')
      s.mode = 'guided'
    } else if (s.mode === 'apply') {
      s.mode = 'normal'
    }
  }
  s.due = addDays(todayKey(), INTERVALS[s.box])
  return { st: s, events, next }
}

export const masteryLabel = (box = 0) => ['Mới', 'Đang học', 'Khá', 'Tốt', 'Vững', 'Thành thạo', 'Thành thạo+'][box]
