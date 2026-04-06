"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { markOnboardingComplete } from "@/lib/onboarding"
import { OnboardingGate } from "./OnboardingGate"
import { ChurnerOnboarding } from "./ChurnerOnboarding"
import { NewChurnerOnboarding } from "./NewChurnerOnboarding"
import type { OnboardingCardEntry } from "@/lib/recommendations"
import type { SpendBand } from "@/lib/projections"
import { useCatalog } from "@/contexts/CatalogContext"

type Flow = "gate" | "path-a" | "path-b"

export function NewOnboarding() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [flow, setFlow] = useState<Flow>("gate")
  const [saving, setSaving] = useState(false)

  const handleGate = (hasChurned: boolean) => {
    setFlow(hasChurned ? "path-a" : "path-b")
  }

  const saveCardHistory = async (
    userId: string,
    cardHistory: OnboardingCardEntry[],
    status: "cancelled"
  ) => {
    if (cardHistory.length === 0) return
    const rows = cardHistory.map((entry) => ({
      user_id: userId,
      card_id: entry.cardId,
      bank: catalogCards.find((c) => c.id === entry.cardId)?.bank ?? entry.bank,
      name: catalogCards.find((c) => c.id === entry.cardId)?.name ?? "",
      status,
      application_date: `${entry.applicationMonth}-01`,
      bonus_earned: entry.bonusReceived,
    }))
    await supabase.from("user_cards").upsert(rows, { onConflict: "user_id,card_id" })
  }

  const handlePathAComplete = async (cardHistory: OnboardingCardEntry[]) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        has_churned_before: true,
        onboarding_path: "experienced",
        onboarding_card_history: cardHistory as unknown,
      }, { onConflict: "user_id" })

      await saveCardHistory(user.id, cardHistory, "cancelled")
      await markOnboardingComplete(user.id)

      toast.success("Plan saved! Welcome to Reward Relay.")
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save. Please try again.")
      setSaving(false)
    }
  }

  const handlePathBComplete = async ({
    goalKey,
    spendBand,
    cardHistory,
  }: {
    goalKey: string
    spendBand: SpendBand
    cardHistory: OnboardingCardEntry[]
  }) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        has_churned_before: false,
        onboarding_path: "new",
        spend_band: spendBand,
        churning_goal: goalKey,
        onboarding_card_history: cardHistory as unknown,
      }, { onConflict: "user_id" })

      if (cardHistory.length > 0) {
        await saveCardHistory(user.id, cardHistory, "cancelled")
      }
      await markOnboardingComplete(user.id)

      toast.success("Plan saved! Welcome to Reward Relay.")
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save. Please try again.")
      setSaving(false)
    }
  }

  if (saving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)]">
        <p className="text-on-surface-variant animate-pulse">Saving your plan...</p>
      </div>
    )
  }

  if (flow === "gate") {
    return <OnboardingGate onSelect={handleGate} />
  }

  if (flow === "path-a") {
    return <ChurnerOnboarding onComplete={handlePathAComplete} />
  }

  return <NewChurnerOnboarding onComplete={handlePathBComplete} />
}
