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
      <body style={{ background: "#0f131f", margin: 0 }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-white/5 p-6" style={{ background: "#1b1f2c" }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#ffb4ab" }}>
              Critical Error
            </h2>
            <p className="mb-6" style={{ color: "#bbcabf" }}>
              Something went critically wrong. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="w-full rounded-full py-2 px-4 font-medium text-on-primary transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
