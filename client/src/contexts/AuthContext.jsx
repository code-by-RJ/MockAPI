import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import api from '../lib/axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — no token to read locally anymore. The httpOnly cookie (if any)
  // is attached automatically by the browser, so we just ask the server who
  // we are; a missing/expired cookie simply 401s and we stay logged out.
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    setUser(res.data.user)
    return res.data
  }, [])

  // Register no longer stores token — user must verify OTP first
  // Returns { success, message, email } — caller navigates to /verify-otp
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
  }, [])

  // Called by VerifyOTP + any other post-OTP flow to finish auth.
  // First arg kept for backward compat with existing callers — the server
  // already set the httpOnly cookie in its response, so it's unused here.
  const loginWithToken = useCallback((_token, userData) => {
    setUser(userData)
  }, [])

  // Clear local state immediately for an instant redirect feel; the cookie-clear
  // request to the server runs in the background and is fire-and-forget — even
  // if it fails, the cookie will just expire naturally (7d maxAge as backstop).
  const logout = useCallback(() => {
    setUser(null)
    api.post('/auth/logout').catch(() => {})
  }, [])

  const updateUser = useCallback((partial) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)