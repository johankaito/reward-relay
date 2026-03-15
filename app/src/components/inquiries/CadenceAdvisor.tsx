"use client"

import { useMemo } from "react"
import { format, addMonths } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProGate } from "@/components/ui/ProGate"
import { getCadenceSignal } from "@/components/inquiries/CadenceSignal"
import type { Database } from "@/types/database.types"

type CreditInquiry = Database["public"]["Tables"]["credit_inquiries"]["Row"]
type BankRule = Database["public"]["Tables"]["bank_rules"]["Row"]

interface CadenceAdvisorProps {
  inquiries: CreditInquiry[]
  bankRules: BankRule[]
  isPro?: boolean
}

interface BankSummary {
  bank: string
  status: "safe" | "caution" | "blocked"
  lastApprovalDate: string | null
  monthsAgo: number | null
  nextSafeDate: string | null
  monthsRemaining: number | null
  ruleMonths: number
  ruleDescription: string
  sourceUrl: string | null
}

export function CadenceAdvisor({ inquiries, bankRules, isPro = false }: CadenceAdvisorProps) {
  const bankSummaries = useMemo<BankSummary[]>(() => {
    return bankRules.map((rule) => {
      const signal = getCadenceSignal(rule.bank, inquiries, bankRules)

      const approvedForBank = inquiries
        .filter((i) => i.bank === rule.bank && i.outcome === "approved")
        .sort(
          (a, b) =>
            new Date(b.application_date).getTime() -
            new Date(a.application_date).getTime()
        )
      const lastApproval = approvedForBank[0]

      let lastApprovalDate: string | null = null
      let monthsAgo: number | null = null
      let nextSafeDate: string | null = null

      if (lastApproval) {
        const d = new Date(lastApproval.application_date)
        const now = new Date()
        lastApprovalDate = format(d, "MMM yyyy")
        monthsAgo = Math.floor(
          (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        )
        if (signal.monthsRemaining && signal.monthsRemaining > 0) {
          nextSafeDate = format(addMonths(d, rule.rule_months), "dd MMM yyyy")
        }
      }

      return {
        bank: rule.bank,
        status: signal.status,
        lastApprovalDate,
        monthsAgo,
        nextSafeDate,
        monthsRemaining: signal.monthsRemaining ?? null,
        ruleMonths: rule.rule_months,
        ruleDescription: rule.rule_description,
        sourceUrl: rule.source_url ?? null,
      }
    })
  }, [bankRules, inquiries])

  const openBanks = bankSummaries.filter((b) => b.status === "safe")
  const blockedBanks = bankSummaries.filter(
    (b) => b.status === "blocked" || b.status === "caution"
  )

  // Sorted: blocked first (most months remaining), then caution, then safe
  const sortedSummaries = [...bankSummaries].sort((a, b) => {
    const order = { blocked: 0, caution: 1, safe: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    if (a.monthsRemaining !== null && b.monthsRemaining !== null) {
      return b.monthsRemaining - a.monthsRemaining
    }
    return a.bank.localeCompare(b.bank)
  })

  const statusConfig = {
    safe: { emoji: "🟢", label: "Open", textClass: "text-emerald-700 dark:text-emerald-400" },
    caution: { emoji: "🟡", label: "Soon", textClass: "text-amber-700 dark:text-amber-400" },
    blocked: { emoji: "🔴", label: "Wait", textClass: "text-red-700 dark:text-red-400" },
  }

  const summaryLine = (
    <div className="mb-4 flex flex-wrap gap-4">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-base">🟢</span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          {openBanks.length} bank{openBanks.length !== 1 ? "s" : ""} open now
        </span>
        {openBanks.length > 0 && (
          <span className="text-[var(--text-secondary)]">
            ({openBanks.map((b) => b.bank).join(", ")})
          </span>
        )}
      </div>
      {blockedBanks.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-base">🔴</span>
          <span className="font-semibold text-red-700 dark:text-red-400">
            {blockedBanks.length} blocked
          </span>
          <span className="text-[var(--text-secondary)]">
            (
            {blockedBanks
              .map((b) => `${b.bank}${b.monthsRemaining ? ` — ${b.monthsRemaining}mo` : ""}`)
              .join(", ")}
            )
          </span>
        </div>
      )}
    </div>
  )

  const fullGrid = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
              Bank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
              Last approval
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
              Next eligible
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
              Rule
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-default)]">
          {sortedSummaries.map((b) => {
            const cfg = statusConfig[b.status]
            return (
              <tr
                key={b.bank}
                className="transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                  {b.bank}
                </td>
                <td className={`px-4 py-3 font-medium ${cfg.textClass}`}>
                  {cfg.emoji} {cfg.label}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {b.lastApprovalDate
                    ? `${b.lastApprovalDate} (${b.monthsAgo}mo ago)`
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {b.nextSafeDate ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                  {b.sourceUrl ? (
                    <a
                      href={b.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--accent)]"
                    >
                      {b.ruleMonths}mo rule
                    </a>
                  ) : (
                    `${b.ruleMonths}mo rule`
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      <CardHeader className="border-b border-[var(--border-default)]">
        <CardTitle className="text-[var(--text-primary)]">Safe Cadence Advisor</CardTitle>
        <p className="text-xs text-[var(--text-secondary)]">
          Per-bank eligibility based on your approval history
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        {summaryLine}

        <ProGate
          isPro={isPro}
          feature="cadence recommendations"
          previewRows={3}
        >
          {fullGrid}
        </ProGate>
      </CardContent>
    </Card>
  )
}
