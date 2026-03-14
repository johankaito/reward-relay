"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProGateProps {
  feature?: string
  children: React.ReactNode
  isPro?: boolean
  previewRows?: number
}

export function ProGate({ feature, children, isPro = false, previewRows }: ProGateProps) {
  if (isPro) {
    return <>{children}</>
  }

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
          <p className="text-sm font-semibold text-[var(--text-primary)]">Pro feature</p>
          {feature && (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{feature}</p>
          )}
        </div>
        <Button
          size="sm"
          className="mt-1 text-white shadow-sm"
          style={{ background: "var(--gradient-cta)" }}
          onClick={() => window.location.href = "/settings#upgrade"}
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  )
}
