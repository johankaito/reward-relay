import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "primary" | "warning" | "danger" | "neutral"

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-amber-400/10 text-amber-400",
  danger: "bg-[#ffb4ab]/10 text-[#ffb4ab]",
  neutral: "bg-on-surface/10 text-on-surface-variant",
}

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function StatusBadge({ children, variant = "primary", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
