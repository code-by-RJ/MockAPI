import { useState, useEffect, useCallback } from 'react'
import { useParams, Link }                   from 'react-router-dom'
import api from '../lib/axios'
import { useToast }        from '../context/ToastContext'
import { TableRowSkeleton } from '../components/Skeleton'
import RequestLogsPanel    from '../components/RequestLogsPanel'
import ConfirmModal        from '../components/ConfirmModal'

export default function ProjectDetail() {
  const { slug }    = useParams()

  const { toast }   = useToast()

  const [resources, setResources]   = useState([])
  const [project, setProject]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [newName, setNewName]       = useState('')
  const [nameError, setNameError]   = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [creating, setCreating]     = useState(false)

  // Confirm modal state
  const [confirmOpen, setConfirmOpen]           = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState(null)
  const [deleting, setDeleting]                 = useState(false)

  const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/${slug}`

  const fetchData = useCallback(async () => {
    try {
      const [projRes, resRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/projects/${slug}/resources`)
      ])
      const found = projRes.data.data?.find(p => p.slug === slug)
      setProject(found || null)
      setResources(resRes.data.data || [])
    } catch {
      toast('Failed to load project', 'error')
    } finally {
      setLoading(false)
    }
  }, [slug, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const RESOURCE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/

  const validateResourceName = (val) => {
    const v = val.trim().toLowerCase()
    if (!v)                          return 'Resource name is required'
    if (v.length < 2)                return 'Name must be at least 2 characters'
    if (v.length > 40)               return 'Name must be under 40 characters'
    if (/\s/.test(val))              return 'Spaces not allowed — use hyphens instead (e.g. blog-posts)'
    if (!RESOURCE_NAME_RE.test(v))   return 'Only lowercase letters, numbers and hyphens allowed'
    if (resources.some(r => r.name === v)) return `"${v}" already exists in this project`
    return ''
  }

  const handleNameChange = (e) => {
    setNewName(e.target.value)
    if (nameTouched) setNameError(validateResourceName(e.target.value))
  }

  // closeModal MUST be declared before the Esc useEffect that references it
  const closeModal = useCallback(() => {
    setShowModal(false); setNewName(''); setNameError(''); setNameTouched(false)
  }, [])

  // Esc closes New Resource modal
  useEffect(() => {
    if (!showModal) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showModal, closeModal])

  // ── Create resource ───────────────────────────────────────────────────────
  const createResource = async () => {
    setNameTouched(true)
    const err = validateResourceName(newName)
    if (err) { setNameError(err); return }
    setCreating(true)
    try {
      await api.post(`/projects/${slug}/resources`, {
        name:   newName.toLowerCase().trim(),
        schema: []
      })
      toast(`Resource "${newName.toLowerCase().trim()}" created`, 'success')
      closeModal()
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate')) {
        setNameError(`"${newName.toLowerCase().trim()}" already exists. Choose a different name.`)
      } else {
        toast(msg || 'Failed to create resource', 'error')
      }
    } finally {
      setCreating(false)
    }
  }

  // ── Delete resource — opens confirm modal ─────────────────────────────────
  const handleDeleteClick = (resource) => {
    setResourceToDelete(resource)
    setConfirmOpen(true)
  }

  // ── Actual delete after confirmation ──────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${slug}/resources/${resourceToDelete.name}`)
      toast(`"${resourceToDelete.name}" deleted`, 'success')
      setResources(p => p.filter(r => r.name !== resourceToDelete.name))
      setConfirmOpen(false)
      setResourceToDelete(null)
    } catch {
      toast('Failed to delete resource', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Copy base URL ─────────────────────────────────────────────────────────
  const copyBase = () => {
    navigator.clipboard.writeText(BASE_URL)
    toast('Base URL copied', 'copy')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/40 font-mono">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-white">{slug}</span>
          </nav>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500
              text-white font-medium transition-colors"
          >
            + New Resource
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Project meta */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/50">
            /{slug}
          </span>
          {project?.isPublic && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              Public
            </span>
          )}
          {/* Base URL */}
          <button
            onClick={copyBase}
            className="ml-auto flex items-center gap-2 font-mono text-[11px] px-3 py-1.5
              rounded-lg bg-white/[0.03] border border-white/10 text-white/40
              hover:text-white hover:border-white/20 transition-colors"
          >
            <span className="truncate max-w-[240px]">{BASE_URL}</span>
            <span>⎘</span>
          </button>
        </div>

        {/* Resources table */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Resources
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Table head */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
              <span className="text-[11px] font-medium text-white/30 w-36">Name</span>
              <span className="text-[11px] font-medium text-white/30 flex-1">Endpoint</span>
              <span className="text-[11px] font-medium text-white/30 w-16 text-center">Fields</span>
              <span className="text-[11px] font-medium text-white/30 w-28 text-right">Actions</span>
            </div>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
            ) : resources.length === 0 ? (
              <div className="py-14 px-6 flex flex-col items-center text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl border border-white/[0.07] bg-white/[0.02]
                  flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/50 mb-1">No resources yet</p>
                <p className="text-xs text-white/25 max-w-[260px] mb-5 leading-relaxed">
                  Resources are your API endpoints — like <span className="font-mono text-white/40">users</span> or <span className="font-mono text-white/40">products</span>. Each gets full CRUD automatically.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs px-4 py-2 rounded-lg bg-violet-600/80 hover:bg-violet-600
                    text-white font-medium transition-colors"
                >
                  + Add first resource
                </button>
              </div>
            ) : (
              resources.map(r => (
                <div key={r.name}
                  className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0"
                >
                  <span className="w-36 font-mono text-sm text-white truncate">{r.name}</span>
                  <span className="flex-1 font-mono text-[11px] text-white/30 truncate">
                    {BASE_URL}/{r.name}
                  </span>
                  <span className="w-16 text-center text-xs text-white/40">
                    {r.schema?.length ?? 0}
                  </span>
                  <div className="w-28 flex items-center justify-end gap-1.5">
                    <Link
                      to={`/project/${slug}/resource/${r.name}`}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10
                        text-white/50 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/project/${slug}/resource/${r.name}/endpoints`}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10
                        text-white/50 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Endpoints
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(r)}
                      className="text-[11px] px-2 py-1 rounded-lg text-white/20
                        hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Request Logs panel */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Request Logs
          </h2>
          <RequestLogsPanel projectSlug={slug} />
        </div>
      </div>

      {/* Create Resource modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#111118] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold">New Resource</h3>
              <p className="text-xs text-white/30 mt-0.5">Lowercase letters, numbers, hyphens only</p>
            </div>
            <div>
              <input
                autoFocus
                type="text"
                placeholder="e.g. users, products, blog-posts"
                value={newName}
                onChange={handleNameChange}
                onBlur={() => { setNameTouched(true); setNameError(validateResourceName(newName)) }}
                onKeyDown={e => e.key === 'Enter' && createResource()}
                className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 font-mono
                  text-sm text-white placeholder-white/20
                  focus:outline-none transition-colors
                  ${nameError && nameTouched
                    ? 'border-red-500/50 focus:border-red-500/60'
                    : 'border-white/10 focus:border-violet-500/50'}`}
              />
              {nameError && nameTouched && (
                <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity="0.2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1.2"/>
                  </svg>
                  {nameError}
                </p>
              )}
              {/* Live preview of normalized name */}
              {newName.trim() && !nameError && (
                <p className="mt-1.5 text-[11px] font-mono text-white/25">
                  endpoint: <span className="text-violet-400">
                    /api/{slug}/{newName.toLowerCase().trim()}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-white/40
                  hover:text-white hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createResource}
                disabled={creating}
                className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500
                  text-sm text-white font-medium transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Resource Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { if (!deleting) { setConfirmOpen(false); setResourceToDelete(null) } }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete resource?"
        message={
          resourceToDelete
            ? <>All data stored in <span className="text-white font-medium">"{resourceToDelete.name}"</span> will be permanently deleted. This cannot be undone.</>
            : 'This action cannot be undone.'
        }
        confirmLabel="Delete Resource"
        variant="danger"
      />
    </div>
  )
}