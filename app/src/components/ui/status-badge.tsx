import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant =
  | "primary"
  | "qualified"
  | "pending"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | "expired"

const variantClasses: Record<BadgeVariant, string> = {
  primary:   "bg-primary/10 text-primary border-primary/20",
  qualified: "bg-primary/20 text-primary border-primary/30",
  pending:   "bg-tertiary/10 text-tertiary border-tertiary/20",
  info:      "bg-tertiary/10 text-tertiary border-tertiary/20",
  warning:   "bg-amber-400/10 text-amber-400 border-amber-400/20",
  danger:    "bg-destructive/10 text-destructive border-destructive/20",
  neutral:   "bg-on-surface/10 text-on-surface-variant border-transparent",
  expired:   "bg-surface-container-highest text-on-surface-variant border-transparent",
}

const dotClasses: Record<BadgeVariant, string> = {
  primary:   "bg-primary",
  qualified: "bg-primary",
  pending:   "bg-tertiary",
  info:      "bg-tertiary",
  warning:   "bg-amber-400",
  danger:    "bg-destructive",
  neutral:   "bg-on-surface-variant",
  expired:   "bg-on-surface-variant",
}

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  /** Show the dot indicator (design system default for status badges) */
  dot?: boolean
  className?: string
}

export function StatusBadge({
  children,
  variant = "primary",
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest",
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])} />
      )}
      {children}
    </span>
  )
}
