import { useEffect, useRef } from 'react'

/**
 * ConfirmModal — reusable destructive-action confirmation dialog
 *
 * Props:
 *   isOpen    {bool}     — show/hide
 *   onClose   {fn}       — called on cancel / Esc / backdrop click
 *   onConfirm {fn}       — called on confirm button click
 *   title     {string}   — modal heading
 *   message   {string}   — body text (supports JSX)
 *   confirmLabel {string} — confirm button label (default: 'Delete')
 *   loading   {bool}     — disable buttons while async op runs
 *   variant   {string}   — 'danger' (red) | 'default' (violet)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Are you sure?',
  message      = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading      = false,
  variant      = 'danger',
}) {
  const confirmBtnRef = useRef(null)

  // Esc to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, loading, onClose])

  // Auto-focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => confirmBtnRef.current?.focus(), 50)
  }, [isOpen])

  if (!isOpen) return null

  const isDanger = variant === 'danger'

  const confirmClasses = isDanger
    ? 'bg-red-600 hover:bg-red-500 focus:ring-red-500/40 text-white'
    : 'bg-violet-600 hover:bg-violet-500 focus:ring-violet-500/40 text-white'

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111118] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Top accent line */}
        <div className={`h-0.5 w-full ${isDanger ? 'bg-red-500/60' : 'bg-violet-500/60'}`} />

        <div className="p-6 space-y-4">
          {/* Icon + Title */}
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
              ${isDanger ? 'bg-red-500/10 border border-red-500/20' : 'bg-violet-500/10 border border-violet-500/20'}`}>
              {isDanger ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={isDanger ? '#EF4444' : '#818CF8'} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#818CF8" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                className="text-base font-semibold text-white leading-tight"
              >
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-white/40 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/40
                hover:text-white hover:border-white/20 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
                focus:ring-2 focus:ring-white/20"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                focus:ring-2 ${confirmClasses}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {confirmLabel}…
                </span>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}