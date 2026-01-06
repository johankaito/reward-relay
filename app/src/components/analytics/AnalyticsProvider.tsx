"use client"

import { useEffect, Suspense } from "react"
import { initPostHog } from "@/lib/analytics/posthog"
import { AnalyticsProvider as AnalyticsContextProvider } from "@/contexts/AnalyticsContext"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog on client side
    initPostHog()
  }, [])

  return (
    <Suspense fallback={null}>
      <AnalyticsContextProvider>{children}</AnalyticsContextProvider>
    </Suspense>
  )
}
