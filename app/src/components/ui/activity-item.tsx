import * as React from "react"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  primary: string
  secondary?: string
  value?: React.ReactNode
  className?: string
}

export function ActivityItem({ primary, secondary, value, className }: ActivityItemProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-4", className)}>
      <div>
        <p className="text-sm font-semibold text-on-surface">{primary}</p>
        {secondary && (
          <p className="text-[10px] text-on-surface-variant">{secondary}</p>
        )}
      </div>
      {value !== undefined && (
        <span className="tabular-nums text-sm font-bold text-primary">{value}</span>
      )}
    </div>
  )
}
