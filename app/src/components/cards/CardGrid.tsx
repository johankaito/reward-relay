import { CardItem, type CardRecord } from "./CardItem"

// Re-export CardRecord for use in other files
export type { CardRecord }

type Props = {
  cards: CardRecord[]
}

export function CardGrid({ cards }: Props) {
  if (!cards.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface)] p-8 text-center text-sm text-slate-200">
        No cards found. Seed the catalog in Supabase to see results.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  )
}
