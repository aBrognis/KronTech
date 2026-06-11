import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground shadow hover:brightness-110 active:brightness-95',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 active:bg-destructive/20',
        outline:     'border border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground active:bg-secondary/70',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/60',
        ghost:       'text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary/70',
        link:        'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:      'h-7 px-3 text-xs rounded-md',
        default: 'h-8 px-4 text-xs',
        lg:      'h-10 px-6 text-sm',
        icon:    'h-8 w-8 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({ className, variant, size, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  )
}

export { buttonVariants }
