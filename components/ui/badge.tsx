import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border-2 px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-white/25 bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.15)_inset] [a&]:hover:bg-primary/90',
        secondary:
          'border-white/20 bg-secondary text-secondary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.1)_inset] [a&]:hover:bg-secondary/90',
        destructive:
          'border-white/15 bg-destructive text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground border-white/25 shadow-[0_2px_6px_rgba(0,0,0,0.15)] [a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:hover:border-white/35',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
