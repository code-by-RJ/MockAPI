import { useState, useEffect, useCallback } from 'react'
import { useParams, Link }                   from 'react-router-dom'
import api from '../lib/axios'
import { useToast }        from '../context/ToastContext'
import { TableRowSkeleton } from '../components/Skeleton'
import RequestLogsPanel    from '../components/RequestLogsPanel'
import ConfirmModal        from '../components/ConfirmModal'

const C = { bg:"#0F172A",surface:"#1E293B",surface2:"#272F42",border:"#334155",fg:"#F8FAFC",muted:"#94A3B8",accent:"#22C55E",accentDim:"#16A34A",red:"#EF4444" }

const FONTS = '' // fonts loaded globally via index.css

const ANIM  = `@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.page-enter{animation:pageIn 0.35s ease forwards}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @media(max-width:600px){
    .pd-nav{padding:0 1rem !important;height:auto !important;flex-wrap:wrap;gap:8px;padding-top:0.75rem !important;padding-bottom:0.75rem !important}
    .pd-nav-left{gap:6px !important;flex-wrap:wrap}
    .pd-breadcrumb-mid{display:none !important}
    .pd-new-res-txt{display:none}
    .pd-new-res-sm{display:inline !important}
    .pd-base-row{flex-direction:column !important;align-items:flex-start !important;gap:10px !important}
    .pd-base-btn{margin-left:0 !important;max-width:100% !important;width:100% !important}
    .pd-base-btn span:first-child{max-width:calc(100vw - 120px) !important}
  }
`

