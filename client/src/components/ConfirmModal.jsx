import { useEffect, useRef } from 'react'

const C = {
  surface:"#1E293B", border:"#334155", fg:"#F8FAFC", muted:"#94A3B8",
  accent:"#22C55E", accentDim:"#16A34A", red:"#EF4444",
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  title='Are you sure?', message='This action cannot be undone.',
  confirmLabel='Delete', loading=false, variant='danger',
}) {
  const confirmBtnRef = useRef(null)
  const isDanger = variant === 'danger'

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, loading, onClose])

  useEffect(() => {
    if (isOpen) setTimeout(() => confirmBtnRef.current?.focus(), 50)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
    >
      <div role="dialog" aria-modal="true" style={{ width:'100%', maxWidth:360, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        {/* Top accent line */}
        <div style={{ height:2, background: isDanger ? 'rgba(239,68,68,0.7)' : `rgba(34,197,94,0.7)` }}/>

        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Icon + Title */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ marginTop:2, flexShrink:0, width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: isDanger ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
              {isDanger ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, color:C.fg, lineHeight:1.3 }}>{title}</h3>
              <p style={{ marginTop:6, fontSize:13, color:C.muted, lineHeight:1.6 }}>{message}</p>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <button
              onClick={onClose} disabled={loading}
              style={{ flex:1, padding:'0.65rem', borderRadius:10, border:`1px solid ${C.border}`, background:'transparent', fontSize:13, color:C.muted, cursor:loading?'not-allowed':'pointer', opacity:loading?0.4:1, transition:'color 150ms,border-color 150ms', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>{e.currentTarget.style.color=C.fg;e.currentTarget.style.borderColor=C.muted}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border}}
            >Cancel</button>
            <button
              ref={confirmBtnRef}
              onClick={onConfirm} disabled={loading}
              style={{ flex:1, padding:'0.65rem', borderRadius:10, background: isDanger ? C.red : C.accent, color: isDanger ? '#fff' : '#0F172A', fontSize:13, fontWeight:600, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?0.5:1, transition:'background 150ms', fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              onMouseEnter={e=>e.currentTarget.style.background=isDanger?'#DC2626':C.accentDim}
              onMouseLeave={e=>e.currentTarget.style.background=isDanger?C.red:C.accent}
            >
              {loading ? (
                <>
                  <svg style={{ animation:'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {confirmLabel}…
                </>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}