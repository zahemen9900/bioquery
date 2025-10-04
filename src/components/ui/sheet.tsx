import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal
const SheetOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-40 bg-space-900/60 backdrop-blur-sm', className)}
      {...props}
    />
  ),
)
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

type SheetSide = 'left' | 'right'

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide
}

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content ref={ref} {...props} asChild>
        <motion.div
          initial={{ x: side === 'left' ? '-100%' : '100%' }}
          animate={{ x: 0 }}
          exit={{ x: side === 'left' ? '-100%' : '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className={cn(
            'fixed inset-y-0 z-50 flex w-80 max-w-full flex-col border border-scheme-border/60 bg-scheme-surface shadow-2xl',
            side === 'left' ? 'left-0 rounded-r-3xl' : 'right-0 rounded-l-3xl',
            className,
          )}
        >
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </SheetPortal>
  ),
)
SheetContent.displayName = DialogPrimitive.Content.displayName

export { Sheet, SheetClose, SheetContent, SheetOverlay, SheetPortal, SheetTrigger }
