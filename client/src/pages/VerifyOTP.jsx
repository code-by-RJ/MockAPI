import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/axios'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
  blue: "#60A5FA", yellow: "#FBBF24",
}
const FONTS = ''
const ANIM  = `@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.35s ease forwards}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`

const RESEND_COOLDOWN = 60  // seconds

export default function VerifyOTP() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { loginWithToken } = useAuth()

  const email = searchParams.get('email') || ''
  const type  = searchParams.get('type')  || 'verify'

  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef([])
  const timerRef  = useRef(null)

  // Start cooldown on mount (just registered/navigated here)
  useEffect(() => {
    startCooldown()
    return () => clearInterval(timerRef.current)
  }, [])

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleInput = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    // Auto-submit when all filled
    if (value && index === 5 && newOtp.every(d => d)) {
      submitOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      setError('')
      inputRefs.current[5]?.focus()
      submitOtp(paste)
    }
  }

  const submitOtp = useCallback(async (code) => {
    if (loading) return
    setError('')

    setLoading(true)

    if (type === 'reset') {
      try {
        await api.post('/auth/verify-reset-otp', { email, otp: code })
        // OTP confirmed valid — pass to ResetPassword via state (not URL) so
        // back/refresh can't reopen the reset form with stale params.
        navigate('/reset-password', { state: { email, otp: code } })
      } catch (err) {
        const msg = err.response?.data?.error || 'Verification failed. Try again.'
        setError(msg)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } finally { setLoading(false) }
      return
    }

    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code })
      loginWithToken(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed. Try again.'
      setError(msg)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }, [email, type, loading, loginWithToken, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    submitOtp(code)
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true); setError('')
    try {
      await api.post('/auth/resend-otp', { email, type })
      startCooldown()
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.')
    } finally { setResending(false) }
  }

  if (!email) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Invalid link — no email provided.</p>
          <Link to="/register" style={{ color: C.accent, fontSize: 13 }}>Go to Register</Link>
        </div>
      </div>
    )
  }

  const masked = email.replace(/(.{2}).+(@.+)/, '$1***$2')

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem' }}>
      <style>{FONTS}{ANIM}{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .otp-input:focus { outline: none; border-color: rgba(34,197,94,0.6) !important; background: rgba(34,197,94,0.04) !important; }
        .otp-input { caret-color: #22C55E; }
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

        {/* Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '2.5rem 2rem' }}>

          {/* Icon */}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 8 }}>
            {type === 'verify' ? 'Verify your email' : 'Enter reset code'}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
            We sent a 6-digit code to <span style={{ color: C.fg, fontWeight: 500 }}>{masked}</span>. Enter it below.
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, borderRadius: 10, padding: '0.6rem 0.8rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* OTP inputs */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  aria-label={`OTP digit ${i + 1}`}
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 600,
                    color: C.fg, background: digit ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.3)',
                    border: `1.5px solid ${digit ? 'rgba(34,197,94,0.4)' : C.border}`,
                    borderRadius: 12, transition: 'border-color 150ms, background 150ms',
                  }}
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.some(d => !d)}
              style={{ width: '100%', padding: '0.72rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, border: 'none', cursor: (loading || otp.some(d => !d)) ? 'not-allowed' : 'pointer', opacity: (loading || otp.some(d => !d)) ? 0.6 : 1, transition: 'opacity 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Verifying…
                </>
              ) : (type === 'verify' ? 'Verify email' : 'Continue')}
            </button>
          </form>

          {/* Resend */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            {cooldown > 0 ? (
              <p style={{ fontSize: 12, color: C.muted }}>
                Resend code in <span style={{ color: C.fg, fontFamily: "'DM Mono', monospace" }}>{cooldown}s</span>
              </p>
            ) : (
              <button onClick={handleResend} disabled={resending}
                style={{ fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer', opacity: resending ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>
        </div>

        {/* Back link */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
          <Link to={type === 'verify' ? '/register' : '/forgot-password'} style={{ color: C.muted, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = C.fg}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}>
            ← Back
          </Link>
        </p>
      </div>
    </div>
  )
}