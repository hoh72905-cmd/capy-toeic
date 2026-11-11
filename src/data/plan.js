import { diffDays, fromKey } from '../lib/date.js'
import { LESSONS } from './listening.js'
import { FAMILIES } from './vocab.js'
import { GRAMMAR } from './quiz.js'

// 12-week crash plan to TOEIC 800
export const WEEKS = [
  { n: 1, phase: 1, title: 'Làm quen đề & từ loại', target: 500, grammar: ['wordform', 'pronoun'], focus: 'Part 1–2: nghe từ khóa, phân biệt âm gần giống. Part 5: nhận diện vị trí từ loại.', tip: 'Học thuộc đuôi danh từ/tính từ/trạng từ — gỡ được 20% câu Part 5.' },
  { n: 2, phase: 1, title: 'Thì & hòa hợp chủ – vị', target: 520, grammar: ['tenses', 'sva'], focus: 'Part 2: bẫy câu hỏi Wh-, câu hỏi đuôi. Part 5: dấu hiệu thì.', tip: 'Gạch chân trạng từ thời gian trước khi nhìn đáp án.' },
  { n: 3, phase: 1, title: 'Giới từ & liên từ', target: 550, grammar: ['preposition', 'conjunction'], focus: 'Part 3: đọc câu hỏi trước khi nghe. Part 5: mệnh đề hay cụm danh từ.', tip: 'Despite/Although là cặp bẫy kinh điển — luôn xét phía sau.' },
  { n: 4, phase: 1, title: 'Ôn tập chặng 1 + bị động', target: 580, grammar: ['passive', 'wordform', 'tenses'], focus: 'Mini test Part 1–2–5. Ghi lỗi sai vào sổ tay.', tip: 'Cuối tuần: làm 1 đề rút gọn, tính điểm để biết chỗ yếu.' },
  { n: 5, phase: 2, title: 'Bị động & V-ing / to V', target: 610, grammar: ['passive', 'gerund'], focus: 'Part 3: hội thoại 3 người, câu hỏi ý định. Part 6: điền câu theo ngữ cảnh.', tip: 'Part 6: đọc cả câu trước và sau chỗ trống.' },
  { n: 6, phase: 2, title: 'Mệnh đề quan hệ & so sánh', target: 640, grammar: ['relative', 'comparison'], focus: 'Part 4: bài nói thông báo, quảng cáo. Part 7: email & thông báo ngắn.', tip: 'Part 7: đọc câu hỏi trước, tìm từ khóa (tên, số, ngày).' },
  { n: 7, phase: 2, title: 'Câu điều kiện & từ nối', target: 670, grammar: ['conditional', 'conjunction'], focus: 'Part 4: câu hỏi suy luận. Part 7: câu hỏi NOT/TRUE.', tip: 'Câu hỏi suy luận: đáp án thường là cách diễn đạt lại (paraphrase).' },
  { n: 8, phase: 2, title: 'Ôn tập chặng 2', target: 700, grammar: ['relative', 'passive', 'gerund', 'conditional'], focus: 'Đề rút gọn LC + RC. Rà lại flashcard ô thấp.', tip: 'Mục tiêu 700: Part 5 sai ≤ 5 câu.' },
  { n: 9, phase: 3, title: 'Tốc độ Part 5–6', target: 730, grammar: ['wordform', 'sva', 'preposition'], focus: 'Part 5: 30 câu trong 10 phút. Part 7: đoạn kép.', tip: 'Câu nào > 30 giây thì đánh dấu và đi tiếp.' },
  { n: 10, phase: 3, title: 'Part 7 đoạn kép/ba', target: 760, grammar: ['conjunction', 'relative', 'comparison'], focus: 'Part 7: liên kết thông tin giữa 2–3 văn bản.', tip: 'Câu hỏi về 2 văn bản thường cần ghép 1 chi tiết ở mỗi bài.' },
  { n: 11, phase: 3, title: 'Đề full & sửa lỗi', target: 780, grammar: ['tenses', 'passive', 'conditional', 'gerund'], focus: 'Làm full test 2 tiếng, sửa kỹ từng lỗi.', tip: 'Ghi vào sổ tay: lỗi sai – nguyên nhân – cách tránh.' },
  { n: 12, phase: 3, title: 'Về đích 800+', target: 800, grammar: ['wordform', 'relative', 'conjunction', 'pronoun'], focus: 'Ôn chỗ yếu, giữ nhịp, ngủ đủ trước ngày thi.', tip: 'Tuần cuối không học dồn — ôn flashcard và làm đề nhẹ.' },
]

