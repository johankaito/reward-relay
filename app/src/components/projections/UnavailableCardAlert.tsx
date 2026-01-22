"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface UnavailableCardAlertProps {
  cardName: string
  cardBank: string
  goalLabel: string
  onDismiss?: () => void
  onUpdateGoal?: () => void
}

export function UnavailableCardAlert({
  cardName,
  cardBank,
  goalLabel,
  onDismiss,
  onUpdateGoal,
}: UnavailableCardAlertProps) {
  return (
    <Card className="border-2 border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10 shadow-lg">
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              ⚠️ Your goal uses an unavailable card
            </h3>
            <p className="text-sm text-slate-200">
              The <span className="font-semibold text-orange-400">{cardBank} {cardName}</span> is no longer available.
              Your "<span className="font-semibold">{goalLabel}</span>" goal currently uses this card in its recommended path.
            </p>
            <p className="text-sm font-medium text-orange-300">
              Action required: Update your goal to use a different card strategy.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {onUpdateGoal && (
              <Button
                size="sm"
                onClick={onUpdateGoal}
                className="rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600"
              >
                Update Your Goal
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Scroll to alternative paths
                const alternativesSection = document.getElementById('alternative-paths')
                if (alternativesSection) {
                  alternativesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="rounded-full border-orange-400/30 bg-transparent text-orange-300 hover:bg-orange-500/10"
            >
              View Alternative Paths
            </Button>
          </div>
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </Card>
  )
}
