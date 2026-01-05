"use client"

import posthog from "posthog-js"

export function initPostHog() {
  if (typeof window !== "undefined") {
    // Only initialize if we have a key and haven't initialized yet
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (key && !posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false, // We'll handle this manually in App Router
        capture_pageleave: true,
        autocapture: true, // Captures clicks, form submits automatically
        session_recording: {
          recordCrossOriginIframes: true,
        },
        persistence: "localStorage", // Persist UTM params and user data
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[PostHog] Initialized successfully")
          }
        },
      })
    }
  }
}

export { posthog }
