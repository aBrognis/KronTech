import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary/15 text-primary border border-primary/25',
        secondary:   'bg-secondary text-secondary-foreground border border-border',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/25',
        success:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
        warning:     'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
        outline:     'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export function Badge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { badgeVariants }
