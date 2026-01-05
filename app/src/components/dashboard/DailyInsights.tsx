"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
      // Load user profile for streak data
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      setProfile(profileData)

      // Load today's insights
      const today = new Date().toISOString().split("T")[0]
      const { data: insightsData } = await supabase
        .from("daily_insights")
        .select("*")
        .eq("user_id", userId)
        .eq("insight_date", today)
        .is("viewed_at", null) // Only unviewed insights
        .limit(3)

      setInsights(insightsData || [])

      // Load hot deal of the day
      const { data: dealData } = await supabase
        .from("deals")
        .select("*")
        .eq("is_active", true)
        .gte("valid_until", new Date().toISOString())
        .order("click_count", { ascending: false })
        .limit(1)
        .single()

      setHotDeal(dealData)

      // Mark insights as viewed
      if (insightsData && insightsData.length > 0) {
        await supabase
          .from("daily_insights")
          .update({ viewed_at: new Date().toISOString() })
          .in(
            "id",
            insightsData.map((i) => i.id)
          )

        trackEvent("daily_insights_viewed", {
          count: insightsData.length,
          types: insightsData.map((i) => i.tip_type),
        })
      }

      // Update streak (call the function)
      await supabase.rpc("update_user_streak", { p_user_id: userId })

      // Reload profile to get updated streak
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
    // Mark as clicked
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
    // Increment click count
    await supabase
      .from("deals")
      .update({ click_count: (deal.click_count || 0) + 1 })
      .eq("id", deal.id)

    trackEvent("deal_clicked", {
      deal_id: deal.id,
      title: deal.title,
      merchant: deal.merchant,
    })

    // Open deal URL in new tab
    window.open(deal.deal_url, "_blank")
  }

  if (loading) {
    return (
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
        <CardContent className="p-6">
          <div className="animate-pulse text-sm text-slate-400">Loading daily insights...</div>
        </CardContent>
      </Card>
    )
  }

  const streakDays = profile?.current_streak_days || 0
  const freeDaysEarned = profile?.free_days_earned || 0
  const daysUntilFreePremium = 7 - (streakDays % 7)

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      {profile && (
        <Card className="border border-teal-500/30 bg-gradient-to-br from-[var(--surface)] to-[color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{streakDays} Day Streak 🔥</p>
                  <p className="text-sm text-slate-300">
                    {daysUntilFreePremium === 7
                      ? "Start your streak today!"
                      : `${daysUntilFreePremium} ${daysUntilFreePremium === 1 ? "day" : "days"} until free premium day`}
                  </p>
                </div>
              </div>
              {freeDaysEarned > 0 && (
                <div className="text-right">
                  <p className="text-sm text-slate-400">Free Days Earned</p>
                  <p className="text-3xl font-bold text-teal-500">{freeDaysEarned}</p>
                </div>
              )}
            </div>
            {streakDays >= 7 && (
              <div className="mt-4 rounded-xl bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
                Amazing! Keep your streak going to earn more free premium days.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily Insights */}
      {insights.length > 0 && (
        <Card className="border border-[var(--accent)]/20 bg-[var(--surface)] shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-white">Today's Insights</h2>
            </div>
            <div className="space-y-3">
              {insights.map((insight) => {
                const icon =
                  insight.tip_type === "fee_warning"
                    ? AlertCircle
                    : insight.tip_type === "deal"
                      ? TrendingUp
                      : Sparkles

                const IconComponent = icon

                return (
                  <button
                    key={insight.id}
                    onClick={() => handleInsightClick(insight)}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 text-left transition-all hover:border-[var(--accent)] hover:bg-[var(--surface-soft)]"
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--accent)]" />
                      <div className="flex-1">
                        <p className="font-semibold text-white">{insight.title}</p>
                        {insight.description && (
                          <p className="mt-1 text-sm text-slate-300">{insight.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hot Deal of the Day */}
      {hotDeal && (
        <Card className="border border-purple-500/30 bg-gradient-to-br from-[var(--surface)] to-purple-900/10 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                    Hot Deal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{hotDeal.title}</h3>
                {hotDeal.description && (
                  <p className="mt-2 text-sm text-slate-300">{hotDeal.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>🏪 {hotDeal.merchant}</span>
                  {hotDeal.card_network && <span>💳 {hotDeal.card_network.toUpperCase()}</span>}
                  {hotDeal.valid_until && (
                    <span>
                      Valid until {new Date(hotDeal.valid_until).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleDealClick(hotDeal)}
                className="flex-shrink-0 rounded-full text-white shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
              >
                View Deal <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
