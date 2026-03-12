"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface UserCard {
  id: string
  card_id: string | null
  bank: string | null
  name: string | null
  status: string | null
  application_date: string | null
  approval_date: string | null
  cancellation_date: string | null
  card: {
    id: string
    bank: string
    name: string
    welcome_bonus_points?: number | null
    [key: string]: unknown
  } | null
}

interface BankTimeline {
  bank: string
  cards: CardTimeline[]
  eligibilityDate: Date | null
  daysUntilEligible: number | null
}

interface CardTimeline {
  card: UserCard
  stages: {
    applied: { date: Date | null; complete: boolean }
    approved: { date: Date | null; complete: boolean }
    active: { date: Date | null; complete: boolean }
    cancelled: { date: Date | null; complete: boolean }
    eligible: { date: Date | null; complete: boolean }
  }
}

export default function CalendarPage() {
  const [bankTimelines, setBankTimelines] = useState<BankTimeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimelines()
  }, [])

  const loadTimelines = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: cards, error } = await supabase
        .from("user_cards")
        .select(`*, card:cards(*)`)
        .eq("user_id", user.id)
        .order("application_date", { ascending: false })

      if (error) throw error

      const bankMap = new Map<string, UserCard[]>()

      ;(cards || []).forEach((card) => {
        const bank = card.card?.bank || card.bank || "Unknown"
        if (!bankMap.has(bank)) bankMap.set(bank, [])
        bankMap.get(bank)!.push(card)
      })

      const timelines: BankTimeline[] = []

      bankMap.forEach((bankCards, bank) => {
        const cardTimelines = bankCards.map((card) => ({
          card,
          stages: {
            applied: {
              date: card.application_date ? new Date(card.application_date) : null,
              complete: !!card.application_date,
            },
            approved: {
              date: card.approval_date ? new Date(card.approval_date) : null,
              complete: !!card.approval_date,
            },
            active: {
              date: null,
              complete: card.status === "active",
            },
            cancelled: {
              date: card.cancellation_date ? new Date(card.cancellation_date) : null,
              complete: !!card.cancellation_date && card.status === "cancelled",
            },
            eligible: {
              date: card.cancellation_date
                ? new Date(
                    new Date(card.cancellation_date).setMonth(
                      new Date(card.cancellation_date).getMonth() + 12,
                    ),
                  )
                : null,
              complete: false,
            },
          },
        }))

        const cancelledCards = bankCards.filter((c) => c.cancellation_date)
        let eligibilityDate: Date | null = null
        let daysUntilEligible: number | null = null

        if (cancelledCards.length > 0) {
          const mostRecentCancellation = cancelledCards.reduce((latest, card) => {
            const cardDate = new Date(card.cancellation_date!)
            return !latest || cardDate > new Date(latest.cancellation_date!) ? card : latest
          })

          eligibilityDate = new Date(
            new Date(mostRecentCancellation.cancellation_date!).setMonth(
              new Date(mostRecentCancellation.cancellation_date!).getMonth() + 12,
            ),
          )

          const today = new Date()
          const daysRemaining = Math.ceil(
            (eligibilityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
          daysUntilEligible = daysRemaining > 0 ? daysRemaining : 0

          cardTimelines.forEach((ct) => {
            if (ct.stages.eligible.date && ct.stages.eligible.date <= today) {
              ct.stages.eligible.complete = true
            }
          })
        }

        timelines.push({ bank, cards: cardTimelines, eligibilityDate, daysUntilEligible })
      })

      timelines.sort((a, b) => {
        if (!a.daysUntilEligible && !b.daysUntilEligible) return 0
        if (!a.daysUntilEligible) return 1
        if (!b.daysUntilEligible) return -1
        return a.daysUntilEligible - b.daysUntilEligible
      })

      setBankTimelines(timelines)
    } catch (error) {
      console.error("Error loading timelines:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—"
    return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getEligibilityStatus = (daysUntilEligible: number | null) => {
    if (daysUntilEligible === null) return null
    if (daysUntilEligible === 0) {
      return { text: "Eligible now", style: { backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }, icon: CheckCircle }
    }
    if (daysUntilEligible < 30) {
      return { text: `${daysUntilEligible} days`, style: { backgroundColor: "var(--warning-bg)", color: "var(--warning-fg)" }, icon: Clock }
    }
    const months = Math.floor(daysUntilEligible / 30)
    return {
      text: `${months} month${months > 1 ? "s" : ""}`,
      style: { backgroundColor: "var(--surface-strong)", color: "var(--text-secondary)" },
      icon: AlertCircle,
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Timeline
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            Churning calendar
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Card lifecycle and bank re-eligibility windows
          </p>
        </div>

        {bankTimelines.length === 0 ? (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="py-10 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]/40" />
              <p className="font-medium text-[var(--text-primary)]">No card history yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Add cards and track their lifecycle to see your churning timeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bankTimelines.map((timeline) => {
              const eligibilityStatus = getEligibilityStatus(timeline.daysUntilEligible)
              const StatusIcon = eligibilityStatus?.icon

              return (
                <Card
                  key={timeline.bank}
                  className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm"
                  data-bank-timeline={timeline.bank}
                >
                  <CardContent className="p-5">
                    {/* Bank header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                          {timeline.bank}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {timeline.cards.length} card
                          {timeline.cards.length > 1 ? "s" : ""} tracked
                        </p>
                      </div>
                      {eligibilityStatus && (
                        <Badge style={eligibilityStatus.style} className="flex items-center gap-1">
                          {StatusIcon && <StatusIcon className="h-3 w-3" />}
                          {eligibilityStatus.text}
                        </Badge>
                      )}
                    </div>

                    {/* Eligibility info */}
                    {timeline.eligibilityDate && (
                      <div
                        className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                        }}
                      >
                        <Clock className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                        <span className="text-[var(--text-primary)]">
                          {timeline.daysUntilEligible === 0
                            ? "You are eligible to reapply for this bank."
                            : `Eligible to reapply: ${formatDate(timeline.eligibilityDate)}`}
                        </span>
                      </div>
                    )}

                    {/* Card timelines */}
                    <div className="space-y-4">
                      {timeline.cards.map(({ card, stages }) => (
                        <div
                          key={card.id}
                          className="border-l-2 border-[var(--border-default)] pl-4"
                        >
                          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                            {card.card?.name || card.name || "Unknown card"}
                          </h3>

                          <div className="space-y-1.5">
                            {/* Applied */}
                            <div className="flex items-center gap-2.5">
                              {stages.applied.complete ? (
                                <CheckCircle className="h-4 w-4 text-[var(--text-secondary)]" />
                              ) : (
                                <XCircle className="h-4 w-4 text-[var(--text-secondary)]/40" />
                              )}
                              <span className="text-sm text-[var(--text-primary)]">Applied</span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {formatDate(stages.applied.date)}
                              </span>
                            </div>

                            {/* Approved */}
                            <div className="flex items-center gap-2.5">
                              {stages.approved.complete ? (
                                <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
                              ) : (
                                <Clock className="h-4 w-4 text-[var(--text-secondary)]/40" />
                              )}
                              <span className="text-sm text-[var(--text-primary)]">Approved</span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {formatDate(stages.approved.date)}
                              </span>
                            </div>

                            {/* Active */}
                            <div className="flex items-center gap-2.5">
                              {stages.active.complete ? (
                                <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
                              ) : (
                                <Clock className="h-4 w-4 text-[var(--text-secondary)]/40" />
                              )}
                              <span className="text-sm text-[var(--text-primary)]">Active</span>
                              {card.status === "active" && (
                                <Badge
                                  className="text-xs"
                                  style={{
                                    backgroundColor: "var(--success-bg)",
                                    color: "var(--success-fg)",
                                  }}
                                >
                                  Current
                                </Badge>
                              )}
                            </div>

                            {/* Cancelled */}
                            {stages.cancelled.complete && (
                              <div className="flex items-center gap-2.5">
                                <XCircle className="h-4 w-4 text-[var(--danger)]" />
                                <span className="text-sm text-[var(--text-primary)]">
                                  Cancelled
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {formatDate(stages.cancelled.date)}
                                </span>
                              </div>
                            )}

                            {/* Eligible again */}
                            {stages.eligible.date && (
                              <div className="flex items-center gap-2.5">
                                {stages.eligible.complete ? (
                                  <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
                                ) : (
                                  <Clock className="h-4 w-4 text-[var(--warning-fg)]" />
                                )}
                                <span className="text-sm text-[var(--text-primary)]">
                                  Eligible to reapply
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {formatDate(stages.eligible.date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardContent className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Legend
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <CheckCircle className="h-3.5 w-3.5 text-[var(--success-fg)]" />
                Completed
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Clock className="h-3.5 w-3.5 text-[var(--warning-fg)]" />
                Pending
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <XCircle className="h-3.5 w-3.5 text-[var(--danger)]" />
                Cancelled
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <CheckCircle className="h-3.5 w-3.5 text-[var(--accent)]" />
                Eligible
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
