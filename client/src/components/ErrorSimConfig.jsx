import { useState } from 'react'
import api from '../lib/axios'
import { useToast } from '../contexts/ToastContext'

const C = {
  surface:"#1E293B", surface2:"#272F42", border:"#334155",
  fg:"#F8FAFC", muted:"#94A3B8", accent:"#22C55E", accentDim:"#16A34A",
  red:"#EF4444", yellow:"#FBBF24", orange:"#F97316",
}

export default function ErrorSimConfig({ slug, resourceName, initialErrorRate = 0, initialDelay = 0 }) {
  const { toast }   = useToast()
  const [errorRate, setErrorRate] = useState(initialErrorRate) // float 0–1
  const [delay, setDelay]         = useState(initialDelay)     // ms 0–5000
  const [saving, setSaving]       = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.patch(`/projects/${slug}/resources/${resourceName}/config`, { errorRate, delay })
      toast('Config saved', 'success')
    } catch { toast('Failed to save config', 'error') }
    finally { setSaving(false) }
  }

  const errPct   = Math.round(errorRate * 100)
  const delayPct = (delay / 5000) * 100
  const isActive = errorRate > 0 || delay > 0

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', maxWidth:'100%' }}>
      <style>{`
        .sim-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;outline:none;cursor:pointer;display:block}
        .sim-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;margin-top:-7px}
        .sim-range.err::-webkit-slider-thumb{background:${C.red}}
        .sim-range.dly::-webkit-slider-thumb{background:${C.yellow}}
        .sim-range::-webkit-slider-runnable-track{height:4px;border-radius:4px}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1.25rem', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, color:C.fg }}>Error Simulation</h3>
          {isActive && <span style={{ fontSize:10, padding:'0.2rem 0.55rem', borderRadius:100, background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.25)', color:C.orange, fontWeight:600 }}>Active</span>}
        </div>
        <button onClick={save} disabled={saving} style={{ fontSize:12, padding:'0.35rem 0.9rem', borderRadius:8, background:saving?C.accentDim:C.accent, color:'#0F172A', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, border:'none', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
          {saving?'Saving…':'Save Config'}
        </button>
      </div>

      <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Error Rate */}
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color:C.fg, marginBottom:2 }}>Error Rate</div>
              <div style={{ fontSize:11, color:C.muted }}>{errPct===0?'All requests succeed':`${errPct}% of requests → 500 error`}</div>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:errPct>0?C.red:C.muted, flexShrink:0, minWidth:52, textAlign:'right' }}>{errPct}%</div>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={errorRate}
            onChange={e=>setErrorRate(Number(e.target.value))}
            className="sim-range err"
            aria-label="Error rate percentage"
            style={{ background:`linear-gradient(to right,${errPct>0?C.red:C.border} 0%,${errPct>0?C.red:C.border} ${errPct}%,${C.surface2} ${errPct}%,${C.surface2} 100%)` }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, overflow:'hidden' }}>
            {['0%','25%','50%','75%','100%'].map(t=><span key={t} style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>{t}</span>)}
          </div>
        </div>

        <div style={{ borderTop:`1px solid ${C.border}` }}/>

        {/* Delay */}
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color:C.fg, marginBottom:2 }}>Response Delay</div>
              <div style={{ fontSize:11, color:C.muted }}>{delay===0?'No artificial delay':delay<1000?`${delay}ms added to every response`:`${(delay/1000).toFixed(1)}s added to every response`}</div>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:delay>0?C.yellow:C.muted, flexShrink:0, minWidth:52, textAlign:'right' }}>{delay<1000?`${delay}ms`:`${(delay/1000).toFixed(1)}s`}</div>
          </div>
          <input
            type="range" min={0} max={5000} step={100}
            value={delay}
            onChange={e=>setDelay(Number(e.target.value))}
            className="sim-range dly"
            aria-label="Response delay in milliseconds"
            style={{ background:`linear-gradient(to right,${delay>0?C.yellow:C.border} 0%,${delay>0?C.yellow:C.border} ${delayPct}%,${C.surface2} ${delayPct}%,${C.surface2} 100%)` }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, overflow:'hidden' }}>
            {['0','1s','2s','3s','4s','5s'].map(t=><span key={t} style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>{t}</span>)}
          </div>
        </div>

        {errorRate > 0 && delay > 0 && (
          <div style={{ padding:'0.6rem 0.85rem', borderRadius:8, background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', fontSize:11, color:C.orange, display:'flex', alignItems:'center', gap:6 }}>
            ⚠ Both active — errored requests still wait {delay}ms before failing
          </div>
        )}
      </div>
    </div>
  )
}
