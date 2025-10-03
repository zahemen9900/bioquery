import * as React from 'react'

import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-scheme-border bg-scheme-surface px-4 text-sm text-scheme-text shadow-sm outline-none transition-all placeholder:text-scheme-muted focus:border-biosphere-500 focus:ring-2 focus:ring-biosphere-500/40 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'