export const PHASES = {
  1: { name: 'Chặng 1 · Nền tảng', color: 'var(--yellow)' },
  2: { name: 'Chặng 2 · Kỹ năng', color: 'var(--blue)' },
  3: { name: 'Chặng 3 · Tăng tốc', color: 'var(--pink)' },
}

export const grammarName = (id) => GRAMMAR.find((g) => g.id === id)?.name || id

export function planInfo(startDate, date) {
  const d = Math.max(0, diffDays(startDate, date))
  const weekIdx = Math.min(11, Math.floor(d / 7))
  return { dayIndex: d, week: WEEKS[weekIdx], weekIdx, dayInWeek: d % 7, finished: d >= 84 }
}

// Lesson / topic / family suggested for a given day of the plan
export function dayPicks(startDate, date) {
  const { dayIndex, week } = planInfo(startDate, date)
  const maxLevel = week.phase
  const pool = LESSONS.filter((l) => l.level <= maxLevel + 1)
  const lesson = pool[dayIndex % pool.length]
  const topic = week.grammar[dayIndex % week.grammar.length]
  const family = FAMILIES[dayIndex % FAMILIES.length]
  return { lesson, topic, family }
}

export function tasksFor(startDate, date) {
  const { week, dayInWeek } = planInfo(startDate, date)
  const { lesson, topic, family } = dayPicks(startDate, date)
  const dow = fromKey(date).getDay() // 0 = Sunday
  if (dow === 0) {
    return [
      { text: '🔁 Ôn lại flashcard đến hạn', kind: 'flash', min: 10 },
      { text: `🧠 Ôn chủ điểm yếu nhất tuần (${grammarName(topic)})`, kind: 'quiz', min: 10 },
      { text: week.phase === 3 ? '📝 Làm 1 đề full 2 tiếng + chữa lỗi' : '📝 Làm 1 đề rút gọn (50 câu)', kind: 'custom', min: week.phase === 3 ? 120 : 40 },
      { text: '📒 Xem lại sổ tay lỗi sai của tuần', kind: 'custom', min: 10 },
    ]
  }
  const list = [
    { text: '🃏 Flashcard: ôn từ đến hạn + từ mới', kind: 'flash', min: 10 },
    { text: `🎧 Nghe chép: ${lesson.title}`, kind: 'listen', min: 6, ref: lesson.id },
    { text: `🧠 Ngữ pháp: ${grammarName(topic)} (luyện thích ứng)`, kind: 'quiz', min: 10, ref: topic },
    { text: `📚 Word family: ${family.words[0][0]}`, kind: 'vocab', min: 5, ref: family.id },
  ]
  if ([1, 3, 5].includes(dow)) list.push({ text: '📖 Đọc Part 7: 1–2 đoạn (bấm giờ)', kind: 'custom', min: 10 })
  if ([2, 4].includes(dow)) list.push({ text: '🎧 Nghe Part 3–4 trên đề thật (1 bộ)', kind: 'custom', min: 10 })
  if (dow === 6) list.push({ text: week.phase === 1 ? '📝 Mini test 30 câu Part 5' : '📝 Mini test Part 5–6 bấm giờ', kind: 'custom', min: 15 })
  void dayInWeek
  return list
}
