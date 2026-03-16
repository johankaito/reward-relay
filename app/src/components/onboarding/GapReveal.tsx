"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markOnboardingStep } from "@/lib/onboarding"
import type { GapAnalysis } from "@/lib/gap-analysis"

type Props = {
  userId: string
  gap: GapAnalysis
  onViewed?: () => void
}

function formatDollars(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function GapReveal({ userId, gap, onViewed }: Props) {
  const router = useRouter()
  const [animated, setAnimated] = useState(false)
  const hasMarked = useRef(false)

  const maxValue = Math.max(gap.optimisedAnnualEarnings, 1)
  const currentPct = Math.round((gap.currentAnnualEarnings / maxValue) * 100)

  // Animate bars in after mount, mark gap as viewed
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)

    if (!hasMarked.current) {
      hasMarked.current = true
      markOnboardingStep(userId, "has_viewed_gap").then(() => {
        onViewed?.()
      })
    }

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCta = () => {
    router.push("/recommendations")
  }

  return (
    <div
      id="gap"
      className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 shadow-sm space-y-5"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
          Your reward gap
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
          Based on your cards and spending
        </h2>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        {/* Current */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Currently earning</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {formatDollars(gap.currentAnnualEarnings)}/year
            </span>
          </div>
          <div className="h-5 w-full rounded-full bg-[var(--surface-strong)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: animated ? `${currentPct}%` : "0%",
                background: "var(--info-fg)",
                opacity: 0.7,
              }}
            />
          </div>
        </div>

        {/* Optimised */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">You could be earning</span>
            <span className="font-semibold text-[var(--accent)]">
              {formatDollars(gap.optimisedAnnualEarnings)}/year
            </span>
          </div>
          <div className="h-5 w-full rounded-full bg-[var(--surface-strong)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out delay-300"
              style={{
                width: animated ? "100%" : "0%",
                background: "var(--gradient-cta)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Gap callout */}
      <div className="rounded-xl bg-[var(--surface-muted)] border border-[var(--border-default)] px-4 py-3">
        <p className="text-sm text-[var(--text-secondary)]">You&apos;re missing</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {formatDollars(gap.gap)}/year in rewards
        </p>
        {gap.bestCard && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Best option: {gap.bestCard.bank} {gap.bestCard.name}
          </p>
        )}
      </div>

      <Button
        className="w-full rounded-full text-white shadow-sm"
        style={{ background: "var(--gradient-cta)" }}
        onClick={handleCta}
      >
        See my recommendation
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  )
}
