import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useToast }        from '../contexts/ToastContext'
import { FieldRowSkeleton } from '../components/Skeleton'
import ErrorSimConfig      from '../components/ErrorSimConfig'

const C = { bg:"#0F172A",surface:"#1E293B",surface2:"#272F42",border:"#334155",fg:"#F8FAFC",muted:"#94A3B8",accent:"#22C55E",accentDim:"#16A34A",red:"#EF4444",yellow:"#FBBF24",blue:"#60A5FA" }
const FONTS = '' // fonts loaded globally via index.css
const ANIM  = `@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.page-enter{animation:pageIn 0.35s ease forwards}`

const TYPES = ['string','number','boolean','email','uuid','date','avatar','enum']
const FAKE_DEFAULTS = { string:'John Doe', number:499, boolean:true, email:'user@example.com', uuid:'a1b2-c3d4-e5f6', date:'2024-01-15', avatar:'https://i.pravatar.cc/150', enum:'option_a' }

function buildPreview(fields) {
  const obj = {}
  fields.forEach(f => {
    if (!f.fieldName) return
    obj[f.fieldName] = f.type==='enum' ? (f.values?.[0]??'option_a') : FAKE_DEFAULTS[f.type]??'value'
  })
  return obj
}

export default function SchemaBuilder() {
  const { slug, name } = useParams()
  const { toast } = useToast()

  const [fields, setFields]             = useState([])
  const [resource, setResource]         = useState(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [previewCopied, setPreviewCopied] = useState(false)
  const [dragIdx, setDragIdx]           = useState(null)
  const [dragOverIdx, setDragOverIdx]   = useState(null)

  const fetchResource = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${slug}/resources`)
      const found = res.data.data?.find(r => r.name === name)
      if (found) {
        setResource(found)
        setFields(found.schema.length > 0 ? found.schema : [{ fieldName:'', type:'string', required:true, values:[] }])
      }
    } catch { toast('Failed to load resource', 'error') }
    finally { setLoading(false) }
  }, [slug, name, toast])

  useEffect(() => { fetchResource() }, [fetchResource])

  const addField    = () => setFields(p => [...p, { fieldName:'', type:'string', required:true, values:[] }])
  const removeField = (i) => setFields(p => p.filter((_,idx) => idx!==i))
  const updateField = (i, key, val) => setFields(p => p.map((f,idx) => idx===i ? {...f,[key]:val} : f))

  const isValidFieldName = name => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name.trim())

  const saveSchema = async () => {
    if (fields.length === 0)                         { toast('Add at least one field', 'error'); return }
    if (fields.some(f => !f.fieldName.trim()))       { toast('All fields must have a name', 'error'); return }
    if (fields.some(f => !isValidFieldName(f.fieldName))) {
      toast('Field names must start with a letter and contain only letters, numbers, _ or $', 'error'); return
    }
    const names = fields.map(f => f.fieldName.trim())
    const hasDupe = names.some((n, i) => names.indexOf(n) !== i)
    if (hasDupe)                                     { toast('Duplicate field names are not allowed', 'error'); return }
    setSaving(true)
    try {
      await api.put(`/projects/${slug}/resources/${name}`, { schema: fields })
      toast('Schema saved ✓', 'success')
    } catch { toast('Failed to save schema', 'error') }
    finally { setSaving(false) }
  }

  const copyPreview = () => {
    navigator.clipboard.writeText(JSON.stringify(buildPreview(fields), null, 2))
    setPreviewCopied(true)
    toast('JSON copied', 'copy')
    setTimeout(() => setPreviewCopied(false), 2000)
  }

  // Priority 4 — export schema as .json file (client-side only)
  const exportSchema = () => {
    const payload = {
      resource: name,
      project:  slug,
      schema:   fields,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${slug}-${name}-schema.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast('Schema exported', 'success')
  }

  const preview = buildPreview(fields)

  const onDragStart = (e, i) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e, i) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== i) setDragOverIdx(i)
  }
  const onDrop = (e, i) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
    const arr = [...fields]
    const [moved] = arr.splice(dragIdx, 1)
    arr.splice(i, 0, moved)
    setFields(arr)
    setDragIdx(null)
    setDragOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  const inputBase = { background:'rgba(0,0,0,0.4)', border:`1px solid ${C.border}`, borderRadius:8, padding:'0.5rem 0.75rem', fontSize:13, color:C.fg, fontFamily:"'DM Mono',monospace", outline:'none', transition:'border-color 150ms', boxSizing:'border-box' }
  const selectBase = { ...inputBase, cursor:'pointer', fontSize:12, color:C.muted }

  return (
    <div className="page-enter" style={{ minHeight:'100vh', background:C.bg, color:C.fg, fontFamily:"'DM Sans',sans-serif", overflowX:'hidden', maxWidth:'100vw' }}>
      <style>{FONTS}{ANIM}{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0} input::placeholder,textarea::placeholder{color:#A3ADC2} select option{background:#1E293B;color:#F8FAFC} .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0} @media(max-width:900px){.sb-grid{grid-template-columns:1fr !important}.sb-sticky{position:static !important}.sb-header{flex-direction:column;align-items:flex-start !important;gap:12px !important;height:auto !important;padding:0.75rem clamp(1.5rem,5vw,3rem) !important}.sb-header-nav{flex-wrap:wrap}.sb-header-actions{flex-wrap:wrap}} @media(max-width:600px){.field-row{flex-wrap:wrap !important}.field-row input{min-width:0 !important}.field-del{display:none !important}.field-row:hover .field-del{display:flex !important}}`}</style>

      <h1 className="sr-only">Schema Builder — {name}</h1>

      {/* HEADER */}
      <div className="sb-header" style={{ borderBottom:`1px solid ${C.border}`, padding:'0 clamp(1.5rem,5vw,3rem)', height:60, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <nav style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:13, color:C.muted }}>
            <Link to="/dashboard" style={{ color:C.muted, textDecoration:'none' }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>Dashboard</Link>
            <span style={{color:'#94A3B8'}}>/</span>
            <Link to={`/project/${slug}`} style={{ color:C.muted, textDecoration:'none' }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>{slug}</Link>
            <span style={{color:'#94A3B8'}}>/</span>
            <span style={{color:C.fg}}>{name}</span>
          </nav>
          <div className="sb-header-actions" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link to={`/project/${slug}/resource/${name}/endpoints`} style={{ fontSize:12, padding:'0.35rem 0.85rem', borderRadius:8, border:`1px solid ${C.border}`, color:C.muted, textDecoration:'none', transition:'color 150ms,border-color 150ms' }} onMouseEnter={e=>{e.currentTarget.style.color=C.fg;e.currentTarget.style.borderColor=C.muted}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border}}>View Endpoints →</Link>
            {/* Priority 4 — Export schema as JSON */}
            <button onClick={exportSchema} disabled={fields.length === 0} title="Download schema as JSON" aria-label="Export schema as JSON" style={{ fontSize:12, padding:'0.35rem 0.75rem', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:fields.length===0?'not-allowed':'pointer', opacity:fields.length===0?0.4:1, transition:'color 150ms,border-color 150ms', display:'flex', alignItems:'center', gap:5, fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>{ if(fields.length>0){e.currentTarget.style.color=C.fg;e.currentTarget.style.borderColor=C.muted} }}
              onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export JSON
            </button>
            <button onClick={saveSchema} disabled={saving} style={{ fontSize:12, padding:'0.35rem 1rem', borderRadius:8, background:saving?C.accentDim:C.accent, color:'#0F172A', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, border:'none', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, transition:'background 150ms' }}>
              {saving?'Saving…':'Save Schema'}
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth:1200, margin:'0 auto', padding:'2rem clamp(1.5rem,5vw,3rem)' }}>
        <div className="sb-grid" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>

          {/* LEFT — Field editor */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:600 }}>Schema Builder</h2>
                <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>{fields.length} field{fields.length!==1?'s':''} defined</p>
              </div>
              <button onClick={addField} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'0.4rem 0.85rem', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, color:C.muted, cursor:'pointer', transition:'color 150ms,background 150ms', fontFamily:"'DM Sans',sans-serif" }} onMouseEnter={e=>{e.currentTarget.style.color=C.fg;e.currentTarget.style.background='rgba(255,255,255,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background='rgba(255,255,255,0.04)'}}>
                <span style={{fontSize:16,lineHeight:1}}>+</span> Add Field
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {loading ? (
                Array.from({length:5}).map((_,i)=><FieldRowSkeleton key={i}/>)
              ) : fields.length===0 ? (
                <div style={{ padding:'3.5rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', border:`1px dashed ${C.border}`, borderRadius:12, background:'rgba(255,255,255,0.01)' }}>
                  <div style={{ width:44, height:44, borderRadius:10, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  </div>
                  <p style={{ fontSize:13, fontWeight:500, color:'#94A3B8', marginBottom:6, fontFamily:"'Space Grotesk',sans-serif" }}>No fields defined</p>
                  <p style={{ fontSize:12, color:'#94A3B8', maxWidth:220, marginBottom:16, lineHeight:1.6 }}>Add fields to define the shape of your fake data.</p>
                  <button onClick={addField} style={{ fontSize:12, padding:'0.45rem 1rem', borderRadius:8, background:'rgba(34,197,94,0.08)', border:`1px solid rgba(34,197,94,0.2)`, color:C.accent, cursor:'pointer', transition:'background 150ms', fontFamily:"'DM Sans',sans-serif" }}>+ Add first field</button>
                </div>
              ) : (
                fields.map((field,i) => (
                  <div
                    key={i}
                    className="field-row"
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={e => onDrop(e, i)}
                    style={{
                      display:'flex', alignItems:'center', gap:10, padding:'0.75rem',
                      borderRadius:10,
                      border:`1px solid ${dragOverIdx===i && dragIdx!==i ? 'rgba(34,197,94,0.45)' : C.border}`,
                      background: dragOverIdx===i && dragIdx!==i ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
                      transition:'background 150ms, border-color 150ms',
                      opacity: dragIdx===i ? 0.35 : 1,
                      minWidth:0
                    }}
                  >
                    {/* Drag handle — mouse/touch only, intentionally not in tab order */}
                    <div
                      draggable
                      onDragStart={e => onDragStart(e, i)}
                      onDragEnd={onDragEnd}
                      title="Drag to reorder"
                      aria-hidden="true"
                      style={{ cursor:'grab', color:'rgba(255,255,255,0.18)', flexShrink:0, display:'flex', alignItems:'center', padding:'0 2px', userSelect:'none' }}
                    >
                      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                        <circle cx="2.5" cy="3"  r="1.5"/><circle cx="7.5" cy="3"  r="1.5"/>
                        <circle cx="2.5" cy="8"  r="1.5"/><circle cx="7.5" cy="8"  r="1.5"/>
                        <circle cx="2.5" cy="13" r="1.5"/><circle cx="7.5" cy="13" r="1.5"/>
                      </svg>
                    </div>
                    <label className="sr-only" htmlFor={`field-name-${i}`}>Field name</label>
                    <input
                      id={`field-name-${i}`}
                      type="text"
                      placeholder="fieldName"
                      value={field.fieldName}
                      onChange={e=>updateField(i,'fieldName',e.target.value)}
                      style={{
                        ...inputBase,
                        flex:1, minWidth:0,
                        borderColor: field.fieldName && !isValidFieldName(field.fieldName) ? C.red
                                    : field.fieldName && isValidFieldName(field.fieldName)  ? 'rgba(34,197,94,0.25)'
                                    : C.border
                      }}
                    />
                    <label className="sr-only" htmlFor={`field-type-${i}`}>Field type</label>
                    <select id={`field-type-${i}`} value={field.type} onChange={e=>updateField(i,'type',e.target.value)} style={{ ...selectBase, width:110 }}>
                      {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    {field.type==='enum' && (
                      <>
                        <label className="sr-only" htmlFor={`field-enum-${i}`}>Enum values, comma separated</label>
                        <input id={`field-enum-${i}`} type="text" placeholder="a,b,c" value={(field.values||[]).join(',')} onChange={e=>updateField(i,'values',e.target.value.split(',').map(s=>s.trim()))} style={{ ...inputBase, width:100, color:C.yellow, borderColor:'rgba(251,191,36,0.25)', fontSize:11 }}/>
                      </>
                    )}
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }}>
                      <input type="checkbox" checked={!!field.required} onChange={e=>updateField(i,'required',e.target.checked)} style={{ accentColor:C.accent, width:13, height:13, cursor:'pointer' }}/>
                      <span style={{ fontSize:10, color:'#94A3B8' }}>req</span>
                    </label>
                    <button onClick={()=>removeField(i)} className="field-del" style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer', transition:'color 150ms,background 150ms', fontSize:13, flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background='rgba(239,68,68,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.2)';e.currentTarget.style.background='transparent'}}>✕</button>
                  </div>
                ))
              )}
            </div>

            {loading ? (
              <div style={{ marginTop:20, height:236, borderRadius:14, background:'rgba(255,255,255,0.02)', border:`1px solid ${C.border}` }} />
            ) : resource && (
              <div style={{ marginTop:20 }}>
                <ErrorSimConfig slug={slug} resourceName={name} initialErrorRate={resource.errorRate||0} initialDelay={resource.delay||0}/>
              </div>
            )}
          </div>

          {/* RIGHT — Live preview */}
          <div className="sb-sticky" style={{ position:'sticky', top:24, display:'flex', flexDirection:'column', gap:16 }}>
            {/* JSON Preview */}
            <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', background:'rgba(0,0,0,0.5)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.6rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.02)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:C.accent, animation:'pulse 2s infinite', display:'inline-block' }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', fontFamily:"'Space Grotesk',sans-serif" }}>Live Preview</span>
                </div>
                <button onClick={copyPreview} style={{ fontSize:11, padding:'0.2rem 0.6rem', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:previewCopied?C.accent:C.muted, cursor:'pointer', transition:'color 150ms', fontFamily:"'DM Sans',sans-serif" }}>
                  {previewCopied?'✓ Copied':'⎘ Copy'}
                </button>
              </div>
              <pre tabIndex={0} role="region" aria-label="JSON preview" style={{ padding:'1rem', fontSize:11, fontFamily:"'DM Mono',monospace", color:`${C.accent}cc`, overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.7, minHeight:100 }}>
                {fields.length===0||fields.every(f=>!f.fieldName.trim())
                  ? <span style={{color:'#94A3B8'}}>// add fields to see preview</span>
                  : JSON.stringify(preview,null,2)
                }
              </pre>
            </div>

            {/* Type reference */}
            <div style={{ border:`1px solid rgba(255,255,255,0.06)`, borderRadius:12, padding:'1rem', background:'rgba(255,255,255,0.02)' }}>
              <p role="heading" aria-level="3" style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'Space Grotesk',sans-serif", marginBottom:12 }}>Type Reference</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {TYPES.map(t=>(
                  <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:C.accent }}>{t}</span>
                    <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180, marginLeft:8 }}>{String(FAKE_DEFAULTS[t])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}