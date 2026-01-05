#!/usr/bin/env node

/**
 * Check for and send churning notifications
 * Runs daily via GitHub Actions to send:
 * 1. Cancellation reminders (30 days before optimal cancellation date)
 * 2. Eligibility alerts (when user becomes eligible for high-value cards)
 */

import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import type { Database } from "../src/types/database.types"

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
  console.error("Missing required environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY")
  process.exit(1)
}

// Initialize clients
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

// Calculate days since a date
function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

// Calculate months since a date
function monthsSince(date: string | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30))
}

// Format date for display
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

// Send cancellation reminder email
async function sendCancellationReminder(
  userEmail: string,
  card: UserCard
): Promise<void> {
  const approvalDays = daysSince(card.approval_date)
  const optimalCancellationDate = card.approval_date
    ? new Date(new Date(card.approval_date).getTime() + 11 * 30 * 24 * 60 * 60 * 1000)
    : null

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
    .card-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
    .highlight { color: #667eea; font-weight: 600; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Time to Cancel Your Card</h1>
      <p>It's almost time to churn your card and avoid the next annual fee!</p>
    </div>

    <div class="content">
      <p class="card-name">${card.bank} - ${card.name}</p>

      <p>Your card is approaching the <span class="highlight">11-month mark</span> (approved ${approvalDays} days ago). This is the optimal time to cancel to:</p>

      <ul>
        <li>Avoid the second annual fee</li>
        <li>Maximize the value from your welcome bonus</li>
        <li>Start the cooling-off period for your next churn</li>
      </ul>

      <p><strong>Optimal Cancellation Date:</strong> ${optimalCancellationDate ? formatDate(optimalCancellationDate.toISOString()) : "Unknown"}</p>

      <p><strong>Annual Fee:</strong> ${card.annual_fee ? `$${card.annual_fee}` : "Unknown"}</p>

      <p><strong>Pro Tips:</strong></p>
      <ul>
        <li>Ensure all points have been posted before cancelling</li>
        <li>Transfer/redeem points before cancellation if they expire</li>
        <li>Cancel at least a few weeks before the anniversary date</li>
      </ul>

      <a href="${SUPABASE_URL.replace("supabase.co", "rewardrelay.app")}/cards" class="cta">View Card Details</a>
    </div>

    <div class="footer">
      <p>Reward Relay - Your Australian Churning Companion</p>
      <p>You're receiving this because you've opted into cancellation reminders.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const { error } = await resend.emails.send({
    from: "Reward Relay <notifications@rewardrelay.app>",
    to: userEmail,
    subject: `⏰ Time to cancel: ${card.bank} - ${card.name}`,
    html
  })

  if (error) {
    console.error(`Failed to send cancellation reminder for card ${card.id}:`, error)
    throw error
  }

  console.log(`✅ Sent cancellation reminder for ${card.bank} - ${card.name} to ${userEmail}`)
}

// Send eligibility alert email
async function sendEligibilityAlert(
  userEmail: string,
  userCards: UserCard[],
  eligibleCards: CatalogCard[]
): Promise<void> {
  const topCards = eligibleCards.slice(0, 3) // Show top 3 eligible cards

  const cardsHtml = topCards
    .map(
      (card) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 15px 0;">
      <h3 style="margin: 0 0 10px 0; color: #667eea;">${card.bank} - ${card.name}</h3>
      <p style="margin: 5px 0;"><strong>Welcome Bonus:</strong> ${card.welcome_bonus_points?.toLocaleString() || 0} points</p>
      <p style="margin: 5px 0;"><strong>Annual Fee:</strong> $${card.annual_fee || 0}</p>
      ${card.bonus_spend_requirement ? `<p style="margin: 5px 0;"><strong>Spend Requirement:</strong> $${card.bonus_spend_requirement.toLocaleString()} in ${card.bonus_spend_window_months || 3} months</p>` : ""}
      ${card.application_link ? `<a href="${card.application_link}" style="display: inline-block; background: #667eea; color: white; padding: 8px 20px; border-radius: 15px; text-decoration: none; margin-top: 10px;">View Card Details</a>` : ""}
    </div>
  `
    )
    .join("")

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
    .highlight { color: #667eea; font-weight: 600; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You're Eligible for New Cards!</h1>
      <p>The cooling-off period has passed and you can churn again!</p>
    </div>

    <div class="content">
      <p>Great news! You're now eligible to apply for <span class="highlight">${eligibleCards.length} high-value cards</span> that you've previously churned.</p>

      <h2>Top Opportunities:</h2>
      ${cardsHtml}

      <p><strong>Remember:</strong></p>
      <ul>
        <li>Space applications 6 months apart for best approval odds</li>
        <li>AMEX requires 18 months cooling-off, others 12 months</li>
        <li>Track your applications in Reward Relay</li>
      </ul>

      <a href="${SUPABASE_URL.replace("supabase.co", "rewardrelay.app")}/recommendations" class="cta">View All Recommendations</a>
    </div>

    <div class="footer">
      <p>Reward Relay - Your Australian Churning Companion</p>
      <p>You're receiving this because you've opted into eligibility alerts.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const { error } = await resend.emails.send({
    from: "Reward Relay <notifications@rewardrelay.app>",
    to: userEmail,
    subject: `🎉 You're eligible for ${eligibleCards.length} new cards!`,
    html
  })

  if (error) {
    console.error(`Failed to send eligibility alert to ${userEmail}:`, error)
    throw error
  }

  console.log(`✅ Sent eligibility alert to ${userEmail} for ${eligibleCards.length} cards`)
}

