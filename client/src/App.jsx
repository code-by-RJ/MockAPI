import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Priority 6 fix — route-based code splitting.
// Previously every page was statically imported, so the entire app (~2.6 MB)
// was bundled into one chunk and shipped on every single route — login,
// register, dashboard, all of it. React.lazy + Suspense splits each page
// into its own chunk, so a visitor to /login only downloads Login's code.
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const VerifyOTP      = lazy(() => import('./pages/VerifyOTP'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const ProjectDetail  = lazy(() => import('./pages/ProjectDetail'))
const SchemaBuilder  = lazy(() => import('./pages/SchemaBuilder'))
const EndpointViewer = lazy(() => import('./pages/EndpointViewer'))
const ShareableDemo  = lazy(() => import('./pages/ShareableDemo'))
const NotFound       = lazy(() => import('./pages/NotFound'))
const Settings       = lazy(() => import('./pages/Settings'))

// Bug 4 fix: BrowserRouter removed — it lives in main.jsx already (via ToastProvider wrapper)
// Having two BrowserRouters causes "cannot render Router inside Router" crash

// Item 12: keep already-logged-in users out of /login, /register — bounce to dashboard instead
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// Minimal, near-instant fallback — avoids a jarring blank screen while a
// route chunk downloads. Kept lightweight on purpose (no fonts/animation
// dependency) so it never itself becomes a layout-shift source.
function RouteFallback() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F172A' }} role="status" aria-label="Loading page">
      <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.15)', borderTopColor:'#22C55E', animation:'app-spin 0.7s linear infinite' }} />
      <style>{`@keyframes app-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register"        element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/verify-otp"      element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/demo/:slug"      element={<ShareableDemo />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/project/:slug" element={
            <ProtectedRoute><ProjectDetail /></ProtectedRoute>
          } />
          <Route path="/project/:slug/resource/:name" element={
            <ProtectedRoute><SchemaBuilder /></ProtectedRoute>
          } />
          <Route path="/project/:slug/resource/:name/endpoints" element={
            <ProtectedRoute><EndpointViewer /></ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}