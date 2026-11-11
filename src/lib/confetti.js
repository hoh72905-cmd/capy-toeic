const COLORS = ['#ffd54f', '#6cc8f5', '#ffb7c5', '#7cc576', '#ffb74d', '#b39ddb']
const SHAPES = ['', '', '', '⭐', '🍊', '✨']

// Small burst of confetti from a point on screen (viewport coordinates)
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 3, count = 18) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const root = document.createElement('div')
  root.className = 'confetti-root'
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i')
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const dist = 60 + Math.random() * (count > 30 ? 220 : 110)
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    if (shape) { el.textContent = shape; el.className = 'emoji' } else el.style.background = COLORS[i % COLORS.length]
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    el.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`)
    el.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`)
    el.style.animationDelay = `${Math.random() * 80}ms`
    root.appendChild(el)
  }
  document.body.appendChild(root)
  setTimeout(() => root.remove(), 1500)
}

// Burst from the element that was clicked
export const confettiAt = (el, count) => {
  const r = el?.getBoundingClientRect?.()
  if (r) confetti(r.left + r.width / 2, r.top + r.height / 2, count)
  else confetti(undefined, undefined, count)
}
