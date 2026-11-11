import { useStore } from './store.js'
import { todayKey, addDays } from './date.js'

// Days in a row with any study activity or finished to-do
export function useStreak() {
  const { activity, todos } = useStore()
  const active = (k) => {
    const a = activity[k]
    const t = todos[k]
    return (a && (a.flash || a.listen || a.quiz || a.vocab)) || (t && t.some((x) => x.done))
  }
  let k = todayKey()
  if (!active(k)) k = addDays(k, -1)
  let n = 0
  while (active(k) && n < 400) { n++; k = addDays(k, -1) }
  return n
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
