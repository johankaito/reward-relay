import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { XMLParser } from "fast-xml-parser"
import type { Database } from "@/types/database.types"
import { extractIssuer, extractNetwork, extractExpiry } from "@/lib/dealEnrichment"

export const dynamic = "force-dynamic"

const POINT_HACKS_RSS = "https://www.pointhacks.com.au/feed/"
const CREDIT_CARD_KEYWORDS = [
  "credit card",
  "bonus points",
  "welcome bonus",
  "sign-up bonus",
  "annual fee waived",
  "qantas points",
  "velocity points",
]

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let xml: string
  try {
    const response = await fetch(POINT_HACKS_RSS, {
      headers: { "User-Agent": "RewardRelay/1.0" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Feed returned ${response.status}` },
        { status: 502 }
      )
    }
    xml = await response.text()
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 })
  }

  let items: Record<string, unknown>[]
  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const feed = parser.parse(xml)
    items = feed?.rss?.channel?.item ?? []
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `XML parse failed: ${String(err)}` },
      { status: 500 }
    )
  }

  const supabase = getServiceClient()
  let inserted = 0
  let skipped = 0
  let signalled = 0
  let unmatchedStored = 0
  const errors: { title: string; error: string }[] = []

  for (const item of items) {
    const title = (item.title as string) ?? ""
    const description = (item.description as string) ?? ""
    const combined = `${title} ${description}`.toLowerCase()

    const isRelevant = CREDIT_CARD_KEYWORDS.some((kw) => combined.includes(kw))
    if (!isRelevant) continue

    const specific_issuer = extractIssuer(title)
    const card_network = extractNetwork(title)
    const valid_until = extractExpiry(description)

    const { error } = await supabase.from("deals").upsert(
      {
        title: title.slice(0, 255),
        description: description.slice(0, 1000),
        merchant: specific_issuer ?? "Various",
        deal_url: (item.link as string) ?? "",
        source: "pointhacks",
        source_url: (item.link as string) ?? "",
        specific_issuer,
        card_network,
        valid_from: new Date((item.pubDate as string) ?? Date.now()).toISOString(),
        valid_until:
          valid_until ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      },
      { onConflict: "source_url" }
    )

    if (error) {
      errors.push({ title: title.slice(0, 100), error: error.message })
      skipped++
      continue
    }
    inserted++

    // If we identified an issuer, attempt to match and signal a re-extraction
    if (specific_issuer) {
      const { data: matchedCards } = await supabase
        .from("cards")
        .select("id, name, bank")
        .ilike("bank", `%${specific_issuer}%`)
        .eq("is_active", true)
        .limit(5)

      if (matchedCards && matchedCards.length > 0) {
        // Flag matched cards: PointHacks published new deal content — re-verify bonus accuracy
        const cardIds = matchedCards.map((c) => c.id)
        await supabase
          .from("cards")
          .update({ needs_verification: true, verification_priority: "high" })
          .in("id", cardIds)
        signalled += cardIds.length
      } else {
        // No matched card — store for admin review
        await supabase.from("unmatched_deals").insert({
          source: "pointhacks",
          raw_title: title.slice(0, 255),
          extracted_issuer: specific_issuer,
          extracted_card_name: null,
          bonus_points: null,
          source_url: (item.link as string) ?? null,
        })
        unmatchedStored++
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    inserted,
    skipped,
    signalled,
    unmatchedStored,
    errors,
  })
}
