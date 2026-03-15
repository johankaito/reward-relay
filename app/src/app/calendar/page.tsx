"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import {
  computeEligibility,
  formatEligibilityLabel,
  type BankExclusionPeriod,
} from "@/lib/eligibility"

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
  bankSlug: string
  cards: CardTimeline[]
  eligibilityDate: Date | null
  daysUntilEligible: number | null
  hasUnknownWindow: boolean
  exclusionMonths: number | null
  exclusionNote: string | null
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

/**
 * Normalize a bank display name to a slug for matching against bank_exclusion_periods.
 * Maps common bank name variants to the slugs used in the DB.
 */
function bankNameToSlug(bank: string): string {
  const lower = bank.toLowerCase()
  if (lower.includes('anz')) return 'anz'
  if (lower.includes('westpac')) return 'westpac'
  if (lower.includes('st.george') || lower.includes('stgeorge') || lower.includes('bank of melbourne') || lower.includes('banksa')) return 'stgeorge-bom-banksa'
  if (lower.includes('bankwest')) return 'bankwest'
  if (lower.includes('commbank') || lower.includes('commonwealth')) return 'commbank'
  if (lower.includes('nab')) return 'nab'
  if (lower.includes('amex') || lower.includes('american express')) return 'amex-au'
  if (lower.includes('hsbc') && lower.includes('qantas')) return 'hsbc-au-qantas'
  if (lower.includes('hsbc') && lower.includes('star')) return 'hsbc-au-star-alliance'
  if (lower.includes('hsbc')) return 'hsbc-au-qantas'
  if (lower.includes('virgin money')) return 'virgin-money-au'
  if (lower.includes('macquarie')) return 'macquarie'
  return lower.replace(/\s+/g, '-')
}

export default function CalendarPage() {
  const [bankTimelines, setBankTimelines] = useState<BankTimeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadTimelines()
  }, [])

  const loadTimelines = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: cards, error: cardsError }, { data: exclusionData }] = await Promise.all([
        supabase
          .from("user_cards")
          .select(`*, card:cards(*)`)
          .eq("user_id", user.id)
          .order("application_date", { ascending: false }),
        supabase
          .from("bank_exclusion_periods" as never)
          .select("bank_slug, bank_name, exclusion_months, exclusion_note, applies_to"),
      ])

      if (cardsError) throw cardsError

      const exclusionMap = new Map<string, BankExclusionPeriod>()
      ;((exclusionData as BankExclusionPeriod[] | null) ?? []).forEach((ep) => {
        exclusionMap.set(ep.bank_slug, ep)
      })

      const bankMap = new Map<string, UserCard[]>()

      ;(cards || []).forEach((card) => {
        const bank = card.card?.bank || card.bank || "Unknown"
        if (!bankMap.has(bank)) bankMap.set(bank, [])
        bankMap.get(bank)!.push(card)
      })

      const timelines: BankTimeline[] = []

      bankMap.forEach((bankCards, bank) => {
        const bankSlug = bankNameToSlug(bank)
        const exclusionPeriod = exclusionMap.get(bankSlug) ?? null
        const exclusionMonths = exclusionPeriod?.exclusion_months ?? null

        const cancelledCards = bankCards.filter((c) => c.cancellation_date)
        const mostRecentApplicationDate =
          bankCards.length > 0
            ? bankCards.reduce((latest, card) => {
                if (!card.application_date) return latest
                if (!latest) return card.application_date
                return card.application_date > latest ? card.application_date : latest
              }, null as string | null)
            : null

        const eligibilityResult = computeEligibility(
          bankSlug,
          bank,
          mostRecentApplicationDate,
          exclusionPeriod,
        )

        const cardTimelines = bankCards.map((card) => {
          const eligibleDate =
            exclusionMonths !== null && card.cancellation_date
              ? (() => {
                  const d = new Date(card.cancellation_date)
                  d.setMonth(d.getMonth() + exclusionMonths)
                  return d
                })()
              : null

          const today = new Date()

          return {
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
                date: eligibleDate,
                complete: eligibleDate !== null && eligibleDate <= today,
              },
            },
          }
        })

        let eligibilityDate: Date | null = null
        let daysUntilEligible: number | null = null

        if (cancelledCards.length > 0 && exclusionMonths !== null) {
          const mostRecentCancellation = cancelledCards.reduce((latest, card) => {
            const cardDate = new Date(card.cancellation_date!)
            return !latest || cardDate > new Date(latest.cancellation_date!) ? card : latest
          })

          eligibilityDate = new Date(mostRecentCancellation.cancellation_date!)
          eligibilityDate.setMonth(eligibilityDate.getMonth() + exclusionMonths)

          const today = new Date()
          const daysRemaining = Math.ceil(
            (eligibilityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
          daysUntilEligible = daysRemaining > 0 ? daysRemaining : 0
        }

        timelines.push({
          bank,
          bankSlug,
          cards: cardTimelines,
          eligibilityDate,
          daysUntilEligible,
          hasUnknownWindow: eligibilityResult.hasUnknownWindow && cancelledCards.length > 0,
          exclusionMonths,
          exclusionNote: exclusionPeriod?.exclusion_note ?? null,
        })
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

  const getEligibilityStatus = (timeline: BankTimeline) => {
    if (timeline.hasUnknownWindow) {
      return {
        text: "Check bank website",
        style: { backgroundColor: "var(--surface-strong)", color: "var(--text-secondary)" },
        icon: Info,
      }
    }
    const { daysUntilEligible } = timeline
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
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
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
              const eligibilityStatus = getEligibilityStatus(timeline)
              const StatusIcon = eligibilityStatus?.icon

              return (
                <Card
                  key={timeline.bank}
                  className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm"
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
                        {timeline.exclusionMonths !== null && (
                          <span className="text-xs text-[var(--text-secondary)]/60">
                            · {timeline.exclusionMonths}mo window
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {timeline.eligibilityDate && !timeline.hasUnknownWindow && (
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

                    {/* Unknown window notice */}
                    {timeline.hasUnknownWindow && timeline.exclusionNote && (
                      <p className="mb-2 text-xs text-[var(--text-secondary)] italic">
                        {timeline.exclusionNote}
                      </p>
                    )}

                    {/* Card timelines — compact inline rows */}
                    <div className="space-y-2">
                      {timeline.cards.map(({ card, stages }) => (
                        <div
                          key={card.id}
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2"
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

                            {/* Unknown window indicator */}
                            {timeline.hasUnknownWindow && stages.cancelled.complete && (
                              <>
                                <span className="text-xs text-[var(--border-default)]">›</span>
                                <div className="flex items-center gap-1">
                                  <Info className="h-3 w-3 text-[var(--text-secondary)]/60" />
                                  <span className="text-xs text-[var(--text-secondary)]/60">
                                    Check bank website
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
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-[var(--text-secondary)]/60" /> Unknown window
          </div>
        </div>
      </div>
    </AppShell>
  )
}
