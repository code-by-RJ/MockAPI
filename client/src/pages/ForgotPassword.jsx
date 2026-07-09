import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
  blue: "#60A5FA",
}
const FONTS = ''
const ANIM  = `@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.35s ease forwards}`

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  const emailError = !email.trim() ? 'Email is required' : !EMAIL_RE.test(email) ? 'Enter a valid email address' : ''
  const isInvalid  = touched && !!emailError
  const isValid    = touched && !emailError && email

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (emailError) return
    setLoading(true); setApiError('')
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem' }}>
        <style>{FONTS}{ANIM}{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <main className="fade-up" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 10 }}>Check your inbox</h1>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, maxWidth: 320, margin: '0 auto 28px' }}>
            If an account exists for <span style={{ color: C.fg, fontWeight: 500 }}>{email}</span>, we've sent a 6-digit reset code.
          </p>
          <button onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=reset`)}
            style={{ padding: '0.65rem 1.5rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            Enter OTP →
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: C.muted }}>
            <Link to="/login" style={{ color: C.muted, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = C.fg}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}>← Back to sign in</Link>
          </p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem' }}>
      <style>{FONTS}{ANIM}{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #A3ADC2; }
        input:focus { outline: none; border-color: rgba(34,197,94,0.5) !important; }
      `}</style>

      <main className="fade-up" style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 30, height: 30, background: C.accent, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.fg }}>MockAPI</span>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '2.5rem 2rem' }}>

          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 8 }}>Forgot password?</h1>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>Enter your email and we'll send a 6-digit reset code.</p>

          {apiError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, borderRadius: 10, padding: '0.6rem 0.8rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email" placeholder="you@example.com"
                  value={email} onChange={e => { setEmail(e.target.value); setApiError('') }}
                  onBlur={() => setTouched(true)}
                  autoComplete="email"
                  style={{ width: '100%', background: isInvalid ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)', border: `1px solid ${isInvalid ? 'rgba(239,68,68,0.5)' : isValid ? 'rgba(34,197,94,0.4)' : C.border}`, borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 1rem', fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 150ms' }}
                />
                {isValid && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></span>}
              </div>
              {isInvalid && <p style={{ marginTop: 6, fontSize: 11, color: C.red }}>{emailError}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.72rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 150ms' }}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
          <Link to="/login" style={{ color: C.muted, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = C.fg}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>← Back to sign in</Link>
        </p>
      </main>
    </div>
  )
}