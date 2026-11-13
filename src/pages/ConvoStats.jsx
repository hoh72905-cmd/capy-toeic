// Giao tiếp statistics: how much, how well, how fast, and what is sticking.
import { useMemo } from 'react'
import { useStore } from '../lib/store.js'
import { convoStats, TYPE_NAME } from '../lib/convoStats.js'
import { CEFR, CEFR_VI, STAGES, MIN_PER_DAY } from '../lib/convo.js'
import { fromKey } from '../lib/date.js'
import { BarChart, LineChart, StackBar } from '../components/Charts.jsx'
import Speak from '../components/Speak.jsx'

const RAMP = ['#a6d4f7', '#4aa3ea', '#1b6fcf', '#0b3f86'] // Mới gặp → Thuộc lòng (light → dark)
const dm = (k) => { const d = fromKey(k); return `${d.getDate()}/${d.getMonth() + 1}` }
const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`)
const sec = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`)

// Change vs the period before. better: 'up' (more is better) or 'down' (less is better, e.g. time)
function Delta({ now, before, better = 'up', fmt = (v) => v, unit = '' }) {
  if (now == null || before == null || before === 0) return <small className="delta flat">chưa có kỳ trước để so</small>
  const diff = now - before
  if (Math.abs(diff) < 1e-9) return <small className="delta flat">= như tuần trước</small>
  const good = better === 'up' ? diff > 0 : diff < 0
  return <small className={`delta ${good ? 'good' : 'bad'}`}>{diff > 0 ? '▲' : '▼'} {fmt(Math.abs(diff))}{unit} so với tuần trước {good ? '👍' : ''}</small>
}

function Tile({ icon, label, value, children, tone = '' }) {
  return (
    <div className={`stat-tile ${tone}`}>
      <span className="st-icon">{icon}</span>
      <span className="st-label">{label}</span>
      <b className="st-value">{value}</b>
      {children}
    </div>
  )
}

