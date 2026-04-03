import { useState, useCallback, useRef } from 'react'
import { ToastContext, type Toast, type ToastType } from '../../hooks/useToast'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timers.current[id]
    }, 3500)
  }, [])

  function dismiss(id: string) {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const ICON = { success: CheckCircle, error: XCircle, info: Info }
  const COLOR = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map(t => {
          const Icon = ICON[t.type]
          return (
            <div key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${COLOR[t.type]} animate-slide-in`}>
              <Icon size={17} className="shrink-0 mt-0.5" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
