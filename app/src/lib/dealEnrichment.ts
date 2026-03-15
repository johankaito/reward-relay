export function extractIssuer(title: string): string | null {
  const BANK_PATTERNS: [RegExp, string][] = [
    [/\banz\b/i, 'ANZ'],
    [/\bamex\b|\bamerican express\b/i, 'American Express'],
    [/\bnab\b/i, 'NAB'],
    [/\bwestpac\b/i, 'Westpac'],
    [/\bcommonwealth\b|\bcba\b/i, 'CBA'],
    [/\bst\.?\s*george\b/i, 'St.George'],
    [/\bbankwest\b/i, 'Bankwest'],
    [/\bciti\b/i, 'Citi'],
    [/\bhsbc\b/i, 'HSBC'],
    [/\bvirgin\b/i, 'Virgin Money'],
    [/\bmacquarie\b/i, 'Macquarie'],
    [/\bqantas\b/i, 'Qantas'],
  ]
  for (const [pattern, name] of BANK_PATTERNS) {
    if (pattern.test(title)) return name
  }
  return null
}

export function extractNetwork(title: string): string | null {
  if (/\bamex\b|\bamerican express\b/i.test(title)) return 'amex'
  if (/\bmastercard\b/i.test(title)) return 'mastercard'
  if (/\bvisa\b/i.test(title)) return 'visa'
  return null
}

export function extractExpiry(description: string): string | null {
  const patterns = [
    /until\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /ends?\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
    /expires?\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  ]
  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match) {
      const parsed = new Date(match[1])
      if (!isNaN(parsed.getTime()) && parsed > new Date()) {
        return parsed.toISOString()
      }
    }
  }
  return null
}
