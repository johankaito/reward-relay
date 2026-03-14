"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface ProfitCard {
  id: string
  bank: string
  name: string
  bonusAud: number
  fee: number
  netValue: number
  bonusEarnedAt: string
  pointsProgram: string
  welcomeBonusPoints: number
  fy: string
}

interface CardBreakdownProps {
  cards: ProfitCard[]
}

function fmtAud(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

export function CardBreakdown({ cards }: CardBreakdownProps) {
  const sorted = [...cards].sort((a, b) => b.netValue - a.netValue)

  if (sorted.length === 0) {
    return (
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
        <CardContent className="py-8 text-center text-sm text-[var(--text-secondary)]">
          No cards with confirmed bonuses yet.
        </CardContent>
      </Card>
    )
  }

  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  return (
    <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
          Card breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
                <th className="px-4 py-2.5 text-left font-medium">Card</th>
                <th className="px-4 py-2.5 text-right font-medium">Bonus</th>
                <th className="px-4 py-2.5 text-right font-medium">Fee</th>
                <th className="px-4 py-2.5 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((card) => {
                const isTop = card.id === best.id
                const isLowValue = card.netValue < 200 && card.netValue >= 0
                const isNegative = card.netValue < 0

                let rowBg = ""
                if (isTop) rowBg = "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                else if (isNegative) rowBg = "bg-[color-mix(in_srgb,#ef4444_6%,transparent)]"
                else if (isLowValue) rowBg = "bg-[color-mix(in_srgb,#f59e0b_6%,transparent)]"

                return (
                  <tr
                    key={card.id}
                    className={`border-b border-[var(--border-default)] last:border-0 ${rowBg}`}
                  >
                    <td className="px-4 py-3">
                      <span className="mr-1.5">
                        {isTop ? "🏆" : isNegative ? "🔴" : isLowValue ? "⚠️" : ""}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {card.bank} {card.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                      {fmtAud(card.bonusAud)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                      {fmtAud(card.fee)}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold"
                      style={{
                        color: isNegative ? "#ef4444" : isLowValue ? "#f59e0b" : "var(--accent)",
                      }}
                    >
                      {fmtAud(card.netValue)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Best / worst callout */}
        <div className="flex flex-wrap gap-4 border-t border-[var(--border-default)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          <span>
            Best: <span className="font-semibold text-[var(--text-primary)]">{best.bank} {best.name}</span>{" "}
            <span style={{ color: "var(--accent)" }}>({fmtAud(best.netValue)} net)</span>
          </span>
          {sorted.length > 1 && (
            <span>
              Worst: <span className="font-semibold text-[var(--text-primary)]">{worst.bank} {worst.name}</span>{" "}
              <span style={{ color: worst.netValue < 0 ? "#ef4444" : "#f59e0b" }}>({fmtAud(worst.netValue)} net)</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
