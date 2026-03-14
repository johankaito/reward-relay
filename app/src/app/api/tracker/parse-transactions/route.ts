import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

  let messageContent: Anthropic.MessageParam["content"]

  if (isPDF) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    messageContent = [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      } as Anthropic.DocumentBlockParam,
      {
        type: "text",
        text: `Extract all transactions from this bank statement PDF. Return ONLY a JSON array with no markdown, no explanation — just the raw JSON array. Each item must have: { "date": "YYYY-MM-DD", "merchant": "string", "amount": number (positive, in AUD) }. Skip balance rows, fees summaries, and opening/closing balances. Only include individual purchase transactions.`,
      },
    ]
  } else {
    const text = await file.text()
    messageContent = [
      {
        type: "text",
        text: `Extract all transactions from this bank statement file (CSV/OFX/QIF format). Return ONLY a JSON array with no markdown, no explanation — just the raw JSON array. Each item must have: { "date": "YYYY-MM-DD", "merchant": "string", "amount": number (positive, in AUD) }. Skip balance rows, fees summaries, and opening/closing balances. Only include individual purchase transactions.\n\nFile contents:\n${text}`,
      },
    ]
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: messageContent }],
    })

    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    // Extract JSON array from response (strip any accidental markdown)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "No transactions found in file" }, { status: 422 })
    }

    const transactions = JSON.parse(jsonMatch[0]) as Array<{
      date: string
      merchant: string
      amount: number
    }>

    return NextResponse.json({ transactions })
  } catch (err: unknown) {
    console.error("Parse error:", err)
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 })
  }
}
