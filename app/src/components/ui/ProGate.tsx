"use client"

import { ReactNode, useEffect } from "react"
import { Lock } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import { Button } from "@/components/ui/button"

interface ProGateProps {
  feature: string
  children: ReactNode
  teaserText?: string
  isPro?: boolean
  previewRows?: number
  requiredTier?: string
}

export function ProBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4edea3] ring-1 ring-[#4edea3]/30 bg-[#4edea3]/15">
      Pro
    </span>
  )
}

export function ProGate({ feature, children, teaserText }: ProGateProps) {
  const { isPro, isLoading } = useSubscription()
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    if (!isLoading && !isPro) {
      trackEvent("paywall_shown", {
        feature: feature as any,
        context: feature,
        cards_count: 0,
      })
    }
  }, [isLoading, isPro, feature, trackEvent])

  if (isLoading) {
    return <>{children}</>
  }

  if (isPro) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {teaserText && (
        <div className="mb-3 rounded-xl border border-[#4edea3]/30 bg-[#4edea3]/10 px-4 py-3">
          <p className="text-sm font-medium text-[#4edea3]">{teaserText}</p>
        </div>
      )}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)]/95 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4edea3]/15 ring-1 ring-[#4edea3]/30">
            <Lock className="h-7 w-7 text-[#4edea3]" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">
              Upgrade to Pro
            </p>
            <p className="text-sm text-on-surface">
              Unlock {feature} and all Pro features with a 7-day free trial
            </p>
          </div>
          <Button
            className="rounded-full px-6 text-white shadow-sm"
            style={{ background: "var(--gradient-cta)" }}
            onClick={() => {
              const event = new CustomEvent("open-upgrade-modal")
              window.dispatchEvent(event)
            }}
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
