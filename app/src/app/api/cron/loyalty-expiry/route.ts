import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { addDays, format } from "date-fns"
import { resend, FROM_EMAIL, APP_URL } from "@/lib/email/client"
import type { Database } from "@/types/database.types"

export const dynamic = "force-dynamic"

const PROGRAM_NAMES: Record<string, string> = {
  qff:      "Qantas Frequent Flyer",
  velocity: "Velocity",
  amex_mr:  "Amex MR",
}

interface ExpiryAlertParams {
  to: string
  programName: string
  balance: number
  expiryDate: string
  daysRemaining: number
}

function getExpiryAlertEmail(params: ExpiryAlertParams) {
  const { programName, balance, expiryDate, daysRemaining } = params
  const subject = `Your ${programName} points expire in ${daysRemaining} days`
  const body = `You have ${balance.toLocaleString()} ${programName} points expiring on ${expiryDate}. Log in to Reward Relay to check your redemption options before they expire.`

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Points Expiry Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Points Expiry Alert</h1>
          </div>

          <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #92400e;">${programName} points expiring in ${daysRemaining} days</h2>
            <p style="font-size: 16px;">${body}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
          </div>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p>This alert was sent by Reward Relay to help you make the most of your points before they expire.</p>
          </div>
        </body>
      </html>
    `,
    text: body,
  }
}

async function sendExpiryAlert(params: ExpiryAlertParams) {
  const email = getExpiryAlertEmail(params)
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const today = new Date()
  const targetDays = [60, 30, 7]
  let alertsSent = 0

  for (const days of targetDays) {
    const targetDate = format(addDays(today, days), "yyyy-MM-dd")

    const { data: expiringBalances, error } = await supabase
      .from("loyalty_balances")
      .select("*")
      .eq("expiry_date", targetDate)
      .gt("balance", 0)

    if (error) {
      console.error(`Error fetching balances for ${days}-day window:`, error)
      continue
    }

    for (const balance of expiringBalances ?? []) {
      const { data: userData } = await supabase.auth.admin.getUserById(balance.user_id)
      const userEmail = userData?.user?.email
      if (!userEmail) continue

      const programName = PROGRAM_NAMES[balance.program] ?? balance.program

      try {
        await sendExpiryAlert({
          to: userEmail,
          programName,
          balance: balance.balance,
          expiryDate: balance.expiry_date!,
          daysRemaining: days,
        })
        alertsSent++
      } catch (err) {
        console.error(`Failed to send expiry alert for user ${balance.user_id}:`, err)
      }
    }
  }

  return NextResponse.json({ ok: true, alertsSent })
}
