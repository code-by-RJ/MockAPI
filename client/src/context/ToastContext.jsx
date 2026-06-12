import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

const CONFIG = {
  success: { icon: '✓', bg: 'bg-emerald-500/90 border-emerald-400/30' },
  error:   { icon: '✕', bg: 'bg-red-500/90 border-red-400/30' },
  info:    { icon: 'ℹ', bg: 'bg-blue-500/90 border-blue-400/30' },
  copy:    { icon: '⎘', bg: 'bg-violet-500/90 border-violet-400/30' }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => removeToast(id), 3200)
    return id
  }, [removeToast])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const { icon, bg } = CONFIG[t.type] || CONFIG.success
          return (
            <div
              key={t.id}
              style={{ animation: 'toastIn 0.22s ease-out both' }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium
                text-white border backdrop-blur-sm shadow-xl pointer-events-auto
                ${bg}`}
            >
              <span className="text-base leading-none">{icon}</span>
              {t.message}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
