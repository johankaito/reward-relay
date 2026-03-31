#!/usr/bin/env tsx
/**
 * PR Screenshot helper — takes screenshots of affected pages and uploads them
 * directly to GitHub's CDN (user-images.githubusercontent.com) using the same
 * upload mechanism as drag-and-drop in the GitHub UI. No files are committed
 * to any branch.
 *
 * Usage:
 *   pnpm pr-screenshot <page> [page2 ...]
 *   pnpm pr-screenshot dashboard cards
 *
 * What it does:
 *   1. Runs pnpm visual-diff <page> to take stitch + live screenshots
 *   2. Uploads PNGs to GitHub's CDN via upload/policies/assets
 *   3. Writes a markdown table with the CDN URLs ready for the PR body
 *
 * Requires: LIVE_URL env var or defaults to http://localhost:3000
 *           GH_REPO env var or inferred from git remote (owner/repo)
 *           gh CLI authenticated (used to get the auth token)
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

/**
 * Uploads a PNG to GitHub's CDN using the same endpoint the web UI uses for
 * drag-and-drop image uploads. Returns a user-images.githubusercontent.com URL.
 * Nothing is committed to any branch.
 */
async function uploadToGitHubCDN(repo: string, filePath: string, filename: string): Promise<string> {
  const token = run("gh auth token", { silent: true }).trim()
  if (!token) throw new Error("Not authenticated — run: gh auth login")

  const fileBuffer = fs.readFileSync(filePath)

  // Step 1: Request an upload policy (pre-signed S3 credentials)
  const policyRes = await fetch(`https://github.com/${repo}/upload/policies/assets`, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: filename,
      size: fileBuffer.length,
      content_type: "image/png",
    }),
  })

  if (!policyRes.ok) {
    const text = await policyRes.text()
    throw new Error(`GitHub upload policy request failed (${policyRes.status}): ${text}`)
  }

  const policy = (await policyRes.json()) as {
    upload_url: string
    upload_url_fields: Record<string, string>
    asset: { href: string }
  }

  // Step 2: Upload the file to S3 using the pre-signed form
  const form = new FormData()
  for (const [key, value] of Object.entries(policy.upload_url_fields)) {
    form.append(key, value)
  }
  form.append("file", new Blob([fileBuffer], { type: "image/png" }), filename)

  const uploadRes = await fetch(policy.upload_url, { method: "POST", body: form })
  // S3 returns 204 No Content on success
  if (!uploadRes.ok && uploadRes.status !== 204) {
    throw new Error(`S3 upload failed (${uploadRes.status})`)
  }

  return policy.asset.href
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
  console.log(`    Uploading to GitHub CDN (not committed to repo)\n`)

  const liveUrl = process.env.LIVE_URL ?? "http://localhost:3000"
  const captured: Array<{ page: string; stitchPath: string | null; livePath: string | null }> = []

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

    captured.push({
      page,
      stitchPath: fs.existsSync(stitchPath) ? stitchPath : null,
      livePath: fs.existsSync(livePath) ? livePath : null,
    })
  }

  if (captured.length === 0) {
    console.error("No screenshots taken — check that pnpm dev is running")
    process.exit(1)
  }

  // Upload to GitHub CDN
  console.log("\n☁️   Uploading to GitHub CDN...")

  const uploaded: Array<{ page: string; stitchUrl: string | null; liveUrl: string | null }> = []

  for (const { page, stitchPath, livePath } of captured) {
    let stitchUrl: string | null = null
    let liveUrl2: string | null = null

    if (livePath) {
      liveUrl2 = await uploadToGitHubCDN(repo, livePath, `${branchSlug}-${page}-live.png`)
      console.log(`  ✓ ${page}-live → ${liveUrl2}`)
    }
    if (stitchPath) {
      stitchUrl = await uploadToGitHubCDN(repo, stitchPath, `${branchSlug}-${page}-stitch.png`)
      console.log(`  ✓ ${page}-stitch → ${stitchUrl}`)
    }

    uploaded.push({ page, stitchUrl, liveUrl: liveUrl2 })
  }

  // Generate PR markdown
  const markdownLines: string[] = [
    `## Visual Review`,
    ``,
    `> Screenshots taken against \`${liveUrl}\` on branch \`${branch}\``,
    ``,
  ]

  for (const { page, stitchUrl, liveUrl: lu } of uploaded) {
    markdownLines.push(`### ${page}`)
    markdownLines.push(``)
    markdownLines.push(`| Stitch design | Live implementation |`)
    markdownLines.push(`|---|---|`)

    const stitchCell = stitchUrl ? `![${page}-stitch](${stitchUrl})` : `_(no Stitch export)_`
    const liveCell = lu ? `![${page}-live](${lu})` : `_(screenshot failed)_`

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

  // Write markdown file for rr-screenshot.sh to pick up
  const mdPath = path.resolve(OUTPUT_DIR, `pr-screenshots-${branchSlug}.md`)
  fs.writeFileSync(mdPath, markdown)
  console.log(`\n✅  Markdown saved to: ${mdPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
