import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useToast }       from '../context/ToastContext'
import { FieldRowSkeleton } from '../components/Skeleton'
import ErrorSimConfig     from '../components/ErrorSimConfig'

const TYPES = ['string', 'number', 'boolean', 'email', 'uuid', 'date', 'avatar', 'enum']

const FAKE_DEFAULTS = {
  string:  'John Doe',
  number:  499,
  boolean: true,
  email:   'user@example.com',
  uuid:    'a1b2-c3d4-e5f6',
  date:    '2024-01-15',
  avatar:  'https://i.pravatar.cc/150',
  enum:    'option_a'
}

function buildPreview(fields) {
  const obj = {}
  fields.forEach(f => {
    if (!f.fieldName) return
    obj[f.fieldName] = f.type === 'enum'
      ? (f.values?.[0] ?? 'option_a')
      : FAKE_DEFAULTS[f.type] ?? 'value'
  })
  return obj
}

export default function SchemaBuilder() {
  const { slug, name } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [fields, setFields]           = useState([])
  const [resource, setResource]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [previewCopied, setPreviewCopied] = useState(false)

  // ── Fetch resource ────────────────────────────────────────────────────────
  const fetchResource = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${slug}/resources`)
      const found = res.data.data?.find(r => r.name === name)
      if (found) {
        setResource(found)
        setFields(
          found.schema.length > 0
            ? found.schema
            : [{ fieldName: '', type: 'string', required: true, values: [] }]
        )
      }
    } catch {
      toast('Failed to load resource', 'error')
    } finally {
      setLoading(false)
    }
  }, [slug, name, toast])

  useEffect(() => { fetchResource() }, [fetchResource])

  // ── Field helpers ─────────────────────────────────────────────────────────
  const addField = () =>
    setFields(p => [...p, { fieldName: '', type: 'string', required: true, values: [] }])

  const removeField = (i) =>
    setFields(p => p.filter((_, idx) => idx !== i))

  const updateField = (i, key, val) =>
    setFields(p => p.map((f, idx) => idx === i ? { ...f, [key]: val } : f))

  // ── Save schema ───────────────────────────────────────────────────────────
  const saveSchema = async () => {
    if (fields.some(f => !f.fieldName.trim())) {
      toast('All fields must have a name', 'error')
      return
    }
    if (fields.length === 0) {
      toast('Add at least one field', 'error')
      return
    }
    setSaving(true)
    try {
      await api.put(`/projects/${slug}/resources/${name}`, { schema: fields })
      toast('Schema saved ✓', 'success')
    } catch {
      toast('Failed to save schema', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Copy preview JSON ─────────────────────────────────────────────────────
  const copyPreview = () => {
    navigator.clipboard.writeText(JSON.stringify(buildPreview(fields), null, 2))
    setPreviewCopied(true)
    toast('JSON copied', 'copy')
    setTimeout(() => setPreviewCopied(false), 2000)
  }

  const preview = buildPreview(fields)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Breadcrumb header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/40 font-mono">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link to={`/project/${slug}`} className="hover:text-white transition-colors">{slug}</Link>
            <span>/</span>
            <span className="text-white">{name}</span>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to={`/project/${slug}/resource/${name}/endpoints`}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50
                hover:border-white/20 hover:text-white transition-colors"
            >
              View Endpoints →
            </Link>
            <button
              onClick={saveSchema}
              disabled={saving}
              className="text-xs px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500
                text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Schema'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* ── LEFT — Field editor ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Schema Builder</h2>
                <p className="text-xs text-white/30 mt-0.5">
                  {fields.length} field{fields.length !== 1 ? 's' : ''} defined
                </p>
              </div>
              <button
                onClick={addField}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                  bg-white/5 border border-white/10 text-white/70 hover:bg-white/10
                  hover:text-white transition-colors"
              >
                <span className="text-base leading-none">+</span> Add Field
              </button>
            </div>

            {/* Field list */}
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <FieldRowSkeleton key={i} />)
              ) : fields.length === 0 ? (
                <div className="py-14 flex flex-col items-center text-center rounded-xl
                  border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <div className="w-12 h-12 rounded-xl border border-white/[0.07] bg-white/[0.02]
                    flex items-center justify-center mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/40 mb-1">No fields defined</p>
                  <p className="text-xs text-white/20 max-w-[220px] mb-5 leading-relaxed">
                    Add fields to define the shape of your fake data — name, type, required.
                  </p>
                  <button
                    onClick={addField}
                    className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10
                      text-white/60 hover:bg-violet-500/10 hover:border-violet-500/30
                      hover:text-violet-300 transition-colors"
                  >
                    + Add first field
                  </button>
                </div>
              ) : (
                fields.map((field, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.07]
                      bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                  >
                    {/* Field name */}
                    <input
                      type="text"
                      placeholder="fieldName"
                      value={field.fieldName}
                      onChange={e => updateField(i, 'fieldName', e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2
                        text-sm font-mono text-white placeholder-white/20
                        focus:outline-none focus:border-violet-500/50 transition-colors"
                    />

                    {/* Type dropdown */}
                    <select
                      value={field.type}
                      onChange={e => updateField(i, 'type', e.target.value)}
                      className="w-28 bg-black/40 border border-white/10 rounded-lg px-2 py-2
                        text-xs text-white/70 focus:outline-none focus:border-violet-500/50
                        transition-colors cursor-pointer"
                    >
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Enum values input (only when type=enum) */}
                    {field.type === 'enum' && (
                      <input
                        type="text"
                        placeholder="a,b,c"
                        value={(field.values || []).join(',')}
                        onChange={e => updateField(i, 'values', e.target.value.split(',').map(s => s.trim()))}
                        className="w-28 bg-black/40 border border-amber-500/20 rounded-lg px-2 py-2
                          text-xs font-mono text-amber-300/70 placeholder-amber-500/20
                          focus:outline-none focus:border-amber-500/40 transition-colors"
                      />
                    )}

                    {/* Required toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0 mt-2">
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={e => updateField(i, 'required', e.target.checked)}
                        className="accent-violet-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] text-white/30">req</span>
                    </label>

                    {/* Remove */}
                    <button
                      onClick={() => removeField(i)}
                      className="shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-lg
                        text-white/20 hover:text-red-400 hover:bg-red-500/10
                        opacity-0 group-hover:opacity-100 transition-all text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Error Simulation config — below field editor */}
            {resource && (
              <ErrorSimConfig
                slug={slug}
                resourceName={name}
                initialErrorRate={resource.errorRate || 0}
                initialDelay={resource.delay || 0}
              />
            )}
          </div>

          {/* ── RIGHT — Live JSON preview ── */}
          <div className="space-y-4">
            <div className="sticky top-6">
              <div className="rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                {/* Preview header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-white/70">Live Preview</span>
                  </div>
                  <button
                    onClick={copyPreview}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-white/10
                      text-white/40 hover:text-white hover:border-white/20 transition-colors"
                  >
                    {previewCopied ? '✓ Copied' : '⎘ Copy'}
                  </button>
                </div>

                {/* JSON output */}
                <pre className="p-4 text-xs font-mono text-emerald-300/80 overflow-x-auto
                  whitespace-pre-wrap break-all leading-relaxed min-h-[120px]">
                  {fields.length === 0 || fields.every(f => !f.fieldName.trim())
                    ? <span className="text-white/20">// add fields to see preview</span>
                    : JSON.stringify(preview, null, 2)
                  }
                </pre>
              </div>

              {/* Field type reference card */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">
                  Type Reference
                </p>
                <div className="space-y-1.5">
                  {TYPES.map(t => (
                    <div key={t} className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-violet-300/70">{t}</span>
                      <span className="text-[10px] text-white/20 font-mono truncate ml-3">
                        {String(FAKE_DEFAULTS[t])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}