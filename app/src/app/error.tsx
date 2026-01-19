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
    // Capture error in PostHog
    if (posthog.__loaded) {
      posthog.captureException(error)
    }
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We've been notified and will look into it. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-sm bg-gray-100 dark:bg-gray-900 p-4 rounded mb-4 overflow-auto">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
