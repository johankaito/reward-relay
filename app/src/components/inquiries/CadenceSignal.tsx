"use client"

import { differenceInMonths, addMonths, format } from "date-fns"
import type { Database } from "@/types/database.types"

type CreditInquiry = Database["public"]["Tables"]["credit_inquiries"]["Row"]
type BankRule = Database["public"]["Tables"]["bank_rules"]["Row"]

export interface CadenceResult {
  status: "safe" | "caution" | "blocked"
  message: string
  monthsRemaining?: number
  nextSafeDate?: string
  ruleMonths: number
}

export function getCadenceSignal(
  bank: string,
  inquiries: CreditInquiry[],
  bankRules: BankRule[]
): CadenceResult {
  const rule = bankRules.find((r) => r.bank === bank)
  if (!rule) {
    return { status: "safe", message: "No known waiting period rule", ruleMonths: 0 }
  }

  const bankInquiries = inquiries
    .filter((i) => i.bank === bank && i.outcome === "approved")
    .sort(
      (a, b) =>
        new Date(b.application_date).getTime() -
        new Date(a.application_date).getTime()
    )

  const lastApproval = bankInquiries[0]
  if (!lastApproval) {
    return {
      status: "safe",
      message: `No previous ${bank} approvals on record`,
      ruleMonths: rule.rule_months,
    }
  }

  const monthsSince = differenceInMonths(
    new Date(),
    new Date(lastApproval.application_date)
  )
  const monthsRemaining = rule.rule_months - monthsSince

  if (monthsRemaining <= 0) {
    return {
      status: "safe",
      message: `${monthsSince} months since last ${bank} approval — you're eligible`,
      ruleMonths: rule.rule_months,
    }
  }

  const nextSafeDate = addMonths(
    new Date(lastApproval.application_date),
    rule.rule_months
  )

  if (monthsRemaining <= 3) {
    return {
      status: "caution",
      message: `${monthsRemaining} month${monthsRemaining === 1 ? "" : "s"} until eligible`,
      monthsRemaining,
      nextSafeDate: format(nextSafeDate, "dd MMM yyyy"),
      ruleMonths: rule.rule_months,
    }
  }

  return {
    status: "blocked",
    message: `Wait ${monthsRemaining} more month${monthsRemaining === 1 ? "" : "s"}`,
    monthsRemaining,
    nextSafeDate: format(nextSafeDate, "dd MMM yyyy"),
    ruleMonths: rule.rule_months,
  }
}

interface CadenceSignalProps {
  bank: string
  inquiries: CreditInquiry[]
  bankRules: BankRule[]
  showBank?: boolean
  compact?: boolean
}

const STATUS_COLOURS = {
  safe: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    emoji: "🟢",
  },
  caution: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    emoji: "🟡",
  },
  blocked: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
    emoji: "🔴",
  },
}

export function CadenceSignal({
  bank,
  inquiries,
  bankRules,
  showBank = true,
  compact = false,
}: CadenceSignalProps) {
  const result = getCadenceSignal(bank, inquiries, bankRules)
  const colours = STATUS_COLOURS[result.status]

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colours.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${colours.dot}`} />
        {result.status === "safe"
          ? "Eligible"
          : result.status === "caution"
          ? `${result.monthsRemaining}mo`
          : `Wait ${result.monthsRemaining}mo`}
      </span>
    )
  }

  return (
    <div className="flex items-start gap-3">
      {showBank && (
        <span className="w-36 shrink-0 text-sm font-medium text-[var(--text-primary)]">
          {bank}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-medium ${colours.text}`}>
          {colours.emoji} {result.message}
        </span>
        {result.nextSafeDate && (
          <span className="text-xs text-[var(--text-secondary)]">
            Eligible {result.nextSafeDate}
          </span>
        )}
      </div>
    </div>
  )
}
