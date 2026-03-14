'use client'

interface RedemptionProgressProps {
  userBalance: number
  pointsRequired: number
  program: 'qff' | 'velocity'
  transferredPoints?: number
}

export function RedemptionProgress({
  userBalance,
  pointsRequired,
  program,
  transferredPoints = 0,
}: RedemptionProgressProps) {
  const percentage = Math.min(100, Math.round((userBalance / pointsRequired) * 100))
  const canBook = userBalance >= pointsRequired
  const pointsNeeded = Math.max(0, pointsRequired - userBalance)
  const almostThere = percentage >= 70 && !canBook

  const programLabel = program === 'qff' ? 'QFF' : 'Velocity'

  if (canBook) {
    return (
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--success-bg)]">
          <div className="h-2 w-full rounded-full bg-green-500" />
        </div>
        <p className="text-xs font-medium text-green-600">Ready to book</p>
        {transferredPoints > 0 && (
          <p className="text-xs text-[var(--text-secondary)]">
            Includes {transferredPoints.toLocaleString()} pts transferred from Amex MR (2:1 ratio)
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)]">
          {(userBalance - transferredPoints).toLocaleString()} / {pointsRequired.toLocaleString()} pts
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: almostThere ? 'rgb(251 191 36)' : 'var(--accent)',
          }}
        />
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        {almostThere
          ? `Almost there — ${pointsNeeded.toLocaleString()} ${programLabel} pts to go`
          : `${pointsNeeded.toLocaleString()} ${programLabel} pts to go`}
      </p>
      {transferredPoints > 0 && (
        <p className="text-xs text-[var(--text-secondary)]">
          Includes {transferredPoints.toLocaleString()} pts transferred from Amex MR (2:1 ratio)
        </p>
      )}
      <p className="text-xs text-[var(--text-secondary)]">
        {(userBalance - transferredPoints).toLocaleString()} / {pointsRequired.toLocaleString()} pts
      </p>
    </div>
  )
}
