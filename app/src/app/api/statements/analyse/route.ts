import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VALID_CATEGORIES = ["Groceries", "Dining", "Fuel", "Travel", "Other"] as const
type Category = (typeof VALID_CATEGORIES)[number]

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check Pro tier
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const isPro =
    meta.subscription_tier === "pro" ||
    meta.subscription_tier === "business" ||
    meta.is_pro === true

  if (!isPro) {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 })
  }

  const body = (await request.json()) as { descriptions: string[] }
  const { descriptions } = body

  if (!Array.isArray(descriptions) || descriptions.length === 0) {
    return NextResponse.json({ error: "No descriptions provided" }, { status: 400 })
  }

  // Batch categorize in one Claude call
  const prompt = `You are a transaction categoriser for Australian bank statements.
Categorise each of the following merchant descriptions into exactly one of: Groceries, Dining, Fuel, Travel, Other.

Descriptions (one per line, numbered):
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Return ONLY a JSON array of strings, one category per description, in the same order.
Example: ["Groceries","Dining","Other","Travel","Fuel"]
No markdown, no explanation — just the raw JSON array.`

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to categorise transactions" }, { status: 422 })
    }

    const raw = JSON.parse(jsonMatch[0]) as unknown[]
    const categories: Category[] = raw.map((c) =>
      VALID_CATEGORIES.includes(c as Category) ? (c as Category) : "Other"
    )

    return NextResponse.json({ categories })
  } catch (err) {
    console.error("Categorise error:", err)
    return NextResponse.json({ error: "Failed to categorise transactions" }, { status: 500 })
  }
}
