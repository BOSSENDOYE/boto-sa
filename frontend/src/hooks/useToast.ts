import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface ToastContextValue {
  toasts: Toast[]
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}
