// Original capybara mascot with a yuzu on its head and a sky-blue scarf
export default function Mascot({ size = 90, mood = 'happy', className = '' }) {
  const eyes = mood === 'happy' || mood === 'cheer'
    ? <g stroke="#3b2a1d" strokeWidth="3" strokeLinecap="round" fill="none"><path d="M40 47 q5 -5 10 0" /><path d="M70 47 q5 -5 10 0" /></g>
    : <g fill="#3b2a1d" className="eyes"><ellipse cx="45" cy="47" rx="3.6" ry="4.2" /><ellipse cx="75" cy="47" rx="3.6" ry="4.2" /><circle cx="46.2" cy="45.6" r="1.2" fill="#fff" /><circle cx="76.2" cy="45.6" r="1.2" fill="#fff" /></g>
  return (
    <svg className={`mascot ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Capybara">
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="rgba(0,0,0,.08)" />
      <ellipse cx="60" cy="94" rx="36" ry="18" fill="#C9966A" />
      <ellipse cx="30" cy="22" rx="7" ry="6" fill="#A97B52" />
      <ellipse cx="90" cy="22" rx="7" ry="6" fill="#A97B52" />
      <rect x="20" y="18" width="80" height="66" rx="32" fill="#D3A275" />
      <path d="M26 80 q34 14 68 0 l2 8 q-36 14 -72 0z" fill="#4FC3F7" />
      <circle cx="88" cy="88" r="5" fill="#29A8E0" />
      <circle cx="34" cy="60" r="6" fill="#FFB3B3" opacity=".7" />
      <circle cx="86" cy="60" r="6" fill="#FFB3B3" opacity=".7" />
      {eyes}
      <rect x="44" y="54" width="32" height="20" rx="10" fill="#A97B52" />
      <ellipse cx="53" cy="61" rx="2.4" ry="3" fill="#3b2a1d" />
      <ellipse cx="67" cy="61" rx="2.4" ry="3" fill="#3b2a1d" />
      <path d="M55 68 q5 4 10 0" stroke="#3b2a1d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="13" r="10" fill="#FFD54F" stroke="#F5B800" strokeWidth="1.5" />
      <path d="M60 4 q6 -6 12 -2 q-6 4 -12 2z" fill="#7CC576" />
      {mood === 'think' && <text x="98" y="20" fontSize="18" fontWeight="800" fill="#1E88E5">?</text>}
      {mood === 'cheer' && <g fill="#FFC107"><path d="M8 30 l3 6 6 1 -5 4 2 6 -6-3 -6 3 2-6 -5-4 6-1z" /><path d="M104 40 l2 4 4 1 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-1z" /></g>}
      {mood === 'sad' && <path d="M84 40 q3 6 0 9 q-3 -3 0 -9z" fill="#64B5F6" />}
    </svg>
  )
}
