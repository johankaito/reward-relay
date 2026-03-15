"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dismissOnboarding } from "@/lib/onboarding"

type Props = {
  userId: string
  displayName: string | null
  onDismiss: () => void
}

export function WelcomeOverlay({ userId, displayName, onDismiss }: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap: move focus into dialog on mount
  useEffect(() => {
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )
    firstFocusable?.focus()
  }, [])

  // Escape key dismisses
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLetsGo = () => {
    onDismiss()
    router.push("/cards")
  }

  const handleSkip = async () => {
    await dismissOnboarding(userId)
    onDismiss()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-8 shadow-2xl"
      >
        {/* Icon */}
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ background: "var(--gradient-cta)" }}
        >
          <Sparkles className="h-7 w-7" />
        </div>

        {/* Heading */}
        <h1
          id="welcome-title"
          className="text-2xl font-bold text-[var(--text-primary)]"
        >
          Welcome to Reward Relay{displayName ? `, ${displayName}` : ""}!
        </h1>

        {/* Body */}
        <p id="welcome-desc" className="mt-3 text-[var(--text-secondary)]">
          Most Australians leave{" "}
          <span className="font-semibold text-[var(--text-primary)]">$1,200+ in rewards</span>{" "}
          unclaimed each year. In 3 steps, we&apos;ll show you exactly what you&apos;re missing.
        </p>

        {/* Steps preview */}
        <ol className="mt-5 space-y-2">
          {[
            "Add your reward cards",
            "Set your monthly spending",
            "See your personalised gap",
          ].map((label, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--gradient-cta)" }}
              >
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        {/* Actions */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 rounded-full text-white shadow-sm"
            style={{ background: "var(--gradient-cta)" }}
            onClick={handleLetsGo}
          >
            Let&apos;s go →
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-full text-[var(--text-secondary)]"
            onClick={handleSkip}
          >
            Skip setup
          </Button>
        </div>
      </div>
    </div>
  )
}
