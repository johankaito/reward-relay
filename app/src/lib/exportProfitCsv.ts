import type { ProfitCard } from "@/components/profit/CardBreakdown"

export function exportProfitCsv(cards: ProfitCard[]) {
  const headers = [
    "Date Earned",
    "Bank",
    "Card Name",
    "Points Program",
    "Bonus Points",
    "Bonus AUD Value",
    "Annual Fee Paid",
    "Net Value",
  ]

  const rows = cards.map((c) => [
    c.bonusEarnedAt ? new Date(c.bonusEarnedAt).toLocaleDateString("en-AU") : "",
    c.bank,
    c.name,
    c.pointsProgram,
    c.welcomeBonusPoints,
    c.bonusAud.toFixed(2),
    c.fee.toFixed(2),
    c.netValue.toFixed(2),
  ])

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `reward-relay-profit-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
