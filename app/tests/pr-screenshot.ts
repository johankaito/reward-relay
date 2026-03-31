#!/usr/bin/env tsx
/**
 * PR Screenshot helper — takes screenshots of affected pages and uploads them
 * to the dedicated `screenshots` branch on GitHub (never committed to feature branches).
 *
 * Usage:
 *   pnpm pr-screenshot <page> [page2 ...]
 *   pnpm pr-screenshot dashboard cards
 *
 * What it does:
 *   1. Runs pnpm visual-diff <page> to take stitch + live screenshots
 *   2. Uploads PNGs to the `screenshots` branch via GitHub Contents API
 *   3. Prints a markdown table with raw GitHub URLs for the PR body
 *
 * Requires: LIVE_URL env var or defaults to http://localhost:3000
 *           GH_REPO env var or inferred from git remote (owner/repo)
 *           GH_TOKEN or gh CLI auth for API calls
 */

import { execSync, spawnSync } from "child_process"
import fs from "fs"
import path from "path"

const APP_DIR = path.resolve(__dirname, "..")
const REPO_ROOT = path.resolve(APP_DIR, "..")
const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")
const SCREENSHOTS_BRANCH = "screenshots"

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

/**
 * Ensures the `screenshots` orphan branch exists on the remote.
 * If it doesn't, creates it with an empty tree via the GitHub API.
 */
function ensureScreenshotsBranch(repo: string): void {
  const existing = run(
    `gh api repos/${repo}/branches/${SCREENSHOTS_BRANCH} --jq '.name' 2>/dev/null || echo ""`,
    { silent: true }
  ).trim()

  if (existing === SCREENSHOTS_BRANCH) return

  console.log(`  Creating '${SCREENSHOTS_BRANCH}' branch on GitHub...`)

  // Create an empty tree
  const treeSha = run(
    `gh api --method POST repos/${repo}/git/trees -F "tree=[]" --jq '.sha'`,
    { silent: true }
  ).trim()

  // Create a commit on the empty tree
  const commitSha = run(
    `gh api --method POST repos/${repo}/git/commits ` +
      `-F message="init: screenshots storage branch" ` +
      `-F tree="${treeSha}" ` +
      `--jq '.sha'`,
    { silent: true }
  ).trim()

  // Create the branch ref
  run(
    `gh api --method POST repos/${repo}/git/refs ` +
      `-F ref="refs/heads/${SCREENSHOTS_BRANCH}" ` +
      `-F sha="${commitSha}"`,
    { silent: true }
  )

  console.log(`  ✓ Created '${SCREENSHOTS_BRANCH}' branch`)
}

/**
 * Uploads a single file to the screenshots branch via GitHub Contents API.
 * Handles both create and update (SHA required for updates).
 */
function uploadFile(repo: string, remotePath: string, localPath: string, commitMessage: string): void {
  // Check if file already exists on screenshots branch (need SHA to update)
  const existingSha = run(
    `gh api "repos/${repo}/contents/${remotePath}?ref=${SCREENSHOTS_BRANCH}" --jq '.sha' 2>/dev/null || echo ""`,
    { silent: true }
  ).trim()

  const content = fs.readFileSync(localPath).toString("base64")
  const body: Record<string, string> = {
    message: commitMessage,
    content,
    branch: SCREENSHOTS_BRANCH,
  }
  if (existingSha) body.sha = existingSha

  const tmpFile = path.join(OUTPUT_DIR, `.gh-upload-tmp.json`)
  fs.writeFileSync(tmpFile, JSON.stringify(body))

  try {
    run(`gh api --method PUT "repos/${repo}/contents/${remotePath}" --input "${tmpFile}"`, { silent: true })
  } finally {
    fs.unlinkSync(tmpFile)
  }
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

  console.log(`\n📸  Taking screenshots for branch: ${branch}`)
  console.log(`    Pages: ${pages.join(", ")}`)
  console.log(`    Will upload to '${SCREENSHOTS_BRANCH}' branch (not committed here)\n`)

  // Ensure the screenshots storage branch exists
  ensureScreenshotsBranch(repo)

  const liveUrl = process.env.LIVE_URL ?? "http://localhost:3000"
  const results: Array<{ page: string; stitchPath: string | null; livePath: string | null }> = []

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

    const stitchPath = path.join(OUTPUT_DIR, `${page}-stitch.png`)
    const livePath = path.join(OUTPUT_DIR, `${page}-live.png`)

    results.push({
      page,
      stitchPath: fs.existsSync(stitchPath) ? stitchPath : null,
      livePath: fs.existsSync(livePath) ? livePath : null,
    })
  }

  if (results.length === 0) {
    console.error("No screenshots taken — check that pnpm dev is running")
    process.exit(1)
  }

  // Upload to screenshots branch
  console.log(`\n☁️   Uploading screenshots to '${SCREENSHOTS_BRANCH}' branch...`)

  const uploadedFiles: Array<{ page: string; stitchRemote: string | null; liveRemote: string | null }> = []

  for (const { page, stitchPath, livePath } of results) {
    let stitchRemote: string | null = null
    let liveRemote: string | null = null

    if (livePath) {
      const remotePath = `${branchSlug}/${page}-live.png`
      uploadFile(repo, remotePath, livePath, `screenshot: ${page} live — ${branch}`)
      liveRemote = remotePath
      console.log(`  ✓ Uploaded ${page}-live.png`)
    }
    if (stitchPath) {
      const remotePath = `${branchSlug}/${page}-stitch.png`
      uploadFile(repo, remotePath, stitchPath, `screenshot: ${page} stitch — ${branch}`)
      stitchRemote = remotePath
      console.log(`  ✓ Uploaded ${page}-stitch.png`)
    }

    uploadedFiles.push({ page, stitchRemote, liveRemote })
  }

  const rawBase = `https://raw.githubusercontent.com/${repo}/${SCREENSHOTS_BRANCH}`

  // Generate PR markdown
  const markdownLines: string[] = [
    `## Visual Review`,
    ``,
    `> Screenshots taken against \`${liveUrl}\` on branch \`${branch}\``,
    ``,
  ]

  for (const { page, stitchRemote, liveRemote } of uploadedFiles) {
    markdownLines.push(`### ${page}`)
    markdownLines.push(``)
    markdownLines.push(`| Stitch design | Live implementation |`)
    markdownLines.push(`|---|---|`)

    const stitchCell = stitchRemote
      ? `![${page}-stitch](${rawBase}/${stitchRemote})`
      : `_(no Stitch export)_`
    const liveCell = liveRemote
      ? `![${page}-live](${rawBase}/${liveRemote})`
      : `_(screenshot failed)_`

    markdownLines.push(`| ${stitchCell} | ${liveCell} |`)
    markdownLines.push(``)
  }

  markdownLines.push(`---`)
  markdownLines.push(`⚠️ **Needs human review before merge** — do not auto-merge this PR`)

  const markdown = markdownLines.join("\n")

  console.log("\n─".repeat(60))
  console.log("COPY THIS INTO YOUR PR BODY:\n")
  console.log(markdown)
  console.log("─".repeat(60))

  // Write markdown for rr-screenshot.sh to pick up
  const mdPath = path.resolve(OUTPUT_DIR, `pr-screenshots-${branchSlug}.md`)
  fs.writeFileSync(mdPath, markdown)
  console.log(`\n✅  Markdown saved to: ${mdPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
