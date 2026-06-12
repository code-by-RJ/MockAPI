import { useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'
import { LogRowSkeleton } from './Skeleton'

const METHOD_STYLE = {
  GET:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  POST:   'text-blue-400   bg-blue-400/10   border-blue-400/25',
  PUT:    'text-amber-400  bg-amber-400/10  border-amber-400/25',
  DELETE: 'text-red-400    bg-red-400/10    border-red-400/25'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60_000)  return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  return new Date(dateStr).toLocaleTimeString()
}

export default function RequestLogsPanel({ projectSlug }) {
  const [logs, setLogs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tick, setTick]               = useState(0) // forces re-render for timeAgo

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectSlug}/logs`)
      setLogs(res.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [projectSlug])

  // Initial fetch
  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Auto-refresh every 5 s
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchLogs, 5000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchLogs])

  // Re-render timeAgo every 30 s without refetching
  useEffect(() => {
    const id = setInterval(() => setTick(p => p + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-white">Request Logs</span>
          <span className="text-[10px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">
            last 100
          </span>
          {logs.length > 0 && (
            <span className="text-[10px] text-white/30">
              {logs.length} entries
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
              autoRefresh
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'border-white/10 text-white/30 hover:text-white/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <button
            onClick={fetchLogs}
            className="text-[11px] text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            ↻
          </button>

          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-white/20 hover:text-red-400/70 transition-colors px-2 py-1 rounded-md hover:bg-red-500/5"
              title="Clear local view (does not delete from DB)"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Log rows ── */}
      <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <LogRowSkeleton key={i} />)
        ) : logs.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-xs text-white/25">No requests recorded yet</p>
            <p className="text-[10px] text-white/15">Hit your API endpoints to see logs appear here</p>
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log._id}
              className="flex items-center gap-3 px-4 py-2 font-mono text-[11px] hover:bg-white/[0.02] transition-colors group"
            >
              {/* Method badge */}
              <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold
                ${METHOD_STYLE[log.method] || 'text-white/40 bg-white/5 border-white/10'}`}>
                {log.method}
              </span>

              {/* Status */}
              <span className={`shrink-0 w-8 text-center font-bold text-xs
                ${log.statusCode < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                {log.statusCode}
              </span>

              {/* Path */}
              <span className="flex-1 text-white/40 truncate group-hover:text-white/60 transition-colors">
                {log.path}
              </span>

              {/* Duration */}
              <span className={`shrink-0 text-right w-12
                ${log.duration > 1000 ? 'text-amber-400/70' : 'text-white/25'}`}>
                {log.duration}ms
              </span>

              {/* Time */}
              <span className="shrink-0 text-white/20 hidden sm:block w-14 text-right" key={tick}>
                {timeAgo(log.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Footer summary bar ── */}
      {logs.length > 0 && (() => {
        const errors   = logs.filter(l => l.statusCode >= 400).length
        const avgMs    = Math.round(logs.reduce((s, l) => s + l.duration, 0) / logs.length)
        const errorPct = Math.round((errors / logs.length) * 100)
        return (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] bg-white/[0.01]">
            <span className="text-[10px] text-white/20">
              avg <span className="text-white/40">{avgMs}ms</span>
            </span>
            <span className="text-[10px] text-white/20">
              errors <span className={errorPct > 0 ? 'text-red-400/70' : 'text-white/40'}>{errorPct}%</span>
            </span>
            <span className="text-[10px] text-white/20 ml-auto">
              {autoRefresh ? 'refreshes every 5s' : 'auto-refresh off'}
            </span>
          </div>
        )
      })()}
    </div>
  )
}