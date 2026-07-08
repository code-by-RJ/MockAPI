import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:22, height:22, border:'2px solid rgba(34,197,94,0.2)', borderTop:'2px solid #22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:'#94A3B8' }}>Loading…</div>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}