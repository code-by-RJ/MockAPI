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
const STRONG_PASSWORD = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

function validate(fields) {
  const errs = {}
  if (!fields.name.trim())                errs.name     = 'Name is required'
  else if (fields.name.trim().length < 2) errs.name     = 'Name must be at least 2 characters'
  if (!fields.email.trim())               errs.email    = 'Email is required'
  else if (!EMAIL_RE.test(fields.email))  errs.email    = 'Enter a valid email address'
  if (!fields.password)                          errs.password = 'Password is required'
  else if (!STRONG_PASSWORD.test(fields.password)) errs.password = 'Min 8 characters with at least 1 letter and 1 number'
  else if (passwordStrength(fields.password).level < 2) errs.password = 'Choose a stronger password'
  return errs
}

function passwordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 6)           score++
  if (pw.length >= 10)          score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Weak',   color: C.red }
  if (score <= 3) return { level: 2, label: 'Fair',   color: '#F59E0B' }
  if (score <= 4) return { level: 3, label: 'Good',   color: C.blue }
  return             { level: 4, label: 'Strong', color: C.accent }
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

function ValidatedInput({ type = 'text', placeholder, value, onChange, onBlur, error, touched, label, autoComplete }) {
  const isValid   = touched && !error && value
  const isInvalid = touched && !!error
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={onChange} onBlur={onBlur} autoComplete={autoComplete}
          style={{
            width: '100%', background: isInvalid ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${isInvalid ? 'rgba(239,68,68,0.5)' : isValid ? 'rgba(34,197,94,0.4)' : C.border}`,
            borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 1rem',
            fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif",
            outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box',
          }}
        />
        {isValid && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>}
        {isInvalid && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.red, pointerEvents: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
      </div>
      <FieldError msg={isInvalid ? error : ''} />
    </div>
  )
}

export default function Register() {
  const [fields, setFields]     = useState({ name: '', email: '', password: '' })
  const [touched, setTouched]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const genStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnpqrstuvwxyz'
    const nums  = '23456789'
    const all   = upper + lower + nums
    const req   = [
      upper[Math.floor(Math.random() * upper.length)],
      nums[Math.floor(Math.random() * nums.length)],
    ]
    const rest = Array.from({ length: 6 }, () => all[Math.floor(Math.random() * all.length)])
    const arr  = [...req, ...rest]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    const pw = arr.join('')
    setFields(p => ({ ...p, password: pw }))
    setShowPassword(true)
    setTouched(p => ({ ...p, password: true }))
  }
  const { register } = useAuth()
  const navigate     = useNavigate()

  const errors    = validate(fields)
  const hasErrors = Object.keys(errors).length > 0
  const strength  = passwordStrength(fields.password)

  const set   = (key) => (e) => { setFields(p => ({ ...p, [key]: e.target.value })); if (apiError) setApiError('') }
  const touch = (key) => () => setTouched(p => ({ ...p, [key]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true })
    if (hasErrors) return
    setApiError(''); setLoading(true)
    try {
      const data = await register(fields.name.trim(), fields.email, fields.password)
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&type=verify`)
    } catch (err) {
      const data = err.response?.data
      const msg  = data?.error || data?.message || ''
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        setApiError('An account with this email already exists. Try signing in instead.')
      } else if (msg.toLowerCase().includes('email')) {
        setApiError('This email address is invalid or not allowed.')
      } else { setApiError(msg || 'Registration failed. Please try again.') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #475569; }
        @media (max-width: 768px) { .auth-left { display: none !important; } .auth-right { width: 100% !important; } }
      `}</style>

      {/* LEFT PANEL */}
      <div className="auth-left" style={{ width: '45%', background: C.surface, borderRight: `1px solid ${C.border}`, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', filter: 'blur(80px)', pointerEvents: 'none' }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
              <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.fg }}>MockAPI</span>
        </div>

        {/* Middle */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: C.accent, padding: '0.3rem 0.8rem', borderRadius: 100, fontSize: 11, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem' }}>
            <span style={{ width: 5, height: 5, background: C.accent, borderRadius: '50%', animation: 'pulse 2s infinite' }}/>
            Free forever — no credit card
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.2, color: C.fg, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Start mocking APIs<br/>
            <span style={{ color: C.accent }}>in 60 seconds.</span>
          </h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: '2rem', maxWidth: 320 }}>
            No backend needed. No YAML. No config. Just a URL that returns exactly what you tell it to.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { num: '01', title: 'Create a resource', desc: 'Name it users, products, orders — anything.' },
              { num: '02', title: 'Configure endpoint', desc: 'Pick method, seed data, set response code.' },
              { num: '03', title: 'Hit the live URL', desc: 'Instant JSON response. Copy & paste to your app.' },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.accent, fontWeight: 500 }}>{num}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ borderLeft: `2px solid rgba(34,197,94,0.3)`, paddingLeft: 12 }}>
          <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', lineHeight: 1.6 }}>"Saved us days of backend work before the demo."</p>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>— Frontend dev, using MockAPI</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right" style={{ width: '55%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: C.fg, marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Start building fake APIs in seconds</p>

          {apiError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <ValidatedInput label="Name" type="text" placeholder="Silk Dev" value={fields.name} onChange={set('name')} onBlur={touch('name')} error={errors.name} touched={touched.name} autoComplete="name" />
            <ValidatedInput label="Email" type="email" placeholder="you@example.com" value={fields.email} onChange={set('email')} onBlur={touch('email')} error={errors.email} touched={touched.email} autoComplete="email" />

            {/* Password + strength + suggest */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: C.muted }}>Password</label>
                <button type="button" onClick={genStrongPassword}
                  style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                  title="Generate a strong password">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Suggest password
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters, 1 letter & 1 number" value={fields.password}
                  onChange={set('password')} onBlur={touch('password')} autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: touched.password && errors.password ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${touched.password && errors.password ? 'rgba(239,68,68,0.5)' : touched.password && !errors.password && fields.password ? 'rgba(34,197,94,0.4)' : C.border}`,
                    borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 1rem',
                    fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showPassword
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {fields.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ height: 2, flex: 1, borderRadius: 2, background: n <= strength.level ? strength.color : C.border, transition: 'background 300ms' }}/>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 500, color: strength.color }}>{strength.label} password</p>
                </div>
              )}
              <FieldError msg={touched.password && errors.password ? errors.password : ''} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, background: loading ? C.accentDim : C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 200ms', marginTop: 4, boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}