"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useCatalog } from "@/contexts/CatalogContext"
import { ChurnerOnboarding } from "@/components/onboarding/ChurnerOnboarding"
import type { OnboardingCardEntry } from "@/lib/recommendations"
import Link from "next/link"

export default function CardHistoryPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [existingCards, setExistingCards] = useState<{ card_id: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?redirect=/cards/history")
        return
      }
      setUserId(session.user.id)
      supabase.from("user_cards").select("card_id").then(({ data }) => {
        setExistingCards(data ?? [])
        setLoading(false)
      })
    })
  }, [router])

  const excludedCardIds = useMemo(
    () => new Set(existingCards.map(c => c.card_id).filter(Boolean) as string[]),
    [existingCards]
  )

  const allCovered = !loading && catalogCards.length > 0 && catalogCards.every(c => excludedCardIds.has(c.id))

  const handleComplete = async (cardHistory: OnboardingCardEntry[]) => {
    if (!userId) return
    setSaving(true)
    const rows = cardHistory.map(entry => ({
      user_id: userId,
      card_id: entry.cardId,
      bank: entry.bank,
      name: "",
      status: "cancelled" as const,
      application_date: entry.applicationMonth ? `${entry.applicationMonth}-01` : null,
      bonus_earned: entry.bonusReceived,
    }))
    await supabase.from("user_cards").upsert(rows, { onConflict: "user_id,card_id" })
    router.push("/recommendations")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)]">
        <p className="text-on-surface-variant animate-pulse">Loading…</p>
      </div>
    )
  }

  if (saving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)]">
        <p className="text-on-surface-variant animate-pulse">Saving your history…</p>
      </div>
    )
  }

  if (allCovered) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)] gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-white">History looks complete</p>
        <p className="text-on-surface-variant text-sm">All cards in our catalog are already in your portfolio.</p>
        <Link href="/recommendations" className="text-teal-400 underline text-sm">View recommendations</Link>
      </div>
    )
  }

  return (
    <ChurnerOnboarding
      onComplete={handleComplete}
      excludedCardIds={excludedCardIds}
      submitLabel="Save history"
      headingOverride="Add past cards"
      subheadingOverride="Select cards you have held before. We will use them to calculate your cooling-off periods."
    />
  )
}
