import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/axios'
import { useToast } from '../contexts/ToastContext'
import { CardSkeleton } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'

const C = {
  bg: "#0F172A", surface: "#1E293B", surface2: "#272F42",
  border: "#334155", fg: "#F8FAFC", muted: "#94A3B8",
  accent: "#22C55E", accentDim: "#16A34A", red: "#EF4444",
}

function ProjectCard({ project, onDeleteClick, onRenameClick }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const BASE_URL = `${import.meta.env.VITE_API_URL || window.location.origin}/api/${project.slug}`

  const copyBase = (e) => {
    e.preventDefault()
    navigator.clipboard.writeText(BASE_URL)
    setCopied(true)
    toast('Base URL copied', 'copy')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '1.25rem', transition: 'border-color 200ms, transform 200ms, box-shadow 200ms', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Priority 2 fix (nested-interactive): whole-card click/keyboard target lives
          in its own full-bleed link BEHIND the content, instead of wrapping the
          action buttons in an <a>. Buttons below are plain siblings now — never
          descendants of an interactive element. */}
      <Link to={`/project/${project.slug}`} aria-label={`Open project ${project.name}`} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10, position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>/{project.slug}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          {project.isPublic && (
            <span style={{ fontSize: 10, padding: '0.2rem 0.6rem', borderRadius: 100, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)', color: C.accent, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>Public</span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '0.2rem 0.55rem', borderRadius: 100, border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)', color: C.muted, fontFamily: "'DM Mono', monospace" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            {project.resourceCount ?? 0}
          </span>
        </div>
      </div>

      {/* Date */}
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 12, position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        Created {new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Actions — plain siblings of the Link above, not nested inside it */}
      <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
        <button onClick={copyBase} style={{ flex: 1, fontSize: 11, padding: '0.4rem 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: copied ? C.accent : C.muted, cursor: 'pointer', transition: 'color 150ms, border-color 150ms', fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
          onMouseLeave={e => { e.currentTarget.style.color = copied ? C.accent : C.muted; e.currentTarget.style.borderColor = C.border }}
        >
          {copied ? '✓ Copied' : '⎘ Copy URL'}
        </button>
        <button onClick={() => onRenameClick(project)} title="Rename project" style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', transition: 'color 150ms, border-color 150ms, background 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button onClick={() => onDeleteClick(project)} style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontSize: 13, transition: 'color 150ms, border-color 150ms, background 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}
        >✕</button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()
  const { toast } = useToast()

  const [projects, setProjects]   = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName]     = useState('')
  const [nameError, setNameError] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [creating, setCreating]   = useState(false)
  const [confirmOpen, setConfirmOpen]         = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting]               = useState(false)
  const [renameOpen, setRenameOpen]           = useState(false)
  const [projectToRename, setProjectToRename] = useState(null)
  const [renameValue, setRenameValue]         = useState('')
  const [renameError, setRenameError]         = useState('')
  const [renameTouched, setRenameTouched]     = useState(false)
  const [renaming, setRenaming]               = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data.data || [])
    } catch { toast('Failed to load projects', 'error') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const logout = () => { authLogout(); navigate('/login') }

  const validateName = (val) => {
    if (!val.trim())             return 'Project name is required'
    if (val.trim().length < 2)  return 'Name must be at least 2 characters'
    if (val.trim().length > 60) return 'Name must be under 60 characters'
    return ''
  }

  const handleNameChange = (e) => {
    setNewName(e.target.value)
    if (nameTouched) setNameError(validateName(e.target.value))
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

  const createProject = async () => {
    setNameTouched(true)
    const err = validateName(newName)
    if (err) { setNameError(err); return }
    setCreating(true)
    try {
      const res = await api.post('/projects', { name: newName.trim() })
      toast(`"${res.data.project.name}" created`, 'success')
      setProjects(p => [{ ...res.data.project, resourceCount: 0 }, ...p])
      closeModal()
    } catch (err) {
      const msg = err.response?.data?.error || ''
      if (msg.toLowerCase().includes('limit')) {
        setNameError(msg)
      } else if (msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('exists')) {
        setNameError('A project with a similar name already exists.')
      } else { toast(msg || 'Failed to create project', 'error') }
    } finally { setCreating(false) }
  }

  const handleDeleteClick = (project) => { setProjectToDelete(project); setConfirmOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${projectToDelete.slug}`)
      toast(`"${projectToDelete.name}" deleted`, 'success')
      setProjects(p => p.filter(pr => pr.slug !== projectToDelete.slug))
      setConfirmOpen(false); setProjectToDelete(null)
    } catch { toast('Failed to delete project', 'error') }
    finally { setDeleting(false) }
  }

  const handleRenameClick = (project) => {
    setProjectToRename(project); setRenameValue(project.name); setRenameOpen(true)
  }

  const closeRenameModal = useCallback(() => {
    setRenameOpen(false); setProjectToRename(null); setRenameValue(''); setRenameError(''); setRenameTouched(false)
  }, [])

  useEffect(() => {
    if (!renameOpen) return
    const handler = (e) => { if (e.key === 'Escape') closeRenameModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [renameOpen, closeRenameModal])

  const handleRenameConfirm = async () => {
    setRenameTouched(true)
    const err = validateName(renameValue)
    if (err) { setRenameError(err); return }
    if (renameValue.trim() === projectToRename.name) { closeRenameModal(); return }
    setRenaming(true)
    try {
      const res = await api.patch(`/projects/${projectToRename.slug}`, { name: renameValue.trim() })
      toast(`Renamed to "${res.data.project.name}"`, 'success')
      setProjects(p => p.map(pr => pr.slug === projectToRename.slug ? { ...pr, ...res.data.project } : pr))
      closeRenameModal()
    } catch (err) {
      const msg = err.response?.data?.error || ''
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('slug')) {
        setRenameError('A project with a similar name already exists.')
      } else { toast(msg || 'Failed to rename project', 'error') }
    } finally { setRenaming(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.fg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .dash-logout-icon{display:none}
        @media(max-width:500px){
          .dash-nav-inner{padding:0 1rem !important}
          .dash-new-btn-txt{display:none}
          .dash-logout-txt{display:none}
          .dash-logout-icon{display:inline}
          .dash-logout{padding:0.45rem 0.6rem !important;min-width:32px}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(1.5rem, 5vw, 3rem)', height: 64, display: 'flex', alignItems: 'center' }}>
        <div className="dash-nav-inner" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.fg }}>MockAPI</span>
            <span style={{ fontSize: 10, padding: '0.15rem 0.5rem', borderRadius: 100, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: C.accent, fontFamily: "'DM Mono', monospace" }}>beta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowModal(true)} aria-label="New Project" style={{ fontSize: 13, padding: '0.45rem 1rem', borderRadius: 8, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}
            >+ <span className="dash-new-btn-txt">New Project</span></button>
            <Link to="/settings" aria-label="Settings" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, color: C.muted, textDecoration: 'none', transition: 'color 150ms, border-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </Link>
            <button onClick={logout} className="dash-logout" aria-label="Logout" style={{ fontSize: 13, padding: '0.45rem 0.85rem', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', transition: 'color 150ms, border-color 150ms', fontFamily: "'DM Sans', sans-serif", display:'flex', alignItems:'center', gap:6 }}
              onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
            >
              <span className="dash-logout-txt">Logout</span>
              <svg className="dash-logout-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem clamp(1.5rem, 5vw, 3rem)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, color: C.fg }}>Your Projects</h1>
          {!loading && (
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {projects.length === 0 ? 'No projects yet — create one to get started' : `${projects.length} project${projects.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {/* Search — only when projects exist */}
        {!loading && projects.length > 0 && (
          <div style={{ marginBottom: 20, position: 'relative', maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Filter projects…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Filter projects by name"
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${searchQuery ? 'rgba(34,197,94,0.3)' : C.border}`, borderRadius: 10, padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: 13, color: C.fg, fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="Clear filter"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 16, border: `1px dashed ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h2M7 11h5"/>
                </svg>
              </div>
              <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,197,94,0.4)', border: '1px solid rgba(34,197,94,0.3)' }}/>
            </div>

            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg, marginBottom: 6 }}>No projects yet</h2>
            <p style={{ fontSize: 13, color: C.muted, maxWidth: 280, marginBottom: 8, lineHeight: 1.6 }}>Create your first project to start generating mock REST APIs with fake data.</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '12px 0 28px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['Auto-generates slug'],['Faker-powered data'],['Instant live endpoints']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowModal(true)} style={{ fontSize: 13, padding: '0.6rem 1.5rem', borderRadius: 10, background: C.accent, color: '#0F172A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}
            >+ Create your first project</button>
          </div>
        ) : (() => {
          const q = searchQuery.trim().toLowerCase()
          const filtered = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.slug.includes(q)) : projects
          if (filtered.length === 0) {
            return (
              <div style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 16, border: `1px dashed ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ marginBottom: 14, opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>No projects match "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} style={{ fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Clear filter</button>
              </div>
            )
          }
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(p => <ProjectCard key={p.slug} project={p} onDeleteClick={handleDeleteClick} onRenameClick={handleRenameClick} />)}
            </div>
          )
        })()}
      </main>

      {/* CREATE MODAL */}
      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg }}>New Project</h3>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>A slug will be auto-generated from the name</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                autoFocus type="text" placeholder="My ecommerce app"
                value={newName} onChange={handleNameChange}
                onBlur={() => { setNameTouched(true); setNameError(validateName(newName)) }}
                onKeyDown={e => e.key === 'Enter' && createProject()}
                style={{ width: '100%', background: nameError && nameTouched ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)', border: `1px solid ${nameError && nameTouched ? 'rgba(239,68,68,0.5)' : C.border}`, borderRadius: 10, padding: '0.65rem 1rem', fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
              />
              {nameError && nameTouched && (
                <p style={{ marginTop: 6, fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2"/></svg>
                  {nameError}
                </p>
              )}
            </div>

            {newName.trim() && !nameError && nameTouched && (
              <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, marginBottom: 16 }}>
                slug: <span style={{ color: C.accent }}>{newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</span>
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 13, color: C.muted, cursor: 'pointer', transition: 'color 150ms, border-color 150ms', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
              >Cancel</button>
              <button onClick={createProject} disabled={creating} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: creating ? C.accentDim : C.accent, color: '#0F172A', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, border: 'none', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, transition: 'background 150ms' }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* RENAME MODAL */}
      {renameOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) closeRenameModal() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg }}>Rename Project</h3>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>A new slug will be auto-generated from the name</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                autoFocus type="text" placeholder="My ecommerce app"
                value={renameValue}
                onChange={e => { setRenameValue(e.target.value); if (renameTouched) setRenameError(validateName(e.target.value)) }}
                onBlur={() => { setRenameTouched(true); setRenameError(validateName(renameValue)) }}
                onKeyDown={e => e.key === 'Enter' && handleRenameConfirm()}
                style={{ width: '100%', background: renameError && renameTouched ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)', border: `1px solid ${renameError && renameTouched ? 'rgba(239,68,68,0.5)' : C.border}`, borderRadius: 10, padding: '0.65rem 1rem', fontSize: 14, color: C.fg, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
              />
              {renameError && renameTouched && (
                <p style={{ marginTop: 6, fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2"/></svg>
                  {renameError}
                </p>
              )}
              {renameValue.trim() && !renameError && renameTouched && (
                <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, marginTop: 6 }}>
                  new slug: <span style={{ color: C.accent }}>{renameValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</span>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeRenameModal} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 13, color: C.muted, cursor: 'pointer', transition: 'color 150ms, border-color 150ms', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.color = C.fg; e.currentTarget.style.borderColor = C.muted }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
              >Cancel</button>
              <button onClick={handleRenameConfirm} disabled={renaming} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, background: renaming ? C.accentDim : C.accent, color: '#0F172A', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, border: 'none', cursor: renaming ? 'not-allowed' : 'pointer', opacity: renaming ? 0.7 : 1, transition: 'background 150ms' }}>
                {renaming ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { if (!deleting) { setConfirmOpen(false); setProjectToDelete(null) } }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete project?"
        message={projectToDelete ? <>All resources and data inside <span style={{ color: C.fg, fontWeight: 500 }}>"{projectToDelete.name}"</span> will be permanently deleted. This cannot be undone.</> : 'This action cannot be undone.'}
        confirmLabel="Delete Project"
        variant="danger"
      />
    </div>
  )
}