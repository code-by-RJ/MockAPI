/**
 * ShareableDemo.jsx — /demo/:slug
 *
 * Public page — no auth needed.
 * Shows live data from the public API + auto-generated docs.
 * Share this link with clients: mockapi.spacego.online/demo/my-project
 *
 * Route to add in App.jsx:
 *   <Route path="/demo/:slug" element={<ShareableDemo />} />
 */

import { useState, useEffect } from 'react'
import { useParams, Link }     from 'react-router-dom'

const METHOD_STYLE = {
  GET:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  POST:   'text-blue-400   bg-blue-400/10   border-blue-400/25',
  PUT:    'text-amber-400  bg-amber-400/10  border-amber-400/25',
  DELETE: 'text-red-400    bg-red-400/10    border-red-400/25'
}

const BASE_ENDPOINTS = (baseUrl, name) => [
  { method: 'GET',    url: `${baseUrl}/${name}`,     description: 'List all (page, limit, sort, filter)' },
  { method: 'GET',    url: `${baseUrl}/${name}/:id`, description: 'Get by ID' },
  { method: 'POST',   url: `${baseUrl}/${name}`,     description: 'Create new record' },
  { method: 'PUT',    url: `${baseUrl}/${name}/:id`, description: 'Update by ID' },
  { method: 'DELETE', url: `${baseUrl}/${name}/:id`, description: 'Delete by ID' }
]

function CopyButton({ text, label = '⎘ Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="text-[11px] px-2.5 py-1 rounded-md border border-white/10
        text-white/40 hover:text-white hover:border-white/20 transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function LiveDataPreview({ url }) {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${url}?limit=3`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to fetch live data'); setLoading(false) })
  }, [url])

  if (loading) return (
    <div className="animate-pulse space-y-2 p-4">
      {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded" />)}
    </div>
  )

  if (error) return (
    <p className="p-4 text-xs text-red-400/60">{error}</p>
  )

  return (
    <pre className="p-4 text-[11px] font-mono text-emerald-300/70 overflow-x-auto whitespace-pre leading-relaxed max-h-60">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default function ShareableDemo() {
  const { slug } = useParams()

  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeResource, setActiveResource] = useState(null)
  const [copied, setCopied]       = useState(false)

  const BASE_URL = `${window.location.origin}/api/${slug}`
  const DEMO_URL = `${window.location.origin}/demo/${slug}`

  useEffect(() => {
    // Public endpoint — no auth token
    fetch(`${window.location.origin}/api/projects`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        const project = d.data?.find(p => p.slug === slug)
        if (!project?.isPublic) {
          setError('This project is private or does not exist.')
          setLoading(false)
          return
        }
        // Fetch resources (public projects only)
        return fetch(`${window.location.origin}/api/projects/${slug}/resources`)
      })
      .then(r => r?.json())
      .then(d => {
        if (!d) return
        const list = d.data || []
        setResources(list)
        if (list.length > 0) setActiveResource(list[0].name)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load project. Make sure it exists and is set to Public.')
        setLoading(false)
      })
  }, [slug])

  const copyDemoLink = () => {
    navigator.clipboard.writeText(DEMO_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-white/30">Loading demo…</p>
      </div>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-3xl">🔒</p>
        <p className="text-white/60 text-sm">{error}</p>
        <Link to="/" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          ← Back to MockAPI
        </Link>
      </div>
    </div>
  )

  const activeRes = resources.find(r => r.name === activeResource)
  const endpoints = activeRes ? BASE_ENDPOINTS(BASE_URL, activeRes.name) : []

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 bg-black/20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-mono font-bold text-white/70 hover:text-white transition-colors text-sm">
              MockAPI
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-sm text-white">{slug}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/25
              bg-emerald-500/10 text-emerald-400">
              Public
            </span>
          </div>
          <button
            onClick={copyDemoLink}
            className="flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg border border-white/10
              text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            🔗 {copied ? 'Copied!' : 'Share Demo'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Base URL */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider shrink-0">Base URL</span>
          <span className="font-mono text-sm text-white/60 flex-1 truncate">{BASE_URL}</span>
          <CopyButton text={BASE_URL} />
        </div>

        {/* Resource tabs */}
        {resources.length > 1 && (
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
            {resources.map(r => (
              <button
                key={r.name}
                onClick={() => setActiveResource(r.name)}
                className={`text-xs px-4 py-1.5 rounded-lg font-mono transition-colors ${
                  activeResource === r.name
                    ? 'bg-white/10 text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}

        {activeRes && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Endpoints */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                Endpoints — {activeRes.name}
              </h2>
              <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
                {endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <span className={`shrink-0 px-2 py-0.5 rounded border text-[11px] font-bold w-16 text-center ${METHOD_STYLE[ep.method]}`}>
                      {ep.method}
                    </span>
                    <span className="flex-1 font-mono text-[12px] text-white/55 truncate">{ep.url}</span>
                    <span className="text-[11px] text-white/25 hidden sm:block truncate max-w-[180px]">{ep.description}</span>
                    <CopyButton text={ep.url} />
                  </div>
                ))}
              </div>

              {/* Schema */}
              {activeRes.schema?.length > 0 && (
                <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                      Schema
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {activeRes.schema.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2">
                        <span className="font-mono text-sm text-white/70 w-32 truncate">{f.fieldName}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded border border-violet-500/20
                          bg-violet-500/10 text-violet-300/70 font-mono">
                          {f.type}
                        </span>
                        {f.required && <span className="text-[10px] text-white/25">required</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live data preview */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                Live Data
              </h2>
              <div className="rounded-xl border border-white/[0.07] bg-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-white/40">GET /{activeRes.name}?limit=3</span>
                  </div>
                </div>
                <LiveDataPreview url={`${BASE_URL}/${activeRes.name}`} key={activeRes.name} />
              </div>

              {/* Powered by */}
              <div className="text-center pt-2">
                <p className="text-[10px] text-white/20">
                  Powered by{' '}
                  <Link to="/" className="text-violet-400/60 hover:text-violet-400 transition-colors">
                    MockAPI
                  </Link>
                  {' '}· mockapi.spacego.online
                </p>
              </div>
            </div>
          </div>
        )}

        {resources.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-white/30 text-sm">This project has no resources yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}