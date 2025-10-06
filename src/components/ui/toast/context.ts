import { createContext } from 'react'

export type ToastAction = {
	label: string
	onClick: () => void
}

export type ToastOptions = {
	duration?: number
	action?: ToastAction
}

export type ToastContextValue = {
	showToast: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
