import { createContext } from 'react'

export type ToastOptions = {
	duration?: number
}

export type ToastContextValue = {
	showToast: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
