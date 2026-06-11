import { cn } from '../../lib/utils'

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-8 w-full rounded-md border border-border bg-input px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-xs file:font-medium',
        className
      )}
      {...props}
    />
  )
}
