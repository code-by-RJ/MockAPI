import { useState, useEffect } from 'react'
import { useParams, Link }     from 'react-router-dom'

const C = { bg:"#0F172A",surface:"#1E293B",surface2:"#272F42",border:"#334155",fg:"#F8FAFC",muted:"#94A3B8",accent:"#22C55E",accentDim:"#16A34A",red:"#EF4444",yellow:"#FBBF24",blue:"#60A5FA" }
const FONTS = '' // fonts loaded globally via index.html <link> — see batch 1 fix
const ANIM  = `@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.page-enter{animation:pageIn 0.35s ease forwards} @keyframes spin{to{transform:rotate(360deg)}} .spinner{animation:spin 0.8s linear infinite} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} .pulse{animation:pulse 2s infinite}`

const METHOD_COLOR = {
  GET:    { text:'#22C55E', bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.25)'  },
  POST:   { text:'#60A5FA', bg:'rgba(96,165,250,0.1)', border:'rgba(96,165,250,0.25)' },
  PUT:    { text:'#FBBF24', bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.25)' },
  DELETE: { text:'#F87171', bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)'  },
}

const BASE_ENDPOINTS = (baseUrl, name) => [
  { method:'GET',    url:`${baseUrl}/${name}`,     description:'List all (page, limit, sort, filter)' },
  { method:'GET',    url:`${baseUrl}/${name}/:id`, description:'Get by ID' },
  { method:'POST',   url:`${baseUrl}/${name}`,     description:'Create new record' },
  { method:'PUT',    url:`${baseUrl}/${name}/:id`, description:'Update by ID' },
  { method:'DELETE', url:`${baseUrl}/${name}/:id`, description:'Delete by ID' },
]

