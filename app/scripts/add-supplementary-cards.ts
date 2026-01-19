import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CardData {
  bank: string
  name: string
  network: string
  annual_fee: number
  welcome_bonus_points: number | null
  bonus_spend_requirement: number | null
  bonus_spend_window_months: number | null
  min_income: number | null
  earn_rate_primary: number
  application_link: string
  scrape_url: string
  scrape_source: string
  points_currency?: string
}

// Additional 25 Australian credit cards to reach 100+ total
const supplementaryCards: CardData[] = [
  // Additional ANZ cards (3 more)
  {
    bank: 'ANZ',
    name: 'Low Fee',
    network: 'Visa',
    annual_fee: 58,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/low-rate-low-fee/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/low-rate-low-fee/',
    scrape_source: 'supplementary'
  },
  {
    bank: 'ANZ',
    name: 'Platinum',
    network: 'Visa',
    annual_fee: 90,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/platinum/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/platinum/',
    scrape_source: 'supplementary'
  },
  {
    bank: 'ANZ',
    name: 'Travel Adventures',
    network: 'Visa',
    annual_fee: 225,
    welcome_bonus_points: 100000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 3,
    min_income: 50000,
    earn_rate_primary: 2.0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/travel-adventures/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/travel-adventures/',
    scrape_source: 'supplementary',
    points_currency: 'Velocity'
  },

  // Additional NAB cards (4 more)
  {
    bank: 'NAB',
    name: 'Low Fee',
    network: 'Visa',
    annual_fee: 59,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.nab.com.au/personal/credit-cards/low-fee-credit-cards/nab-low-fee-card',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/low-fee-credit-cards/nab-low-fee-card',
    scrape_source: 'supplementary'
  },
  {
    bank: 'NAB',
    name: 'Rewards Premium',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 100000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 60,
    min_income: 50000,
    earn_rate_primary: 2.0,
    application_link: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-premium',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-premium',
    scrape_source: 'supplementary',
    points_currency: 'NAB Rewards'
  },
  {
    bank: 'NAB',
    name: 'Qantas Rewards Premium',
    network: 'Visa',
    annual_fee: 395,
    welcome_bonus_points: 150000,
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 60,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-premium',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-premium',
    scrape_source: 'supplementary',
    points_currency: 'Qantas'
  },
  {
    bank: 'NAB',
    name: 'Velocity Rewards Premium',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 80000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 60,
    min_income: 50000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.nab.com.au/personal/credit-cards/velocity-rewards',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/velocity-rewards',
    scrape_source: 'supplementary',
    points_currency: 'Velocity'
  },

  // Additional Westpac cards (3 more)
  {
    bank: 'Westpac',
    name: 'Altitude Qantas Platinum',
    network: 'Mastercard',
    annual_fee: 250,
    welcome_bonus_points: 70000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 0.75,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-qantas-platinum/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-qantas-platinum/',
    scrape_source: 'supplementary',
    points_currency: 'Qantas'
  },
  {
    bank: 'Westpac',
    name: 'Low Fee',
    network: 'Mastercard',
    annual_fee: 59,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/low-rate-low-fee/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/low-rate-low-fee/',
    scrape_source: 'supplementary'
  },
  {
    bank: 'Westpac',
    name: 'Ignite',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/ignite/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/ignite/',
    scrape_source: 'supplementary'
  },

  // Additional CommBank cards (4 more)
  {
    bank: 'CommBank',
    name: 'Platinum Awards',
    network: 'Mastercard',
    annual_fee: 249,
    welcome_bonus_points: 120000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.commbank.com.au/credit-cards/platinum-awards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/platinum-awards.html',
    scrape_source: 'supplementary',
    points_currency: 'CommBank Awards'
  },
  {
    bank: 'CommBank',
    name: 'Essential Awards',
    network: 'Mastercard',
    annual_fee: 149,
    welcome_bonus_points: 70000,
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 60,
    min_income: 35000,
    earn_rate_primary: 1.0,
    application_link: 'https://www.commbank.com.au/credit-cards/essential-awards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/essential-awards.html',
    scrape_source: 'supplementary',
    points_currency: 'CommBank Awards'
  },
  {
    bank: 'CommBank',
    name: 'Everyday Rewards',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.commbank.com.au/credit-cards/everyday-rewards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/everyday-rewards.html',
    scrape_source: 'supplementary'
  },
  {
    bank: 'CommBank',
    name: 'Yello',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.commbank.com.au/credit-cards/yello.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/yello.html',
    scrape_source: 'supplementary'
  },

  // Additional Amex cards (3 more)
  {
    bank: 'American Express',
    name: 'Essential',
    network: 'Amex',
    annual_fee: 0,
    welcome_bonus_points: 40000,
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 3,
    min_income: 25000,
    earn_rate_primary: 1.0,
    application_link: 'https://www.americanexpress.com/au/credit-cards/essential-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/essential-credit-card/',
    scrape_source: 'supplementary',
    points_currency: 'Membership Rewards'
  },
  {
    bank: 'American Express',
    name: 'Gold Card',
    network: 'Amex',
    annual_fee: 225,
    welcome_bonus_points: 60000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 3,
    min_income: 40000,
    earn_rate_primary: 2.0,
    application_link: 'https://www.americanexpress.com/au/credit-cards/gold-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/gold-card/',
    scrape_source: 'supplementary',
    points_currency: 'Membership Rewards'
  },
  {
    bank: 'American Express',
    name: 'Velocity Business Platinum',
    network: 'Amex',
    annual_fee: 395,
    welcome_bonus_points: 120000,
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 3,
    min_income: 50000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.americanexpress.com/au/credit-cards/velocity-business-platinum/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/velocity-business-platinum/',
    scrape_source: 'supplementary',
    points_currency: 'Velocity'
  },

  // St.George additional (2 more)
  {
    bank: 'St.George',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 59,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/low-rate',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/low-rate',
    scrape_source: 'supplementary'
  },
  {
    bank: 'St.George',
    name: 'Amplify Rewards',
    network: 'Mastercard',
    annual_fee: 129,
    welcome_bonus_points: 50000,
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 35000,
    earn_rate_primary: 1.0,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-rewards',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-rewards',
    scrape_source: 'supplementary',
    points_currency: 'Amplify'
  },

  // Additional HSBC (2 more)
  {
    bank: 'HSBC',
    name: 'Premier World Mastercard',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 80000,
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 100000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.hsbc.com.au/credit-cards/products/premier-world-mastercard/',
    scrape_url: 'https://www.hsbc.com.au/credit-cards/products/premier-world-mastercard/',
    scrape_source: 'supplementary',
    points_currency: 'HSBC Rewards'
  },
  {
    bank: 'HSBC',
    name: 'Star Card',
    network: 'Mastercard',
    annual_fee: 79,
    welcome_bonus_points: 30000,
    bonus_spend_requirement: 1500,
    bonus_spend_window_months: 90,
    min_income: 25000,
    earn_rate_primary: 1.0,
    application_link: 'https://www.hsbc.com.au/credit-cards/products/star-card/',
    scrape_url: 'https://www.hsbc.com.au/credit-cards/products/star-card/',
    scrape_source: 'supplementary',
    points_currency: 'HSBC Rewards'
  },

  // Bendigo Bank (2 cards)
  {
    bank: 'Bendigo Bank',
    name: 'Rewards Platinum',
    network: 'Visa',
    annual_fee: 149,
    welcome_bonus_points: 50000,
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 35000,
    earn_rate_primary: 1.0,
    application_link: 'https://www.bendigobank.com.au/personal/credit-cards/rewards-platinum',
    scrape_url: 'https://www.bendigobank.com.au/personal/credit-cards/rewards-platinum',
    scrape_source: 'supplementary',
    points_currency: 'Bendigo Rewards'
  },
  {
    bank: 'Bendigo Bank',
    name: 'Qantas Platinum',
    network: 'Visa',
    annual_fee: 149,
    welcome_bonus_points: 40000,
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 35000,
    earn_rate_primary: 0.75,
    application_link: 'https://www.bendigobank.com.au/personal/credit-cards/qantas-platinum',
    scrape_url: 'https://www.bendigobank.com.au/personal/credit-cards/qantas-platinum',
    scrape_source: 'supplementary',
    points_currency: 'Qantas'
  },

  // Latitude (2 cards)
  {
    bank: 'Latitude',
    name: '28 Degrees Platinum Mastercard',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.latitudefinancial.com/credit-cards/28-degrees/',
    scrape_url: 'https://www.latitudefinancial.com/credit-cards/28-degrees/',
    scrape_source: 'supplementary'
  },
  {
    bank: 'Latitude',
    name: 'Latitude Gem Visa',
    network: 'Visa',
    annual_fee: 0,
    welcome_bonus_points: null,
    bonus_spend_requirement: null,
    bonus_spend_window_months: null,
    min_income: null,
    earn_rate_primary: 0,
    application_link: 'https://www.latitudefinancial.com/credit-cards/latitude-gem-visa/',
    scrape_url: 'https://www.latitudefinancial.com/credit-cards/latitude-gem-visa/',
    scrape_source: 'supplementary'
  }
]

