import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-8 w-full appearance-none rounded-md border border-border bg-input px-3 pr-8 py-1 text-xs text-foreground',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}
