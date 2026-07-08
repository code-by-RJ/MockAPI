import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/axios'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
  blue: "#60A5FA",
}
const FONTS = ''
const ANIM  = `@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.35s ease forwards}`
const STRONG_PASSWORD = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

function passwordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 6)            score++
  if (pw.length >= 10)           score++
  if (/[A-Z]/.test(pw))          score++
  if (/[0-9]/.test(pw))          score++
  if (/[^A-Za-z0-9]/.test(pw))  score++
  if (score <= 1) return { level: 1, label: 'Weak',   color: C.red }
  if (score <= 3) return { level: 2, label: 'Fair',   color: '#F59E0B' }
  if (score <= 4) return { level: 3, label: 'Good',   color: C.blue }
  return             { level: 4, label: 'Strong', color: C.accent }
}

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()

  const email = location.state?.email || ''
  const otp   = location.state?.otp   || ''

  const [password, setPassword]   = useState('')
  const [confirm,  setConfirm]    = useState('')
  const [touched,  setTouched]    = useState({})
  const [loading,  setLoading]    = useState(false)
  const [apiError, setApiError]   = useState('')
  const [success,  setSuccess]    = useState(false)
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
    setPassword(pw); setConfirm(pw)
    setShowPassword(true)
    setTouched(p => ({ ...p, password: true, confirm: true }))
  }

  const strength = passwordStrength(password)
  const pwError  = !password
    ? 'Password is required'
    : !STRONG_PASSWORD.test(password)
      ? 'Min 8 characters with at least 1 letter and 1 number'
      : strength.level < 2
        ? 'Choose a stronger password'
        : ''
  const cfmError = !confirm  ? 'Please confirm your password' : confirm !== password ? 'Passwords do not match' : ''

  const touch = (key) => () => setTouched(p => ({ ...p, [key]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (pwError || cfmError) return
    setLoading(true); setApiError('')
    try {
      await api.post('/auth/reset-password', { email, otp, password })
      setSuccess(true)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Reset failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (!email || !otp) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: C.accent, fontSize: 13 }}>Request a new code</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem' }}>
        <style>{FONTS}{ANIM}{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div className="fade-up" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 10 }}>Password reset!</h1>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 28 }}>Your password has been updated. You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')}
            style={{ padding: '0.65rem 1.5rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            Sign in →
          </button>
        </div>
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

      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>

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

          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 8 }}>Set new password</h1>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>Choose a strong password for your account.</p>

          {apiError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, borderRadius: 10, padding: '0.6rem 0.8rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* New password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: C.muted }}>New password</label>
                <button type="button" onClick={genStrongPassword}
                  style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Suggest password
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters, 1 letter & 1 number"
                  value={password} onChange={e => { setPassword(e.target.value); setApiError('') }}
                  onBlur={touch('password')} autoComplete="new-password"
                  style={{ width: '100%', background: touched.password && pwError ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)', border: `1px solid ${touched.password && pwError ? 'rgba(239,68,68,0.5)' : touched.password && !pwError && password ? 'rgba(34,197,94,0.4)' : C.border}`, borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 1rem', fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 150ms' }}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showPassword
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ height: 2, flex: 1, borderRadius: 2, background: n <= strength.level ? strength.color : C.border, transition: 'background 300ms' }}/>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 500, color: strength.color }}>{strength.label} password</p>
                </div>
              )}
              {touched.password && pwError && <p style={{ marginTop: 6, fontSize: 11, color: C.red }}>{pwError}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>Confirm password</label>
              <input
                type="password" placeholder="Repeat password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                onBlur={touch('confirm')} autoComplete="new-password"
                style={{ width: '100%', background: touched.confirm && cfmError ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)', border: `1px solid ${touched.confirm && cfmError ? 'rgba(239,68,68,0.5)' : touched.confirm && !cfmError && confirm ? 'rgba(34,197,94,0.4)' : C.border}`, borderRadius: 10, padding: '0.65rem 1rem', fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 150ms' }}
              />
              {touched.confirm && cfmError && <p style={{ marginTop: 6, fontSize: 11, color: C.red }}>{cfmError}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.72rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 150ms', marginTop: 4 }}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
          <Link to="/login" style={{ color: C.muted, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = C.fg}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}