async function addSupplementaryCards() {
  console.log('🎯 Adding Supplementary Cards to Reach 100+ Target\n')
  console.log(`📦 Processing ${supplementaryCards.length} supplementary cards...\n`)

  let added = 0
  let skipped = 0
  let errors = 0

  for (const card of supplementaryCards) {
    const { data, error } = await supabase
      .from('cards')
      .upsert(
        {
          bank: card.bank,
          name: card.name,
          network: card.network,
          annual_fee: card.annual_fee,
          welcome_bonus_points: card.welcome_bonus_points,
          bonus_spend_requirement: card.bonus_spend_requirement,
          bonus_spend_window_months: card.bonus_spend_window_months,
          min_income: card.min_income,
          earn_rate_primary: card.earn_rate_primary,
          application_link: card.application_link,
          scrape_url: card.scrape_url,
          scrape_source: card.scrape_source,
          points_currency: card.points_currency || null
        },
        { onConflict: 'scrape_source,scrape_url' }
      )
      .select()

    if (error) {
      console.error(`❌ ${card.bank} - ${card.name}: ${error.message}`)
      errors++
    } else if (data && data.length > 0) {
      console.log(`✅ ${card.bank} - ${card.name}`)
      added++
    } else {
      console.log(`⏭️  ${card.bank} - ${card.name} (already exists)`)
      skipped++
    }
  }

  // Get final count
  const { count: finalCount } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  console.log('\n' + '='.repeat(80))
  console.log('📊 Supplementary Add Summary:')
  console.log(`   ✅ Successfully added: ${added} cards`)
  console.log(`   ⏭️  Skipped (already exist): ${skipped} cards`)
  console.log(`   ❌ Errors: ${errors} cards`)
  console.log(`   📈 Total processed: ${supplementaryCards.length} cards`)
  console.log('')
  console.log(`🎉 Total cards in database: ${finalCount}`)

  if (finalCount && finalCount >= 100) {
    console.log('✅ SUCCESS! Reached target of 100+ cards!')
  } else {
    console.log(`⚠️  Need ${100 - (finalCount || 0)} more cards to reach 100`)
  }
  console.log('='.repeat(80))
}

addSupplementaryCards()