export default function ConvoStats({ D, onBack, onPractice }) {
  const store = useStore()
  const S = useMemo(() => convoStats(store), [store])
  const byId = useMemo(() => new Map(D.tr.map((x) => [x.id, x])), [D])
  const { lvl } = S
  const hard = S.hard.filter((h) => byId.has(h.id))

  const bars = S.daily.map((d) => ({ label: dm(d.d), value: d.n, dim: d.n < MIN_PER_DAY, title: dm(d.d), text: d.n ? `${d.n} câu · đúng ${d.ok} · +${d.xp} XP` : 'Không luyện' }))
  const accLine = S.weekly.map((w) => ({ label: dm(w.start), value: w.acc == null ? null : Math.round(w.acc * 100), title: `Tuần từ ${dm(w.start)}`, text: w.acc == null ? '' : `${Math.round(w.acc * 100)}% đúng · ${w.n} câu` }))
  const rtLine = S.weekly.map((w) => ({ label: dm(w.start), value: w.rt == null ? null : +(w.rt / 1000).toFixed(1), title: `Tuần từ ${dm(w.start)}`, text: w.rt == null ? '' : `chọn câu đáp trung bình ${(w.rt / 1000).toFixed(1)} giây` }))
  const ttLine = S.weekly.map((w) => ({ label: dm(w.start), value: w.tt == null ? null : +(w.tt / 1000).toFixed(1), title: `Tuần từ ${dm(w.start)}`, text: w.tt == null ? '' : `nghĩ & nói một câu trung bình ${(w.tt / 1000).toFixed(1)} giây` }))
  const sprintLine = S.sprints.slice(-20).map((r, i) => ({ label: dm(r.d), value: r.r, title: `Lượt ${i + 1} · ${dm(r.d)}`, text: `${r.r} đúng, ${r.w} sai · ${(r.ms / 1000).toFixed(1)}s/câu` }))
  const bestSprint = Math.max(0, ...S.sprints.map((r) => r.r))
  const weakest = S.skills.filter((s) => s.count >= 3 && s.now != null).sort((a, b) => a.now - b.now)[0]
  const ADVICE = {
    tr: 'Câu dịch còn sai nhiều: trước khi gõ, nói thầm câu trả lời một lần, rồi nghe lại câu đúng và nhắc lại 2 lần.',
    listen: 'Phần nghe & nhắc lại còn yếu: bấm 🐢 Nghe chậm trước, sau đó nghe tốc độ thường và nói đuổi theo.',
    ask: 'Đặt câu hỏi chưa chắc: nhớ trật tự "Từ hỏi + trợ động từ + chủ ngữ + động từ" (What do you…? Where did she…?).',
    rf: 'Phản xạ đáp lời còn chậm: chơi thêm 1–2 lượt ⚡ Thử thách 60 giây mỗi ngày để quen các cặp câu thông dụng.',
    role: 'Hội thoại còn khó: luyện lại bài nhập vai cũ trong thư viện, lần hai bật "Ẩn chữ" để luyện nghe.',
    ex: 'Diễn đạt ý chưa đủ ý: trước khi nói, liệt kê 3 ý bằng từ khóa, rồi nối bằng because / so / however.',
  }

  return (
    <div className="page talk-stats">
      <div className="row between wrap gap-s">
        <button className="btn sm" onClick={onBack}>← Giao tiếp</button>
        <span className="muted small">Bắt đầu luyện từ {dm(S.firstDay)} · {S.activeDays} ngày đã luyện</span>
      </div>
      <h1>📊 Thống kê giao tiếp</h1>

      <div className="tile-grid">
        <Tile icon="🗣️" label="Câu đã nói (tổng)" value={S.total} tone="t-yellow"><small className="delta flat">tuần này {S.last7.n} câu</small></Tile>
        <Tile icon="🔥" label="Chuỗi ngày" value={`${S.streak} ngày`} tone="t-pink"><small className="delta flat">dài nhất {S.longest} ngày</small></Tile>
        <Tile icon="🎯" label="Chính xác 7 ngày" value={pct(S.last7.acc)} tone="t-green"><Delta now={S.last7.acc} before={S.prev7.acc} fmt={(v) => Math.round(v * 100)} unit="%" /></Tile>
        <Tile icon="⚡" label="Tốc độ phản xạ" value={sec(S.last7.rt)} tone="t-blue"><Delta now={S.last7.rt} before={S.prev7.rt} better="down" fmt={(v) => (v / 1000).toFixed(1)} unit="s" /></Tile>
      </div>

      <section className="card journey">
        <div className="row between wrap gap-s">
          <h2>🧗 Hành trình A1 → C2</h2>
          <span className="pill yellow">Cấp {lvl.name} · {CEFR_VI[lvl.cefr]}</span>
        </div>
        <div className="journey-track">
          {Array.from({ length: STAGES }, (_, s) => (
            <span key={s} className={`jt ${s < lvl.stage ? 'done' : s === lvl.stage ? 'now' : ''} ${s % 3 === 0 ? 'cefr' : ''}`} title={`${CEFR[Math.floor(s / 3)]} · ${(s % 3) + 1}`}>
              {s % 3 === 0 && <em>{CEFR[s / 3]}</em>}
            </span>
          ))}
        </div>
        <p className="small">
          {S.forecast
            ? <>Với nhịp hiện tại (~{Math.round(S.pace)} XP/ngày), bạn sẽ lên <b>{CEFR[lvl.cefr + 1]}</b> sau khoảng <b>{S.forecast} ngày</b>. Trả lời chính xác hơn sẽ nhận nhiều XP hơn nên lên cấp nhanh hơn.</>
            : lvl.cefr >= 5 ? 'Bạn đang ở cấp cao nhất. Giữ nhịp ôn mỗi ngày để không quên.' : 'Luyện vài ngày để app dự báo khi nào bạn lên cấp tiếp theo.'}
        </p>
      </section>

      <section className="card">
        <h2>🗓️ Số câu mỗi ngày · 30 ngày</h2>
        <p className="muted small">Cột nhạt: dưới {MIN_PER_DAY} câu (chưa giữ chuỗi). Chạm vào cột để xem chi tiết.</p>
        <BarChart data={bars} goal={MIN_PER_DAY} goalLabel={`tối thiểu ${MIN_PER_DAY}`} ariaLabel="Số câu mỗi ngày trong 30 ngày" />
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>🎯 Độ chính xác theo tuần</h2>
          <p className="muted small">Phần trăm câu đúng hoặc gần đúng · 12 tuần.</p>
          <LineChart points={accLine} min={0} max={100} format={(v) => `${Math.round(v)}%`} ariaLabel="Độ chính xác theo tuần" />
        </section>
        <section className="card">
          <h2>⚡ Thời gian chọn câu đáp</h2>
          <p className="muted small">Giây trung bình để chọn đúng câu đáp · <b>càng thấp càng phản xạ nhanh</b>.</p>
          <LineChart points={rtLine} format={(v) => `${v.toFixed(1)}s`} ariaLabel="Thời gian phản xạ theo tuần" />
        </section>
        <section className="card">
          <h2>💭 Thời gian nghĩ một câu</h2>
          <p className="muted small">Từ lúc thấy câu tiếng Việt đến lúc nói/gõ xong tiếng Anh · càng thấp càng trôi chảy.</p>
          <LineChart points={ttLine} format={(v) => `${v.toFixed(0)}s`} ariaLabel="Thời gian nghĩ một câu theo tuần" />
        </section>
        <section className="card">
          <h2>🏁 Thử thách 60 giây</h2>
          <p className="muted small">Số câu đúng mỗi lượt · kỷ lục <b>{bestSprint}</b>.</p>
          <LineChart points={sprintLine} min={0} format={(v) => Math.round(v)} ariaLabel="Điểm thử thách 60 giây" />
        </section>
      </div>

      <section className="card">
        <h2>🧩 Kỹ năng · 14 ngày gần nhất</h2>
        <div className="skill-rows">
          {S.skills.map((s) => (
            <div key={s.k} className="skill-row">
              <span className="sk-name">{s.icon} {s.name}</span>
              <div className="meter"><div style={{ width: `${Math.round((s.now || 0) * 100)}%` }} /></div>
              <b className="sk-val">{pct(s.now)}</b>
              <span className="sk-diff small">
                {s.now == null ? <span className="muted">chưa luyện</span>
                  : s.before == null ? <span className="muted">{s.count} lượt</span>
                  : Math.round((s.now - s.before) * 100) === 0 ? <span className="muted">= giữ vững</span>
                  : <span className={s.now > s.before ? 'good' : 'bad'}>{s.now > s.before ? '▲' : '▼'} {Math.abs(Math.round((s.now - s.before) * 100))}%</span>}
              </span>
            </div>
          ))}
        </div>
        {weakest && <p className="tip-box small">💡 <b>Nên luyện thêm: {weakest.name}.</b> {ADVICE[weakest.k]}</p>}
      </section>

      <section className="card">
        <h2>🧠 Độ thuộc · những gì đã học</h2>
        <p className="muted small">Mỗi câu được ôn lại theo lịch 1-2-4-7-15-30 ngày. Trả lời đúng nhiều lần thì câu chuyển dần sang "Thuộc lòng".</p>
        <StackBar parts={S.mastery.map((m, k) => ({ name: m.name, count: m.count, color: RAMP[k] }))} />
        <table className="mini-table">
          <thead><tr><th>Loại</th>{S.mastery.map((m) => <th key={m.key}>{m.name}</th>)}</tr></thead>
          <tbody>
            {Object.entries(S.byType).map(([t, x]) => <tr key={t}><td>{TYPE_NAME[t]}</td>{S.mastery.map((m) => <td key={m.key}>{x[m.key]}</td>)}</tr>)}
            {!Object.keys(S.byType).length && <tr><td colSpan={5} className="muted">Chưa học câu nào.</td></tr>}
          </tbody>
        </table>
      </section>

      {hard.length > 0 && (
        <section className="card tint-pink">
          <div className="row between wrap gap-s">
            <h2>🎯 Câu hay quên</h2>
            <button className="btn sm yellow" onClick={() => onPractice(hard.map((h) => h.id))}>Ôn ngay {hard.length} câu ➜</button>
          </div>
          <ul className="hard-list">
            {hard.map((h) => { const it = byId.get(h.id); return it && (
              <li key={h.id}><span className="muted small">{it.vi}</span><span><Speak text={it.en[0]} small /> {it.en[0]}</span><small className="pill pink">quên {h.lapses} lần</small></li>
            ) })}
          </ul>
        </section>
      )}
    </div>
  )
}
