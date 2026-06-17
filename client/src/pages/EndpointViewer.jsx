import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useToast } from '../context/ToastContext'
import { EndpointRowSkeleton } from '../components/Skeleton'

const C = { bg:"#0F172A",surface:"#1E293B",surface2:"#272F42",border:"#334155",fg:"#F8FAFC",muted:"#94A3B8",accent:"#22C55E",accentDim:"#16A34A",red:"#EF4444",yellow:"#FBBF24",blue:"#60A5FA" }
const FONTS = '' // fonts loaded globally via index.css
const ANIM  = `@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.page-enter{animation:pageIn 0.35s ease forwards}
  @media(max-width:600px){
    .ev-nav{padding:0 1rem !important;height:auto !important;flex-wrap:wrap;padding-top:0.65rem !important;padding-bottom:0.65rem !important;gap:8px}
    .ev-crumb-mid{display:none !important}
    .ev-crumb-mid2{display:none !important}
    .ev-schema-btn{display:none !important}
    .ev-endpoint-url{font-size:10px !important}
    .ev-snippet-code{font-size:10px !important}
  }
`

const METHOD_COLOR = {
  GET:    { text:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)'  },
  POST:   { text:'#60A5FA', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)' },
  PUT:    { text:'#FBBF24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)' },
  DELETE: { text:'#EF4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)'  },
}

function buildEndpoints(baseUrl, resourceName) {
  return [
    { method:'GET',    url:`${baseUrl}/${resourceName}`,     description:'List all records (supports ?page, ?limit, ?sort, ?filter)', hasId:false },
    { method:'GET',    url:`${baseUrl}/${resourceName}/:id`, description:'Get single record by ID', hasId:true },
    { method:'POST',   url:`${baseUrl}/${resourceName}`,     description:'Create a new record (validated against schema)', hasId:false },
    { method:'PUT',    url:`${baseUrl}/${resourceName}/:id`, description:'Update a record by ID', hasId:true },
    { method:'DELETE', url:`${baseUrl}/${resourceName}/:id`, description:'Delete a record by ID', hasId:true },
  ]
}

function buildFetchSnippet(method, url, fields) {
  const hasBody = method==='POST'||method==='PUT'
  const bodyObj = {}
  if (hasBody && fields.length>0) fields.forEach(f=>{ bodyObj[f.fieldName]=`<${f.type}>` })
  return `fetch('${url}', {\n  method: '${method}',${hasBody?`\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${JSON.stringify(bodyObj,null,4).replace(/"/g,"'")})`:''}\n})\n  .then(res => res.json())\n  .then(data => console.log(data))`
}

function buildAxiosSnippet(method, url, fields) {
  const hasBody = method==='POST'||method==='PUT'
  const bodyObj = {}
  if (hasBody && fields.length>0) fields.forEach(f=>{ bodyObj[f.fieldName]=`<${f.type}>` })
  const m = method.toLowerCase()
  if (hasBody) return `const { data } = await axios.${m}(\n  '${url}',\n  ${JSON.stringify(bodyObj,null,2).replace(/"/g,"'")}\n)\nconsole.log(data)`
  return `const { data } = await axios.${m}('${url}')\nconsole.log(data)`
}

function CodeBlock({ code, lang }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); toast(`${lang} snippet copied`,'copy'); setTimeout(()=>setCopied(false),2000) }
  return (
    <div style={{ border:`1px solid rgba(255,255,255,0.07)`, borderRadius:10, overflow:'hidden', background:'rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.02)' }}>
        <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{lang}</span>
        <button onClick={copy} style={{ fontSize:11, padding:'0.2rem 0.6rem', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:copied?C.accent:C.muted, cursor:'pointer', transition:'color 150ms', fontFamily:"'DM Sans',sans-serif" }}>{copied?'✓ Copied':'⎘ Copy'}</button>
      </div>
      <pre style={{ padding:'1rem', fontSize:11, fontFamily:"'DM Mono',monospace", color:`${C.accent}cc`, overflowX:'auto', whiteSpace:'pre', lineHeight:1.7 }}>{code}</pre>
    </div>
  )
}

