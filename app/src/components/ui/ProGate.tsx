"use client"

import { ReactNode } from "react"
import { Lock } from "lucide-react"

type Props = {
  children: ReactNode
  feature?: string
  requiredTier?: "pro" | "business"
}

/**
 * ProGate Component
 *
 * Wraps Pro/Business-tier features. Currently renders children for all users
 * while the subscription system is being built out.
 *
 * When a subscription check is added, replace the passthrough with
 * an actual tier check against the user's subscription.
 */
export function ProGate({ children }: Props) {
  // TODO: wire up actual subscription tier check
  return <>{children}</>
}

/**
 * ProBadge — small badge to indicate a Pro feature label
 */
export function ProBadge({ label = "Pro" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
      <Lock className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}
