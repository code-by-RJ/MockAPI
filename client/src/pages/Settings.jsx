import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../lib/axios'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
}

const STRONG_PASSWORD = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Shared sub-components ────────────────────────────────────────────

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6 }}>{children}</label>
}

function Input({ type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '0.65rem 1rem', fontSize: 14, color: C.fg,
        fontFamily: "'DM Sans', sans-serif", outline: 'none',
      }}
    />
  )
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

function SaveBtn({ loading, label = 'Save Changes', disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        marginTop: 18, padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none',
        background: loading || disabled ? C.accentDim : C.accent,
        color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.7 : 1, transition: 'opacity 150ms',
      }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: '1.5rem',
    }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.fg }}>{title}</h2>
      {subtitle && <p style={{ margin: '0 0 20px', fontSize: 13, color: C.muted }}>{subtitle}</p>}
      <div style={{ marginTop: subtitle ? 0 : 16 }}>{children}</div>
    </div>
  )
}

// ── Profile card (name) ──────────────────────────────────────────────

function ProfileCard() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [name, setName]   = useState(user?.name || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', { name: name.trim() })
      updateUser({ name: res.data.user.name })
      toast('Name updated', 'success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update name')
    } finally { setLoading(false) }
  }

  const unchanged = name.trim() === (user?.name || '').trim()

  return (
    <Card title="Profile" subtitle="Update your display name">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Label>Email</Label>
          <p style={{ margin: 0, fontSize: 14, color: C.muted,
            background: 'rgba(0,0,0,0.15)', border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '0.65rem 1rem' }}>
            {user?.email}
          </p>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={name} onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Your name" autoComplete="name"
          />
          <FieldError msg={error} />
        </div>
        <div>
          <SaveBtn loading={loading} disabled={unchanged} onClick={handleSave} />
          {/* Attach onClick directly since this isn't a form */}
        </div>
      </div>
    </Card>
  )
}

// ── Change password card ─────────────────────────────────────────────

function PasswordCard() {
  const toast = useToast()
  const [fields, setFields] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(key) { return e => { setFields(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })) } }

  function validate() {
    const e = {}
    if (!fields.current) e.current = 'Current password is required'
    if (!fields.next) e.next = 'New password is required'
    else if (!STRONG_PASSWORD.test(fields.next)) e.next = 'Min 8 characters with at least 1 letter and 1 number'
    if (!fields.confirm) e.confirm = 'Please confirm your new password'
    else if (fields.next !== fields.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await api.put('/auth/change-password', { currentPassword: fields.current, newPassword: fields.next })
      setFields({ current: '', next: '', confirm: '' })
      toast('Password updated', 'success')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update password'
      // Surface "current password incorrect" under the right field
      if (msg.toLowerCase().includes('current')) setErrors({ current: msg })
      else setErrors({ confirm: msg })
    } finally { setLoading(false) }
  }

  return (
    <Card title="Change Password" subtitle="You'll stay logged in on this device after changing">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'current', label: 'Current password',  auto: 'current-password' },
          { key: 'next',    label: 'New password',       auto: 'new-password' },
          { key: 'confirm', label: 'Confirm new password', auto: 'new-password' },
        ].map(({ key, label, auto }) => (
          <div key={key}>
            <Label>{label}</Label>
            <Input type="password" value={fields[key]} onChange={set(key)}
              placeholder={key === 'next' ? 'Min 8 chars, 1 letter & 1 number' : ''}
              autoComplete={auto} />
            <FieldError msg={errors[key]} />
          </div>
        ))}
        <div>
          <button type="button" onClick={handleSave}
            disabled={loading}
            style={{
              marginTop: 4, padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none',
              background: loading ? C.accentDim : C.accent,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </div>
    </Card>
  )
}

// ── Change email card (2-step: pw verify → OTP) ──────────────────────

function EmailCard() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [step, setStep]     = useState(1)   // 1 = form, 2 = OTP input
  const [pw, setPw]         = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp]       = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  async function handleRequest() {
    const e = {}
    if (!pw)                           e.pw       = 'Current password is required'
    if (!newEmail.trim())              e.newEmail  = 'New email is required'
    else if (!EMAIL_RE.test(newEmail)) e.newEmail  = 'Enter a valid email address'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      const res = await api.post('/auth/request-email-change', { currentPassword: pw, newEmail: newEmail.trim().toLowerCase() })
      setPendingEmail(newEmail.trim().toLowerCase())
      setErrors({})
      setStep(2)
      toast(res.data.message, 'success')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send OTP'
      if (msg.toLowerCase().includes('password')) setErrors({ pw: msg })
      else setErrors({ newEmail: msg })
    } finally { setLoading(false) }
  }

  async function handleConfirm() {
    if (!otp.trim()) { setErrors({ otp: 'OTP is required' }); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/confirm-email-change', { otp: otp.trim() })
      updateUser({ email: res.data.user.email })
      toast('Email updated successfully', 'success')
      setStep(1); setPw(''); setNewEmail(''); setOtp(''); setPendingEmail('')
    } catch (err) {
      setErrors({ otp: err.response?.data?.error || 'Verification failed' })
    } finally { setLoading(false) }
  }

  return (
    <Card title="Change Email" subtitle="An OTP will be sent to your new email to confirm the change">
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Current password</Label>
            <Input type="password" value={pw} onChange={e => { setPw(e.target.value); setErrors(er => ({ ...er, pw: '' })) }}
              placeholder="Verify it's you" autoComplete="current-password" />
            <FieldError msg={errors.pw} />
          </div>
          <div>
            <Label>New email address</Label>
            <Input type="email" value={newEmail} onChange={e => { setNewEmail(e.target.value); setErrors(er => ({ ...er, newEmail: '' })) }}
              placeholder="you@example.com" autoComplete="email" />
            <FieldError msg={errors.newEmail} />
          </div>
          <div>
            <button type="button" onClick={handleRequest} disabled={loading}
              style={{
                marginTop: 4, padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none',
                background: loading ? C.accentDim : C.accent,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Sending OTP…' : 'Send Verification OTP'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            OTP sent to <span style={{ color: C.fg }}>{pendingEmail}</span>. Valid for 10 minutes.
          </p>
          <div>
            <Label>Enter OTP</Label>
            <Input value={otp} onChange={e => { setOtp(e.target.value); setErrors({}) }}
              placeholder="6-digit code" autoComplete="one-time-code" />
            <FieldError msg={errors.otp} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleConfirm} disabled={loading}
              style={{
                padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none',
                background: loading ? C.accentDim : C.accent,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Verifying…' : 'Confirm Change'}
            </button>
            <button type="button" onClick={() => { setStep(1); setOtp(''); setErrors({}) }}
              style={{
                padding: '0.65rem 1rem', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 13, cursor: 'pointer',
              }}>
              Back
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.fg,
      fontFamily: "'DM Sans', sans-serif",
      padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 5vw, 2rem)',
    }}>
      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto 2rem' }}>
        <Link to="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: C.muted, textDecoration: 'none', marginBottom: 24,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 700 }}>Account Settings</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted }}>Manage your profile, password, and email</p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ProfileCard />
        <PasswordCard />
        <EmailCard />
      </div>
    </div>
  )
}