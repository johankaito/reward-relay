import * as React from "react"
import { cn } from "@/lib/utils"

type TxStatus = "qualified" | "pending" | "non-qualified" | "redeemed"

const statusConfig: Record<TxStatus, { badge: string; text: string }> = {
  qualified: {
    badge: "bg-primary/20 text-primary",
    text: "QUALIFIED",
  },
  pending: {
    badge: "bg-tertiary/20 text-tertiary",
    text: "PENDING",
  },
  "non-qualified": {
    badge: "bg-destructive/20 text-destructive",
    text: "NON-QUALIFIED",
  },
  redeemed: {
    badge: "bg-surface-container-highest text-on-surface-variant",
    text: "REDEEMED",
  },
}

interface TransactionRowProps {
  /** Icon element rendered in the w-12 h-12 circle wrapper */
  icon: React.ReactNode
  /** Icon background + text color classes e.g. "bg-secondary/10 text-secondary" */
  iconColor?: string
  merchant: string
  subtitle?: string
  /** Multiplier label e.g. "4x" rendered inline with merchant name */
  multiplier?: string
  amount: string
  status?: TxStatus
  points?: string
  /** Show as last item (no bottom border) */
  last?: boolean
  className?: string
}

export function TransactionRow({
  icon,
  iconColor = "bg-primary/10 text-primary",
  merchant,
  subtitle,
  multiplier,
  amount,
  status,
  points,
  last = false,
  className,
}: TransactionRowProps) {
  const statusCfg = status ? statusConfig[status] : null

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 transition-colors hover:bg-surface-container",
        !last && "border-b border-outline-variant/5",
        className,
      )}
    >
      {/* Icon */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconColor,
          )}
        >
          {icon}
        </div>

        {/* Labels */}
        <div>
          <div className="flex items-center gap-2">
            <h6 className="text-sm font-semibold text-on-surface">{merchant}</h6>
            {multiplier && (
              <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-on-primary">
                {multiplier}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Amount + status */}
      <div className="flex flex-col items-end gap-1">
        <span className="tabular-nums font-bold text-on-surface">{amount}</span>
        {(statusCfg || points) && (
          <div className="flex items-center gap-2">
            {statusCfg && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
                  statusCfg.badge,
                )}
              >
                {statusCfg.text}
              </span>
            )}
            {points && (
              <span className="tabular-nums text-[10px] font-bold text-primary">{points}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
