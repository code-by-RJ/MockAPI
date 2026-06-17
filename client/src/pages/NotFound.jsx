import { Link } from 'react-router-dom'

const C = {
  bg:        '#0F172A',
  surface:   '#1E293B',
  border:    '#334155',
  fg:        '#F8FAFC',
  muted:     '#94A3B8',
  accent:    '#22C55E',
  accentDim: '#16A34A',
}

const FONTS = '' // fonts loaded globally via index.css

const ANIM = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .nf-enter { animation: fadeUp 0.4s ease forwards; }
  @keyframes pulse404 {
    0%, 100% { opacity: 0.06; }
    50%       { opacity: 0.1;  }
  }
  .nf-bg-text { animation: pulse404 4s ease-in-out infinite; }
`

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.fg, fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <style>{FONTS}{ANIM}{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Background 404 — decorative */}
      <span className="nf-bg-text" aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 'clamp(180px, 40vw, 380px)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.fg, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.05em', lineHeight: 1, whiteSpace: 'nowrap' }}>
        404
      </span>

      {/* Content */}
      <div className="nf-enter" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, maxWidth: 420 }}>

        {/* Badge */}
        <span style={{ fontSize: 11, padding: '0.3rem 0.8rem', borderRadius: 100, border: `1px solid rgba(34,197,94,0.25)`, background: 'rgba(34,197,94,0.08)', color: C.accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>
          404 NOT FOUND
        </span>

        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(22px, 4vw, 30px)', color: C.fg, lineHeight: 1.2 }}>
          Page not found
        </h1>

        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 320 }}>
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/dashboard"
            style={{ fontSize: 13, padding: '0.75rem 1.25rem', borderRadius: 8, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, textDecoration: 'none', transition: 'background 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
          >
            Back to Dashboard
          </Link>
          <Link
            to="/"
            style={{ fontSize: 13, padding: '0.75rem 1.1rem', borderRadius: 8, border: `1px solid ${C.border}`, color: C.muted, textDecoration: 'none', transition: 'color 150ms, border-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
            onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
          >
            Go to Home
          </Link>
        </div>

      </div>
    </div>
  )
}