export const pad = (n) => String(n).padStart(2, '0')
export const toKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d) }
export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)
export const todayKey = () => toKey(new Date())
export const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const weekKeys = (k = todayKey()) => {
  // Monday-first week containing k
  const d = fromKey(k); const dow = (d.getDay() + 6) % 7
  const monday = addDays(k, -dow)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