function CopyButton({ text, label='⎘ Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  return (
    <button onClick={copy} style={{ fontSize:11, padding:'0.25rem 0.65rem', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:copied?C.accent:C.muted, cursor:'pointer', transition:'color 150ms', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
      {copied?'✓ Copied':label}
    </button>
  )
}

function LiveDataPreview({ url }) {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${url}?limit=3`)
      .then(r=>r.json())
      .then(d=>{ setData(d); setLoading(false) })
      .catch(()=>{ setError('Failed to fetch live data'); setLoading(false) })
  }, [url])

  if (loading) return (
    <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:8 }}>
      {[1,2,3].map(i=><div key={i} style={{ height:14, borderRadius:4, background:'rgba(255,255,255,0.05)', animation:'pulse 1.5s ease infinite' }}/>)}
    </div>
  )
  if (error) return <p style={{ padding:'1rem', fontSize:12, color:`${C.red}99` }}>{error}</p>
  return (
    <pre style={{ padding:'1rem', fontSize:11, fontFamily:"'DM Mono',monospace", color:`${C.accent}bb`, overflowX:'auto', whiteSpace:'pre', lineHeight:1.7, maxHeight:240, overflowY:'auto' }}>
      {JSON.stringify(data,null,2)}
    </pre>
  )
}

export default function ShareableDemo() {
  const { slug } = useParams()

  const [resources, setResources]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeResource, setActiveResource] = useState(null)
  const [copied, setCopied]         = useState(false)

  const BASE_URL = `${window.location.origin}/api/${slug}`
  const DEMO_URL = `${window.location.origin}/demo/${slug}`

  useEffect(() => {
    fetch(`${window.location.origin}/api/projects`)
      .then(r=>{ if(!r.ok) throw new Error(); return r.json() })
      .then(d=>{
        const project = d.data?.find(p=>p.slug===slug)
        if (!project?.isPublic) { setError('This project is private or does not exist.'); setLoading(false); return }
        return fetch(`${window.location.origin}/api/projects/${slug}/resources`)
      })
      .then(r=>r?.json())
      .then(d=>{
        if (!d) return
        const list = d.data || []
        setResources(list)
        if (list.length>0) setActiveResource(list[0].name)
        setLoading(false)
      })
      .catch(()=>{ setError('Could not load project. Make sure it exists and is set to Public.'); setLoading(false) })
  }, [slug])

  const copyDemoLink = () => { navigator.clipboard.writeText(DEMO_URL); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{FONTS}{ANIM}</style>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:22, height:22, border:`2px solid rgba(34,197,94,0.2)`, borderTop:`2px solid ${C.accent}`, borderRadius:'50%', margin:'0 auto 12px' }}/>
        <p style={{ fontSize:13, color:'#94A3B8', fontFamily:"'DM Sans',sans-serif" }}>Loading demo…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <style>{FONTS}{ANIM}</style>
      <div style={{ textAlign:'center', maxWidth:320 }}>
        <p style={{ fontSize:32, marginBottom:16 }}>🔒</p>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:20, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{error}</p>
        <Link to="/" style={{ fontSize:12, color:C.accent, textDecoration:'none', fontFamily:"'DM Sans',sans-serif" }}>← Back to MockAPI</Link>
      </div>
    </div>
  )

  const activeRes = resources.find(r=>r.name===activeResource)
  const endpoints = activeRes ? BASE_ENDPOINTS(BASE_URL, activeRes.name) : []

  return (
    <div className="page-enter" style={{ minHeight:'100vh', background:C.bg, color:C.fg, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{FONTS}{ANIM}{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0} .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`}</style>

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:'0 clamp(1.5rem,5vw,3rem)', height:60, display:'flex', alignItems:'center', background:'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <div style={{ width:26, height:26, background:C.accent, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
                  <rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/>
                </svg>
              </div>
              <Link to="/" style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, color:'rgba(255,255,255,0.7)', textDecoration:'none' }}>MockAPI</Link>
            </div>
            <span style={{color:'#94A3B8' }}>/</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.fg }}>{slug}</span>
            <span style={{ fontSize:10, padding:'0.2rem 0.6rem', borderRadius:100, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.08)', color:C.accent, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>Public</span>
          </div>
          <button onClick={copyDemoLink} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, padding:'0.35rem 0.85rem', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:copied?C.accent:C.muted, cursor:'pointer', transition:'color 150ms,border-color 150ms', fontFamily:"'DM Sans',sans-serif" }}>
            🔗 {copied?'Copied!':'Share Demo'}
          </button>
        </div>
      </div>

      <main style={{ maxWidth:1000, margin:'0 auto', padding:'2rem clamp(1.5rem,5vw,3rem)', display:'flex', flexDirection:'column', gap:24 }}>
        <h1 className="sr-only">{slug} — Public demo</h1>

        {/* Base URL */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.75rem 1rem', borderRadius:10, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize:10, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em', flexShrink:0, fontFamily:"'Space Grotesk',sans-serif" }}>Base URL</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'rgba(255,255,255,0.6)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{BASE_URL}</span>
          <CopyButton text={BASE_URL}/>
        </div>

        {/* Resource tabs */}
        {resources.length>1 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, padding:'0.25rem', borderRadius:10, background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.06)`, width:'fit-content' }}>
            {resources.map(r=>(
              <button key={r.name} onClick={()=>setActiveResource(r.name)} style={{ fontSize:12, padding:'0.35rem 1rem', borderRadius:8, fontFamily:"'DM Mono',monospace", background:activeResource===r.name?'rgba(255,255,255,0.1)':'transparent', color:activeResource===r.name?C.fg:'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', transition:'all 150ms' }}>{r.name}</button>
            ))}
          </div>
        )}

        {activeRes && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

            {/* Endpoints + Schema */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'Space Grotesk',sans-serif" }}>Endpoints — {activeRes.name}</div>

              <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                {endpoints.map((ep,i)=>{
                  const mc = METHOD_COLOR[ep.method]
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.65rem 1rem', borderBottom:i<endpoints.length-1?`1px solid rgba(255,255,255,0.04)`:'none', transition:'background 150ms' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{ flexShrink:0, padding:'0.15rem 0.4rem', borderRadius:5, border:`1px solid ${mc.border}`, background:mc.bg, color:mc.text, fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace", width:56, textAlign:'center' }}>{ep.method}</span>
                      <span style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.url}</span>
                      <span style={{ fontSize:11, color:'#94A3B8', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{ep.description}</span>
                      <CopyButton text={ep.url}/>
                    </div>
                  )
                })}
              </div>

              {activeRes.schema?.length>0 && (
                <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                  <div style={{ padding:'0.6rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'Space Grotesk',sans-serif" }}>Schema</span>
                  </div>
                  {activeRes.schema.map((f,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.55rem 1rem', borderBottom:i<activeRes.schema.length-1?`1px solid rgba(255,255,255,0.04)`:'none' }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'rgba(255,255,255,0.7)', width:128, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.fieldName}</span>
                      <span style={{ fontSize:11, padding:'0.15rem 0.5rem', borderRadius:6, border:'1px solid rgba(34,197,94,0.2)', background:'rgba(34,197,94,0.08)', color:C.accent, fontFamily:"'DM Mono',monospace" }}>{f.type}</span>
                      {f.required && <span style={{ fontSize:10, color:'#94A3B8' }}>required</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live data */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'Space Grotesk',sans-serif" }}>Live Data</div>
              <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', background:'rgba(0,0,0,0.4)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.6rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="pulse" style={{ width:7, height:7, borderRadius:'50%', background:C.accent, display:'inline-block' }}/>
                    <span style={{ fontSize:11, color:'#94A3B8', fontFamily:"'DM Mono',monospace" }}>GET /{activeRes.name}?limit=3</span>
                  </div>
                </div>
                <LiveDataPreview url={`${BASE_URL}/${activeRes.name}`} key={activeRes.name}/>
              </div>
              <div style={{ textAlign:'center', paddingTop:4 }}>
                <p style={{ fontSize:10, color:'#94A3B8', fontFamily:"'DM Sans',sans-serif" }}>
                  Powered by <Link to="/" style={{ color:`${C.accent}66`, textDecoration:'none' }}>MockAPI</Link> · mockapi.spacego.online
                </p>
              </div>
            </div>
          </div>
        )}

        {resources.length===0 && (
          <div style={{ padding:'5rem 2rem', textAlign:'center' }}>
            <p style={{ fontSize:13, color:'#94A3B8', fontFamily:"'DM Sans',sans-serif" }}>This project has no resources yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}