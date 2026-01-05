"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, DollarSign, TrendingUp, ExternalLink } from "lucide-react"
import type { MultiCardPath, PathStep } from "@/lib/projections"

interface GoalTimelineComparisonProps {
  recommendedPath: MultiCardPath
  alternativePaths?: MultiCardPath[]
  currentPoints: number
}

export function GoalTimelineComparison({
  recommendedPath,
  alternativePaths = [],
  currentPoints,
}: GoalTimelineComparisonProps) {
  const renderTimeline = (path: MultiCardPath, isRecommended: boolean = false) => {
    const milestones = path.steps.filter(s => s.action === "apply" || s.action === "bonus_posts")

    return (
      <div className={`rounded-2xl border p-6 ${
        isRecommended
          ? "border-[var(--accent)] bg-gradient-to-br from-[var(--surface)] to-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
          : "border-[var(--border-default)] bg-[var(--surface)]"
      }`}>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {path.cards.map((card, idx) => (
                  <div key={card.id} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-slate-400">+</span>}
                    {card.application_link ? (
                      <Link
                        href={card.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
                      >
                        {card.bank}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-white">{card.bank}</span>
                    )}
                  </div>
                ))}
              </div>
              {isRecommended && (
                <Badge className="bg-[var(--accent-bg)] text-[var(--accent-fg)]">
                  ⭐ RECOMMENDED
                </Badge>
              )}
              {path.rank === "fastest" && !isRecommended && (
                <Badge className="bg-[var(--success-bg)] text-[var(--success-fg)]">
                  ⚡ FASTEST
                </Badge>
              )}
              {path.rank === "cheapest" && !isRecommended && (
                <Badge className="bg-[var(--info-bg)] text-[var(--info-fg)]">
                  💰 CHEAPEST
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-300">
              {path.cards.map(c => c.name).join(", ")}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4" />
              <span className="font-semibold text-white">{path.timeToGoal} months</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold text-white">${path.totalCost}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold text-[var(--success)]">
                {path.totalPoints.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-[var(--border-default)]" />

          {/* Milestones */}
          <div className="relative flex justify-between">
            {milestones.map((milestone, idx) => {
              const isComplete = milestone.action === "bonus_posts"
              const isFinalMilestone = idx === milestones.length - 1

              return (
                <div key={idx} className="flex flex-col items-center">
                  {/* Milestone marker */}
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                    isComplete
                      ? "border-[var(--success)] bg-[var(--success-bg)]"
                      : "border-[var(--border-default)] bg-[var(--surface)]"
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="h-6 w-6 text-[var(--success)]" />
                    ) : (
                      <Clock className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Milestone details */}
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-white">
                      {milestone.action === "apply" ? "Apply" : "Goal Reached!"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Month {milestone.month}
                    </p>
                    {isFinalMilestone && (
                      <div className="mt-2">
                        <Badge className="bg-[var(--success-bg)] text-[var(--success-fg)]">
                          {milestone.runningTotal.toLocaleString()} pts
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card info for apply milestones */}
                  {milestone.action === "apply" && (
                    <div className="mt-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1">
                      {milestone.card.application_link ? (
                        <Link
                          href={milestone.card.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-white hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
                        >
                          {milestone.card.bank}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      ) : (
                        <p className="text-xs font-medium text-white">{milestone.card.bank}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        +{milestone.card.welcome_bonus_points?.toLocaleString()} pts
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Net Value Summary */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
          <div>
            <p className="text-xs text-slate-400">Net Value</p>
            <p className="text-lg font-semibold text-white">
              ${path.netValue.toFixed(2)}
            </p>
            <p className="text-xs text-slate-300">
              Points worth ${(path.totalPoints * 0.01).toFixed(2)} - ${path.totalCost} fees
            </p>
          </div>
          {isRecommended && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Why recommended?</p>
              <p className="text-sm font-medium text-[var(--accent)]">
                {path.rank === "fastest" ? "Fastest path to goal" :
                 path.rank === "cheapest" ? "Best value for money" :
                 "Optimal balance of speed & value"}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recommended Path */}
      <div>
        <h3 className="mb-4 text-xl font-semibold text-white">Recommended Path</h3>
        {renderTimeline(recommendedPath, true)}
      </div>

      {/* Alternative Paths */}
      {alternativePaths.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">Alternative Paths</h3>
          <div className="space-y-4">
            {alternativePaths.map((path, idx) => (
              <div key={idx}>{renderTimeline(path, false)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <Card className="border border-[var(--info-bg)]/30 bg-[var(--info-bg)]/10">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-[var(--info-fg)]">ℹ️</div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-[var(--info-fg)]">
                Timeline Assumptions
              </p>
              <ul className="space-y-1 text-slate-300">
                <li>• 3 months to meet minimum spend requirement</li>
                <li>• 1 month for bonus points to post after spend met</li>
                <li>• 6 months minimum spacing between card applications</li>
                <li>• AMEX: 18-month cooling period | Others: 12-month cooling period</li>
                <li>• Current points balance: {currentPoints.toLocaleString()}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
