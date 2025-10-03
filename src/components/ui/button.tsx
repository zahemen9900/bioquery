import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

type ButtonIconProps = {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biosphere-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-biosphere-500 text-space-900 hover:bg-biosphere-600 shadow-md hover:shadow-lg hover:scale-105 active:scale-100',
        secondary: 'bg-scheme-surface text-scheme-text hover:bg-scheme-surface-hover border border-scheme-border shadow-sm hover:shadow-md',
        outline: 'border border-scheme-border bg-transparent text-scheme-text hover:bg-scheme-surface',
        link: 'text-biosphere-500 underline-offset-4 hover:text-biosphere-600 hover:underline',
        ghost: 'text-scheme-text hover:bg-scheme-surface',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        link: 'h-auto px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    ButtonIconProps {
  asChild?: boolean
  title?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, iconLeft, iconRight, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {iconLeft ? <span className="inline-flex items-center justify-center">{iconLeft}</span> : null}
        <span>{children ?? props.title}</span>
        {iconRight ? <span className="inline-flex items-center justify-center">{iconRight}</span> : null}
      </Comp>
    )
  },
)

Button.displayName = 'Button'
