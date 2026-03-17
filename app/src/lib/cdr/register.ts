// CDR Register client — discovers CDR data holder base URLs
const CDR_REGISTER_URL = 'https://api.cdr.gov.au/cdr-register/v1/banking/data-holders/brands/summary'

export interface CDRDataHolder {
  bankName: string
  bankSlug: string
  publicBaseUri: string
}

// Fallback URLs in case CDR Register is unavailable
const CDR_FALLBACKS: CDRDataHolder[] = [
  { bankName: 'ANZ', bankSlug: 'anz', publicBaseUri: 'https://api.anz/cds-au/v1/banking' },
  { bankName: 'Commonwealth Bank', bankSlug: 'cba', publicBaseUri: 'https://api.commbank.com.au/public/cds-au/v1/banking' },
  { bankName: 'NAB', bankSlug: 'nab', publicBaseUri: 'https://api.nab.com.au/cds-au/v1/banking' },
  { bankName: 'Westpac', bankSlug: 'westpac', publicBaseUri: 'https://openbank.api.westpac.com.au/cds-au/v1/banking' },
]

function toBankSlug(legalEntityName: string): string {
  const name = legalEntityName.toLowerCase()
  if (name.includes('anz') || name.includes('australia and new zealand')) return 'anz'
  if (name.includes('commonwealth') || name.includes('commbank') || name.includes('cba')) return 'cba'
  if (name.includes('nab') || name.includes('national australia')) return 'nab'
  if (name.includes('westpac')) return 'westpac'
  if (name.includes('st.george') || name.includes('st george')) return 'stgeorge'
  if (name.includes('bankwest')) return 'bankwest'
  if (name.includes('hsbc')) return 'hsbc'
  if (name.includes('macquarie')) return 'macquarie'
  // Generate slug from name
  return legalEntityName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20)
}

export async function getCDRDataHolders(): Promise<CDRDataHolder[]> {
  try {
    const response = await fetch(CDR_REGISTER_URL, {
      headers: { 'x-v': '1' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.warn(`CDR Register returned ${response.status}, using fallbacks`)
      return CDR_FALLBACKS
    }

    const data = await response.json() as {
      data: Array<{
        legalEntityName?: string
        brandName?: string
        endpointDetail?: { publicBaseUri?: string }
      }>
    }

    const holders: CDRDataHolder[] = []

    for (const holder of data.data ?? []) {
      const publicBaseUri = holder.endpointDetail?.publicBaseUri
      if (!publicBaseUri) continue

      const bankName = holder.brandName ?? holder.legalEntityName ?? 'Unknown'
      const bankSlug = toBankSlug(holder.legalEntityName ?? bankName)

      holders.push({ bankName, bankSlug, publicBaseUri })
    }

    if (holders.length === 0) {
      console.warn('CDR Register returned no holders, using fallbacks')
      return CDR_FALLBACKS
    }

    return holders
  } catch (error) {
    console.warn('CDR Register fetch failed, using fallbacks:', error)
    return CDR_FALLBACKS
  }
}
