"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OnboardingProgress } from "@/lib/onboarding"

type Props = {
  progress: OnboardingProgress
}

const STEPS = [
  {
    label: "Add your first card",
    completedKey: "hasAddedCard" as const,
    cta: "Add card",
    href: "/cards",
    doneLabel: "Done",
  },
  {
    label: "Set your spending profile",
    completedKey: "hasSetSpending" as const,
    cta: "Set up spending",
    href: "/spending",
    doneLabel: "Done",
  },
  {
    label: "See your personalised gap",
    completedKey: "hasViewedGap" as const,
    cta: "See my gap →",
    href: "/dashboard#gap",
    doneLabel: "Done",
  },
]

export function SetupChecklist({ progress }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [sessionDismissed, setSessionDismissed] = useState(false)

  // Hide permanently if onboarding complete
  if (progress.onboardingCompletedAt) return null
  // Hide for the session if user dismissed
  if (sessionDismissed) return null

  const completedCount = [progress.hasAddedCard, progress.hasSetSpending, progress.hasViewedGap].filter(Boolean).length
  const percentage = Math.round((completedCount / 3) * 100)

  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            Get started — see your reward gap in 3 steps
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-[var(--text-secondary)]">
            {completedCount}/3
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors"
            aria-label={collapsed ? "Expand setup checklist" : "Collapse setup checklist"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setSessionDismissed(true)}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors"
            aria-label="Remind me later"
            title="Remind me later (will return on next visit)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-1">
        <div className="h-1.5 w-full rounded-full bg-[var(--surface-strong)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: "var(--gradient-cta)",
            }}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{percentage}% complete</p>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-[var(--border-default)] divide-y divide-[var(--border-default)]">
          {STEPS.map((step, i) => {
            const isDone = progress[step.completedKey]
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--success-fg)]" />
                ) : (
                  <Circle className="h-5 w-5 flex-shrink-0 text-[var(--text-secondary)]/40" />
                )}
                <span
                  className={`flex-1 text-sm ${isDone ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"}`}
                >
                  {i + 1}. {step.label}
                </span>
                {isDone ? (
                  <span className="text-xs font-medium text-[var(--success-fg)]">
                    {step.doneLabel}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 rounded-full text-xs h-7 px-3"
                    onClick={() => router.push(step.href)}
                  >
                    {step.cta}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
