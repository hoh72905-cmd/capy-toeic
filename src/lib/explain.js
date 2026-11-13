// Grading "Diễn đạt ý" (say it in your own words). There is no single right answer, so the score
// looks at what a teacher would: did you get the key ideas across, did you link them (because, so,
// however…), and did you say enough for your level. Runs live while the learner types.

const VI_CHARS = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i
// Linking words and phrases, from simple to advanced
const CONNECT = [
  'because', 'so', 'but', 'then', 'also', 'first', 'finally', 'after that', 'for example', 'for instance', 'if', 'when',
  'since', 'however', 'although', 'though', 'instead', 'otherwise', 'unless', 'while', 'whereas', "that's why", 'as a result',
  'on the other hand', 'therefore', 'moreover', 'in my view', 'i think', 'i believe', 'overall', 'ultimately', 'which means', 'so that',
  'where', 'who', 'until', 'yet', 'rather than', 'such as',
]
export const TARGET_WORDS = [12, 20, 30, 40, 50, 60]
export const TARGET_LINKS = [1, 1, 2, 2, 3, 3]

const norm = (t) => ` ${t.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9%' -]+/g, ' ').replace(/\s+/g, ' ').trim()} `

function has(text, words, kw) {
  if (/[ -]/.test(kw)) return text.includes(` ${kw}`)
  if (kw.length <= 3) return words.includes(kw)
  return words.some((w) => w.startsWith(kw))
}

/** Analyse an answer to an explain prompt. Returns the score (0–1), verdict and what is missing. */
export function gradeExplain(answer, prompt) {
  const text = norm(answer)
  const words = text.trim().split(' ').filter(Boolean)
  const vi = VI_CHARS.test(answer)
  const ideas = prompt.ideas.map((it) => ({ label: it.label, ok: it.kw.some((k) => has(text, words, k)) }))
  const links = CONNECT.filter((c) => has(text, words, c))
  // Explaining a word is short by nature: a good definition is one or two sentences
  const target = prompt.kind === 'word' ? Math.round(TARGET_WORDS[prompt.lv] * 0.5) : TARGET_WORDS[prompt.lv]
  const need = prompt.kind === 'word' ? 1 : TARGET_LINKS[prompt.lv]
  const banned = !!prompt.ban && prompt.ban.split('|').some((k) => has(text, words, k))
  const ideaPart = ideas.filter((i) => i.ok).length / ideas.length
  let score = 0.65 * ideaPart + 0.2 * Math.min(1, words.length / target) + 0.15 * Math.min(1, links.length / need)
  if (banned) score = Math.min(score * 0.6, 0.7)
  if (ideaPart === 0) score = Math.min(score, 0.2) // long but off-topic is not an explanation
  if (vi || !words.length) score = 0
  const verdict = score >= 0.8 ? 'right' : score >= 0.55 ? 'close' : 'wrong'
  return { score, verdict, ideas, words: words.length, target, links, need, banned, vi }
}

// Sentence starters for each kind of task, by level band
const FRAMES = {
  sit: [
    ["I'm calling because…", 'First, … Then, …', 'The problem is that…', 'Could you…?', "I'm sorry, but…"],
    ['The main reason is that…', "What I'd suggest is…", 'To be honest, …', 'As a result, …', 'Would it be possible to…?'],
    ["I'd like to be upfront about…", 'What this means for us is…', 'Looking ahead, …', 'The bottom line is…', "I'm confident that…"],
  ],
  word: [
    ["It's a thing you use to…", "It's a place where…", "It's a person who…", 'You need it when…'],
    ["It's a kind of… that…", "It's like a… but…", 'You usually find it…', 'People use it to…'],
    ["It's the feeling you get when…", 'It describes a situation where…', "It's when someone…", 'A good example would be…'],
  ],
  opinion: [
    ['I think… because…', 'For example, …', 'I like… more than…', 'But…'],
    ['In my opinion, …', 'On the other hand, …', 'The main advantage is…', 'Overall, …'],
    ["While it's true that…, …", 'It largely depends on…', "I'd argue that…", 'Ultimately, …'],
  ],
}
export const framesFor = (p) => FRAMES[p.kind][p.lv < 2 ? 0 : p.lv < 4 ? 1 : 2]
export const KIND_NAME = { sit: '🧭 Xử lý tình huống', word: '🔎 Giải thích từ (không được nói từ đó)', opinion: '💭 Nêu quan điểm' }
