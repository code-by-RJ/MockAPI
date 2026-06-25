import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import api from '../lib/axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — verify token with /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }, [])

  // Register no longer stores token — user must verify OTP first
  // Returns { success, message, email } — caller navigates to /verify-otp
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
  }, [])

  // Called by VerifyOTP + any other post-OTP flow to finish auth
  const loginWithToken = useCallback((token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
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