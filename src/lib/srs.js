import { todayKey, addDays } from './date.js'

// Leitner boxes: higher box = learned better = reviewed less often
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30]
export const MASTERED_BOX = 5

export function review(card = { box: 0 }, grade) {
  // grade: 0 forgot, 1 hard, 2 good, 3 easy
  let box = card.box || 0
  if (grade === 0) box = 0
  else if (grade === 1) box = Math.max(1, box)
  else if (grade === 2) box = Math.min(6, box + 1)
  else box = Math.min(6, box + 2)
  const due = addDays(todayKey(), grade === 0 ? 0 : INTERVALS[box])
  return { ...card, box, due, seen: (card.seen || 0) + 1, lapses: (card.lapses || 0) + (grade === 0 ? 1 : 0), last: todayKey() }
}

export const isDue = (c) => !c?.due || c.due <= todayKey()
