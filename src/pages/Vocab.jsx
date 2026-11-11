import { useMemo, useState } from 'react'
import { FAMILIES, TOPICS } from '../data/vocab.js'
import { setState, useStore, logActivity } from '../lib/store.js'
import { uid, todayKey } from '../lib/date.js'
import Speak from '../components/Speak.jsx'

export default function Vocab({ params, onDone }) {
  const topicRef = params?.ref?.startsWith('t:') ? params.ref.slice(2) : null
  const [topic, setTopic] = useState(topicRef || 'all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(topicRef ? null : params?.ref || null)
  const list = useMemo(() => FAMILIES.filter((f) =>
    (topic === 'all' || f.topic === topic)
    && (!q || f.words.some(([w, , vi]) => w.includes(q.toLowerCase()) || vi.toLowerCase().includes(q.toLowerCase())))), [topic, q])

  if (onDone) {
    const fam = FAMILIES.find((f) => f.id === params?.ref) || FAMILIES[0]
    return (
      <div>
        <FamilyCard f={fam} open />
        <button className="btn yellow wide" onClick={() => { logActivity('vocab'); onDone() }}>Đã học xong ➜</button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>📚 Từ vựng theo word family</h1>
        <p className="muted">Mỗi họ từ có đủ dạng N / V / Adj / Adv, từ đồng nghĩa (≈), trái nghĩa (≠) và câu ví dụ có mệnh đề. <b>Bôi đen</b> bất kỳ chữ tiếng Anh nào để dịch & nghe phát âm.</p>
        <input placeholder="🔎 Tìm từ (tiếng Anh hoặc tiếng Việt)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {['all', ...TOPICS].map((t) => <button key={t} className={`chip ${topic === t ? 'on' : ''}`} onClick={() => setTopic(t)}>{t === 'all' ? 'Tất cả' : t}</button>)}
        </div>
      </div>
      <div className="family-list">
        {list.map((f) => <FamilyCard key={f.id} f={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />)}
      </div>
    </div>
  )
}

function FamilyCard({ f, open, onToggle }) {
  const { saved } = useStore()
  const isSaved = (w) => saved.some((s) => s.text === w)
  const save = (w, vi) => {
    if (isSaved(w)) return
    setState((s) => ({ saved: [{ id: uid(), text: w, meaning: vi, date: todayKey(), box: 0, due: todayKey() }, ...s.saved] }))
  }
  return (
    <div className={`card family ${open ? 'open' : ''}`}>
      <button className="family-head" onClick={onToggle}>
        <div>
          <b className="fam-word">{f.words[0][0]}</b> <span className="muted">{f.ipa}</span>
          <div className="muted small">{f.words.map((w) => w[0]).join(' · ')}</div>
        </div>
        <span className="pill">{f.topic}</span>
      </button>
      {open && (
        <div className="family-body">
          <table className="words">
            <tbody>
              {f.words.map(([w, pos, vi]) => (
                <tr key={w}>
                  <td><b>{w}</b></td>
                  <td><span className="pill blue">{pos}</span></td>
                  <td>{vi}</td>
                  <td className="nowrap">
                    <Speak text={w} small />
                    <button className="icon-btn sm" title="Lưu vào sổ tay" onClick={() => save(w, vi)}>{isSaved(w) ? '⭐' : '☆'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="syn-ant">
            <div><b>≈ Đồng nghĩa:</b> {f.syn.map((s) => <span key={s} className="chip word-chip">{s} <Speak text={s} small /></span>)}</div>
            <div><b>≠ Trái nghĩa:</b> {f.ant.length ? f.ant.map((s) => <span key={s} className="chip pink word-chip">{s} <Speak text={s} small /></span>) : '—'}</div>
          </div>
          <div className="examples">
            {f.ex.map(([en, vi]) => (
              <div className="example" key={en}>
                <p className="en">{en} <Speak text={en} small /></p>
                <p className="vi">{vi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
