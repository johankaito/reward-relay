interface DataFreshnessChipProps {
  lastVerifiedAt: string | null
  confidence: number | null
}

export function DataFreshnessChip({ lastVerifiedAt, confidence }: DataFreshnessChipProps) {
  const daysSince =
    lastVerifiedAt !== null
      ? Math.floor((Date.now() - new Date(lastVerifiedAt).getTime()) / 86_400_000)
      : null

  const isStale = daysSince === null || daysSince > 30
  const isLowConfidence = confidence !== null && confidence < 0.8

  if (isStale || isLowConfidence) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
        <span aria-hidden>⚠</span>
        {isStale ? "Data may be outdated" : "Unverified — check with issuer"}
      </span>
    )
  }

  if (daysSince !== null && daysSince <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#4edea3]/10 px-2 py-0.5 text-xs text-[#4edea3]">
        <span aria-hidden>✓</span>
        Verified recently
      </span>
    )
  }

  return (
    <span className="text-xs text-on-surface-variant">
      Verified {daysSince}d ago
    </span>
  )
}
