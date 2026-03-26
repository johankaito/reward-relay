import * as React from "react"
import { cn } from "@/lib/utils"

type AlertVariant = "info" | "error" | "warning"

const variantConfig: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  info: {
    bg: "bg-primary/5",
    border: "border-primary",
    icon: "ℹ",
    iconColor: "text-primary",
  },
  error: {
    bg: "bg-destructive/5",
    border: "border-destructive",
    icon: "⚠",
    iconColor: "text-destructive",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500",
    icon: "⚠",
    iconColor: "text-amber-400",
  },
}

interface AlertBannerProps {
  variant?: AlertVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function AlertBanner({
  variant = "info",
  title,
  description,
  icon,
  action,
  className,
}: AlertBannerProps) {
  const config = variantConfig[variant]

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-r-xl border-l-4 p-4",
        config.bg,
        config.border,
        className,
      )}
    >
      {icon ? (
        <span className={cn("mt-0.5 shrink-0 text-sm", config.iconColor)}>{icon}</span>
      ) : (
        <span className={cn("mt-0.5 shrink-0 text-sm font-bold", config.iconColor)}>
          {config.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-xs font-bold text-on-surface">{title}</p>
        )}
        {description && (
          <p className="mt-0.5 text-[10px] text-on-surface-variant">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
