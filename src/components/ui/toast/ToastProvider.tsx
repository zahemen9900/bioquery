import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ToastContext, type ToastContextValue, type ToastAction } from './context'

type ToastEntry = {
	id: number
	message: string
	duration: number
	action?: ToastAction
}

const MIN_DURATION = 1500
const DEFAULT_DURATION = 2500

type ToastProviderProps = {
	children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastEntry[]>([])
	const timers = useRef<Record<number, number>>({})

	const removeToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id))
		const handle = timers.current[id]
		if (handle) {
			window.clearTimeout(handle)
			delete timers.current[id]
		}
	}, [])

	const showToast = useCallback<ToastContextValue['showToast']>((message, options) => {
		if (!message.trim()) return

		const id = Date.now()
		const duration = Math.max(MIN_DURATION, options?.duration ?? DEFAULT_DURATION)
		const action = options?.action

		setToasts((prev) => [...prev, { id, message, duration, action }])

		const timeoutId = window.setTimeout(() => removeToast(id), duration)
		timers.current[id] = timeoutId
	}, [removeToast])

	useEffect(() => () => {
		Object.values(timers.current).forEach((handle) => window.clearTimeout(handle))
		timers.current = {}
	}, [])

	const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
				<div className="flex w-full max-w-md flex-col gap-2">
					<AnimatePresence initial={false}>
						{toasts.map((toast) => (
							<motion.div
								key={toast.id}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 16 }}
								transition={{ duration: 0.22 }}
								className="pointer-events-auto rounded-xl border border-scheme-border bg-scheme-surface px-4 py-3 text-sm text-scheme-text shadow-2xl shadow-black/15"
							>
								<div className="flex items-center gap-3">
									<span className="flex-1 text-sm text-scheme-text">{toast.message}</span>
									{toast.action ? (
										<button
											type="button"
											onClick={() => {
												removeToast(toast.id)
												toast.action?.onClick()
											}}
											className="rounded-md border border-biosphere-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-biosphere-300 transition hover:border-biosphere-400 hover:text-biosphere-200"
										>
											{toast.action.label}
										</button>
									) : null}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>
		</ToastContext.Provider>
	)
}
