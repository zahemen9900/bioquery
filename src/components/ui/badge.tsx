import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-biosphere-500/40 focus:ring-offset-1',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-biosphere-500 text-space-900 shadow-sm',
				secondary: 'border-transparent bg-scheme-muted/30 text-scheme-muted-text',
				outline: 'border-scheme-border/60 bg-transparent text-scheme-muted-text',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
	<span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
))

Badge.displayName = 'Badge'

export { Badge }
