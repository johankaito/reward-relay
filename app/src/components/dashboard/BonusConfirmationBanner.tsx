"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Target, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

interface PendingCard {
  id: string
  bank: string | null
  name: string | null
  welcomeBonusPoints: number | null
  pointsProgram: string | null
}

const REMINDER_KEY = "bonus_reminder_after"

function getReminderData(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function setReminder(cardId: string) {
  const data = getReminderData()
  const after = new Date()
  after.setDate(after.getDate() + 7)
  data[cardId] = after.toISOString()
  localStorage.setItem(REMINDER_KEY, JSON.stringify(data))
}

function isSnoozed(cardId: string): boolean {
  const data = getReminderData()
  const after = data[cardId]
  if (!after) return false
  return new Date(after) > new Date()
}

export function BonusConfirmationBanner() {
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPendingConfirmations()
  }, [])

  const loadPendingConfirmations = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from("user_cards")
      .select("id, bank, name, cards!card_id(welcome_bonus_points, points_currency)")
      .eq("bonus_earned_suggested", true)
      .eq("bonus_earned", false)
      .eq("status", "active")

    if (!data) return

    const cards: PendingCard[] = data
      .map((row) => {
        const card = Array.isArray(row.cards) ? row.cards[0] : row.cards
        return {
          id: row.id,
          bank: row.bank,
          name: row.name,
          welcomeBonusPoints: card?.welcome_bonus_points ?? null,
          pointsProgram: card?.points_currency ?? null,
        }
      })
      .filter((c) => !isSnoozed(c.id))

    setPendingCards(cards)
  }

  const handleConfirm = async (card: PendingCard) => {
    const { error } = await supabase
      .from("user_cards")
      .update({
        bonus_earned: true,
        bonus_earned_at: new Date().toISOString(),
        bonus_earned_suggested: false,
      })
      .eq("id", card.id)

    if (error) {
      toast.error("Failed to update — please try again")
      return
    }

    // Fire confetti (best-effort — skip if package not installed)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import(/* webpackIgnore: true */ "canvas-confetti" as any)
      const confetti = (mod as { default: (opts: Record<string, unknown>) => void }).default
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 } })
    } catch {
      // canvas-confetti not available
    }

    toast.success("Logged! Added to your P&L.")
    dismissCard(card.id)
  }

  const handleSnooze = (cardId: string) => {
    setReminder(cardId)
    dismissCard(cardId)
  }

  const dismissCard = (cardId: string) => {
    setDismissed((prev) => new Set([...prev, cardId]))
  }

  const visible = pendingCards.filter((c) => !dismissed.has(c.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map((card) => (
        <div
          key={card.id}
          className="relative rounded-xl border-2 p-4"
          style={{
            borderColor: "var(--accent)",
            background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
          }}
        >
          <button
            onClick={() => dismissCard(card.id)}
            className="absolute right-3 top-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: "var(--gradient-cta)" }}
            >
              <Target className="h-4 w-4" />
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Looks like you&apos;ve hit your minimum spend on {card.bank} {card.name}
                </p>
                {card.welcomeBonusPoints && card.pointsProgram && (
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Have you received your{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {card.welcomeBonusPoints.toLocaleString()} {card.pointsProgram} points
                    </span>{" "}
                    bonus?
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="text-white shadow-sm"
                  style={{ background: "var(--gradient-cta)" }}
                  onClick={() => handleConfirm(card)}
                >
                  Yes, I&apos;ve got it!
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSnooze(card.id)}
                >
                  Not yet — remind me in 7 days
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
