"use client"

import { useEffect, useState } from "react"
import { Flame, Sparkles, AlertCircle, TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import type { Database } from "@/types/database.types"

type DailyInsight = Database["public"]["Tables"]["daily_insights"]["Row"]
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
type Deal = Database["public"]["Tables"]["deals"]["Row"]

interface DailyInsightsProps {
  userId: string
}

export function DailyInsights({ userId }: DailyInsightsProps) {
  const { trackEvent } = useAnalytics()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [insights, setInsights] = useState<DailyInsight[]>([])
  const [hotDeal, setHotDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDailyData()
  }, [userId])

  const loadDailyData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      setProfile(profileData)

      const today = new Date().toISOString().split("T")[0]
      const { data: insightsData } = await supabase
        .from("daily_insights")
        .select("*")
        .eq("user_id", userId)
        .eq("insight_date", today)
        .is("viewed_at", null)
        .limit(3)

      setInsights(insightsData || [])

      const { data: dealData } = await supabase
        .from("deals")
        .select("*")
        .eq("is_active", true)
        .gte("valid_until", new Date().toISOString())
        .order("click_count", { ascending: false })
        .limit(1)
        .single()

      setHotDeal(dealData)

      if (insightsData && insightsData.length > 0) {
        await supabase
          .from("daily_insights")
          .update({ viewed_at: new Date().toISOString() })
          .in(
            "id",
            insightsData.map((i) => i.id),
          )

        trackEvent("daily_insights_viewed", {
          count: insightsData.length,
          types: insightsData.map((i) => i.tip_type),
        })
      }

      await supabase.rpc("update_user_streak", { p_user_id: userId })

      const { data: updatedProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      setProfile(updatedProfile)
    } catch (error) {
      console.error("Error loading daily data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInsightClick = async (insight: DailyInsight) => {
    await supabase
      .from("daily_insights")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", insight.id)

    trackEvent("daily_insight_clicked", {
      tip_type: insight.tip_type,
      title: insight.title,
    })
  }

  const handleDealClick = async (deal: Deal) => {
    await supabase
      .from("deals")
      .update({ click_count: (deal.click_count || 0) + 1 })
      .eq("id", deal.id)

    trackEvent("deal_clicked", {
      deal_id: deal.id,
      title: deal.title,
      merchant: deal.merchant,
    })

    window.open(deal.deal_url, "_blank")
  }

  if (loading) {
    return (
      <div className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
    )
  }

  const streakDays = profile?.current_streak_days || 0
  const freeDaysEarned = profile?.free_days_earned || 0
  const daysUntilFreePremium = 7 - (streakDays % 7)
  const streakProgress = streakDays > 0 ? ((7 - daysUntilFreePremium) / 7) * 100 : 0

  // Don't render if nothing to show
  const hasContent = streakDays > 0 || insights.length > 0 || hotDeal

  if (!hasContent) return null

  return (
    <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      <CardContent className="divide-y divide-[var(--border-default)] p-0">

        {/* Streak row */}
        {streakDays > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              <Flame className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {streakDays} day streak
                </p>
                {freeDaysEarned > 0 && (
                  <span className="text-xs text-[var(--accent)]">
                    {freeDaysEarned} free {freeDaysEarned === 1 ? "day" : "days"} earned
                  </span>
                )}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: `${streakProgress}%`,
                    backgroundColor: "var(--accent)",
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {daysUntilFreePremium === 7
                  ? "Visit daily to build your streak"
                  : `${daysUntilFreePremium} ${daysUntilFreePremium === 1 ? "day" : "days"} until free premium day`}
              </p>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="px-4 py-3">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Today&apos;s insights
              </p>
            </div>
            <div className="space-y-2">
              {insights.map((insight) => {
                const IconComponent =
                  insight.tip_type === "fee_warning"
                    ? AlertCircle
                    : insight.tip_type === "deal"
                      ? TrendingUp
                      : Sparkles

                return (
                  <button
                    key={insight.id}
                    onClick={() => handleInsightClick(insight)}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-soft)]"
                  >
                    <div className="flex items-start gap-2.5">
                      <IconComponent className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {insight.title}
                        </p>
                        {insight.description && (
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {insight.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Hot deal */}
        {hotDeal && (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                Hot deal
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)]">
                {hotDeal.title}
              </p>
              {hotDeal.merchant && (
                <p className="text-xs text-[var(--text-secondary)]">{hotDeal.merchant}</p>
              )}
            </div>
            <Button
              onClick={() => handleDealClick(hotDeal)}
              size="sm"
              variant="outline"
              className="flex-shrink-0 rounded-full"
            >
              View <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
