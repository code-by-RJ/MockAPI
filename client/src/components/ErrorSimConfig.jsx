import { useState } from 'react'
import api from '../lib/axios'
import { useToast } from '../context/ToastContext'

export default function ErrorSimConfig({ slug, resourceName, initialErrorRate = 0, initialDelay = 0 }) {
  const { toast } = useToast()
  const [errorRate, setErrorRate] = useState(initialErrorRate)
  const [delay, setDelay]         = useState(initialDelay)
  const [saving, setSaving]       = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.patch(`/projects/${slug}/resources/${resourceName}/config`, { errorRate, delay })
      toast('Config saved', 'success')
    } catch {
      toast('Failed to save config', 'error')
    } finally {
      setSaving(false)
    }
  }

  const errorPct   = Math.round(errorRate * 100)
  const errorColor = errorPct === 0 ? 'text-white/30' : errorPct < 30 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Error Simulation</span>
          {(errorRate > 0 || delay > 0) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
              Active
            </span>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30
            text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Config'}
        </button>
      </div>

      <div className="p-4 space-y-5">

        {/* Error Rate slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/70">Error Rate</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {errorPct === 0
                  ? 'All requests succeed'
                  : `${errorPct}% of requests → 500 error`}
              </p>
            </div>
            <span className={`text-lg font-bold font-mono ${errorColor}`}>
              {errorPct}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range" min={0} max={1} step={0.05}
              value={errorRate}
              onChange={e => setErrorRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                bg-white/10 accent-red-500"
            />
            {/* Track fill visual hint */}
            <div
              className="absolute top-0 left-0 h-1.5 rounded-full bg-red-500/50 pointer-events-none mt-[1px]"
              style={{ width: `${errorPct}%`, transition: 'width 0.1s' }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/20 font-mono px-0.5">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Delay slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/70">Response Delay</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {delay === 0
                  ? 'No artificial delay'
                  : delay < 1000
                    ? `${delay}ms added to every response`
                    : `${(delay / 1000).toFixed(1)}s added to every response`}
              </p>
            </div>
            <span className={`text-lg font-bold font-mono ${delay === 0 ? 'text-white/30' : 'text-amber-400'}`}>
              {delay < 1000 ? `${delay}ms` : `${(delay / 1000).toFixed(1)}s`}
            </span>
          </div>
          <div className="relative">
            <input
              type="range" min={0} max={5000} step={100}
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                bg-white/10 accent-amber-500"
            />
            <div
              className="absolute top-0 left-0 h-1.5 rounded-full bg-amber-500/50 pointer-events-none mt-[1px]"
              style={{ width: `${(delay / 5000) * 100}%`, transition: 'width 0.1s' }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/20 font-mono px-0.5">
            <span>0</span><span>1s</span><span>2s</span><span>3s</span><span>4s</span><span>5s</span>
          </div>
        </div>

        {/* Warning when both are active */}
        {errorRate > 0 && delay > 0 && (
          <p className="text-[10px] text-amber-400/60 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
            ⚠ Both active — errored requests still wait {delay}ms before failing
          </p>
        )}
      </div>
    </div>
  )
}