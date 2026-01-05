"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { posthog } from "@/lib/analytics/posthog"
import type { AnalyticsEvent } from "@/lib/analytics/events"
import { estimateCAC } from "@/lib/analytics/events"

interface AnalyticsContextType {
  trackEvent: <T extends AnalyticsEvent>(
    eventName: T["name"],
    properties: T["properties"]
  ) => void
  identifyUser: (userId: string, traits?: Record<string, any>) => void
  trackPageView: (page: string) => void
  getAcquisitionSource: () => {
    source: string
    campaign?: string
    medium?: string
    cac_estimate: number
  }
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

const ACQUISITION_SOURCE_KEY = "rr_acquisition_source"
const ACQUISITION_CAMPAIGN_KEY = "rr_acquisition_campaign"
const ACQUISITION_MEDIUM_KEY = "rr_acquisition_medium"
const ACQUISITION_TIMESTAMP_KEY = "rr_acquisition_timestamp"

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isInitialized, setIsInitialized] = useState(false)

  // Persist acquisition source on first visit
  useEffect(() => {
    if (typeof window === "undefined") return

    const utmSource = searchParams?.get("utm_source")
    const utmCampaign = searchParams?.get("utm_campaign")
    const utmMedium = searchParams?.get("utm_medium")

    // Only save if this is the first visit (no existing source)
    const existingSource = localStorage.getItem(ACQUISITION_SOURCE_KEY)
    if (!existingSource && utmSource) {
      localStorage.setItem(ACQUISITION_SOURCE_KEY, utmSource)
      localStorage.setItem(ACQUISITION_TIMESTAMP_KEY, Date.now().toString())

      if (utmCampaign) {
        localStorage.setItem(ACQUISITION_CAMPAIGN_KEY, utmCampaign)
      }
      if (utmMedium) {
        localStorage.setItem(ACQUISITION_MEDIUM_KEY, utmMedium)
      }

      // Also set in PostHog for attribution
      if (posthog.__loaded) {
        posthog.register({
          initial_utm_source: utmSource,
          initial_utm_campaign: utmCampaign,
          initial_utm_medium: utmMedium,
        })
      }
    } else if (!existingSource) {
      // No UTM params and no existing source = direct traffic
      const referrer = document.referrer
      const source = referrer ? new URL(referrer).hostname : "direct"
      localStorage.setItem(ACQUISITION_SOURCE_KEY, source)
      localStorage.setItem(ACQUISITION_TIMESTAMP_KEY, Date.now().toString())
    }

    setIsInitialized(true)
  }, [searchParams])

  // Track page views on navigation
  useEffect(() => {
    if (pathname && isInitialized && posthog.__loaded) {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
        path: pathname,
      })
    }
  }, [pathname, isInitialized])

  const trackEvent = useCallback(
    <T extends AnalyticsEvent>(eventName: T["name"], properties: T["properties"]) => {
      if (typeof window === "undefined" || !posthog.__loaded) {
        console.warn("[Analytics] PostHog not loaded, skipping event:", eventName)
        return
      }

      posthog.capture(eventName, properties as any)

      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Event tracked:", eventName, properties)
      }
    },
    []
  )

  const identifyUser = useCallback((userId: string, traits?: Record<string, any>) => {
    if (typeof window === "undefined" || !posthog.__loaded) return

    posthog.identify(userId, traits)

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] User identified:", userId, traits)
    }
  }, [])

  const trackPageView = useCallback((page: string) => {
    if (typeof window === "undefined" || !posthog.__loaded) return

    posthog.capture("$pageview", {
      $current_url: window.location.href,
      path: page,
    })
  }, [])

  const getAcquisitionSource = useCallback(() => {
    const source = localStorage.getItem(ACQUISITION_SOURCE_KEY) || "direct"
    const campaign = localStorage.getItem(ACQUISITION_CAMPAIGN_KEY) || undefined
    const medium = localStorage.getItem(ACQUISITION_MEDIUM_KEY) || undefined
    const cac_estimate = estimateCAC(source)

    return { source, campaign, medium, cac_estimate }
  }, [])

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        identifyUser,
        trackPageView,
        getAcquisitionSource,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider")
  }
  return context
}
