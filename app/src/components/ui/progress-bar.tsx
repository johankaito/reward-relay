import { cn } from "@/lib/utils"

interface ProgressBarProps {
  /** 0–100 */
  value: number
  height?: "sm" | "md"
  className?: string
}

export function ProgressBar({ value, height = "sm", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-surface-container-highest",
        height === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${clamped}%`,
          background: "linear-gradient(90deg, var(--primary-container) 0%, var(--primary) 100%)",
        }}
      />
    </div>
  )
}
