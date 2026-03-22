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
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
          {card.bank}
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {card.points_currency || "Points"}
        </span>
      </div>

      {/* Card name */}
      <h3 className="text-base font-semibold leading-tight text-on-surface">{card.name}</h3>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricBox
          label="Annual fee"
          value={card.annual_fee != null ? `$${card.annual_fee.toLocaleString()}` : "N/A"}
          highlight={false}
        />
        <MetricBox
          label="Welcome bonus"
          value={
            card.welcome_bonus_points
              ? `${card.welcome_bonus_points.toLocaleString()} ${card.points_currency ?? "pts"}`
              : "N/A"
          }
          highlight={!!card.welcome_bonus_points}
        />
      </div>

      {card.min_income != null && (
        <p className="text-[10px] font-medium text-on-surface-variant">
          Min income: ${card.min_income.toLocaleString()}
        </p>
      )}

      {/* CTA */}
      <button
        className="mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 active:opacity-75"
        style={{ background: "var(--gradient-cta)" }}
      >
        Add card
      </button>
    </div>
  )
}

function MetricBox({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: boolean
}) {
  return (
    <div className="rounded-xl bg-surface-container-highest px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p
        className={`mt-0.5 text-sm font-bold tabular-nums ${
          highlight ? "text-primary" : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
