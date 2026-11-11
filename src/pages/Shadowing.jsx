import { useEffect, useRef, useState } from 'react'
import { LESSONS } from '../data/listening.js'
import { useStore, setState, logActivity } from '../lib/store.js'
import { speak, stopSpeak, useSpeaking, soundHint } from '../lib/speech.js'
import { dailyPlan, nextItems } from '../lib/course.js'
import { todayKey } from '../lib/date.js'
import { ACCENT_NAME, diffWords } from './Listening.jsx'
import Mascot from '../components/Mascot.jsx'

// Speech recognition exists in Chrome / Edge / Safari; not inside the Android app's web view
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function useRecorder() {
  const [rec, setRec] = useState(null) // MediaRecorder while recording
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState('')
  const start = async () => {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks = []
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' })) })
        setRec(null)
      }
      r.start()
      setRec(r)
    } catch (e) {
      setErr(e?.name === 'NotAllowedError'
        ? 'Chưa được phép dùng micro. Cho phép micro cho trang này (biểu tượng ổ khóa trên thanh địa chỉ) rồi thử lại. Trên app Android: cần bản APK mới.'
        : 'Không mở được micro trên thiết bị này.')
    }
  }
  const stop = () => rec?.state === 'recording' && rec.stop()
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  return { recording: !!rec, url, err, start, stop, reset: () => setUrl(null) }
}

function Player({ lesson, onBack }) {
  const { shadow } = useStore()
  const [idx, setIdx] = useState(0)
  const [rate, setRate] = useState(1)
  const [showText, setShowText] = useState(true)
  const [showVi, setShowVi] = useState(false)
  const [hint, setHint] = useState('')
  const [looping, setLooping] = useState(false)
  const [heard, setHeard] = useState(null) // { words, score }
  const [listening, setListening] = useState(false)
  const loopRef = useRef(false)
  const recRef = useRef(null)
  const mic = useRecorder()
  const myAudio = useRef(null)
  const speaking = useSpeaking()
  const [en, vi] = lesson.s[idx]
  const key = `L:${lesson.id}:${idx}`
  const done = shadow[lesson.id]

  const play = async () => {
    const r = await speak(en, { accent: lesson.accent, rate, key })
    setHint(r.ok || r.reason === 'stopped' ? '' : soundHint(r.reason))
    return r
  }
  // Shadowing: the sentence plays 3 times with a pause, speak along with it
  const loop = async () => {
    if (looping) { loopRef.current = false; setLooping(false); stopSpeak(); return }
    loopRef.current = true; setLooping(true)
    for (let k = 0; k < 3 && loopRef.current; k++) {
      const r = await play()
      if (!r.ok) break
      await sleep(900 + en.split(' ').length * 120)
    }
    loopRef.current = false; setLooping(false)
  }
  // Pronunciation check with speech recognition (browser)
  const check = () => {
    if (listening) { recRef.current?.stop(); return }
    const r = new Recognition()
    r.lang = lesson.accent === 'uk' ? 'en-GB' : lesson.accent === 'au' ? 'en-AU' : 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => {
      const said = e.results[0][0].transcript
      const words = diffWords(en, said)
      setHeard({ said, words, score: Math.round((words.filter((w) => w.ok).length / words.length) * 100) })
    }
    r.onerror = (e) => setHint(e.error === 'not-allowed' ? 'Chưa được phép dùng micro cho trang này.' : e.error === 'no-speech' ? 'Không nghe thấy gì — nói to và gần micro hơn nhé.' : '')
    r.onend = () => setListening(false)
    recRef.current = r
    setHeard(null); setHint('')
    stopSpeak()
    r.start()
    setListening(true)
  }
  const compare = async () => {
    await play()
    await sleep(400)
    myAudio.current?.play()
  }
  const go = (n) => {
    loopRef.current = false; setLooping(false); stopSpeak(); mic.stop(); mic.reset(); setHeard(null); setHint('')
    setIdx(n)
  }
  const finish = () => {
    if (!done) {
      setState((s) => ({ shadow: { ...s.shadow, [lesson.id]: todayKey() } }))
      logActivity('shadow', 1, 8)
    }
    onBack()
  }
  useEffect(() => () => { loopRef.current = false; stopSpeak() }, [])

  return (
    <div className="page shadowing">
      <div className="row between wrap gap-s">
        <button className="btn sm" onClick={onBack}>← Danh sách</button>
        <span className="pill">{lesson.scene} {lesson.title}</span>
        <span className="muted small">Câu {idx + 1}/{lesson.s.length} · {ACCENT_NAME[lesson.accent]}</span>
      </div>
      <div className="progress"><div style={{ width: `${((idx + 1) / lesson.s.length) * 100}%` }} /></div>

      <div className="card shadow-card">
        <div className="row between wrap gap-s">
          <div className="seg">
            {[0.8, 1, 1.15].map((r) => <button key={r} className={rate === r ? 'on' : ''} onClick={() => setRate(r)}>{r === 1 ? 'Thường' : r < 1 ? '🐢 Chậm' : '🐇 Nhanh'}</button>)}
          </div>
          <div className="row gap-s small">
            <label className="row gap-s"><input type="checkbox" style={{ width: 'auto' }} checked={showText} onChange={(e) => setShowText(e.target.checked)} /> Hiện câu</label>
            <label className="row gap-s"><input type="checkbox" style={{ width: 'auto' }} checked={showVi} onChange={(e) => setShowVi(e.target.checked)} /> Nghĩa</label>
          </div>
        </div>
        <p className={`shadow-text ${showText ? '' : 'hidden-text'}`}>
          {heard ? heard.words.map((w, i) => <span key={i} className={w.ok ? 'w-ok' : 'w-miss'}>{w.w} </span>) : en}
        </p>
        {showVi && vi && <p className="muted">{vi}</p>}

        <div className="shadow-actions">
          <button className="btn blue" onClick={() => (speaking === key ? stopSpeak() : play())}>{speaking === key ? '⏹ Dừng' : '▶ Nghe câu'}</button>
          <button className={`btn ${looping ? 'pink' : 'yellow'}`} onClick={loop}>{looping ? '⏹ Dừng lặp' : '🔁 Nói đuổi theo (×3)'}</button>
          {!mic.recording
            ? <button className="btn" onClick={mic.start}>🎙️ Ghi âm giọng mình</button>
            : <button className="btn pink rec" onClick={mic.stop}>⏺ Đang ghi… bấm để dừng</button>}
          {Recognition && <button className={`btn ${listening ? 'pink' : ''}`} onClick={check}>{listening ? '👂 Đang nghe… (bấm để dừng)' : '🗣️ Chấm phát âm'}</button>}
        </div>
        {mic.url && (
          <div className="my-voice">
            <span className="small"><b>Giọng của bạn:</b></span>
            <audio ref={myAudio} src={mic.url} controls />
            <button className="btn sm blue" onClick={compare}>🎧 So sánh: mẫu → của mình</button>
          </div>
        )}
        {heard && <p className={heard.score >= 80 ? 'ok-box small' : 'cause small'}>Máy nghe được: "<i>{heard.said}</i>" — khớp {heard.score}%. {heard.score >= 80 ? 'Rất tốt!' : 'Từ màu hồng là từ chưa rõ: nghe lại và nói chậm, rõ từng từ.'}</p>}
        {(hint || mic.err) && <p className="cause small">{hint || mic.err}</p>}
      </div>

      <div className="row between">
        <button className="btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← Câu trước</button>
        {idx < lesson.s.length - 1
          ? <button className="btn yellow" onClick={() => go(idx + 1)}>Câu tiếp ➜</button>
          : <button className="btn yellow" onClick={finish}>✅ Hoàn thành bài</button>}
      </div>
      <div className="card tint-blue small">
        <b>Cách shadowing hiệu quả:</b>
        <ol>
          <li>Nghe câu 1–2 lần, đọc nghĩa nếu chưa hiểu.</li>
          <li>Bấm <b>Nói đuổi theo</b>: nói cùng lúc với giọng mẫu, chậm hơn nửa nhịp, bắt chước ngữ điệu và chỗ nối âm.</li>
          <li>Tắt "Hiện câu", nói lại chỉ bằng tai.</li>
          <li>Ghi âm giọng mình rồi bấm <b>So sánh</b> để nghe khác biệt.</li>
        </ol>
      </div>
    </div>
  )
}

