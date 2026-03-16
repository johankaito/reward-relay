"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProGateProps {
  feature?: string
  children: React.ReactNode
  isPro?: boolean
  previewRows?: number
  requiredTier?: 'pro' | 'business'
}

export function ProGate({ feature, children, isPro = false, previewRows, requiredTier = 'pro' }: ProGateProps) {
  if (isPro) {
    return <>{children}</>
  }

  const isBusiness = requiredTier === 'business'
  const label = isBusiness ? 'Business feature' : 'Pro feature'
  const ctaLabel = isBusiness ? 'Upgrade to Business' : 'Upgrade to Pro'
  const upgradeHref = isBusiness ? '/settings#upgrade-business' : '/settings#upgrade'

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div
        className="pointer-events-none select-none overflow-hidden"
        style={{
          maxHeight: previewRows ? `${previewRows * 48}px` : undefined,
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
        aria-hidden
      >
        <div className="blur-sm opacity-40">{children}</div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[var(--surface)]/60 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-strong)]">
          <Lock className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          {feature && (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{feature}</p>
          )}
        </div>
        <Button
          size="sm"
          className="mt-1 text-white shadow-sm"
          style={{ background: "var(--gradient-cta)" }}
          onClick={() => window.location.href = upgradeHref}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
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
