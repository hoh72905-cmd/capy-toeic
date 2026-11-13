// Small SVG charts for the statistics pages: bars, a line with crosshair, a progress ring and a
// sparkline. One series each, so the title names the series and no legend box is needed.
import { useEffect, useRef, useState } from 'react'

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const niceMax = (v) => {
  if (v <= 5) return 5
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v)
}

// Rounded top corners only: the bar stays square on the baseline
const barPath = (x, y, w, h, r) => {
  r = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

function Tip({ tip }) {
  if (!tip) return null
  return <div className="chart-tip" style={{ left: tip.x, top: tip.y }}><b>{tip.title}</b><span>{tip.text}</span></div>
}

/** Bars. data: [{ label, value, title, text }]; goal draws a dashed reference line. */
export function BarChart({ data, height = 170, goal, goalLabel, tickEvery = 5, ariaLabel }) {
  const [ref, w] = useWidth()
  const [tip, setTip] = useState(null)
  const padL = 28, padB = 22, padT = 10
  const max = niceMax(Math.max(goal || 0, ...data.map((d) => d.value)))
  const innerW = Math.max(0, w - padL)
  const innerH = height - padB - padT
  const step = data.length ? innerW / data.length : 0
  const bw = Math.max(2, step - 2) // 2px gap between bars
  const y = (v) => padT + innerH - (v / max) * innerH
  return (
    <div className="chart" ref={ref} onMouseLeave={() => setTip(null)}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={ariaLabel}>
          {[0, max / 2, max].map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={y(t)} y2={y(t)} className="grid" />
              <text x={padL - 6} y={y(t) + 4} className="axis" textAnchor="end">{t}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = padL + i * step + 1
            const h = (d.value / max) * innerH
            const on = tip?.i === i
            return (
              <g key={i}>
                {d.value > 0 && <path d={barPath(x, y(d.value), bw, h, 4)} className={`bar ${d.dim ? 'dim' : ''} ${on ? 'on' : ''}`} />}
                {(i % tickEvery === tickEvery - 1 || i === data.length - 1) && <text x={x + bw / 2} y={height - 6} className="axis" textAnchor="middle">{d.label}</text>}
                <rect x={padL + i * step} y={padT} width={step} height={innerH} fill="transparent"
                  onMouseEnter={() => setTip({ i, x: Math.min(w - 120, Math.max(0, x - 40)), y: Math.max(0, y(d.value) - 52), title: d.title, text: d.text })}
                  onClick={() => setTip({ i, x: Math.min(w - 120, Math.max(0, x - 40)), y: Math.max(0, y(d.value) - 52), title: d.title, text: d.text })} />
              </g>
            )
          })}
          {goal > 0 && <g>
            <line x1={padL} x2={w} y1={y(goal)} y2={y(goal)} className="goal" />
            <text x={w - 2} y={y(goal) - 4} className="axis goal-t" textAnchor="end">{goalLabel}</text>
          </g>}
        </svg>
      )}
      <Tip tip={tip} />
    </div>
  )
}

/** Line with markers and a hover crosshair. points: [{ label, value (null = no data), title, text }]. */
export function LineChart({ points, height = 170, format = (v) => v, min: minIn, max: maxIn, ariaLabel }) {
  const [ref, w] = useWidth()
  const [tip, setTip] = useState(null)
  const padL = 34, padB = 22, padT = 12, padR = 8
  const vals = points.map((p) => p.value).filter((v) => v != null)
  const lo = minIn ?? Math.min(...vals, Infinity)
  const hi = maxIn ?? Math.max(...vals, -Infinity)
  const span = hi - lo || 1
  const min = minIn ?? Math.max(0, lo - span * 0.2)
  const max = maxIn ?? hi + span * 0.2
  const innerW = Math.max(0, w - padL - padR)
  const innerH = height - padB - padT
  const x = (i) => padL + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2)
  const y = (v) => padT + innerH - ((v - min) / (max - min || 1)) * innerH
  // Break the line where there is no data
  const segs = []
  let cur = []
  points.forEach((p, i) => { if (p.value == null) { if (cur.length) segs.push(cur); cur = [] } else cur.push([x(i), y(p.value)]) })
  if (cur.length) segs.push(cur)
  const show = (i) => {
    const p = points[i]
    if (p.value == null) { setTip(null); return }
    setTip({ i, x: Math.min(w - 130, Math.max(0, x(i) - 50)), y: Math.max(0, y(p.value) - 56), title: p.title, text: p.text })
  }
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - padL) / (innerW || 1)) * (points.length - 1))
    show(Math.max(0, Math.min(points.length - 1, i)))
  }
  if (!vals.length) return <div className="chart empty-chart" ref={ref}><p className="muted small">Chưa có dữ liệu — luyện thêm vài ngày để thấy đường tiến bộ.</p></div>
  return (
    <div className="chart" ref={ref} onMouseLeave={() => setTip(null)}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={ariaLabel} onMouseMove={onMove} onClick={onMove}>
          {[min, (min + max) / 2, max].map((t, k) => (
            <g key={k}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className="grid" />
              <text x={padL - 6} y={y(t) + 4} className="axis" textAnchor="end">{format(t)}</text>
            </g>
          ))}
          {points.map((p, i) => { const st = Math.ceil(points.length / (w < 500 ? 4 : 6)); return (i === points.length - 1 || (i % st === 0 && points.length - 1 - i >= st)) })
            .map((on, i) => on && <text key={i} x={x(i)} y={height - 6} className="axis" textAnchor="middle">{points[i].label}</text>)}
          {tip && <line x1={x(tip.i)} x2={x(tip.i)} y1={padT} y2={padT + innerH} className="cross" />}
          {segs.map((s, k) => <polyline key={k} points={s.map((q) => q.join(',')).join(' ')} className="line" />)}
          {points.map((p, i) => p.value != null && <circle key={i} cx={x(i)} cy={y(p.value)} r={tip?.i === i ? 5.5 : 4} className="dot" />)}
        </svg>
      )}
      <Tip tip={tip} />
    </div>
  )
}

/** Progress ring with content in the middle. */
export function Ring({ pct, size = 96, stroke = 10, children, className = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={`ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, pct)))} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

/** Tiny trend line without axes (the number beside it carries the value). */
export function Sparkline({ values, width = 110, height = 32 }) {
  const v = values.filter((x) => x != null)
  if (v.length < 2) return null
  const lo = Math.min(...v), hi = Math.max(...v)
  const pts = v.map((x, i) => [(i / (v.length - 1)) * (width - 6) + 3, height - 4 - ((x - lo) / (hi - lo || 1)) * (height - 8)])
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} className="spark" aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} className="line" />
      <circle cx={last[0]} cy={last[1]} r={3.5} className="dot" />
    </svg>
  )
}

/** One stacked bar of parts (mastery). parts: [{ name, count, color }] */
export function StackBar({ parts }) {
  const total = parts.reduce((a, p) => a + p.count, 0)
  return (
    <div className="stackbar-wrap">
      <div className="stackbar" role="img" aria-label={parts.map((p) => `${p.name} ${p.count}`).join(', ')}>
        {total === 0 ? <span className="stack-empty" /> : parts.filter((p) => p.count > 0).map((p) => (
          <span key={p.name} style={{ flex: p.count, background: p.color }} title={`${p.name}: ${p.count}`} />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => <span key={p.name}><i style={{ background: p.color }} />{p.name} <b>{p.count}</b></span>)}
      </div>
    </div>
  )
}