// Main function
async function main() {
  console.log("🔍 Checking for notifications...")

  // Get all users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("Failed to fetch users:", authError)
    process.exit(1)
  }

  console.log(`Found ${authUsers.users.length} users`)

  // Load catalog cards for eligibility checks
  const { data: catalogCards, error: catalogError } = await supabase
    .from("cards")
    .select("*")
    .eq("is_active", true)

  if (catalogError) {
    console.error("Failed to load catalog:", catalogError)
    process.exit(1)
  }

  let cancellationReminders = 0
  let eligibilityAlerts = 0

  // Process each user
  for (const user of authUsers.users) {
    const userEmail = user.email!
    console.log(`\nProcessing user: ${userEmail}`)

    // Get user's cards
    const { data: userCards, error: cardsError } = await supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", user.id)

    if (cardsError) {
      console.error(`Failed to load cards for ${userEmail}:`, cardsError)
      continue
    }

    // Check for cancellation reminders (10-11 months after approval, still active)
    const cardsNeedingCancellation = userCards.filter((card) => {
      if (card.status !== "active") return false
      const days = daysSince(card.approval_date)
      if (!days) return false
      // Remind at 305-335 days (10-11 months, 30-day window)
      return days >= 305 && days <= 335
    })

    for (const card of cardsNeedingCancellation) {
      try {
        await sendCancellationReminder(userEmail, card)
        cancellationReminders++
      } catch (error) {
        console.error(`Failed to send cancellation reminder for card ${card.id}`)
      }
    }

    // Check for eligibility alerts (12+ months after cancellation)
    const cancelledCards = userCards.filter(card => card.status === "cancelled")
    const banksCoolingOff = new Set(
      cancelledCards
        .filter(card => {
          const months = monthsSince(card.cancellation_date)
          return months !== null && months < 12
        })
        .map(card => card.bank)
    )

    const eligibleCards = (catalogCards || []).filter((catalogCard) => {
      // Skip if bank is in cooling-off period
      if (banksCoolingOff.has(catalogCard.bank)) return false

      // Check if user has churned this bank before and is now eligible
      const previousChurns = cancelledCards.filter(uc => uc.bank === catalogCard.bank)
      if (previousChurns.length === 0) return false

      // Find most recent cancellation
      const mostRecent = previousChurns.reduce((latest, card) => {
        if (!latest.cancellation_date) return card
        if (!card.cancellation_date) return latest
        return new Date(card.cancellation_date) > new Date(latest.cancellation_date) ? card : latest
      })

      const months = monthsSince(mostRecent.cancellation_date)
      // Eligible if 12+ months and high value (welcome bonus > 50k points)
      return months !== null && months >= 12 && (catalogCard.welcome_bonus_points || 0) >= 50000
    })

    // Only send eligibility alert if there are high-value cards (avoid spam)
    if (eligibleCards.length >= 3) {
      try {
        await sendEligibilityAlert(userEmail, userCards, eligibleCards)
        eligibilityAlerts++
      } catch (error) {
        console.error(`Failed to send eligibility alert to ${userEmail}`)
      }
    }
  }

  console.log("\n✅ Notification check complete!")
  console.log(`Cancellation reminders sent: ${cancellationReminders}`)
  console.log(`Eligibility alerts sent: ${eligibilityAlerts}`)
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
