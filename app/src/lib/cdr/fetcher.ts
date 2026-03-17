import { getCDRDataHolders, type CDRDataHolder } from './register'
import type { Database, Json } from '@/types/database.types'

type CdrProductInsert = Database['public']['Tables']['cdr_products']['Insert']

// CDR product API response types
interface CDRFee {
  feeType: string
  name: string
  amount?: string
  currency?: string
  additionalValue?: string
  additionalInfo?: string
}

interface CDRFeature {
  featureType: string
  additionalValue?: string
  additionalInfo?: string
}

interface CDRLendingRate {
  lendingRateType: string
  rate: string
  additionalValue?: string
}

interface CDRProductDetail {
  productId: string
  name: string
  description?: string
  brand?: string
  brandName?: string
  effectiveFrom?: string
  productCategory?: string
  fees?: CDRFee[]
  features?: CDRFeature[]
  lendingRates?: CDRLendingRate[]
  eligibility?: Array<{ eligibilityType: string; additionalValue?: string }>
}

interface CDRProductsResponse {
  data?: {
    products?: CDRProductDetail[]
  }
  links?: {
    next?: string
  }
}

export interface ExtractedAnnualFee {
  amount: number
  waiver: string | null
}

export function extractAnnualFee(product: CDRProductDetail): ExtractedAnnualFee | null {
  if (!product.fees || product.fees.length === 0) return null

  // Find annual fee: additionalValue='P1Y' (ISO 8601 duration = 1 year) or name contains 'annual'
  const annualFee = product.fees.find(
    (fee) =>
      fee.additionalValue === 'P1Y' ||
      fee.name.toLowerCase().includes('annual') ||
      fee.name.toLowerCase().includes('yearly')
  )

  if (!annualFee || !annualFee.amount) return null

  const amount = parseFloat(annualFee.amount)
  if (isNaN(amount)) return null

  return {
    amount,
    waiver: annualFee.additionalInfo ?? null,
  }
}

export function extractLoyaltyProgram(product: CDRProductDetail): string | null {
  if (!product.features) return null

  const loyaltyFeature = product.features.find(
    (f) => f.featureType === 'LOYALTY_PROGRAM'
  )

  return loyaltyFeature?.additionalValue ?? null
}

export function extractPurchaseRate(product: CDRProductDetail): number | null {
  if (!product.lendingRates) return null

  const purchaseRate = product.lendingRates.find(
    (r) => r.lendingRateType === 'PURCHASE'
  )

  if (!purchaseRate?.rate) return null

  const rate = parseFloat(purchaseRate.rate)
  return isNaN(rate) ? null : rate
}

export function extractMinCreditLimit(product: CDRProductDetail): number | null {
  if (!product.eligibility) return null

  const minCreditLimit = product.eligibility.find(
    (e) => e.eligibilityType === 'MIN_LIMIT'
  )

  if (!minCreditLimit?.additionalValue) return null

  const limit = parseFloat(minCreditLimit.additionalValue)
  return isNaN(limit) ? null : limit
}

export async function fetchBankCDRProducts(
  bankSlug: string,
  baseUrl: string
): Promise<CdrProductInsert[]> {
  // Strip trailing /cds-au/v1/banking if already included in baseUrl
  const cleanBase = baseUrl.replace(/\/cds-au\/v1\/banking\/?$/, '')
  const url = `${cleanBase}/cds-au/v1/banking/products?product-category=CRED_AND_CHRG_CARDS&page-size=100`

  const response = await fetch(url, {
    headers: {
      'x-v': '4',
      'x-min-v': '3',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    throw new Error(`CDR API returned ${response.status} for ${bankSlug}: ${url}`)
  }

  const data = await response.json() as CDRProductsResponse
  const products = data.data?.products ?? []

  return products.map((product): CdrProductInsert => {
    const annualFeeData = extractAnnualFee(product)
    const loyaltyProgram = extractLoyaltyProgram(product)
    const purchaseRate = extractPurchaseRate(product)
    const minCreditLimit = extractMinCreditLimit(product)

    return {
      product_id: product.productId,
      bank_slug: bankSlug,
      bank_name: product.brandName ?? product.brand ?? bankSlug,
      product_name: product.name,
      product_category: product.productCategory ?? 'CRED_AND_CHRG_CARDS',
      annual_fee_amount: annualFeeData?.amount ?? null,
      annual_fee_waiver_condition: annualFeeData?.waiver ?? null,
      loyalty_program_name: loyaltyProgram,
      purchase_rate: purchaseRate,
      min_credit_limit: minCreditLimit,
      raw_json: product as unknown as Json,
      cdr_effective_from: product.effectiveFrom ?? null,
      last_fetched_at: new Date().toISOString(),
      is_active: true,
    }
  })
}

export async function fetchAllBanksCDRProducts(): Promise<{
  bankSlug: string
  products: CdrProductInsert[]
  error?: string
}[]> {
  let holders: CDRDataHolder[]
  try {
    holders = await getCDRDataHolders()
  } catch (error) {
    console.error('Failed to get CDR data holders:', error)
    return []
  }

  const results = await Promise.allSettled(
    holders.map(async (holder) => {
      const products = await fetchBankCDRProducts(holder.bankSlug, holder.publicBaseUri)
      return { bankSlug: holder.bankSlug, products }
    })
  )

  return results.map((result, i) => {
    const holder = holders[i]!
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.warn(`CDR fetch failed for ${holder.bankSlug}:`, result.reason)
      return { bankSlug: holder.bankSlug, products: [], error: String(result.reason) }
    }
  })
}
