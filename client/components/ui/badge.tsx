import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border-border",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/20",
        outline:
          "bg-transparent text-foreground border-border",
        ghost: "border-transparent bg-muted text-muted-foreground",
        link: "border-transparent underline-offset-4 [a&]:hover:underline text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
