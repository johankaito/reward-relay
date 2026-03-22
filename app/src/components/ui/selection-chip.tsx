import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectionChipProps {
  children: React.ReactNode
  active?: boolean
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function SelectionChip({
  children,
  active = false,
  icon,
  onClick,
  className,
}: SelectionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
        active
          ? "bg-primary text-on-primary"
          : "border border-outline-variant/30 bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
