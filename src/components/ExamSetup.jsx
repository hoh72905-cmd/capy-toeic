import { useStore, setState } from '../lib/store.js'
import { todayKey, addDays, fromKey, diffDays } from '../lib/date.js'
import { cefrFor, requiredLessons, requiredComps, todayCurriculum } from '../lib/curriculum.js'

const TARGETS = [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 990]
const fmtDate = (k) => fromKey(k).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })

// Exam date + target score form, with a summary of what the plan looks like
export default function ExamSetup({ compact }) {
  const { profile, curri } = useStore()
  const today = todayKey()
  const set = (patch) => setState((s) => ({ profile: { ...s.profile, ...patch } }))
  const target = profile.targetScore || 800
  const cefr = cefrFor(target)
  const cur = cefrFor(profile.currentScore)
  const days = profile.examDate ? diffDays(today, profile.examDate) : null
  const lessons = requiredLessons(target)
  const plan = todayCurriculum(profile, curri, today)

  return (
    <div className="card exam-setup">
      <h2>🎯 Ngày thi & mục tiêu</h2>
      <div className="exam-grid">
        <label>📅 Ngày thi
          <input type="date" min={addDays(today, 1)} value={profile.examDate || ''}
            onChange={(e) => set({ examDate: e.target.value || null })} />
        </label>
        <label>🏆 Điểm mục tiêu
          <select value={target} onChange={(e) => set({ targetScore: Number(e.target.value) })}>
            {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        {!compact && <>
          <label>📊 Điểm hiện tại (nếu có)
            <input type="number" min={10} max={990} step={5} placeholder="VD: 450" value={profile.currentScore || ''}
              onChange={(e) => set({ currentScore: e.target.value ? Math.min(990, Math.max(10, Number(e.target.value))) : null })} />
          </label>
          <label>🚩 Ngày bắt đầu học
            <input type="date" value={profile.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
          </label>
        </>}
      </div>

      {profile.examDate ? (
        <div className="exam-summary">
          <div className="countdown"><b>{days > 0 ? days : 0}</b><span>ngày nữa thi</span></div>
          <div className="small">
            <p>🗓️ {fmtDate(profile.examDate)}</p>
            <p>🎯 {target} điểm ≈ trình độ <b>{cefr?.cefr}</b> ({cefr?.from}–{cefr?.to}){cur && <> · hiện tại <b>{cur.cefr}</b></>}</p>
            <p>📘 Cần học <b>{lessons.length}</b> bài trong khung kiến thức · đã xong {plan.doneCount} · khoảng <b>{plan.perDay.toFixed(1)}</b> bài/ngày, tuần cuối dành để làm đề.</p>
            {days !== null && days < 21 && <p className="warn">⚠️ Còn ít thời gian: app ưu tiên ôn chủ điểm yếu và làm đề. Có thể lùi ngày thi hoặc hạ mục tiêu để lịch nhẹ hơn.</p>}
            {plan.perDay > 4 && days >= 21 && <p className="warn">⚠️ Lịch khá dày (&gt; 4 bài/ngày). Cân nhắc lùi ngày thi hoặc hạ mục tiêu.</p>}
          </div>
        </div>
      ) : (
        <p className="muted small">Chọn ngày thi để app chia lộ trình 12 tuần và khung kiến thức vừa khít đến ngày thi.</p>
      )}
      {!compact && (
        <p className="muted small">Mốc điểm TOEIC → CEFR và danh sách năng lực cần có lấy từ bộ dữ liệu Kaggle. Với {target} điểm, cần: {requiredComps(target).map((c) => c.cefr ? `Ngữ pháp ${c.cefr}` : c.name.replace('Test in TOEIC for Level', '')).join(' · ')}.</p>
      )}
    </div>
  )
}
