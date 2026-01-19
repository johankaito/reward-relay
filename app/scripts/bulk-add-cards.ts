#!/usr/bin/env tsx
/**
 * Bulk Add Australian Credit Cards
 * Adds 60+ cards from major Australian banks to reach 100+ total cards
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

interface CardData {
  bank: string
  name: string
  network: string
  annual_fee: number
  welcome_bonus_points: number
  bonus_spend_requirement: number
  bonus_spend_window_months: number
  min_income: number
  earn_rate_primary: number
  application_link: string
  scrape_url: string
  scrape_source: string
  points_currency?: string
}

const cards: CardData[] = [
  // ANZ Cards (8 cards)
  {
    bank: 'ANZ',
    name: 'Rewards Black',
    network: 'Visa',
    annual_fee: 425,
    welcome_bonus_points: 180000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 2.0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/rewards/black/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/rewards/black/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Frequent Flyer Black',
    network: 'Visa',
    annual_fee: 425,
    welcome_bonus_points: 130000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer/black/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer/black/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Rewards Platinum',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.anz.com.au/personal/credit-cards/rewards/platinum/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/rewards/platinum/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Frequent Flyer Platinum',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 75000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer/platinum/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer/platinum/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Low Rate',
    network: 'Visa',
    annual_fee: 58,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/low-rate/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/low-rate/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Low Rate Platinum',
    network: 'Visa',
    annual_fee: 85,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 50000,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/low-rate/platinum/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/low-rate/platinum/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'First',
    network: 'Visa',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/first/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/first/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'ANZ',
    name: 'Cashback',
    network: 'Visa',
    annual_fee: 58,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 1000,
    bonus_spend_window_months: 90,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.anz.com.au/personal/credit-cards/cashback/',
    scrape_url: 'https://www.anz.com.au/personal/credit-cards/cashback/',
    scrape_source: 'bulk-add'
  },

  // NAB Cards (7 cards)
  {
    bank: 'NAB',
    name: 'Rewards Signature',
    network: 'Visa',
    annual_fee: 395,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-signature-card',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-signature-card',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'Qantas Rewards Signature',
    network: 'Visa',
    annual_fee: 395,
    welcome_bonus_points: 90000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-signature',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-signature',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'Rewards Premium',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 60000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-premium-card',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-premium-card',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'Low Rate',
    network: 'Visa',
    annual_fee: 59,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.nab.com.au/personal/credit-cards/low-rate-credit-cards/low-rate-card',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/low-rate-credit-cards/low-rate-card',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'StraightUp',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.nab.com.au/personal/credit-cards/nab-straightup-card',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/nab-straightup-card',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'Qantas Rewards Premium',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 60000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1,
    application_link: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-premium',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-premium',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'NAB',
    name: 'Velocity Rewards',
    network: 'Visa',
    annual_fee: 295,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1,
    application_link: 'https://www.nab.com.au/personal/credit-cards/velocity-rewards',
    scrape_url: 'https://www.nab.com.au/personal/credit-cards/velocity-rewards',
    scrape_source: 'bulk-add'
  },

  // Westpac Cards (8 cards)
  {
    bank: 'Westpac',
    name: 'Altitude Black',
    network: 'Mastercard',
    annual_fee: 395,
    welcome_bonus_points: 120000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 2,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Altitude Platinum',
    network: 'Mastercard',
    annual_fee: 295,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-platinum/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-platinum/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 59,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/low-rate/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/low-rate/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: '55 Days',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/55-days/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/55-days/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Lite',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 20000,
    earn_rate_primary: 0,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/lite/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/no-annual-fee/lite/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Altitude Black Qantas',
    network: 'Mastercard',
    annual_fee: 395,
    welcome_bonus_points: 90000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/qantas/altitude-black-qantas/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/qantas/altitude-black-qantas/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Altitude Platinum Qantas',
    network: 'Mastercard',
    annual_fee: 295,
    welcome_bonus_points: 60000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/qantas/altitude-platinum-qantas/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/qantas/altitude-platinum-qantas/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Westpac',
    name: 'Altitude Go',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 5000,
    
    bonus_spend_requirement: 250,
    bonus_spend_window_months: 90,
    min_income: 30000,
    earn_rate_primary: 0.5,
    application_link: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-go/',
    scrape_url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-go/',
    scrape_source: 'bulk-add'
  },

  // CommBank Cards (7 cards)
  {
    bank: 'CommBank',
    name: 'Ultimate Awards',
    network: 'Mastercard',
    annual_fee: 425,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 2,
    application_link: 'https://www.commbank.com.au/credit-cards/ultimate-awards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/ultimate-awards.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Awards',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 30000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1,
    application_link: 'https://www.commbank.com.au/credit-cards/awards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/awards.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Low Fee',
    network: 'Mastercard',
    annual_fee: 49,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.commbank.com.au/credit-cards/low-fee.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/low-fee.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 59,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.commbank.com.au/credit-cards/low-rate.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/low-rate.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Neo',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.commbank.com.au/credit-cards/neo.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/neo.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Smart Awards',
    network: 'Mastercard',
    annual_fee: 99,
    welcome_bonus_points: 20000,
    
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 40000,
    earn_rate_primary: 0.75,
    application_link: 'https://www.commbank.com.au/credit-cards/smart-awards.html',
    scrape_url: 'https://www.commbank.com.au/credit-cards/smart-awards.html',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'CommBank',
    name: 'Business Awards',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 40000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 0,
    earn_rate_primary: 1,
    application_link: 'https://www.commbank.com.au/business/credit-cards/business-awards.html',
    scrape_url: 'https://www.commbank.com.au/business/credit-cards/business-awards.html',
    scrape_source: 'bulk-add'
  },

  // American Express Cards (12 cards)
  {
    bank: 'American Express',
    name: 'Qantas Ultimate',
    network: 'Amex',
    annual_fee: 450,
    welcome_bonus_points: 90000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1,
    application_link: 'https://www.americanexpress.com/au/credit-cards/qantas-ultimate-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/qantas-ultimate-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Qantas Premium',
    network: 'Amex',
    annual_fee: 295,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 0.75,
    application_link: 'https://www.americanexpress.com/au/credit-cards/qantas-premium-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/qantas-premium-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Explorer',
    network: 'Amex',
    annual_fee: 395,
    welcome_bonus_points: 70000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 2,
    application_link: 'https://www.americanexpress.com/au/credit-cards/explorer-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/explorer-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Platinum Charge',
    network: 'Amex',
    annual_fee: 1450,
    welcome_bonus_points: 150000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 150000,
    earn_rate_primary: 3,
    application_link: 'https://www.americanexpress.com/au/credit-cards/platinum-charge-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/platinum-charge-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Velocity Platinum',
    network: 'Amex',
    annual_fee: 375,
    welcome_bonus_points: 70000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.americanexpress.com/au/credit-cards/velocity-platinum-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/velocity-platinum-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Essential',
    network: 'Amex',
    annual_fee: 0,
    welcome_bonus_points: 15000,
    
    bonus_spend_requirement: 1000,
    bonus_spend_window_months: 90,
    min_income: 35000,
    earn_rate_primary: 1,
    application_link: 'https://www.americanexpress.com/au/credit-cards/essential-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/essential-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Platinum Edge',
    network: 'Amex',
    annual_fee: 195,
    welcome_bonus_points: 40000,
    
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 3,
    application_link: 'https://www.americanexpress.com/au/credit-cards/platinum-edge-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/platinum-edge-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'David Jones',
    network: 'Amex',
    annual_fee: 99,
    welcome_bonus_points: 10000,
    
    bonus_spend_requirement: 2000,
    bonus_spend_window_months: 90,
    min_income: 40000,
    earn_rate_primary: 1,
    application_link: 'https://www.americanexpress.com/au/credit-cards/david-jones-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/david-jones-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Velocity Escape',
    network: 'Amex',
    annual_fee: 195,
    welcome_bonus_points: 35000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 40000,
    earn_rate_primary: 1,
    application_link: 'https://www.americanexpress.com/au/credit-cards/velocity-escape-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/velocity-escape-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Business Explorer',
    network: 'Amex',
    annual_fee: 395,
    welcome_bonus_points: 80000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 0,
    earn_rate_primary: 2,
    application_link: 'https://www.americanexpress.com/au/credit-cards/business-explorer-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/business-explorer-credit-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Business Platinum',
    network: 'Amex',
    annual_fee: 1450,
    welcome_bonus_points: 150000,
    
    bonus_spend_requirement: 5000,
    bonus_spend_window_months: 90,
    min_income: 0,
    earn_rate_primary: 2.25,
    application_link: 'https://www.americanexpress.com/au/credit-cards/business-platinum-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/business-platinum-card/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'American Express',
    name: 'Velocity Business',
    network: 'Amex',
    annual_fee: 249,
    welcome_bonus_points: 200000,
    
    bonus_spend_requirement: 6000,
    bonus_spend_window_months: 90,
    min_income: 0,
    earn_rate_primary: 1,
    application_link: 'https://www.americanexpress.com/au/credit-cards/velocity-business-credit-card/',
    scrape_url: 'https://www.americanexpress.com/au/credit-cards/velocity-business-credit-card/',
    scrape_source: 'bulk-add'
  },

  // St.George Cards (4 cards)
  {
    bank: 'St.George',
    name: 'Amplify Signature',
    network: 'Mastercard',
    annual_fee: 379,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-signature',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-signature',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'St.George',
    name: 'Amplify Platinum',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-platinum',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-platinum',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'St.George',
    name: 'Vertigo',
    network: 'Visa',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/vertigo',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/vertigo',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'St.George',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 55,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.stgeorge.com.au/personal/credit-cards/low-rate',
    scrape_url: 'https://www.stgeorge.com.au/personal/credit-cards/low-rate',
    scrape_source: 'bulk-add'
  },

  // Bank of Melbourne Cards (4 cards)
  {
    bank: 'Bank of Melbourne',
    name: 'Amplify Signature',
    network: 'Mastercard',
    annual_fee: 379,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.bankofmelbourne.com.au/personal/credit-cards/amplify-signature',
    scrape_url: 'https://www.bankofmelbourne.com.au/personal/credit-cards/amplify-signature',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Bank of Melbourne',
    name: 'Amplify Platinum',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.bankofmelbourne.com.au/personal/credit-cards/amplify-platinum',
    scrape_url: 'https://www.bankofmelbourne.com.au/personal/credit-cards/amplify-platinum',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Bank of Melbourne',
    name: 'Vertigo',
    network: 'Visa',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.bankofmelbourne.com.au/personal/credit-cards/vertigo',
    scrape_url: 'https://www.bankofmelbourne.com.au/personal/credit-cards/vertigo',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Bank of Melbourne',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 55,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.bankofmelbourne.com.au/personal/credit-cards/low-rate',
    scrape_url: 'https://www.bankofmelbourne.com.au/personal/credit-cards/low-rate',
    scrape_source: 'bulk-add'
  },

  // BankSA Cards (4 cards)
  {
    bank: 'BankSA',
    name: 'Amplify Signature',
    network: 'Mastercard',
    annual_fee: 379,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.banksa.com.au/personal/credit-cards/amplify-signature',
    scrape_url: 'https://www.banksa.com.au/personal/credit-cards/amplify-signature',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'BankSA',
    name: 'Amplify Platinum',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 50000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.banksa.com.au/personal/credit-cards/amplify-platinum',
    scrape_url: 'https://www.banksa.com.au/personal/credit-cards/amplify-platinum',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'BankSA',
    name: 'Vertigo',
    network: 'Visa',
    annual_fee: 0,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 25000,
    earn_rate_primary: 0,
    application_link: 'https://www.banksa.com.au/personal/credit-cards/vertigo',
    scrape_url: 'https://www.banksa.com.au/personal/credit-cards/vertigo',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'BankSA',
    name: 'Low Rate',
    network: 'Mastercard',
    annual_fee: 55,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 0,
    bonus_spend_window_months: 0,
    min_income: 35000,
    earn_rate_primary: 0,
    application_link: 'https://www.banksa.com.au/personal/credit-cards/low-rate',
    scrape_url: 'https://www.banksa.com.au/personal/credit-cards/low-rate',
    scrape_source: 'bulk-add'
  },

  // HSBC Cards (3 cards)
  {
    bank: 'HSBC',
    name: 'Premier Qantas',
    network: 'Mastercard',
    annual_fee: 0,
    welcome_bonus_points: 100000,
    
    bonus_spend_requirement: 4000,
    bonus_spend_window_months: 90,
    min_income: 100000,
    earn_rate_primary: 1.5,
    application_link: 'https://www.hsbc.com.au/credit-cards/products/premier-qantas/',
    scrape_url: 'https://www.hsbc.com.au/credit-cards/products/premier-qantas/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'HSBC',
    name: 'Platinum Qantas',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 50000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 60000,
    earn_rate_primary: 1.25,
    application_link: 'https://www.hsbc.com.au/credit-cards/products/platinum-qantas/',
    scrape_url: 'https://www.hsbc.com.au/credit-cards/products/platinum-qantas/',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'HSBC',
    name: 'Cashback',
    network: 'Mastercard',
    annual_fee: 199,
    welcome_bonus_points: 0,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 60000,
    earn_rate_primary: 0,
    application_link: 'https://www.hsbc.com.au/credit-cards/products/cashback/',
    scrape_url: 'https://www.hsbc.com.au/credit-cards/products/cashback/',
    scrape_source: 'bulk-add'
  },

  // Qantas Money Cards (2 cards)
  {
    bank: 'Qantas Money',
    name: 'Titanium',
    network: 'Mastercard',
    annual_fee: 1200,
    welcome_bonus_points: 150000,
    
    bonus_spend_requirement: 6000,
    bonus_spend_window_months: 90,
    min_income: 200000,
    earn_rate_primary: 1.25,
    application_link: 'https://qantasmoney.com.au/credit-cards/titanium',
    scrape_url: 'https://qantasmoney.com.au/credit-cards/titanium',
    scrape_source: 'bulk-add'
  },
  {
    bank: 'Qantas Money',
    name: 'Platinum',
    network: 'Mastercard',
    annual_fee: 299,
    welcome_bonus_points: 75000,
    
    bonus_spend_requirement: 3000,
    bonus_spend_window_months: 90,
    min_income: 75000,
    earn_rate_primary: 1,
    application_link: 'https://qantasmoney.com.au/credit-cards/platinum',
    scrape_url: 'https://qantasmoney.com.au/credit-cards/platinum',
    scrape_source: 'bulk-add'
  },
]

async function addCards() {
  console.log(`\n🎯 Bulk adding ${cards.length} Australian credit cards...\n`)

  let added = 0
  let skipped = 0
  let errors = 0

  for (const card of cards) {
    console.log(`\n📝 Processing: ${card.bank} ${card.name}`)

    try {
      const { data, error} = await supabase
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
          },
          { onConflict: 'scrape_source,scrape_url' }
        )
        .select()

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⏭️  Already exists: ${card.bank} ${card.name}`)
          skipped++
        } else {
          console.error(`   ❌ Error: ${error.message}`)
          errors++
        }
      } else {
        console.log(`   ✅ Added: ${card.bank} ${card.name}`)
        added++
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err}`)
      errors++
    }
  }

  console.log(`\n\n📊 Bulk Add Summary:`)
  console.log(`   ✅ Successfully added: ${added} cards`)
  console.log(`   ⏭️  Skipped (already exist): ${skipped} cards`)
  console.log(`   ❌ Errors: ${errors} cards`)
  console.log(`   📈 Total processed: ${cards.length} cards\n`)

  // Verify total card count
  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  console.log(`\n🎉 Total cards in database: ${count}`)

  if (count! >= 100) {
    console.log(`✅ SUCCESS! Reached target of 100+ cards!`)
  } else {
    console.log(`⚠️  Need ${100 - count!} more cards to reach 100`)
  }
}

addCards().catch(console.error)
