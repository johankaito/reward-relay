import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import type { Database } from "@/types/database.types"
import { fetchCardPageByUrl } from "@/lib/card-fetcher"

export const dynamic = "force-dynamic"
export const maxDuration = 300

type BankExclusionPeriod = Database["public"]["Tables"]["bank_exclusion_periods"]["Row"]

interface ExtractedPeriod {
  cooling_period_months: number | null
  scope: string
  exact_quote: string
}

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

async function extractCoolingPeriod(pageMarkdown: string, bankName: string): Promise<ExtractedPeriod | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Extract the welcome bonus cooling/exclusion period from these credit card terms for ${bankName}. This is the period a customer must wait after closing a card before being eligible for a new welcome bonus from the same bank.\n\nReturn ONLY valid JSON: {"cooling_period_months": number|null, "scope": "string", "exact_quote": "string"}. If unclear, return null for cooling_period_months.\n\nTerms:\n${pageMarkdown.slice(0, 8000)}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    return JSON.parse(jsonMatch[0]) as ExtractedPeriod
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: periodsToVerify } = await supabase
    .from("bank_exclusion_periods")
    .select("*")
    .not("official_tc_url", "is", null)
    .or(`last_verified_at.is.null,last_verified_at.lt.${sevenDaysAgo}`)

  if (!periodsToVerify?.length) {
    return NextResponse.json({ processed: 0, matched: 0, mismatches: [] })
  }

  let processed = 0
  let matched = 0
  const mismatches: Array<{ bank_slug: string; stored_months: number | null; extracted_months: number | null }> = []

  for (const period of periodsToVerify as BankExclusionPeriod[]) {
    if (!period.official_tc_url) continue

    try {
      const page = await fetchCardPageByUrl(period.official_tc_url, 1)
      const extracted = await extractCoolingPeriod(page.markdown, period.bank_name)

      if (!extracted) {
        processed++
        continue
      }

      const hasMismatch = extracted.cooling_period_months !== period.exclusion_months

      if (hasMismatch) {
        mismatches.push({
          bank_slug: period.bank_slug,
          stored_months: period.exclusion_months,
          extracted_months: extracted.cooling_period_months,
        })

        await supabase
          .from("bank_exclusion_periods")
          .update({
            tc_exact_quote: extracted.exact_quote,
            verified_by: "automated",
            last_verified_at: new Date().toISOString(),
          })
          .eq("id", period.id)
      } else {
        matched++
        await supabase
          .from("bank_exclusion_periods")
          .update({
            tc_exact_quote: extracted.exact_quote,
            verified_by: "automated",
            last_verified_at: new Date().toISOString(),
          })
          .eq("id", period.id)
      }

      processed++
    } catch (err) {
      console.error(`tc-verify: failed for ${period.bank_slug}:`, err)
      processed++
    }
  }

  return NextResponse.json({ processed, matched, mismatches })
}
