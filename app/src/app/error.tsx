"use client"

import { useEffect } from "react"
import { posthog } from "@/lib/analytics/posthog"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (posthog.__loaded) {
      posthog.captureException(error)
    }
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="max-w-md w-full rounded-2xl border border-white/5 p-6" style={{ background: "var(--surface-container)" }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--destructive)" }}>
          Something went wrong!
        </h2>
        <p className="mb-6" style={{ color: "var(--on-surface-variant)" }}>
          We&apos;ve been notified and will look into it. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-sm p-4 rounded-lg mb-4 overflow-auto font-mono text-xs" style={{ background: "var(--background)", color: "var(--on-surface-variant)" }}>
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="w-full rounded-full py-2 px-4 font-medium text-on-primary transition-opacity hover:opacity-90"
          style={{ background: "var(--gradient-cta)" }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
