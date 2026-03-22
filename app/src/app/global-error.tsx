"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body style={{ background: "var(--background)", margin: 0 }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-white/5 p-6" style={{ background: "var(--surface-container)" }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--destructive)" }}>
              Critical Error
            </h2>
            <p className="mb-6" style={{ color: "var(--on-surface-variant)" }}>
              Something went critically wrong. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="w-full rounded-full py-2 px-4 font-medium text-on-primary transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-cta)" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
