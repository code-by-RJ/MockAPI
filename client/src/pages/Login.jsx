import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
  blue: "#60A5FA", yellow: "#FBBF24",
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields) {
  const errs = {}
  if (!fields.email.trim())              errs.email    = 'Email is required'
  else if (!EMAIL_RE.test(fields.email)) errs.email    = 'Enter a valid email address'
  if (!fields.password)                  errs.password = 'Password is required'
  return errs
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p style={{ marginTop: 6, fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity="0.2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1.2"/>
      </svg>
      {msg}
    </p>
  )
}

function ValidatedInput({ type = 'text', placeholder, value, onChange, onBlur, error, touched, label, onToggleShow, showValue }) {
  const isValid   = touched && !error && value
  const isInvalid = touched && !!error
  const hasToggle = !!onToggleShow
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={hasToggle ? (showValue ? 'text' : 'password') : type}
          placeholder={placeholder} value={value}
          onChange={onChange} onBlur={onBlur}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: isInvalid ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.25)',
            border: `1px solid ${isInvalid ? 'rgba(239,68,68,0.5)' : isValid ? 'rgba(34,197,94,0.4)' : C.border}`,
            borderRadius: 10, padding: `0.65rem ${hasToggle ? '4rem' : '2.5rem'} 0.65rem 1rem`,
            fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif",
            outline: 'none', transition: 'border-color 150ms',
          }}
        />
        {/* Status icon — shifted left when toggle is present */}
        {isValid && <span style={{ position: 'absolute', right: hasToggle ? 34 : 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>}
        {isInvalid && <span style={{ position: 'absolute', right: hasToggle ? 34 : 10, top: '50%', transform: 'translateY(-50%)', color: C.red, pointerEvents: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
        {/* Eye toggle */}
        {hasToggle && (
          <button
            type="button"
            onClick={onToggleShow}
            tabIndex={-1}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '2px 4px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = C.fg}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
            aria-label={showValue ? 'Hide password' : 'Show password'}
          >
            {showValue ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      <FieldError msg={isInvalid ? error : ''} />
    </div>
  )
}

/* ── LEFT PANEL ── */
function LeftPanel() {
  return (
    <div style={{ flex: '0 0 44%', background: C.surface, borderRight: `1px solid ${C.border}`, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }}/>

      {/* Top */}
      <div>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3rem' }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
              <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.fg }}>MockAPI</span>
        </div>

        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, lineHeight: 1.2, color: C.fg, marginBottom: '0.75rem' }}>
          Your mock APIs,<br/><span style={{ color: C.accent }}>instantly live.</span>
        </h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 300 }}>
          Create REST endpoints, seed realistic data, and share demo URLs — all without touching a backend.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['Instant endpoints', 'Live in under 3 seconds'],
            ['Faker data seeding', 'Realistic names, emails, IDs'],
            ['Error simulation', 'Test 4xx/5xx responses'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal snippet */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
        <div style={{ color: '#94A3B8', marginBottom: 4 }}>// GET /api/v1/users</div>
        <div><span style={{ color: C.blue }}>"id"</span>: <span style={{ color: C.accent }}>"usr_01"</span>,</div>
        <div><span style={{ color: C.blue }}>"name"</span>: <span style={{ color: C.accent }}>"Priya Sharma"</span>,</div>
        <div><span style={{ color: C.blue }}>"latency"</span>: <span style={{ color: C.yellow }}>"12ms"</span></div>
      </div>
    </div>
  )
}

export default function Login() {
  const [fields, setFields]       = useState({ email: '', password: '' })
  const [touched, setTouched]     = useState({})
  const [apiError, setApiError]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(null)   // 1 | 2 | null
  const [lockUntil, setLockUntil]       = useState(null)   // Date | null
  const [showPass, setShowPass]         = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const errors    = validate(fields)
  const hasErrors = Object.keys(errors).length > 0

  const set   = (key) => (e) => { setFields(p => ({ ...p, [key]: e.target.value })); if (apiError) { setApiError(''); setAttemptsLeft(null); setLockUntil(null) } }
  const touch = (key) => () => setTouched(p => ({ ...p, [key]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (hasErrors) return
    setApiError(''); setLoading(true); setAttemptsLeft(null); setLockUntil(null)
    try {
      await login(fields.email, fields.password)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg  = typeof data?.error === 'string' ? data.error : data?.message || 'Something went wrong.'

      if (data?.isLocked) {
        setLockUntil(data.lockUntil ? new Date(data.lockUntil) : null)
        setApiError(msg)
      } else if (data?.attemptsLeft !== undefined) {
        setAttemptsLeft(data.attemptsLeft)
        setApiError(msg)
      } else {
        setApiError(msg)
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #A3ADC2; }
        .left-panel { display: flex !important; }
        @media (max-width: 768px) { .left-panel { display: none !important; } .right-panel { padding: 2rem 1.5rem !important; } }
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      `}</style>

      {/* LEFT */}
      <div className="left-panel" style={{ flex: '0 0 44%', background: C.surface, borderRight: `1px solid ${C.border}`, padding: '3rem', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }}/>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3rem' }}>
            <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/></svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.fg }}>MockAPI</span>
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.4rem, 2vw, 1.9rem)', fontWeight: 700, lineHeight: 1.2, color: C.fg, marginBottom: '0.75rem' }}>
            Your mock APIs,<br/><span style={{ color: C.accent }}>instantly live.</span>
          </h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 300 }}>
            Create REST endpoints, seed realistic data, and share demo URLs — without touching a backend.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Instant endpoints','Live in under 3 seconds'],['Faker data seeding','Realistic names, emails, IDs'],['Error simulation','Test 4xx/5xx responses']].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
          <div style={{ color: '#94A3B8', marginBottom: 4 }}>// GET /api/v1/users</div>
          <div><span style={{ color: C.blue }}>"id"</span>: <span style={{ color: C.accent }}>"usr_01"</span>,</div>
          <div><span style={{ color: C.blue }}>"name"</span>: <span style={{ color: C.accent }}>"Priya Sharma"</span>,</div>
          <div><span style={{ color: C.blue }}>"latency"</span>: <span style={{ color: C.yellow }}>"12ms"</span></div>
        </div>
      </div>

      {/* RIGHT */}
      <main className="right-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 className="sr-only">Sign in — MockAPI</h1>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: C.fg, marginBottom: 4 }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Sign in to your account</p>
          </div>

          {/* Locked state */}
          {lockUntil && (
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '0.75rem 0.85rem', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }} aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: 12, color: C.yellow, fontWeight: 500 }}>{apiError}</span>
              </div>
              <Link to={`/forgot-password`} style={{ fontSize: 11, color: C.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = C.fg}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                Reset password instead →
              </Link>
            </div>
          )}

          {/* Wrong password with attempts left */}
          {!lockUntil && apiError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${attemptsLeft === 1 ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.2)'}`, color: attemptsLeft === 1 ? C.yellow : C.red, fontSize: 12, borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }} aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{apiError}</span>
              </div>
              {attemptsLeft === 1 && (
                <p style={{ marginTop: 6, fontSize: 11, color: C.muted, paddingLeft: 21 }}>
                  1 more wrong attempt will lock your account for 15 min.{' '}
                  <Link to="/forgot-password" style={{ color: C.accent, textDecoration: 'none' }}>Reset password?</Link>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <ValidatedInput label="Email" type="email" placeholder="you@example.com" value={fields.email} onChange={set('email')} onBlur={touch('email')} error={errors.email} touched={touched.email} />
            <ValidatedInput label="Password" type="password" placeholder="••••••••" value={fields.password} onChange={set('password')} onBlur={touch('password')} error={errors.password} touched={touched.password} onToggleShow={() => setShowPass(p => !p)} showValue={showPass} />

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.72rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 200ms', marginTop: 4, boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = C.accentDim)}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = C.accent)}
            >{loading ? 'Signing in…' : 'Sign in'}</button>

            <div style={{ textAlign: 'right', marginTop: 2 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = C.fg}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                Forgot password?
              </Link>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  )
}