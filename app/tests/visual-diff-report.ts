/**
 * Visual diff report — reads screenshot pairs from visual-diff.ts manifest,
 * sends each pair to Claude claude-sonnet-4-6 (vision), and produces a structured gap report.
 *
 * Usage: pnpm tsx tests/visual-diff-report.ts [page]
 *        pnpm tsx tests/visual-diff-report.ts landing
 *        pnpm tsx tests/visual-diff-report.ts   (all pages in manifest)
 *
 * Requires: ANTHROPIC_API_KEY in env (or .env.local)
 * Run visual-diff.ts first to generate screenshots.
 */

import Anthropic from "@anthropic-ai/sdk"
import fs from "fs"
import path from "path"

const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")
const MANIFEST = path.join(OUTPUT_DIR, "manifest.json")

type ManifestEntry = { name: string; stitch: string; live: string }

const SYSTEM_PROMPT = `You are a pixel-perfect design QA engineer comparing a Stitch design export against a live implementation.

You will receive two screenshots side by side:
- LEFT / first image: the Stitch design (source of truth)
- RIGHT / second image: the live implementation

Your job: identify every visual difference, no matter how small.

For each difference, output:
- Severity: P0 (structural), P1 (major visual), P2 (notable), P3 (polish)
- Location: which section / element
- Design: what the Stitch export shows
- Live: what the implementation shows
- Fix: the exact CSS/className change needed

End with:
- Fidelity score: X/100
- Top 3 fixes that would have the most visual impact`

async function analysePagePair(
  client: Anthropic,
  name: string,
  stitchPath: string,
  livePath: string
): Promise<string> {
  if (!fs.existsSync(stitchPath)) {
    return `⚠ Stitch screenshot missing: ${stitchPath}`
  }
  if (!fs.existsSync(livePath)) {
    return `⚠ Live screenshot missing: ${livePath}`
  }

  const stitchB64 = fs.readFileSync(stitchPath).toString("base64")
  const liveB64 = fs.readFileSync(livePath).toString("base64")

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Page: ${name}\nLeft = Stitch design. Right = live implementation. List all visual differences.`,
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: stitchB64 },
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: liveB64 },
          },
        ],
      },
    ],
  })

  const block = response.content[0]
  return block.type === "text" ? block.text : ""
}

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`No manifest found. Run: pnpm tsx tests/visual-diff.ts first`)
    process.exit(1)
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"))
  const filter = process.argv[2]
  const targets = filter ? manifest.filter((e) => e.name === filter) : manifest

  if (filter && targets.length === 0) {
    console.error(`No entry for "${filter}" in manifest.`)
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set")
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  const reportLines: string[] = [
    `# Visual Diff Report`,
    `Generated: ${new Date().toISOString()}`,
    `Viewport: 1440×900 · Model: claude-sonnet-4-6`,
    ``,
  ]

  for (const entry of targets) {
    console.log(`\n🔍  Analysing ${entry.name}...`)
    const analysis = await analysePagePair(client, entry.name, entry.stitch, entry.live)
    reportLines.push(`## ${entry.name}`, ``, analysis, ``, `---`, ``)
    console.log(analysis)
  }

  const reportPath = path.join(OUTPUT_DIR, `report-${Date.now()}.md`)
  fs.writeFileSync(reportPath, reportLines.join("\n"))
  console.log(`\n✅  Report saved: ${reportPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
