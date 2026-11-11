import { useState } from 'react'
import { useStore } from '../lib/store.js'
import { todayKey } from '../lib/date.js'
import { dayPicks, grammarName } from '../data/plan.js'
import Flashcards from './Flashcards.jsx'
import Practice from './Practice.jsx'
import Listening from './Listening.jsx'
import Vocab from './Vocab.jsx'
import Mascot from '../components/Mascot.jsx'

// One guided study session built from today's plan
export default function Session({ go }) {
  const { profile } = useStore()
  const picks = dayPicks(profile.startDate, todayKey())
  const steps = [
    { key: 'flash', label: '🃏 Flashcard', sub: '~5 phút' },
    { key: 'quiz', label: `🧠 ${grammarName(picks.topic)}`, sub: '8 câu thích ứng' },
    { key: 'listen', label: `🎧 ${picks.lesson.title}`, sub: '~6 phút' },
    { key: 'vocab', label: `📚 ${picks.family.words[0][0]}`, sub: 'word family' },
  ]
  const [i, setI] = useState(0)
  const next = () => setI((x) => x + 1)
  const done = i >= steps.length

  return (
    <div className="page">
      <div className="row between">
        <button className="btn sm" onClick={() => go('home')}>← Trang chính</button>
        <span className="muted small">Buổi học hôm nay</span>
      </div>
      <ol className="stepper">
        {steps.map((s, k) => (
          <li key={s.key} className={k < i ? 'done' : k === i ? 'now' : ''}><span className="dot">{k < i ? '✓' : k + 1}</span><span>{s.label}<small>{s.sub}</small></span></li>
        ))}
      </ol>
      {!done && (
        <div className="step-body">
          {steps[i].key === 'flash' && <Flashcards limit={12} onDone={next} />}
          {steps[i].key === 'quiz' && <Practice params={{ ref: picks.topic }} limit={8} onDone={next} />}
          {steps[i].key === 'listen' && <Listening params={{ ref: picks.lesson.id }} onDone={next} />}
          {steps[i].key === 'vocab' && <Vocab params={{ ref: picks.family.id }} onDone={next} />}
          <button className="link small skip" onClick={next}>Bỏ qua phần này →</button>
        </div>
      )}
      {done && (
        <div className="card center">
          <Mascot size={130} mood="cheer" className="bob" />
          <h2>Hoàn thành buổi học! 🎉</h2>
          <p>Các việc tương ứng trong to-do list đã được đánh dấu xong.</p>
          <button className="btn yellow" onClick={() => go('home')}>Về trang chính</button>
        </div>
      )}
    </div>
  )
}
