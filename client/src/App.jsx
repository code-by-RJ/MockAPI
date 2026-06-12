import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import ProjectDetail  from './pages/ProjectDetail'
import SchemaBuilder  from './pages/SchemaBuilder'
import EndpointViewer from './pages/EndpointViewer'
import ShareableDemo  from './pages/ShareableDemo'

// Bug 4 fix: BrowserRouter removed — it lives in main.jsx already (via ToastProvider wrapper)
// Having two BrowserRouters causes "cannot render Router inside Router" crash

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/demo/:slug" element={<ShareableDemo />} />

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
      </Routes>
    </AuthProvider>
  )
}