export default function ProjectDetail() {
  const { slug }  = useParams()
  const { toast } = useToast()

  const [resources, setResources]   = useState([])
  const [project, setProject]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [newName, setNewName]       = useState('')
  const [nameError, setNameError]   = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [baseCopied, setBaseCopied] = useState(false)
  const [confirmOpen, setConfirmOpen]           = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState(null)
  const [deleting, setDeleting]                 = useState(false)
  // Priority 4
  const [recordCounts, setRecordCounts] = useState({})  // { [resourceName]: number }
  const [seeding, setSeeding]           = useState({})   // { [resourceName]: boolean }

  const BASE_URL = `${import.meta.env.VITE_API_URL || window.location.origin}/api/${slug}`

  // Fetch record counts from engine API — now requires JWT since private
  // projects (isPublic: false) are guarded at the engine pipeline level.
  // Owner's token always works since pipeline checks token.userId === project.owner.
  const fetchRecordCounts = useCallback(async (resourceList) => {
    if (!resourceList || resourceList.length === 0) return
    const token = localStorage.getItem('token')
    const results = await Promise.allSettled(
      resourceList.map(async (r) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/${slug}/${r.name}?limit=1`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          const data = await res.json()
          return { name: r.name, total: data.total ?? 0 }
        } catch {
          return { name: r.name, total: 0 }
        }
      })
    )
    const counts = {}
    results.forEach(result => {
      if (result.status === 'fulfilled') counts[result.value.name] = result.value.total
    })
    setRecordCounts(counts)
  }, [slug])

  const fetchData = useCallback(async () => {
    try {
      const [projRes, resRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/projects/${slug}/resources`)
      ])
      const found = projRes.data.data?.find(p => p.slug === slug)
      setProject(found || null)
      const resList = resRes.data.data || []
      setResources(resList)
      // Fetch record counts in parallel (non-blocking)
      fetchRecordCounts(resList)
    } catch { toast('Failed to load project', 'error') }
    finally { setLoading(false) }
  }, [slug, toast, fetchRecordCounts])

  useEffect(() => { fetchData() }, [fetchData])

  const copyBase = () => {
    navigator.clipboard.writeText(BASE_URL)
    setBaseCopied(true)
    toast('Base URL copied', 'copy')
    setTimeout(() => setBaseCopied(false), 2000)
  }

  const RESOURCE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/
  const validateResourceName = (val) => {
    const v = val.trim().toLowerCase()
    if (!v)                               return 'Resource name is required'
    if (v.length < 2)                     return 'Name must be at least 2 characters'
    if (v.length > 40)                    return 'Name must be under 40 characters'
    if (/\s/.test(val))                   return 'Spaces not allowed — use hyphens instead'
    if (!RESOURCE_NAME_RE.test(v))        return 'Only lowercase letters, numbers and hyphens'
    if (resources.some(r => r.name === v)) return `"${v}" already exists in this project`
    return ''
  }

  const handleNameChange = (e) => {
    setNewName(e.target.value)
    if (nameTouched) setNameError(validateResourceName(e.target.value))
  }

  const closeModal = useCallback(() => {
    setShowModal(false); setNewName(''); setNameError(''); setNameTouched(false)
  }, [])

  useEffect(() => {
    if (!showModal) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showModal, closeModal])

  const createResource = async () => {
    setNameTouched(true)
    const err = validateResourceName(newName)
    if (err) { setNameError(err); return }
    setCreating(true)
    try {
      await api.post(`/projects/${slug}/resources`, { name: newName.toLowerCase().trim(), schema: [] })
      toast(`Resource "${newName.toLowerCase().trim()}" created`, 'success')
      closeModal(); fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('limit')) {
        toast(msg, 'error'); closeModal()
      } else if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate')) {
        setNameError(`"${newName.toLowerCase().trim()}" already exists.`)
      } else { toast(msg || 'Failed to create resource', 'error') }
    } finally { setCreating(false) }
  }

  const handleDeleteClick = (r) => { setResourceToDelete(r); setConfirmOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${slug}/resources/${resourceToDelete.name}`)
      toast(`"${resourceToDelete.name}" deleted`, 'success')
      setResources(p => p.filter(r => r.name !== resourceToDelete.name))
      setRecordCounts(c => { const n = {...c}; delete n[resourceToDelete.name]; return n })
      setConfirmOpen(false); setResourceToDelete(null)
    } catch { toast('Failed to delete resource', 'error') }
    finally { setDeleting(false) }
  }

  // Priority 4 — re-seed: replace all records with 10 fresh faker records
  const handleReseed = async (resourceName) => {
    setSeeding(s => ({ ...s, [resourceName]: true }))
    try {
      await api.post(`/projects/${slug}/resources/${resourceName}/seed`)
      toast(`"${resourceName}" re-seeded with 10 fresh records`, 'success')
      // Refresh count for this resource
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/${slug}/${resourceName}?limit=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json()
        setRecordCounts(c => ({ ...c, [resourceName]: data.total ?? 10 }))
      } catch { setRecordCounts(c => ({ ...c, [resourceName]: 10 })) }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to re-seed'
      toast(msg, 'error')
    } finally {
      setSeeding(s => ({ ...s, [resourceName]: false }))
    }
  }

  return (
    <div className="page-enter" style={{ minHeight:'100vh', background:C.bg, color:C.fg, fontFamily:"'DM Sans', sans-serif" }}>
      <style>{FONTS}{ANIM}{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        input::placeholder{color:#475569}
        .row-hover:hover{background:rgba(255,255,255,0.02)}
        .action-btn{display:inline-flex;align-items:center;padding:0.25rem 0.6rem;border-radius:8px;border:1px solid ${C.border};background:transparent;color:${C.muted};font-size:11px;cursor:pointer;transition:color 150ms,border-color 150ms;font-family:'DM Sans',sans-serif;text-decoration:none}
        .action-btn:hover{color:${C.fg};border-color:${C.muted}}
        .del-btn{display:inline-flex;align-items:center;padding:0.25rem 0.5rem;border-radius:8px;background:transparent;border:none;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;transition:color 150ms,background 150ms}
        .del-btn:hover{color:${C.red};background:rgba(239,68,68,0.08)}
      `}</style>

      {/* NAVBAR */}
      <nav className="pd-nav" style={{ borderBottom:`1px solid ${C.border}`, padding:'0 clamp(1.5rem,5vw,3rem)', height:60, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="pd-nav-left" style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:13, color:C.muted }}>
            <Link to="/dashboard" style={{ color:C.muted, textDecoration:'none', transition:'color 150ms' }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>Dashboard</Link>
            <span className="pd-breadcrumb-mid" style={{ color:'#475569' }}>/</span>
            <span style={{ color:C.fg }}>{slug}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {project?.isPublic && (
              <Link to={`/demo/${slug}`} target="_blank" style={{ fontSize:11, padding:'0.3rem 0.7rem', borderRadius:8, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.08)', color:C.accent, textDecoration:'none', fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>↗ Demo</Link>
            )}
            <button onClick={()=>setShowModal(true)} aria-label="New Resource" style={{ fontSize:13, padding:'0.4rem 1rem', borderRadius:8, background:C.accent, color:'#0F172A', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, border:'none', cursor:'pointer', transition:'background 150ms' }} onMouseEnter={e=>e.currentTarget.style.background=C.accentDim} onMouseLeave={e=>e.currentTarget.style.background=C.accent}>
              + <span className="pd-new-res-txt">New Resource</span><span style={{display:'none'}} className="pd-new-res-sm">New</span>
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem clamp(1.5rem,5vw,3rem)' }}>

        {/* Project meta */}
        <div className="pd-base-row" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, marginBottom:28 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, padding:'0.25rem 0.65rem', borderRadius:100, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.03)', color:C.muted }}>/{slug}</span>
          {project?.isPublic && (
            <span style={{ fontSize:10, padding:'0.2rem 0.6rem', borderRadius:100, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.08)', color:C.accent, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>Public</span>
          )}
          <button onClick={copyBase} className="pd-base-btn" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:11, padding:'0.4rem 0.85rem', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${C.border}`, color:baseCopied?C.accent:C.muted, cursor:'pointer', transition:'color 150ms', maxWidth:320 }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:240 }}>{BASE_URL}</span>
            <span>⎘</span>
          </button>
        </div>

        {/* Resources table */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'Space Grotesk',sans-serif", marginBottom:12 }}>Resources</div>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}><div style={{ overflowX:'auto' }}>
            {/* Head */}
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0.6rem 1rem', background:'rgba(255,255,255,0.02)', borderBottom:`1px solid ${C.border}`, minWidth:580 }}>
              {['Name','Endpoint','Fields','Records','Actions'].map((h,i)=>(
                <span key={h} style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.3)', width:i===0?144:i===2?56:i===3?70:i===4?136:'auto', flex:i===1?1:undefined, textAlign:i===2||i===3||i===4?'center':undefined, fontFamily:"'Space Grotesk',sans-serif" }}>{h}</span>
              ))}
            </div>

            {loading ? (
              Array.from({length:3}).map((_,i)=><TableRowSkeleton key={i} cols={4}/>)
            ) : resources.length === 0 ? (
              <div style={{ padding:'4rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:12, border:`1px solid rgba(34,197,94,0.15)`, background:'rgba(34,197,94,0.05)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <p style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.5)', marginBottom:6, fontFamily:"'Space Grotesk',sans-serif" }}>No resources yet</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', maxWidth:260, marginBottom:20, lineHeight:1.6 }}>Resources are your API endpoints — like <code style={{fontFamily:"'DM Mono',monospace",color:'rgba(255,255,255,0.4)'}}>users</code> or <code style={{fontFamily:"'DM Mono',monospace",color:'rgba(255,255,255,0.4)'}}>products</code>. Each gets full CRUD automatically.</p>
                <button onClick={()=>setShowModal(true)} style={{ fontSize:12, padding:'0.5rem 1.25rem', borderRadius:8, background:C.accent, color:'#0F172A', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, border:'none', cursor:'pointer' }}>+ Add first resource</button>
              </div>
            ) : (
              resources.map(r => (
                <div key={r.name} className="row-hover" style={{ display:'flex', alignItems:'center', gap:16, padding:'0.75rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.04)`, transition:'background 150ms', minWidth:580 }}>
                  <span style={{ width:144, fontFamily:"'DM Mono',monospace", fontSize:13, color:C.fg, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                  <span style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{BASE_URL}/{r.name}</span>
                  <span style={{ width:56, textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.4)' }}>{r.schema?.length ?? 0}</span>
                  {/* Records count — fetched from engine API */}
                  <span style={{ width:70, textAlign:'center', fontSize:12, fontFamily:"'DM Mono',monospace", color: recordCounts[r.name] !== undefined ? C.accent : 'rgba(255,255,255,0.2)' }}>
                    {recordCounts[r.name] !== undefined ? recordCounts[r.name] : '—'}
                  </span>
                  <div style={{ width:136, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5 }}>
                    <Link to={`/project/${slug}/resource/${r.name}`} className="action-btn">Edit</Link>
                    <Link to={`/project/${slug}/resource/${r.name}/endpoints`} className="action-btn">API</Link>
                    {/* Re-seed button */}
                    <button
                      onClick={() => handleReseed(r.name)}
                      disabled={seeding[r.name]}
                      aria-label={`Re-seed ${r.name}`}
                      title={r.schema?.length > 0 ? 'Re-seed with 10 fresh records' : 'Add schema fields first'}
                      style={{ display:'inline-flex', alignItems:'center', padding:'0.25rem 0.45rem', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color: seeding[r.name] ? C.accent : C.muted, cursor: r.schema?.length > 0 ? (seeding[r.name] ? 'not-allowed' : 'pointer') : 'default', fontSize:11, transition:'color 150ms,border-color 150ms', opacity: r.schema?.length === 0 ? 0.35 : 1 }}
                      onMouseEnter={e => { if (r.schema?.length > 0 && !seeding[r.name]) { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)' } }}
                      onMouseLeave={e => { if (!seeding[r.name]) { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border } }}
                    >
                      {seeding[r.name] ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                      )}
                    </button>
                    <button onClick={()=>handleDeleteClick(r)} className="del-btn" aria-label={`Delete ${r.name}`}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>

        {/* Request Logs */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'Space Grotesk',sans-serif", marginBottom:12 }}>Request Logs</div>
          <RequestLogsPanel projectSlug={slug} />
        </div>
      </div>

      {/* Create Resource Modal */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)closeModal()}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ width:'100%', maxWidth:380, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, color:C.fg, marginBottom:4 }}>New Resource</h3>
            <p style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Lowercase letters, numbers, hyphens only</p>
            <div style={{ marginBottom:16 }}>
              <input autoFocus type="text" placeholder="e.g. users, products, blog-posts" value={newName} onChange={handleNameChange}
                onBlur={()=>{setNameTouched(true);setNameError(validateResourceName(newName))}}
                onKeyDown={e=>e.key==='Enter'&&createResource()}
                style={{ width:'100%', background:nameError&&nameTouched?'rgba(239,68,68,0.05)':'rgba(0,0,0,0.3)', border:`1px solid ${nameError&&nameTouched?'rgba(239,68,68,0.5)':C.border}`, borderRadius:10, padding:'0.65rem 1rem', fontFamily:"'DM Mono',monospace", fontSize:13, color:C.fg, outline:'none', boxSizing:'border-box' }}/>
              {nameError && nameTouched && <p style={{ marginTop:6, fontSize:11, color:C.red, display:'flex', alignItems:'center', gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2"/></svg>{nameError}</p>}
              {newName.trim() && !nameError && <p style={{ marginTop:6, fontSize:11, fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.25)' }}>endpoint: <span style={{color:C.accent}}>/api/{slug}/{newName.toLowerCase().trim()}</span></p>}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeModal} style={{ flex:1, padding:'0.6rem', borderRadius:10, border:`1px solid ${C.border}`, background:'transparent', fontSize:13, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }} onMouseEnter={e=>{e.currentTarget.style.color=C.fg;e.currentTarget.style.borderColor=C.muted}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border}}>Cancel</button>
              <button onClick={createResource} disabled={creating} style={{ flex:1, padding:'0.6rem', borderRadius:10, background:creating?C.accentDim:C.accent, color:'#0F172A', fontSize:13, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, border:'none', cursor:creating?'not-allowed':'pointer', opacity:creating?0.7:1 }}>{creating?'Creating…':'Create'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={()=>{if(!deleting){setConfirmOpen(false);setResourceToDelete(null)}}}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete resource?"
        message={resourceToDelete?<>All data in <span style={{color:C.fg,fontWeight:500}}>"{resourceToDelete.name}"</span> will be permanently deleted.</>:'This action cannot be undone.'}
        confirmLabel="Delete Resource"
        variant="danger"
      />
    </div>
  )
}