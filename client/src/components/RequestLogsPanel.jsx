import { useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'
import { LogRowSkeleton } from './Skeleton'

const C = { accent:"#22C55E", red:"#EF4444", yellow:"#FBBF24", blue:"#60A5FA", muted:"#94A3B8", border:"#334155" }

const METHOD_COLOR = {
  GET:    { text:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)'  },
  POST:   { text:'#60A5FA', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)' },
  PUT:    { text:'#FBBF24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)' },
  DELETE: { text:'#EF4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)'  },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60_000)   return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  return new Date(dateStr).toLocaleTimeString()
}

export default function RequestLogsPanel({ projectSlug }) {
  const [logs, setLogs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tick, setTick]               = useState(0)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectSlug}/logs`)
      setLogs(res.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [projectSlug])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchLogs, 5000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchLogs])
  useEffect(() => {
    const id = setInterval(() => setTick(p => p + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const errors   = logs.filter(l => l.statusCode >= 400).length
  const avgMs    = logs.length ? Math.round(logs.reduce((s, l) => s + l.duration, 0) / logs.length) : 0
  const errorPct = logs.length ? Math.round((errors / logs.length) * 100) : 0

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', background:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color:'#F8FAFC' }}>Request Logs</span>
          <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.05)', padding:'0.15rem 0.5rem', borderRadius:5 }}>last 100</span>
          {logs.length > 0 && <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{logs.length} entries</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button
            onClick={() => setAutoRefresh(p => !p)}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, padding:'0.3rem 0.75rem', borderRadius:6, border:autoRefresh?`1px solid rgba(34,197,94,0.4)`:`1px solid ${C.border}`, background:autoRefresh?'rgba(34,197,94,0.1)':'transparent', color:autoRefresh?C.accent:'rgba(255,255,255,0.3)', cursor:'pointer', transition:'all 150ms', fontFamily:"'DM Sans',sans-serif" }}
          >
            <span style={{ width:6, height:6, borderRadius:'50%', background:autoRefresh?C.accent:'rgba(255,255,255,0.2)', animation:autoRefresh?'pulse 2s infinite':undefined, display:'inline-block' }}/>
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={fetchLogs} style={{ fontSize:13, color:'rgba(255,255,255,0.3)', background:'transparent', border:'none', cursor:'pointer', padding:'0.3rem 0.5rem', borderRadius:6, transition:'color 150ms' }} onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}>↻</button>
          {logs.length > 0 && <button onClick={() => setLogs([])} style={{ fontSize:11, color:'rgba(255,255,255,0.2)', background:'transparent', border:'none', cursor:'pointer', padding:'0.3rem 0.5rem', borderRadius:6, transition:'color 150ms', fontFamily:"'DM Sans',sans-serif" }} onMouseEnter={e=>e.currentTarget.style.color='rgba(239,68,68,0.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>Clear</button>}
        </div>
      </div>

      {/* Log rows */}
      <div style={{ maxHeight:288, overflowY:'auto' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <LogRowSkeleton key={i}/>)
        ) : logs.length === 0 ? (
          <div style={{ padding:'3rem 1rem', textAlign:'center' }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>No requests recorded yet</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.15)', marginTop:4 }}>Hit your API endpoints to see logs appear here</p>
          </div>
        ) : (
          logs.map(log => {
            const mc = METHOD_COLOR[log.method] || { text:'rgba(255,255,255,0.4)', bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.1)' }
            return (
              <div key={log._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.5rem 1rem', fontFamily:"'DM Mono',monospace", fontSize:11, borderBottom:`1px solid rgba(255,255,255,0.04)`, transition:'background 150ms', cursor:'default' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ flexShrink:0, padding:'0.15rem 0.4rem', borderRadius:5, border:`1px solid ${mc.border}`, background:mc.bg, color:mc.text, fontSize:10, fontWeight:700, width:44, textAlign:'center' }}>{log.method}</span>
                <span style={{ flexShrink:0, width:32, textAlign:'center', fontWeight:700, fontSize:12, color:log.statusCode<400?C.accent:C.red }}>{log.statusCode}</span>
                <span style={{ flex:1, color:'rgba(255,255,255,0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.path}</span>
                <span style={{ flexShrink:0, textAlign:'right', width:52, color:log.duration>1000?C.yellow:'rgba(255,255,255,0.25)' }}>{log.duration}ms</span>
                <span style={{ flexShrink:0, color:'rgba(255,255,255,0.2)', width:56, textAlign:'right' }} key={tick}>{timeAgo(log.timestamp)}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {logs.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0.5rem 1rem', borderTop:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.01)' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>avg <span style={{color:'rgba(255,255,255,0.4)'}}>{avgMs}ms</span></span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>errors <span style={{color:errorPct>0?'rgba(239,68,68,0.7)':'rgba(255,255,255,0.4)'}}>{errorPct}%</span></span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginLeft:'auto', fontFamily:"'DM Mono',monospace" }}>{autoRefresh?'refreshes every 5s':'auto-refresh off'}</span>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}