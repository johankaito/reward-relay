import { extractCardData } from '../src/lib/card-extractor'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface TestFixture {
  slug: string
  file: string
  expected: {
    annualFee: number
    earnRates: Array<{ category: string; pointsPerDollar: number }>
    minConfidence: number
  }
  tolerances?: {
    annualFeeDelta?: number
    earnRateDelta?: number
  }
}

const FIXTURES: TestFixture[] = [
  {
    slug: 'anz-ff-black',
    file: 'anz-ff-black.md',
    expected: {
      annualFee: 425,
      earnRates: [{ category: 'All purchases', pointsPerDollar: 1 }],
      minConfidence: 0.75,
    },
  },
  {
    slug: 'cba-awards',
    file: 'cba-awards.md',
    expected: {
      annualFee: 89,
      earnRates: [{ category: 'All purchases', pointsPerDollar: 1 }],
      minConfidence: 0.75,
    },
  },
  {
    slug: 'nab-rewards-signature',
    file: 'nab-rewards-signature.md',
    expected: {
      annualFee: 295,
      earnRates: [{ category: 'All purchases', pointsPerDollar: 1.25 }],
      minConfidence: 0.75,
    },
  },
  {
    slug: 'amex-explorer',
    file: 'amex-explorer.md',
    expected: {
      annualFee: 395,
      earnRates: [{ category: 'All purchases', pointsPerDollar: 2 }],
      minConfidence: 0.75,
    },
  },
  {
    slug: 'westpac-altitude-black',
    file: 'westpac-altitude-black.md',
    expected: {
      annualFee: 250,
      earnRates: [{ category: 'All purchases', pointsPerDollar: 1.25 }],
      minConfidence: 0.75,
    },
  },
]

async function runTests() {
  const fixturesDir = join(__dirname, 'fixtures')
  let passed = 0
  let failed = 0
  const failures: string[] = []

  console.log('Running card extraction regression tests...\n')

  for (const fixture of FIXTURES) {
    const pageContent = readFileSync(join(fixturesDir, fixture.file), 'utf-8')

    console.log(`Testing: ${fixture.slug}`)

    try {
      const extracted = await extractCardData(pageContent)

      // Assert annual fee (within $5 tolerance)
      const feeTolerance = fixture.tolerances?.annualFeeDelta ?? 5
      const feeDiff = Math.abs(extracted.annualFee.amount - fixture.expected.annualFee)
      if (feeDiff > feeTolerance) {
        throw new Error(
          `Annual fee mismatch: expected $${fixture.expected.annualFee}, got $${extracted.annualFee.amount} (diff: $${feeDiff})`
        )
      }

      // Assert earn rate (first/primary earn rate points per dollar)
      const expectedEarnRate = fixture.expected.earnRates[0]
      const matchingRate =
        extracted.earnRates.find(
          (r) =>
            r.category.toLowerCase().includes('all') ||
            r.category.toLowerCase().includes('everyday') ||
            r.category.toLowerCase().includes('eligible')
        ) ?? extracted.earnRates[0]

      if (!matchingRate) {
        throw new Error('No earn rates extracted')
      }

      const earnRateTolerance = fixture.tolerances?.earnRateDelta ?? 0.1
      const earnRateDiff = Math.abs(matchingRate.pointsPerDollar - expectedEarnRate.pointsPerDollar)
      if (earnRateDiff > earnRateTolerance) {
        throw new Error(
          `Earn rate mismatch: expected ${expectedEarnRate.pointsPerDollar} ppd, got ${matchingRate.pointsPerDollar} ppd`
        )
      }

      // Assert confidence score
      if (extracted.confidenceScore < fixture.expected.minConfidence) {
        throw new Error(
          `Confidence too low: ${extracted.confidenceScore.toFixed(2)} < ${fixture.expected.minConfidence}`
        )
      }

      console.log(
        `  ✓ Annual fee: $${extracted.annualFee.amount} | Earn rate: ${matchingRate.pointsPerDollar} ppd | Confidence: ${extracted.confidenceScore.toFixed(2)}`
      )
      passed++
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.log(`  ✗ ${msg}`)
      failures.push(`${fixture.slug}: ${msg}`)
      failed++
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)

  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }

  console.log('\nAll extraction tests passed!')
}

runTests().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
