import axios from 'axios'

// Now uses env var in prod, Vite proxy (/api) in dev
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends the httpOnly auth cookie on every request automatically
})

// No request interceptor needed anymore — the browser attaches the httpOnly
// cookie itself. There's also nothing for client-side JS to read or attach,
// which is the whole point (an XSS payload can no longer steal the token).

// Auto logout ONLY on 401 (token invalid / expired)
// 403 = authenticated but limit/permission hit — do NOT logout
// Skip auth endpoints — login/register handle their own 401s (wrong password etc.)
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/reset-password', '/auth/me']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthEndpoint = AUTH_ENDPOINTS.some(e => url.includes(e))
    if (err.response?.status === 401 && !isAuthEndpoint) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api