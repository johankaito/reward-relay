import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface BonusOffer {
  issuer: string
  cardName: string | null
  bonusPoints: number
  programName: string
  spendRequirement: number
  timeframeMonths: number
  annualFee: number | null
  expiryDate: string | null
}

const OZBARGAIN_SYSTEM_PROMPT = `Extract credit card sign-up bonus offer details from OzBargain deal. Return null via tool if not a credit card bonus offer.`

export async function parseOzBargainDeal(
  title: string,
  description: string
): Promise<BonusOffer | null> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: OZBARGAIN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description}`,
        },
      ],
      tools: [
        {
          name: 'extract_bonus_offer',
          description: 'Extract credit card bonus offer details from an OzBargain deal',
          input_schema: {
            type: 'object' as const,
            properties: {
              issuer: { type: 'string', description: 'Bank or card issuer name' },
              cardName: { type: ['string', 'null'] as ('string' | 'null')[], description: 'Specific card name if mentioned' },
              bonusPoints: { type: 'number', description: 'Number of bonus points offered' },
              programName: { type: 'string', description: 'Loyalty program name (e.g. Qantas Points, Velocity Points)' },
              spendRequirement: { type: 'number', description: 'Minimum spend required in AUD' },
              timeframeMonths: { type: 'number', description: 'Timeframe to meet spend requirement in months' },
              annualFee: { type: ['number', 'null'] as ('number' | 'null')[], description: 'Annual fee in AUD if mentioned' },
              expiryDate: { type: ['string', 'null'] as ('string' | 'null')[], description: 'Offer expiry date in ISO format if mentioned' },
            },
            required: ['issuer', 'bonusPoints', 'programName', 'spendRequirement', 'timeframeMonths'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_bonus_offer' },
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') return null

    return toolUse.input as BonusOffer
  } catch (error) {
    console.error('OzBargain parse error:', error)
    return null
  }
}

export interface OzBargainFeedItem {
  title: string
  description: string
  link: string
  pubDate: string
}

export async function parseOzBargainFeed(
  feedItems: OzBargainFeedItem[]
): Promise<Array<{ offer: BonusOffer; link: string; pubDate: string }>> {
  const results: Array<{ offer: BonusOffer; link: string; pubDate: string }> = []

  for (const item of feedItems) {
    const offer = await parseOzBargainDeal(item.title, item.description)
    if (offer) {
      results.push({ offer, link: item.link, pubDate: item.pubDate })
    }
  }

  return results
}
