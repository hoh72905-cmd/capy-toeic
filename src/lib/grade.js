// Grading a free English answer against several accepted answers.
// One idea can be said in many ways, so the answer is compared with EVERY accepted sentence,
// after making equivalent forms equal: contractions, US/UK spelling, numbers, common synonyms.

const CONTRACTIONS = [
  [/\bcan't\b|\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'], [/\blet's\b/g, 'let us'],
  [/\bain't\b/g, 'is not'], [/n't\b/g, ' not'], [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'ll\b/g, ' will'], [/'m\b/g, ' am'],
  [/\b(he|she|it|that|what|there|here|who|where|how|this|everything|nothing|someone|somebody)'s\b/g, '$1 is'],
  [/\b(i|you|we|they|he|she|it)'d\b/g, '$1 would'], [/'s\b/g, ' s'], [/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'],
  [/\bgotta\b/g, 'have to'], [/\bok(ay)?\b/g, 'ok'], [/\balright\b/g, 'all right'],
]
const SPELLING = {
  colour: 'color', favourite: 'favorite', favour: 'favor', centre: 'center', theatre: 'theater', metre: 'meter', litre: 'liter',
  realise: 'realize', realised: 'realized', organise: 'organize', organised: 'organized', apologise: 'apologize', recognise: 'recognize',
  travelling: 'traveling', travelled: 'traveled', cancelled: 'canceled', neighbour: 'neighbor', behaviour: 'behavior', honour: 'honor',
  grey: 'gray', programme: 'program', cheque: 'check', jewellery: 'jewelry', mum: 'mom', practise: 'practice', defence: 'defense',
}
// Words that are interchangeable in everyday sentences
const SYNONYMS = {
  film: 'movie', movies: 'movie', films: 'movie', large: 'big', huge: 'big', begin: 'start', began: 'started', begun: 'started',
  purchase: 'buy', purchased: 'bought', shop: 'store', shops: 'stores', holiday: 'vacation', autumn: 'fall', lorry: 'truck', flat: 'apartment',
  pupil: 'student', pupils: 'students', kid: 'child', kids: 'children', mother: 'mom', father: 'dad', papa: 'dad', mama: 'mom',
  happy: 'glad', glad: 'glad', sick: 'ill', ill: 'ill', small: 'little', little: 'little', quick: 'fast', quickly: 'fast',
  automobile: 'car', taxi: 'cab', underground: 'subway', toilet: 'restroom', bathroom: 'restroom', telephone: 'phone',
  couch: 'sofa', sweets: 'candy', biscuit: 'cookie', biscuits: 'cookies', presently: 'now', also: 'too',
  perhaps: 'maybe', certainly: 'sure', near: 'close', till: 'until', amongst: 'among', whilst: 'while', got: 'got', gotten: 'got',
  receive: 'get', received: 'got', obtain: 'get', reply: 'answer', replied: 'answered', speak: 'talk', spoke: 'talked',
}
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
// Little words whose absence rarely changes the meaning (weigh less)
const LIGHT = new Set(['a', 'an', 'the', 'that', 'very', 'really', 'so', 'just', 'please', 'well', 'oh', 'um', 'too', 'quite'])

export function tokens(s) {
  let t = ` ${String(s).toLowerCase().replace(/[’‘`]/g, "'")} `
  for (const [re, to] of CONTRACTIONS) t = t.replace(re, to)
  t = t.replace(/(\d+)/g, (m) => (Number(m) <= 20 ? NUMBERS[Number(m)] : m))
  return t.replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '').split(/\s+/).filter(Boolean)
    .map((w) => SPELLING[w] || w).map((w) => SYNONYMS[w] || w)
}

// Longest common subsequence of two token lists, with which tokens matched
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Float32Array(b.length + 1))
  const wt = (w) => (LIGHT.has(w) ? 0.3 : 1)
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + wt(a[i]) : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const okA = Array(a.length).fill(false), okB = Array(b.length).fill(false)
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { okA[i] = okB[j] = true; i++; j++ } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++
  }
  return { score: dp[0][0], okA, okB }
}
const weight = (list) => list.reduce((s, w) => s + (LIGHT.has(w) ? 0.3 : 1), 0)

/**
 * Grade an answer. refs: accepted English sentences.
 * Returns { score 0–1, verdict: 'right' | 'close' | 'wrong', best: the closest accepted sentence,
 *           missing: words of that sentence not in the answer, extra: words of the answer not in it }
 */
export function grade(answer, refs) {
  const a = tokens(answer)
  if (!a.length) return { score: 0, verdict: 'wrong', best: refs[0], missing: [], extra: [] }
  let best = null
  for (const ref of refs) {
    const r = tokens(ref)
    const m = lcs(a, r)
    const p = m.score / Math.max(0.3, weight(a)), rec = m.score / Math.max(0.3, weight(r))
    const f = p + rec ? (2 * p * rec) / (p + rec) : 0
    if (!best || f > best.score) {
      best = { score: f, ref, missing: r.filter((w, k) => !m.okB[k] && !LIGHT.has(w)), extra: a.filter((w, k) => !m.okA[k] && !LIGHT.has(w)) }
    }
  }
  const s = best.score
  const verdict = s >= 0.9 && best.missing.length === 0 ? 'right' : s >= 0.72 ? 'close' : 'wrong'
  return { score: Math.round(s * 100) / 100, verdict, best: best.ref, missing: best.missing, extra: best.extra }
}
