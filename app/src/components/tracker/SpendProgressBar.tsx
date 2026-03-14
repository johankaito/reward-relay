"use client"

import { calculatePace, type PaceStatus } from "@/lib/spendPace"

type Props = {
  currentSpend: number
  requirement: number
  applicationDate: string
  deadline: string
  variant?: "compact" | "full"
}

const STATUS_STYLES: Record<PaceStatus, { bar: string; badge: string; label: string }> = {
  completed: {
    bar: "bg-[var(--success-fg,#16a34a)]",
    badge: "bg-[var(--success-bg,#dcfce7)] text-[var(--success-fg,#16a34a)]",
    label: "Bonus earned!",
  },
  on_track: {
    bar: "bg-[var(--accent)]",
    badge: "bg-[var(--accent)]/10 text-[var(--accent)]",
    label: "On track",
  },
  behind: {
    bar: "bg-[var(--warning-fg,#d97706)]",
    badge: "bg-[var(--warning-bg,#fef3c7)] text-[var(--warning-fg,#d97706)]",
    label: "Behind pace",
  },
  will_miss: {
    bar: "bg-[var(--danger,#dc2626)]",
    badge: "bg-[var(--danger)]/10 text-[var(--danger,#dc2626)]",
    label: "At risk",
  },
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

export function SpendProgressBar({ currentSpend, requirement, applicationDate, deadline, variant = "compact" }: Props) {
  const pace = calculatePace(currentSpend, requirement, applicationDate, deadline)
  const styles = STATUS_STYLES[pace.paceStatus]

  const progressWidth = `${Math.min(100, pace.percentComplete)}%`

  if (variant === "compact") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            {fmt(currentSpend)} <span className="opacity-50">/ {fmt(requirement)}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${styles.badge}`}
            >
              {styles.label}
            </span>
            {pace.paceStatus !== "completed" && (
              <span className="text-[var(--text-secondary)]/70">
                {pace.daysRemaining}d left
              </span>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
          <div
            className={`h-full rounded-full transition-all ${styles.bar}`}
            style={{ width: progressWidth }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {fmt(currentSpend)}
            <span className="ml-1 text-base font-normal text-[var(--text-secondary)]">
              / {fmt(requirement)}
            </span>
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div
          className={`h-full rounded-full transition-all ${styles.bar}`}
          style={{ width: progressWidth }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3 text-center">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Days left</p>
          <p className="font-semibold text-[var(--text-primary)]">{pace.daysRemaining}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Remaining</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {fmt(Math.max(0, requirement - currentSpend))}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Daily needed</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {pace.paceStatus === "completed" ? "—" : fmt(pace.requiredDailySpend)}
          </p>
        </div>
      </div>

      {pace.paceStatus !== "completed" && (
        <p className="text-xs text-[var(--text-secondary)]">
          At current pace ({fmt(pace.avgDailySpend)}/day) you&apos;ll reach{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {fmt(pace.projectedTotal)}
          </span>{" "}
          by the deadline.
        </p>
      )}
    </div>
  )
}
