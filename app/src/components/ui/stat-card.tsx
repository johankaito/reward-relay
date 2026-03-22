import * as React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, icon, accent = false, className }: StatCardProps) {
  return (
    <div className={cn("glass-panel rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        {icon && <span className="text-sm text-primary/40">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-black tabular-nums",
          accent ? "text-primary" : "text-on-surface",
        )}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-on-surface-variant">{sub}</p>}
    </div>
  )
}
