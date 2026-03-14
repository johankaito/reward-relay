import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { getEligibleDeals, type Deal } from "@/lib/deals"
import { resend, FROM_EMAIL, APP_URL } from "@/lib/email/client"

export const dynamic = "force-dynamic"

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

async function sendDealAlert({
  to,
  deals,
}: {
  to: string
  deals: Deal[]
}) {
  const subject = `🎯 ${deals.length} new deal${deals.length > 1 ? "s" : ""} you're eligible for`
  const dealListHtml = deals
    .map(
      (d) =>
        `<li><a href="${d.deal_url}" style="color:#10b981;font-weight:600;">${d.title}</a>${d.merchant && d.merchant !== "Various" ? ` — ${d.merchant}` : ""}</li>`
    )
    .join("")
  const dealListText = deals.map((d) => `- ${d.title}: ${d.deal_url}`).join("\n")

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Deals Alert</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px;border-radius:10px;text-align:center;margin-bottom:30px;">
          <h1 style="color:white;margin:0;font-size:24px;">🎯 New Deals For You</h1>
        </div>
        <p>We found <strong>${deals.length} new deal${deals.length > 1 ? "s" : ""}</strong> matching banks you&apos;re eligible for:</p>
        <ul style="padding-left:20px;line-height:2;">
          ${dealListHtml}
        </ul>
        <p style="color:#718096;font-size:13px;">These deals match banks you haven&apos;t churned in the last 12 months.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">View Dashboard</a>
        </div>
        <div style="border-top:2px solid #e2e8f0;padding-top:20px;margin-top:30px;text-align:center;color:#718096;font-size:14px;">
          <p>Sent by Reward Relay. <a href="${APP_URL}/dashboard" style="color:#10b981;">Manage preferences</a></p>
        </div>
      </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text: `New deals you're eligible for:\n\n${dealListText}\n\nThese deals match banks you haven't churned in the last 12 months.\n\n${APP_URL}/dashboard`,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: newDeals } = await supabase
    .from("deals")
    .select("*")
    .eq("is_active", true)
    .gte("created_at", yesterday)

  if (!newDeals?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Query pro/trialing subscribers; fall back to all users if table unavailable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proUsers } = await (supabase as any)
    .from("stripe_subscriptions")
    .select("user_id")
    .in("status", ["active", "trialing"])

  // Fall back to all user_profiles if stripe_subscriptions is not available
  const userList: Array<{ user_id: string }> =
    proUsers ??
    ((
      await supabase.from("user_profiles").select("user_id")
    ).data ?? [])

  let sent = 0
  for (const user of userList) {
    const eligibleDeals = await getEligibleDeals(user.user_id, supabase)
    const newEligible = eligibleDeals.filter((d) =>
      newDeals.some((nd) => nd.id === d.id)
    )

    if (newEligible.length === 0) continue

    const { data: userData } = await supabase.auth.admin.getUserById(
      user.user_id
    )
    if (!userData.user?.email) continue

    try {
      await sendDealAlert({
        to: userData.user.email,
        deals: newEligible,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send deal alert for user ${user.user_id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
