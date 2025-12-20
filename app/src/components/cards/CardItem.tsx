import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type CardRecord = {
  id: string
  bank: string
  name: string
  annual_fee?: number | null
  welcome_bonus_points?: number | null
  points_currency?: string | null
  min_income?: number | null
}

export function CardItem({ card }: { card: CardRecord }) {
  return (
    <Card className="h-full border border-[var(--border-default)] bg-[var(--surface)] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-[var(--info-bg)] text-[var(--info-fg)]">
            {card.bank}
          </Badge>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
            }}
          >
            {card.points_currency || "Points"}
          </span>
        </div>
        <CardTitle className="text-lg leading-tight text-white">
          {card.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-200">
        <MetricRow label="Annual fee" value={formatMoney(card.annual_fee)} />
        <MetricRow
          label="Welcome bonus"
          value={
            card.welcome_bonus_points
              ? `${card.welcome_bonus_points.toLocaleString()} ${card.points_currency || "pts"}`
              : "N/A"
          }
        />
        <MetricRow
          label="Min income"
          value={card.min_income ? `$${card.min_income.toLocaleString()}` : "Not listed"}
        />
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)] px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function formatMoney(value?: number | null) {
  if (value == null) return "N/A"
  return `$${value.toLocaleString()}`
}
