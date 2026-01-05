"use client"

import { useEffect } from "react"
import { initPostHog } from "@/lib/analytics/posthog"
import { AnalyticsProvider as AnalyticsContextProvider } from "@/contexts/AnalyticsContext"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog on client side
    initPostHog()
  }, [])

  return <AnalyticsContextProvider>{children}</AnalyticsContextProvider>
}
