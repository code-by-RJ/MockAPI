import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import VerifyOTP      from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Dashboard      from './pages/Dashboard'
import ProjectDetail  from './pages/ProjectDetail'
import SchemaBuilder  from './pages/SchemaBuilder'
import EndpointViewer from './pages/EndpointViewer'
import ShareableDemo  from './pages/ShareableDemo'
import NotFound       from './pages/NotFound'
import Settings       from './pages/Settings'

// Bug 4 fix: BrowserRouter removed — it lives in main.jsx already (via ToastProvider wrapper)
// Having two BrowserRouters causes "cannot render Router inside Router" crash

// Item 12: keep already-logged-in users out of /login, /register — bounce to dashboard instead
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}