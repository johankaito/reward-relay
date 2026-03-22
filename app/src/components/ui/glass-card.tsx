import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  /** Show ambient primary glow in top-right corner */
  glow?: boolean
  padding?: "sm" | "md" | "lg"
  className?: string
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export function GlassCard({ children, glow = false, padding = "lg", className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel group relative overflow-hidden rounded-xl border border-white/5",
        paddingMap[padding],
        className,
      )}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-colors group-hover:bg-primary/30"
          style={{ background: "rgba(78,222,163,0.2)" }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
