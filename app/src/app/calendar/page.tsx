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
        <div className="space-y-3">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Page header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Timeline
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold text-[var(--text-primary)]">
            Churning calendar
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Card lifecycle and bank re-eligibility windows
          </p>
        </div>

        {bankTimelines.length === 0 ? (
          <Card className="border border-white/5 bg-[var(--surface)] shadow-sm">
            <CardContent className="py-8 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]/40" />
              <p className="font-medium text-[var(--text-primary)]">No card history yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Add cards and track their lifecycle to see your churning timeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bankTimelines.map((timeline) => {
              const eligibilityStatus = getEligibilityStatus(timeline.daysUntilEligible)
              const StatusIcon = eligibilityStatus?.icon

              return (
                <Card
                  key={timeline.bank}
                  className="border border-white/5 bg-[var(--surface)] shadow-sm"
                  data-bank-timeline={timeline.bank}
                >
                  <CardContent className="p-4">
                    {/* Bank header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                          {timeline.bank}
                        </h2>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {timeline.cards.length} card{timeline.cards.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {timeline.eligibilityDate && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Clock className="h-3 w-3 text-[var(--accent)]" />
                            {timeline.daysUntilEligible === 0
                              ? "Eligible now"
                              : `Eligible ${formatDate(timeline.eligibilityDate)}`}
                          </span>
                        )}
                        {eligibilityStatus && (
                          <Badge style={eligibilityStatus.style} className="flex items-center gap-1 text-xs">
                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                            {eligibilityStatus.text}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card timelines — compact inline rows */}
                    <div className="space-y-2">
                      {timeline.cards.map(({ card, stages }) => (
                        <div
                          key={card.id}
                          className="rounded-lg border border-white/5 bg-[var(--surface-muted)] px-3 py-2"
                        >
                          <p className="mb-1.5 text-xs font-semibold text-[var(--text-primary)]">
                            {card.card?.name || card.name || "Unknown card"}
                          </p>

                          {/* Stages as a single inline row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {/* Applied */}
                            <div className="flex items-center gap-1">
                              {stages.applied.complete ? (
                                <CheckCircle className="h-3 w-3 text-[var(--text-secondary)]" />
                              ) : (
                                <XCircle className="h-3 w-3 text-[var(--text-secondary)]/40" />
                              )}
                              <span className="text-xs text-[var(--text-secondary)]">Applied</span>
                              {stages.applied.date && (
                                <span className="text-xs text-[var(--text-secondary)]/60">
                                  {formatDate(stages.applied.date)}
                                </span>
                              )}
                            </div>

                            {stages.applied.complete && <span className="text-xs text-[var(--border-default)]">›</span>}

                            {/* Approved */}
                            <div className="flex items-center gap-1">
                              {stages.approved.complete ? (
                                <CheckCircle className="h-3 w-3 text-[var(--success-fg)]" />
                              ) : (
                                <Clock className="h-3 w-3 text-[var(--text-secondary)]/40" />
                              )}
                              <span className="text-xs text-[var(--text-secondary)]">Approved</span>
                              {stages.approved.date && (
                                <span className="text-xs text-[var(--text-secondary)]/60">
                                  {formatDate(stages.approved.date)}
                                </span>
                              )}
                            </div>

                            {/* Active badge */}
                            {stages.active.complete && (
                              <>
                                <span className="text-xs text-[var(--border-default)]">›</span>
                                <Badge
                                  className="text-xs"
                                  style={{ backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }}
                                >
                                  Active
                                </Badge>
                              </>
                            )}

                            {/* Cancelled */}
                            {stages.cancelled.complete && (
                              <>
                                <span className="text-xs text-[var(--border-default)]">›</span>
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-[var(--danger)]" />
                                  <span className="text-xs text-[var(--text-secondary)]">Cancelled</span>
                                  <span className="text-xs text-[var(--text-secondary)]/60">
                                    {formatDate(stages.cancelled.date)}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Eligible again */}
                            {stages.eligible.date && (
                              <>
                                <span className="text-xs text-[var(--border-default)]">›</span>
                                <div className="flex items-center gap-1">
                                  {stages.eligible.complete ? (
                                    <CheckCircle className="h-3 w-3 text-[var(--accent)]" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-[var(--warning-fg)]" />
                                  )}
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    Eligible {formatDate(stages.eligible.date)}
                                  </span>
                                </div>
                              </>
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-[var(--success-fg)]" /> Completed
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-[var(--warning-fg)]" /> Pending
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3 w-3 text-[var(--danger)]" /> Cancelled
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-[var(--accent)]" /> Eligible
          </div>
        </div>
      </div>
    </AppShell>
  )
}
