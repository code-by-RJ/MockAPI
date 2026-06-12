import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useToast } from '../context/ToastContext'
import { EndpointRowSkeleton } from '../components/Skeleton'

const METHOD_STYLE = {
  GET:    { badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', label: 'GET' },
  POST:   { badge: 'text-blue-400   bg-blue-400/10   border-blue-400/25',   label: 'POST' },
  PUT:    { badge: 'text-amber-400  bg-amber-400/10  border-amber-400/25',  label: 'PUT' },
  DELETE: { badge: 'text-red-400    bg-red-400/10    border-red-400/25',    label: 'DELETE' }
}

function buildEndpoints(baseUrl, resourceName) {
  return [
    {
      method: 'GET',
      url: `${baseUrl}/${resourceName}`,
      description: 'List all records (supports ?page, ?limit, ?sort, ?filter)',
      hasId: false
    },
    {
      method: 'GET',
      url: `${baseUrl}/${resourceName}/:id`,
      description: 'Get single record by ID',
      hasId: true
    },
    {
      method: 'POST',
      url: `${baseUrl}/${resourceName}`,
      description: 'Create a new record (validated against schema)',
      hasId: false
    },
    {
      method: 'PUT',
      url: `${baseUrl}/${resourceName}/:id`,
      description: 'Update a record by ID',
      hasId: true
    },
    {
      method: 'DELETE',
      url: `${baseUrl}/${resourceName}/:id`,
      description: 'Delete a record by ID',
      hasId: true
    }
  ]
}

function buildFetchSnippet(method, url, fields) {
  const hasBody = method === 'POST' || method === 'PUT'
  const bodyObj = {}
  if (hasBody && fields.length > 0) {
    fields.forEach(f => { bodyObj[f.fieldName] = `<${f.type}>` })
  }

  return `fetch('${url}', {
  method: '${method}',${hasBody ? `
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(bodyObj, null, 4).replace(/"/g, "'")})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data))`
}

function buildAxiosSnippet(method, url, fields) {
  const hasBody = method === 'POST' || method === 'PUT'
  const bodyObj = {}
  if (hasBody && fields.length > 0) {
    fields.forEach(f => { bodyObj[f.fieldName] = `<${f.type}>` })
  }

  const methodLower = method.toLowerCase()
  if (hasBody) {
    return `const { data } = await axios.${methodLower}(
  '${url}',
  ${JSON.stringify(bodyObj, null, 2).replace(/"/g, "'")}
)
console.log(data)`
  }
  return `const { data } = await axios.${methodLower}('${url}')
console.log(data)`
}

function CodeBlock({ code, lang }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast(`${lang} snippet copied`, 'copy')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-xl border border-white/[0.07] bg-black/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{lang}</span>
        <button
          onClick={copy}
          className="text-[11px] px-2.5 py-0.5 rounded-md border border-white/10
            text-white/40 hover:text-white hover:border-white/20 transition-colors"
        >
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="p-4 text-[11px] font-mono text-emerald-300/80 overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

export default function EndpointViewer() {
  const { slug, name } = useParams()
  const { toast } = useToast()

  const [resource, setResource] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null) // which endpoint is open
  const [snippetTab, setSnippetTab] = useState('fetch') // 'fetch' | 'axios'

  const BASE_URL = `${import.meta.env.VITE_API_URL || window.location.origin}/api/${slug}`
  const endpoints = buildEndpoints(BASE_URL, name)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/projects/${slug}/resources`)
        const found = res.data.data?.find(r => r.name === name)
        setResource(found || null)
      } catch {
        toast('Failed to load resource', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [slug, name])

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
    toast('URL copied', 'copy')
  }

  const fields = resource?.schema || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-white/40 font-mono">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to={`/project/${slug}`} className="hover:text-white transition-colors">{slug}</Link>
            <span>/</span>
            <Link to={`/project/${slug}/resource/${name}`} className="hover:text-white transition-colors">{name}</Link>
            <span>/</span>
            <span className="text-white">endpoints</span>
          </nav>
          <Link
            to={`/project/${slug}/resource/${name}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50
              hover:border-white/20 hover:text-white transition-colors"
          >
            ← Schema
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Base URL */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider shrink-0">Base URL</span>
          <span className="font-mono text-sm text-white/60 flex-1 truncate">{BASE_URL}</span>
          <button
            onClick={() => copyUrl(BASE_URL)}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 text-white/40
              hover:text-white hover:border-white/20 transition-colors shrink-0"
          >
            ⎘ Copy
          </button>
        </div>

        {/* Endpoints list */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <EndpointRowSkeleton key={i} />)
            : endpoints.map((ep, i) => {
                const { badge } = METHOD_STYLE[ep.method]
                const isOpen = expanded === i

                return (
                  <div key={i} className="rounded-xl border border-white/[0.07] overflow-hidden">

                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <span className={`shrink-0 px-2.5 py-0.5 rounded border text-[11px] font-bold w-16 text-center ${badge}`}>
                        {ep.method}
                      </span>
                      <span className="flex-1 font-mono text-sm text-white/60 truncate">{ep.url}</span>
                      <span className="text-xs text-white/25 hidden sm:block shrink-0 max-w-xs truncate">
                        {ep.description}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); copyUrl(ep.url) }}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 text-white/40
                            hover:text-white hover:border-white/20 transition-colors"
                        >
                          ⎘
                        </button>
                        <span className={`text-white/20 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </div>
                    </button>

                    {/* Expanded — code snippets */}
                    {isOpen && (
                      <div className="border-t border-white/[0.06] px-4 py-4 bg-black/20 space-y-4">
                        <p className="text-xs text-white/30">{ep.description}</p>

                        {/* Query params hint for GET list */}
                        {ep.method === 'GET' && !ep.hasId && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['?page=1', '?limit=10', '?sort=-createdAt', `?filter=name:john`].map(p => (
                              <span key={p}
                                className="font-mono text-[10px] px-2 py-1 rounded-lg bg-white/[0.03]
                                  border border-white/[0.06] text-white/30 text-center truncate">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Snippet tab switcher */}
                        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06] w-fit">
                          {['fetch', 'axios'].map(t => (
                            <button
                              key={t}
                              onClick={() => setSnippetTab(t)}
                              className={`text-[11px] px-3 py-1 rounded-md font-mono transition-colors ${
                                snippetTab === t
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/30 hover:text-white/60'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Code block */}
                        <CodeBlock
                          lang={snippetTab}
                          code={
                            snippetTab === 'fetch'
                              ? buildFetchSnippet(ep.method, ep.url, fields)
                              : buildAxiosSnippet(ep.method, ep.url, fields)
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>

        {/* Schema preview */}
        {!loading && fields.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-white/50">Schema — {name}</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-sm text-white/70 w-36 truncate">{f.fieldName}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded border border-violet-500/20 bg-violet-500/10 text-violet-300/70 font-mono">
                    {f.type}
                  </span>
                  {f.required && (
                    <span className="text-[10px] text-white/25">required</span>
                  )}
                  {f.type === 'enum' && f.values?.length > 0 && (
                    <span className="text-[10px] font-mono text-amber-400/40">
                      [{f.values.join(', ')}]
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}