import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedCard } from '@/types/extraction'

const anthropic = new Anthropic()

const EXTRACTION_SYSTEM_PROMPT = `You are a precise credit card data extraction specialist.
Extract all structured data from Australian credit card product pages.

CONFIDENCE SCORING RULES:
- 0.95+: Data is explicit and unambiguous (e.g. "2 Qantas Points per $1 spent")
- 0.80-0.95: Data requires minor interpretation (e.g. reading a table with clear headers)
- 0.60-0.80: Data requires inference or is partially described
- <0.60: Flag for human review — data is ambiguous, missing, or conflicts exist

SET confidenceScore < 0.70 when:
- Earn rates are only in footnotes/asterisked disclaimers
- Terms reference a PDF rather than stating rates inline
- Bonus offer has complex eligibility not fully visible on page
- Annual fee has multiple variants with unclear applicability

EARN RATE EXTRACTION RULES:
- List ALL earn rate categories separately (international vs domestic is critical)
- If earn rates vary by merchant category, list each separately
- "Up to X points" — extract X, note cap in extractionNotes
- Points per dollar, NOT points per spend threshold

BONUS OFFER RULES:
- Only extract current active bonus offers, not historical or "was" offers
- If no bonus offer is present, set bonusOffer to null
- newCustomersOnly should be true unless page explicitly says existing customers eligible`

const EXTRACTION_TOOL = {
  name: 'extract_credit_card_data',
  description: 'Extract all structured credit card product data from the provided page content',
  input_schema: {
    type: 'object' as const,
    properties: {
      cardName: { type: 'string' },
      issuer: { type: 'string' },
      network: { type: 'string', enum: ['Visa', 'Mastercard', 'Amex', 'Diners'] },

      annualFee: {
        type: 'object' as const,
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string', enum: ['AUD'] },
          waiverCondition: { type: ['string', 'null'] },
          firstYearDiscount: { type: ['number', 'null'] },
        },
        required: ['amount', 'currency'],
      },

      earnRates: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            category: { type: 'string' },
            pointsPerDollar: { type: 'number' },
            programName: { type: 'string' },
            monthlyCapDollars: { type: ['number', 'null'] },
            cappedRate: { type: ['number', 'null'] },
          },
          required: ['category', 'pointsPerDollar', 'programName'],
        },
      },

      bonusOffer: {
        type: ['object', 'null'],
        properties: {
          bonusPoints: { type: 'number' },
          spendRequirement: { type: 'number' },
          timeframeMonths: { type: 'number' },
          additionalCredit: { type: ['number', 'null'] },
          expiryDate: { type: ['string', 'null'] },
          newCustomersOnly: { type: 'boolean' },
          eligibilityNotes: { type: ['string', 'null'] },
        },
        required: ['bonusPoints', 'spendRequirement', 'timeframeMonths', 'newCustomersOnly'],
      },

      purchaseRate: { type: ['number', 'null'] },
      cashAdvanceRate: { type: ['number', 'null'] },
      interestFreeDays: { type: ['number', 'null'] },
      minIncome: { type: ['number', 'null'] },
      minCreditLimit: { type: ['number', 'null'] },

      confidenceScore: {
        type: 'number',
        description: '0.0-1.0 confidence that all extracted fields are accurate',
      },
      lowConfidenceFields: {
        type: 'array' as const,
        items: { type: 'string' },
        description: 'List field names where confidence is lower than the overall score',
      },
      extractionNotes: { type: 'string' },
    },
    required: [
      'cardName',
      'issuer',
      'annualFee',
      'earnRates',
      'confidenceScore',
      'lowConfidenceFields',
      'extractionNotes',
    ],
  },
} satisfies Anthropic.Messages.Tool

async function runExtraction(
  pageContent: string,
  cdrData: object | undefined,
  model: string
): Promise<ExtractedCard> {
  const userMessage = cdrData
    ? `CDR verified data (use as ground truth for fees):\n${JSON.stringify(cdrData, null, 2)}\n\n---\n\nPage content to extract from:\n${pageContent}`
    : `Page content to extract from:\n${pageContent}`

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_credit_card_data' },
    messages: [{ role: 'user', content: userMessage }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('No tool use in extraction response')
  }

  return toolUse.input as ExtractedCard
}

export async function extractCardData(
  pageContent: string,
  cdrData?: object
): Promise<ExtractedCard> {
  // Primary extraction with Haiku
  const extracted = await runExtraction(
    pageContent,
    cdrData,
    'claude-haiku-4-5-20251001'
  )

  // Escalate to Sonnet if confidence is low
  if (extracted.confidenceScore < 0.75) {
    console.log(
      `Low confidence (${extracted.confidenceScore.toFixed(2)}) — escalating to Sonnet for re-extraction`
    )
    return runExtraction(pageContent, cdrData, 'claude-sonnet-4-6')
  }

  return extracted
}

export function getVerificationAction(confidenceScore: number): {
  needsVerification: boolean
  verificationPriority: 'low' | 'normal' | 'high'
  action: string
} {
  if (confidenceScore >= 0.90) {
    return {
      needsVerification: false,
      verificationPriority: 'normal',
      action: 'auto-publish',
    }
  }
  if (confidenceScore >= 0.75) {
    return {
      needsVerification: false,
      verificationPriority: 'low',
      action: 'publish-reverify-7d',
    }
  }
  if (confidenceScore >= 0.60) {
    return {
      needsVerification: true,
      verificationPriority: 'high',
      action: 'hold-for-review',
    }
  }
  return {
    needsVerification: true,
    verificationPriority: 'high',
    action: 'manual-review',
  }
}
