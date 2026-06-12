import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields) {
  const errs = {}
  if (!fields.name.trim())                errs.name     = 'Name is required'
  else if (fields.name.trim().length < 2) errs.name     = 'Name must be at least 2 characters'
  if (!fields.email.trim())               errs.email    = 'Email is required'
  else if (!EMAIL_RE.test(fields.email))  errs.email    = 'Enter a valid email address'
  if (!fields.password)                   errs.password = 'Password is required'
  else if (fields.password.length < 6)    errs.password = 'Password must be at least 6 characters'
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
  if (score <= 4) return { level: 3, label: 'Good',   color: '#60A5FA' }
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
      <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
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
        {isValid && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        )}
        {isInvalid && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.red, pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        )}
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
      await register(fields.name.trim(), fields.email, fields.password)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg  = data?.error || data?.message || ''
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        setApiError('An account with this email already exists. Try signing in instead.')
      } else if (msg.toLowerCase().includes('email')) {
        setApiError('This email address is invalid or not allowed.')
      } else {
        setApiError(msg || 'Registration failed. Please try again.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input::placeholder { color: #475569; }`}</style>

      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(34,197,94,0.04)', filter: 'blur(100px)', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
              <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.fg }}>MockAPI</span>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '2rem', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: C.fg, marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Start building fake APIs in seconds</p>

          {apiError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <ValidatedInput label="Name" type="text" placeholder="Silk Dev" value={fields.name} onChange={set('name')} onBlur={touch('name')} error={errors.name} touched={touched.name} autoComplete="name" />
            <ValidatedInput label="Email" type="email" placeholder="you@example.com" value={fields.email} onChange={set('email')} onBlur={touch('email')} error={errors.email} touched={touched.email} autoComplete="email" />

            {/* Password + strength */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password" placeholder="Min. 6 characters" value={fields.password}
                  onChange={set('password')} onBlur={touch('password')} autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: touched.password && errors.password ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${touched.password && errors.password ? 'rgba(239,68,68,0.5)' : touched.password && !errors.password && fields.password ? 'rgba(34,197,94,0.4)' : C.border}`,
                    borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 1rem',
                    fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  }}
                />
                {touched.password && !errors.password && fields.password && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </div>

              {/* Strength bar */}
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

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.7rem', borderRadius: 10, background: loading ? C.accentDim : C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 200ms', marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: C.accent, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
