import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Dialog({ open, onOpenChange, children }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  )
}

export function DialogTrigger({ children, asChild }) {
  return <RadixDialog.Trigger asChild={asChild}>{children}</RadixDialog.Trigger>
}

export function DialogContent({ className, title, description, children, ...props }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl',
          'animate-fade-up outline-none',
          className
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="h-4 w-4" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogHeader({ className, children }) {
  return (
    <div className={cn('flex flex-col space-y-1 px-6 py-4 border-b border-border', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ className, children }) {
  return (
    <RadixDialog.Title className={cn('text-sm font-semibold text-foreground', className)}>
      {children}
    </RadixDialog.Title>
  )
}

export function DialogDescription({ className, children }) {
  return (
    <RadixDialog.Description className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </RadixDialog.Description>
  )
}

export function DialogBody({ className, children }) {
  return (
    <div className={cn('px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto', className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ className, children }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t border-border', className)}>
      {children}
    </div>
  )
}