export default function EndpointViewer() {
  const { slug, name } = useParams()
  const { toast } = useToast()

  const [resource, setResource] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [snippetTab, setSnippetTab] = useState('fetch')
  const [urlCopied, setUrlCopied] = useState(null)

  const BASE_URL  = `${import.meta.env.VITE_API_URL || window.location.origin}/api/${slug}`
  const endpoints = buildEndpoints(BASE_URL, name)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/projects/${slug}/resources`)
        const found = res.data.data?.find(r => r.name === name)
        setResource(found || null)
      } catch { toast('Failed to load resource', 'error') }
      finally { setLoading(false) }
    }
    load()
  }, [slug, name, toast])

  const copyUrl = (url, idx=null) => {
    navigator.clipboard.writeText(url)
    toast('URL copied', 'copy')
    if (idx !== null) { setUrlCopied(idx); setTimeout(()=>setUrlCopied(null),2000) }
  }

  const fields = resource?.schema || []

  return (
    <div className="page-enter" style={{ minHeight:'100vh', background:C.bg, color:C.fg, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{FONTS}{ANIM}{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0} input::placeholder{color:#475569}`}</style>

      {/* HEADER */}
      <div className="ev-nav" style={{ borderBottom:`1px solid ${C.border}`, padding:'0 clamp(1.5rem,5vw,3rem)', height:60, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:900, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <nav style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:13, color:C.muted, minWidth:0, overflow:'hidden' }}>
            <Link to="/dashboard" style={{ color:C.muted, textDecoration:'none', flexShrink:0 }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>Dashboard</Link>
            <span className="ev-crumb-mid" style={{color:'#475569',flexShrink:0}}>/</span>
            <Link className="ev-crumb-mid" to={`/project/${slug}`} style={{ color:C.muted, textDecoration:'none', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>{slug}</Link>
            <span className="ev-crumb-mid2" style={{color:'#475569',flexShrink:0}}>/</span>
            <Link className="ev-crumb-mid2" to={`/project/${slug}/resource/${name}`} style={{ color:C.muted, textDecoration:'none', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} onMouseEnter={e=>e.target.style.color=C.fg} onMouseLeave={e=>e.target.style.color=C.muted}>{name}</Link>
            <span style={{color:'#475569',flexShrink:0}}>/</span>
            <span style={{color:C.fg,flexShrink:0}}>endpoints</span>
          </nav>
          <Link className="ev-schema-btn" to={`/project/${slug}/resource/${name}`} style={{ fontSize:12, padding:'0.35rem 0.85rem', borderRadius:8, border:`1px solid ${C.border}`, color:C.muted, textDecoration:'none', transition:'color 150ms,border-color 150ms', flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.color=C.fg;e.currentTarget.style.borderColor=C.muted}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border}}>← Schema</Link>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'2rem clamp(1.5rem,5vw,3rem)', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Base URL */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.75rem 1rem', borderRadius:10, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', flexShrink:0, fontFamily:"'Space Grotesk',sans-serif" }}>Base URL</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'rgba(255,255,255,0.6)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{BASE_URL}</span>
          <button onClick={()=>copyUrl(BASE_URL)} style={{ fontSize:11, padding:'0.25rem 0.65rem', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', transition:'color 150ms', flexShrink:0, fontFamily:"'DM Sans',sans-serif" }}>⎘ Copy</button>
        </div>

        {/* Endpoints */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? (
            Array.from({length:5}).map((_,i)=><EndpointRowSkeleton key={i}/>)
          ) : (
            endpoints.map((ep,i) => {
              const mc = METHOD_COLOR[ep.method]
              const isOpen = expanded===i
              return (
                <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                  <button onClick={()=>setExpanded(isOpen?null:i)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'0.75rem 1rem', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', transition:'background 150ms', color:C.fg }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ flexShrink:0, padding:'0.15rem 0.5rem', borderRadius:6, border:`1px solid ${mc.border}`, background:mc.bg, color:mc.text, fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace", width:60, textAlign:'center' }}>{ep.method}</span>
                    <span style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:13, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.url}</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:240, display:'none' }}>{ep.description}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <button onClick={e=>{e.stopPropagation();copyUrl(ep.url,i)}} style={{ fontSize:11, padding:'0.2rem 0.6rem', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:urlCopied===i?C.accent:C.muted, cursor:'pointer', transition:'color 150ms', fontFamily:"'DM Sans',sans-serif" }}>
                        {urlCopied===i?'✓':'⎘'}
                      </button>
                      <span style={{ color:'rgba(255,255,255,0.2)', fontSize:11, transition:'transform 200ms', display:'inline-block', transform:isOpen?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop:`1px solid rgba(255,255,255,0.06)`, padding:'1rem', background:'rgba(0,0,0,0.2)', display:'flex', flexDirection:'column', gap:14 }}>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{ep.description}</p>

                      {ep.method==='GET' && !ep.hasId && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
                          {['?page=1','?limit=10','?sort=-createdAt','?filter=name:john'].map(p=>(
                            <span key={p} style={{ fontFamily:"'DM Mono',monospace", fontSize:10, padding:'0.35rem 0.6rem', borderRadius:6, background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.06)`, color:'rgba(255,255,255,0.3)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p}</span>
                          ))}
                        </div>
                      )}

                      {/* Snippet tabs */}
                      <div style={{ display:'flex', gap:4, padding:'0.25rem', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid rgba(255,255,255,0.06)`, width:'fit-content' }}>
                        {['fetch','axios'].map(t=>(
                          <button key={t} onClick={()=>setSnippetTab(t)} style={{ fontSize:11, padding:'0.3rem 0.8rem', borderRadius:6, fontFamily:"'DM Mono',monospace", background:snippetTab===t?'rgba(255,255,255,0.1)':'transparent', color:snippetTab===t?C.fg:'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', transition:'all 150ms' }}>{t}</button>
                        ))}
                      </div>

                      <CodeBlock lang={snippetTab} code={snippetTab==='fetch'?buildFetchSnippet(ep.method,ep.url,fields):buildAxiosSnippet(ep.method,ep.url,fields)}/>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Schema preview */}
        {!loading && fields.length>0 && (
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'0.65rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)', fontFamily:"'Space Grotesk',sans-serif" }}>Schema — {name}</span>
            </div>
            <div>
              {fields.map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.6rem 1rem', borderBottom:i<fields.length-1?`1px solid rgba(255,255,255,0.04)`:'none' }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'rgba(255,255,255,0.7)', width:144, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.fieldName}</span>
                  <span style={{ fontSize:11, padding:'0.15rem 0.5rem', borderRadius:6, border:'1px solid rgba(34,197,94,0.2)', background:'rgba(34,197,94,0.08)', color:`${C.accent}aa`, fontFamily:"'DM Mono',monospace" }}>{f.type}</span>
                  {f.required && <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>required</span>}
                  {f.type==='enum' && f.values?.length>0 && <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:`${C.yellow}66` }}>[{f.values.join(', ')}]</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}