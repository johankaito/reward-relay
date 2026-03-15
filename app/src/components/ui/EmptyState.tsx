import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  icon?: ReactNode
  heading: string
  body: string
  ghost?: ReactNode
  cta: ReactNode
  socialProof?: string
  className?: string
}

export function EmptyState({ icon, heading, body, ghost, cta, socialProof, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-6 py-10 text-center",
        className,
      )}
    >
      {icon && <div className="text-[var(--accent)]">{icon}</div>}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{heading}</h2>
        <p className="mx-auto max-w-sm text-sm text-[var(--text-secondary)]">{body}</p>
      </div>

      {/* Ghost preview */}
      {ghost && (
        <div className="relative w-full max-w-xs overflow-hidden rounded-xl">
          <div className="pointer-events-none select-none blur-[2px] opacity-40">{ghost}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-[var(--surface)]/80 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm ring-1 ring-[var(--border-default)]">
              🔒 Set up to unlock
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 sm:flex-row">{cta}</div>

      {socialProof && (
        <p className="text-xs italic text-[var(--text-secondary)]">{socialProof}</p>
      )}
    </div>
  )
}
