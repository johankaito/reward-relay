import * as React from "react"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./progress-bar"

interface BonusTrackerCardProps {
  bank: string
  name: string
  /** Current spend amount */
  currentSpend: number
  /** Target spend amount */
  spendTarget: number
  /** Days remaining until deadline */
  daysLeft?: number | null
  /** Bonus points on completion */
  bonusPoints?: number
  className?: string
}

export function BonusTrackerCard({
  bank,
  name,
  currentSpend,
  spendTarget,
  daysLeft,
  bonusPoints,
  className,
}: BonusTrackerCardProps) {
  const pct =
    spendTarget > 0 ? Math.min(100, Math.round((currentSpend / spendTarget) * 100)) : 0

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-6 transition-colors duration-200 hover:border-primary/30",
        className,
      )}
    >
      {/* Header row */}
      <div className="mb-6 flex items-end justify-between gap-2">
        <div>
          <h5 className="font-headline font-bold text-on-surface">
            {bank} {name}
          </h5>
          <p className="text-xs text-on-surface-variant">Sign-up Bonus Goal</p>
        </div>
        {spendTarget > 0 && (
          <p className="shrink-0 font-headline font-extrabold tabular-nums text-2xl text-primary">
            ${currentSpend.toLocaleString("en-AU")}
            <span className="text-sm font-medium text-on-surface-variant">
              {" "}/ ${(spendTarget / 1000).toFixed(0)}k
            </span>
          </p>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar value={pct} height="md" />

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
        {bonusPoints != null && bonusPoints > 0 ? (
          <span>
            {(bonusPoints / 1000).toFixed(0)}k pts on completion
          </span>
        ) : (
          <span />
        )}
        {daysLeft != null ? (
          <span>{daysLeft} Days Remaining</span>
        ) : null}
      </div>
    </div>
  )
}