export default function Shadowing({ params }) {
  const store = useStore()
  const { shadow } = store
  const [current, setCurrent] = useState(() => LESSONS.find((l) => l.id === params?.ref) || null)
  const [filter, setFilter] = useState('toeic')
  const plan = dailyPlan(store).shadow
  const today = nextItems(store, 'shadow')
  if (current) return <Player key={current.id} lesson={current} onBack={() => setCurrent(null)} />

  const list = LESSONS.filter((l) => (filter === 'toeic' ? !l.tatoeba : l.tatoeba))
  const Card = ({ l }) => (
    <button className="card lesson-card" onClick={() => setCurrent(l)}>
      <span className="lesson-scene">{l.scene}</span>
      <div>
        <b>{l.title}</b>
        <p className="muted small">{l.part} · {ACCENT_NAME[l.accent]} · {l.s.length} câu</p>
        <div className="row gap-s"><span className="pill">{'⭐'.repeat(l.level || 1)}</span>{shadow[l.id] && <span className="pill green">✓ Đã luyện</span>}</div>
      </div>
    </button>
  )
  return (
    <div className="page">
      <div className="page-head">
        <h1>🗣️ Shadowing — nói đuổi theo</h1>
        <p className="muted">Nghe câu mẫu rồi nói theo ngay, bắt chước ngữ điệu, trọng âm và nối âm. Luyện đều mỗi ngày giúp nghe nhanh hơn và phát âm tự nhiên hơn. Có giọng Mỹ 🇺🇸, Canada 🇨🇦, Anh 🇬🇧 và Úc 🇦🇺 như trong đề thi.</p>
        <div className="day-goal"><span>🎯 Hôm nay: <b>{plan.doneToday}/{plan.goal}</b> bài · đã luyện {plan.learned}/{plan.total} bài trong lộ trình</span></div>
      </div>
      {today.length > 0 && <>
        <h2 className="section-title">⭐ Bài của hôm nay</h2>
        <div className="lesson-grid">{today.map((l) => <Card key={l.id} l={l} />)}</div>
      </>}
      <div className="seg">
        <button className={filter === 'toeic' ? 'on' : ''} onClick={() => setFilter('toeic')}>🎓 Câu kiểu đề TOEIC</button>
        <button className={filter === 'daily' ? 'on' : ''} onClick={() => setFilter('daily')}>💬 Câu thông dụng</button>
      </div>
      <div className="lesson-grid">{list.map((l) => <Card key={l.id} l={l} />)}</div>
      {!list.length && <Mascot />}
    </div>
  )
}
