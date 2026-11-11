import { useEffect, useRef, useState } from 'react'
import { localLookup, translate, looksVietnamese } from '../lib/translate.js'
import { speak } from '../lib/speech.js'
import { setState } from '../lib/store.js'
import { uid, todayKey } from '../lib/date.js'

// Highlight any English text in the app → translate, pronounce, save
export default function SelectionPopup() {
  const [sel, setSel] = useState(null) // { text, x, y }
  const [result, setResult] = useState({ local: null, vi: '', loading: false, error: '' })
  const [saved, setSaved] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    let timer
    const onChange = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const s = window.getSelection()
        const text = s?.toString().trim()
        if (!text || text.length > 300 || !s.rangeCount) return
        const node = s.anchorNode?.parentElement
        if (node?.closest('input, textarea, .sel-popup, [data-noselect]')) return
        if (looksVietnamese(text) || !/[a-z]/i.test(text)) return
        const rect = s.getRangeAt(0).getBoundingClientRect()
        setSel({ text, x: rect.left + rect.width / 2, y: rect.bottom })
      }, 350)
    }
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setSel(null) }
    document.addEventListener('selectionchange', onChange)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('selectionchange', onChange); document.removeEventListener('pointerdown', onDown) }
  }, [])

  useEffect(() => {
    if (!sel) return
    setSaved(false)
    const local = localLookup(sel.text)
    setResult({ local, vi: '', loading: true, error: '' })
    let alive = true
    translate(sel.text)
      .then((vi) => alive && setResult((r) => ({ ...r, vi, loading: false })))
      .catch(() => alive && setResult((r) => ({ ...r, loading: false, error: 'Không có mạng để dịch' })))
    return () => { alive = false }
  }, [sel])

  if (!sel) return null
  const w = Math.min(320, window.innerWidth - 24)
  const left = Math.max(12, Math.min(sel.x - w / 2, window.innerWidth - w - 12))
  const top = Math.min(sel.y + 10, window.innerHeight - 220)
  const meaning = result.local ? `${result.local.vi} (${result.local.pos})` : result.vi

  const save = () => {
    setState((s) => ({ saved: [{ id: uid(), text: sel.text, meaning: meaning || '', date: todayKey(), box: 0, due: todayKey() }, ...s.saved] }))
    setSaved(true)
  }

  return (
    <div className="sel-popup" ref={boxRef} style={{ left, top, width: w }}>
      <div className="sel-text">{sel.text}</div>
      {result.local && <div className="sel-local">📗 {result.local.vi} <span className="pill">{result.local.pos}</span></div>}
      <div className="sel-vi">{result.loading ? 'Đang dịch…' : result.error || (result.vi && `🌐 ${result.vi}`)}</div>
      <div className="row gap-s">
        <button className="btn sm blue" onClick={() => speak(sel.text)}>🔊 Phát âm</button>
        <button className="btn sm" onClick={() => speak(sel.text, { rate: 0.7 })}>🐢 Chậm</button>
        <button className="btn sm yellow" onClick={save} disabled={saved}>{saved ? '✓ Đã lưu' : '⭐ Lưu'}</button>
      </div>
    </div>
  )
}
