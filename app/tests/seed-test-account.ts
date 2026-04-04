/**
 * Seed test account with realistic multi-bank data for visual QA screenshots.
 * Run: npx tsx tests/seed-test-account.ts
 */
import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Load .env.local manually without dotenv
const envPath = path.join(__dirname, "../.env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const TEST_EMAIL = process.env.TEST_EMAIL!

async function main() {
  // 1. Get test user ID
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) throw userErr
  const user = users.users.find((u) => u.email === TEST_EMAIL)
  if (!user) throw new Error(`Test user not found: ${TEST_EMAIL}`)
  const userId = user.id
  console.log(`✓ Test user: ${TEST_EMAIL} (${userId})`)

  // 2. Get card catalog IDs to link to
  const { data: catalog } = await supabase.from("cards").select("id, bank, name, welcome_bonus_points, points_currency, annual_fee").limit(50)
  const findCard = (bank: string, partial: string) =>
    catalog?.find((c) => c.bank?.toLowerCase().includes(bank.toLowerCase()) && c.name?.toLowerCase().includes(partial.toLowerCase()))

  // 3. Clear existing test data
  await supabase.from("user_cards").delete().eq("user_id", userId)
  console.log("✓ Cleared existing user_cards")

  // 4. Seed active cards (multi-bank, for cards page visual)
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split("T")[0]

  const activeCards = [
    { bank: "Amex", name: "Amex Platinum", annual_fee: 1450, status: "active", application_date: daysAgo(400), approval_date: daysAgo(390), bonus_earned: false, current_spend: 3200, is_business: false },
    { bank: "CommBank", name: "CBA Ultimate Awards", annual_fee: 419, status: "active", application_date: daysAgo(300), approval_date: daysAgo(295), bonus_earned: false, current_spend: 1800, is_business: false },
    { bank: "ANZ", name: "ANZ Rewards Black", annual_fee: 375, status: "active", application_date: daysAgo(200), approval_date: daysAgo(195), bonus_earned: false, current_spend: 4250, is_business: false },
    { bank: "Westpac", name: "Westpac Altitude Black", annual_fee: 250, status: "active", application_date: daysAgo(150), approval_date: daysAgo(145), bonus_earned: false, current_spend: 2100, is_business: false },
    { bank: "NAB", name: "NAB Rewards Platinum", annual_fee: 195, status: "active", application_date: daysAgo(100), approval_date: daysAgo(97), bonus_earned: false, current_spend: 900, is_business: false },
    { bank: "HSBC", name: "HSBC Premier World Mastercard", annual_fee: 0, status: "active", application_date: daysAgo(60), approval_date: daysAgo(57), bonus_earned: false, current_spend: 400, is_business: false },
    { bank: "Bendigo Bank", name: "Bendigo Bank Qantas Platinum", annual_fee: 149, status: "active", application_date: daysAgo(30), approval_date: daysAgo(28), bonus_earned: false, current_spend: 1200, is_business: false },
  ]

  // 5. Seed earned cards (for profit page — bonus_earned = true)
  const earnedCards = [
    // FY2024/25
    { bank: "Amex", name: "Amex Explorer", annual_fee: 395, status: "cancelled", application_date: daysAgo(730), approval_date: daysAgo(720), bonus_earned: true, bonus_earned_at: daysAgo(690), bonus_spend_deadline: daysAgo(600), current_spend: 3000, is_business: false },
    { bank: "CommBank", name: "CBA Awards", annual_fee: 319, status: "cancelled", application_date: daysAgo(680), approval_date: daysAgo(675), bonus_earned: true, bonus_earned_at: daysAgo(640), bonus_spend_deadline: daysAgo(580), current_spend: 3000, is_business: false },
    { bank: "ANZ", name: "ANZ Frequent Flyer Black", annual_fee: 425, status: "cancelled", application_date: daysAgo(620), approval_date: daysAgo(615), bonus_earned: true, bonus_earned_at: daysAgo(575), bonus_spend_deadline: daysAgo(525), current_spend: 5000, is_business: false },
    { bank: "Westpac", name: "Westpac Altitude Qantas Black", annual_fee: 299, status: "cancelled", application_date: daysAgo(560), approval_date: daysAgo(555), bonus_earned: true, bonus_earned_at: daysAgo(515), bonus_spend_deadline: daysAgo(470), current_spend: 3000, is_business: false },
    // FY2025/26
    { bank: "NAB", name: "NAB Qantas Rewards Signature", annual_fee: 395, status: "cancelled", application_date: daysAgo(400), approval_date: daysAgo(395), bonus_earned: true, bonus_earned_at: daysAgo(355), bonus_spend_deadline: daysAgo(305), current_spend: 3000, is_business: false },
    { bank: "Bendigo Bank", name: "Bendigo Bank Qantas Platinum", annual_fee: 149, status: "cancelled", application_date: daysAgo(300), approval_date: daysAgo(295), bonus_earned: true, bonus_earned_at: daysAgo(255), bonus_spend_deadline: daysAgo(205), current_spend: 2000, is_business: false },
    { bank: "Amex", name: "Amex Qantas Ultimate", annual_fee: 450, status: "cancelled", application_date: daysAgo(200), approval_date: daysAgo(195), bonus_earned: true, bonus_earned_at: daysAgo(155), bonus_spend_deadline: daysAgo(105), current_spend: 3000, is_business: false },
    { bank: "CommBank", name: "CBA Smart Awards", annual_fee: 0, status: "cancelled", application_date: daysAgo(120), approval_date: daysAgo(115), bonus_earned: true, bonus_earned_at: daysAgo(75), bonus_spend_deadline: daysAgo(25), current_spend: 4000, is_business: false },
  ]

  // Find catalog card IDs to link welcome_bonus_points
  const cardBonusMap: Record<string, { card_id: string | null; welcome_bonus_points: number; points_currency: string }> = {
    "Amex Explorer": { card_id: null, welcome_bonus_points: 100000, points_currency: "MR" },
    "CBA Awards": { card_id: null, welcome_bonus_points: 100000, points_currency: "CBA Awards" },
    "ANZ Frequent Flyer Black": { card_id: null, welcome_bonus_points: 130000, points_currency: "Qantas" },
    "Westpac Altitude Qantas Black": { card_id: null, welcome_bonus_points: 120000, points_currency: "Qantas" },
    "NAB Qantas Rewards Signature": { card_id: null, welcome_bonus_points: 100000, points_currency: "Qantas" },
    "Bendigo Bank Qantas Platinum": { card_id: null, welcome_bonus_points: 70000, points_currency: "Qantas" },
    "Amex Qantas Ultimate": { card_id: null, welcome_bonus_points: 120000, points_currency: "Qantas" },
    "CBA Smart Awards": { card_id: null, welcome_bonus_points: 100000, points_currency: "CBA Awards" },
  }

  // Try to find matching catalog entries
  if (catalog) {
    for (const [cardName, info] of Object.entries(cardBonusMap)) {
      const match = catalog.find((c) => c.name?.toLowerCase().includes(cardName.toLowerCase().split(" ").pop()!))
      if (match) info.card_id = match.id
    }
  }

  const allCards = [
    ...activeCards.map((c) => ({ ...c, user_id: userId, alert_enabled: true })),
    ...earnedCards.map((c) => {
      const bonus = cardBonusMap[c.name]
      return {
        ...c,
        user_id: userId,
        alert_enabled: false,
        card_id: bonus?.card_id ?? null,
      }
    }),
  ]

  const { error: insertErr } = await supabase.from("user_cards").insert(allCards)
  if (insertErr) throw insertErr

  console.log(`✓ Inserted ${activeCards.length} active cards + ${earnedCards.length} earned cards`)

  // 6. Seed some spending transactions
  await supabase.from("spending_transactions").delete().eq("user_id", userId)
  const merchants = ["Woolworths", "Coles", "Shell", "JB Hi-Fi", "Qantas", "Virgin Australia", "Amazon", "Netflix", "Uber Eats", "Dan Murphy's"]
  const categories = ["Groceries", "Fuel", "Electronics", "Travel", "Streaming", "Food Delivery", "Liquor"]
  const transactions = Array.from({ length: 40 }, (_, i) => ({
    user_id: userId,
    date: daysAgo(Math.floor(Math.random() * 90)),
    merchant: merchants[i % merchants.length],
    amount: Math.round((Math.random() * 300 + 10) * 100) / 100,
    category: categories[i % categories.length],
  }))
  await supabase.from("spending_transactions").insert(transactions)
  console.log(`✓ Inserted ${transactions.length} spending transactions`)

  console.log("\n✅ Test account seeded successfully")
  console.log(`   Active cards: ${activeCards.length} (Amex, CBA, ANZ, Westpac, NAB, HSBC, Bendigo)`)
  console.log(`   Earned cards: ${earnedCards.length} (profit page data)`)
  console.log(`   Transactions: ${transactions.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
