import * as React from "react"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  primary: string
  secondary?: string
  value?: React.ReactNode
  /** Optional icon rendered in a w-12 h-12 rounded-full circle.
   *  Pass the icon element; iconColor applies bg + text color classes. */
  icon?: React.ReactNode
  iconColor?: string
  className?: string
}

export function ActivityItem({
  primary,
  secondary,
  value,
  icon,
  iconColor = "bg-primary/10 text-primary",
  className,
}: ActivityItemProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-4", className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              iconColor,
            )}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-on-surface">{primary}</p>
          {secondary && (
            <p className="text-[10px] text-on-surface-variant">{secondary}</p>
          )}
        </div>
      </div>
      {value !== undefined && (
        <span className="tabular-nums text-sm font-bold text-primary">{value}</span>
      )}
    </div>
  )
}
