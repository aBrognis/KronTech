import { cn } from '../../lib/utils'

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        'block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}
