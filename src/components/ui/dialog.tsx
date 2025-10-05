import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { HiOutlineXMark } from 'react-icons/hi2'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-40 bg-space-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Content asChild {...props}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={cn('relative w-full max-w-2xl rounded-2xl border border-scheme-border/70 bg-scheme-surface p-6 shadow-2xl focus:outline-none', className)}
          >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg bg-scheme-surface/80 p-1.5 text-scheme-muted-text transition-colors hover:bg-scheme-muted/20 hover:text-scheme-text focus:outline-none focus:ring-2 focus:ring-biosphere-500/50">
              <HiOutlineXMark className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-left', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold text-scheme-text', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-scheme-muted-text', className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogPortal, DialogTitle, DialogTrigger }
