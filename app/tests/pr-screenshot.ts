#!/usr/bin/env tsx
/**
 * PR Screenshot helper — takes before/after screenshots of affected pages,
 * commits them to the current branch, and prints the markdown embed block
 * ready to paste into a GitHub PR body.
 *
 * Usage:
 *   pnpm pr-screenshot <page> [page2 ...]
 *   pnpm pr-screenshot dashboard cards
 *
 * What it does:
 *   1. Runs pnpm visual-diff <page> to take stitch + live screenshots
 *   2. Copies PNGs into screenshots/<branch>/ at repo root
 *   3. Commits them to the current branch
 *   4. Prints a markdown table with raw GitHub URLs for the PR body
 *
 * Requires: LIVE_URL env var or defaults to http://localhost:3000
 *           GH_REPO env var or inferred from git remote (owner/repo)
 */

import { execSync, spawnSync } from "child_process"
import fs from "fs"
import path from "path"

const APP_DIR = path.resolve(__dirname, "..")
const REPO_ROOT = path.resolve(APP_DIR, "..")
const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")

function run(cmd: string, opts?: { cwd?: string; silent?: boolean }): string {
  try {
    return execSync(cmd, {
      cwd: opts?.cwd ?? APP_DIR,
      encoding: "utf-8",
      stdio: opts?.silent ? "pipe" : ["inherit", "pipe", "pipe"],
    }).trim()
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string }
    return (err.stdout ?? err.stderr ?? err.message ?? "").trim()
  }
}

function getCurrentBranch(): string {
  return run("git rev-parse --abbrev-ref HEAD", { silent: true, cwd: REPO_ROOT })
}

function getRepo(): string {
  if (process.env.GH_REPO) return process.env.GH_REPO
  const remote = run("git remote get-url origin", { silent: true, cwd: REPO_ROOT })
  return remote.replace(/.*github\.com[:/]/, "").replace(/\.git$/, "")
}

function slugify(branch: string): string {
  return branch.replace(/[^a-zA-Z0-9-_]/g, "-")
}

async function main() {
  const pages = process.argv.slice(2)
  if (pages.length === 0) {
    console.error("Usage: pnpm pr-screenshot <page> [page2 ...]")
    console.error("       pnpm pr-screenshot dashboard cards spending")
    process.exit(1)
  }

  const branch = getCurrentBranch()
  const repo = getRepo()
  const branchSlug = slugify(branch)
  const screenshotDir = path.resolve(REPO_ROOT, "screenshots", branchSlug)

  fs.mkdirSync(screenshotDir, { recursive: true })

  console.log(`\n📸  Taking screenshots for branch: ${branch}`)
  console.log(`    Pages: ${pages.join(", ")}`)
  console.log(`    Output: screenshots/${branchSlug}/\n`)

  const liveUrl = process.env.LIVE_URL ?? "http://localhost:3000"
  const results: Array<{ page: string; stitchSrc: string; liveSrc: string; stitchDest: string; liveDest: string }> = []

  for (const page of pages) {
    console.log(`  Running visual-diff for: ${page}`)
    const result = spawnSync(
      "sh",
      ["-c", `[ -f ~/.nvm/nvm.sh ] && . ~/.nvm/nvm.sh && nvm use 20 >/dev/null 2>&1; LIVE_URL=${liveUrl} pnpm visual-diff ${page}`],
      { cwd: APP_DIR, encoding: "utf-8", stdio: "inherit" }
    )

    if (result.status !== 0) {
      console.warn(`  ⚠  visual-diff failed for ${page}, skipping`)
      continue
    }

    const stitchSrc = path.join(OUTPUT_DIR, `${page}-stitch.png`)
    const liveSrc = path.join(OUTPUT_DIR, `${page}-live.png`)
    const stitchDest = path.join(screenshotDir, `${page}-stitch.png`)
    const liveDest = path.join(screenshotDir, `${page}-live.png`)

    if (fs.existsSync(liveSrc)) {
      fs.copyFileSync(liveSrc, liveDest)
      console.log(`  ✓ Copied ${page}-live.png`)
    }
    if (fs.existsSync(stitchSrc)) {
      fs.copyFileSync(stitchSrc, stitchDest)
      console.log(`  ✓ Copied ${page}-stitch.png`)
    }

    results.push({ page, stitchSrc, liveSrc, stitchDest, liveDest })
  }

  if (results.length === 0) {
    console.error("No screenshots taken — check that pnpm-dev is running on localhost:3000")
    process.exit(1)
  }

  // Commit screenshots to branch
  console.log("\n📦  Committing screenshots to branch...")
  run(`git add screenshots/${branchSlug}/`, { cwd: REPO_ROOT, silent: true })

  const staged = run("git diff --cached --name-only", { silent: true, cwd: REPO_ROOT })
  if (staged.trim()) {
    run(`git -c commit.gpgsign=false commit -m "chore(screenshots): add PR review screenshots for ${pages.join(", ")}"`, { cwd: REPO_ROOT })
    console.log("  ✓ Screenshots committed")
  } else {
    console.log("  ✓ Screenshots already up to date (no new commit needed)")
  }

  // Push to ensure screenshots are available on GitHub
  run(`git push origin ${branch} --quiet`, { cwd: REPO_ROOT, silent: true })
  console.log("  ✓ Pushed to remote\n")

  // Use commit SHA (not branch) so URLs survive after branch deletion
  const sha = run("git rev-parse HEAD", { silent: true, cwd: REPO_ROOT })
  console.log(`  📌 Commit SHA: ${sha}\n`)

  // Generate PR markdown
  const rawBase = `https://raw.githubusercontent.com/${repo}/${sha}/screenshots/${branchSlug}`

  const markdownLines: string[] = [
    `## Visual Review`,
    ``,
    `> Screenshots taken against \`${liveUrl}\` on branch \`${branch}\``,
    ``,
  ]

  for (const { page, stitchDest, liveDest } of results) {
    const hasStitch = fs.existsSync(stitchDest)
    const hasLive = fs.existsSync(liveDest)

    markdownLines.push(`### ${page}`)
    markdownLines.push(``)
    markdownLines.push(`| Stitch design | Live implementation |`)
    markdownLines.push(`|---|---|`)

    const stitchCell = hasStitch
      ? `![${page}-stitch](${rawBase}/${page}-stitch.png)`
      : `_(no Stitch export)_`
    const liveCell = hasLive
      ? `![${page}-live](${rawBase}/${page}-live.png)`
      : `_(screenshot failed)_`

    markdownLines.push(`| ${stitchCell} | ${liveCell} |`)
    markdownLines.push(``)
  }

  markdownLines.push(`---`)
  markdownLines.push(`⚠️ **Needs human review before merge** — do not auto-merge this PR`)

  const markdown = markdownLines.join("\n")

  console.log("─".repeat(60))
  console.log("COPY THIS INTO YOUR PR BODY:\n")
  console.log(markdown)
  console.log("─".repeat(60))

  // Also write to a file for easy piping
  const mdPath = path.resolve(OUTPUT_DIR, `pr-screenshots-${branchSlug}.md`)
  fs.writeFileSync(mdPath, markdown)
  console.log(`\n✅  Markdown saved to: ${mdPath}`)
  console.log(`   Use: cat ${mdPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
