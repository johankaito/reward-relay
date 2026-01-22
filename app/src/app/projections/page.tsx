"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Target, TrendingUp } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoalTimelineComparison } from "@/components/projections/GoalTimelineComparison"
import { PointsBalanceWidget } from "@/components/profile/PointsBalanceWidget"
import { UnavailableCardAlert } from "@/components/projections/UnavailableCardAlert"
import { supabase } from "@/lib/supabase/client"
import { GOALS, calculateMultiCardPaths, type RedemptionGoal } from "@/lib/projections"
import { checkForUnavailableCards } from "@/lib/unavailable-cards"
import { useCatalog } from "@/contexts/CatalogContext"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type UserPoints = Database["public"]["Tables"]["user_points"]["Row"]

export default function ProjectionsPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog() // Active cards only
  const [allCatalogCards, setAllCatalogCards] = useState<Database["public"]["Tables"]["cards"]["Row"][]>([])
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState<string>("domesticFlight")

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/")
      return
    }

    // Load user cards, points, and ALL catalog cards (including inactive) in parallel
    const [userCardsResult, pointsResult, allCardsResult] = await Promise.all([
      supabase
        .from("user_cards")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_points")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase
        .from("cards")
        .select("*")
        .order("bank", { ascending: true })
    ])

    if (userCardsResult.error) {
      toast.error(userCardsResult.error.message || "Unable to load your cards")
      setLoading(false)
      return
    }

    setUserCards(userCardsResult.data || [])
    setUserPoints(pointsResult.data)
    setAllCatalogCards(allCardsResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [router])

  const selectedGoal = GOALS[selectedGoalId]
  const currentPoints = userPoints?.qantas_ff_balance || 0

  // Calculate paths using ALL cards (including inactive) to detect unavailable cards
  const paths = useMemo(() => {
    if (!selectedGoal || allCatalogCards.length === 0) return []
    return calculateMultiCardPaths(selectedGoal, userCards, allCatalogCards, currentPoints)
  }, [selectedGoal, userCards, allCatalogCards, currentPoints])

  const recommendedPath = paths[0]
  const alternativePaths = paths.slice(1, 4) // Show top 3 alternatives

  // Check for unavailable cards in recommended path
  const unavailableCard = useMemo(() => {
    return checkForUnavailableCards(paths)
  }, [paths])

  const domesticGoals = Object.values(GOALS).filter(g => g.category === "domestic")
  const internationalGoals = Object.values(GOALS).filter(g => g.category === "international")

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading projections...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Churning Projections
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Your path to rewards
              </h1>
              <p className="text-sm text-slate-300">
                See how many cards and months it takes to reach your travel goals
              </p>
            </div>
          </div>
        </div>

        {/* Points Balance Widget */}
        <PointsBalanceWidget
          currentBalance={currentPoints}
          lastUpdated={userPoints?.last_updated_at ? new Date(userPoints.last_updated_at) : null}
          onBalanceUpdate={loadData}
        />

        {/* Unavailable Card Alert */}
        {unavailableCard && selectedGoal && (
          <UnavailableCardAlert
            cardName={unavailableCard.cardName}
            cardBank={unavailableCard.cardBank}
            goalLabel={selectedGoal.label}
            onUpdateGoal={() => {
              // Scroll to alternative paths
              const alternativesSection = document.getElementById('alternative-paths')
              if (alternativesSection) {
                alternativesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          />
        )}

        {/* Goal Selector */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-[var(--accent)]" />
              Choose Your Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="domestic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="domestic">Domestic</TabsTrigger>
                <TabsTrigger value="international">International</TabsTrigger>
              </TabsList>

              <TabsContent value="domestic" className="mt-6 space-y-3">
                {domesticGoals.map((goal) => (
                  <Button
                    key={goal.id}
                    variant={selectedGoalId === goal.id ? "default" : "outline"}
                    className="w-full justify-start gap-3"
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{goal.label}</p>
                      <p className="text-xs text-slate-400">{goal.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {goal.pointsRequired.toLocaleString()} pts
                    </Badge>
                  </Button>
                ))}
              </TabsContent>

              <TabsContent value="international" className="mt-6 space-y-3">
                {internationalGoals.map((goal) => (
                  <Button
                    key={goal.id}
                    variant={selectedGoalId === goal.id ? "default" : "outline"}
                    className="w-full justify-start gap-3"
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{goal.label}</p>
                      <p className="text-xs text-slate-400">{goal.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {goal.pointsRequired.toLocaleString()} pts
                    </Badge>
                  </Button>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Current Goal Summary */}
        {selectedGoal && (
          <Card className="border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface)] to-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Selected Goal</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedGoal.icon} {selectedGoal.label}
                  </p>
                  <p className="text-sm text-slate-300">{selectedGoal.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Points Needed</p>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {Math.max(0, selectedGoal.pointsRequired - currentPoints).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    of {selectedGoal.pointsRequired.toLocaleString()} required
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] transition-all"
                    style={{
                      width: `${Math.min(100, (currentPoints / selectedGoal.pointsRequired) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {currentPoints > 0
                    ? `${Math.floor((currentPoints / selectedGoal.pointsRequired) * 100)}% complete`
                    : "Start earning points to track progress"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paths */}
        {paths.length > 0 ? (
          <div id="alternative-paths">
            <GoalTimelineComparison
              recommendedPath={recommendedPath}
              alternativePaths={alternativePaths}
              currentPoints={currentPoints}
            />
          </div>
        ) : (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)]">
            <CardContent className="py-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-lg font-semibold text-white">
                No paths available
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Add some cards to your portfolio to see personalized churning paths
              </p>
              <Button
                className="mt-6"
                onClick={() => router.push("/cards")}
              >
                Browse Cards
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
