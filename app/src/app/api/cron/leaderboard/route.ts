import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import type { Database } from "@/types/database.types"

export const dynamic = "force-dynamic"

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

function hashUserId(userId: string): string {
  return createHash("sha256").update(userId).digest("hex")
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getServiceClient()

  // Fetch all user_cards with bonus_earned = true, joined with cards for point value
  const { data: earnedCards, error } = await db
    .from("user_cards")
    .select("user_id, annual_fee, card_id, cards(welcome_bonus_points)")
    .eq("bonus_earned", true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate per user: total AUD value (using 0.01 AUD per point baseline) and card count
  const userStats = new Map<string, { totalAud: number; cardsCount: number }>()

  for (const card of earnedCards ?? []) {
    const uid = card.user_id
    const cardData = card.cards as { welcome_bonus_points: number | null } | null
    const bonusPoints = cardData?.welcome_bonus_points ?? 0
    const bonusAud = bonusPoints * 0.01
    const fee = card.annual_fee ?? 0
    const netAud = bonusAud - fee

    if (!userStats.has(uid)) {
      userStats.set(uid, { totalAud: 0, cardsCount: 0 })
    }
    const stats = userStats.get(uid)!
    stats.totalAud += netAud
    stats.cardsCount += 1
  }

  // Sort by net AUD descending, take top 100
  const sorted = Array.from(userStats.entries())
    .sort(([, a], [, b]) => b.totalAud - a.totalAud)
    .slice(0, 100)

  // Build leaderboard rows — user_id is NEVER stored, only SHA-256 hash
  const rows = sorted.map(([userId, stats], index) => ({
    rank: index + 1,
    user_hash: hashUserId(userId),
    total_aud_earned: Math.round(stats.totalAud * 100) / 100,
    cards_churned: stats.cardsCount,
    updated_at: new Date().toISOString(),
  }))

  // Replace entire leaderboard_cache
  await db.from("leaderboard_cache").delete().neq("rank", 0)

  if (rows.length > 0) {
    const { error: insertError } = await db.from("leaderboard_cache").insert(rows)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, count: rows.length })
}
