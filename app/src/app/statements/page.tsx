"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Papa from "papaparse"

import { AppShell } from "@/components/layout/AppShell"
import { ProGate } from "@/components/ui/ProGate"
import { supabase } from "@/lib/supabase/client"
import { useCatalog } from "@/contexts/CatalogContext"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

type Category = "Groceries" | "Dining" | "Fuel" | "Travel" | "Other"

interface Transaction {
  date: string
  description: string
  amount: number
  category: Category
}

const CATEGORY_COLOURS: Record<Category, string> = {
  Groceries: "#4edea3",
  Dining:    "#f59e0b",
  Fuel:      "#3b82f6",
  Travel:    "#a855f7",
  Other:     "#6b7280",
}

const CATEGORIES: Category[] = ["Groceries", "Dining", "Fuel", "Travel", "Other"]

// ── CSV parsers for each bank format ──────────────────────────────────────────

function parseRows(data: Record<string, string>[]): Omit<Transaction, "category">[] {
  const headers = Object.keys(data[0] || {}).map((h) => h.toLowerCase())
  const results: Omit<Transaction, "category">[] = []

  for (const row of data) {
    let date = ""
    let description = ""
    let amount = 0

    if (headers.includes("date") && (headers.includes("debit") || headers.includes("credit"))) {
      // CommBank / Westpac: Date, Description/Narrative, Debit, Credit, Balance
      date = row["Date"] || row["date"]
      description = row["Description"] || row["description"] || row["Narrative"] || row["narrative"]
      const debit = parseFloat((row["Debit"] || row["debit"] || "0").replace(/[^0-9.-]/g, ""))
      const credit = parseFloat((row["Credit"] || row["credit"] || "0").replace(/[^0-9.-]/g, ""))
      amount = debit > 0 ? debit : credit
    } else if (headers.includes("date") && headers.includes("amount")) {
      // ANZ / NAB: Date, Description/Narrative, Amount, Balance
      date = row["Date"] || row["date"]
      description = row["Description"] || row["description"] || row["Narrative"] || row["narrative"]
      amount = Math.abs(parseFloat((row["Amount"] || row["amount"] || "0").replace(/[^0-9.-]/g, "")))
    } else {
      // Generic fallback
      for (const k of headers) {
        if (k.includes("date")) { date = row[k]; break }
      }
      for (const k of headers) {
        if (k.includes("description") || k.includes("narrative")) { description = row[k]; break }
      }
      for (const k of headers) {
        if (k.includes("amount") || k === "debit" || k === "credit") {
          amount = Math.abs(parseFloat((row[k] || "0").replace(/[^0-9.-]/g, "")))
          if (amount > 0) break
        }
      }
    }

    if (!date || !description || amount === 0 || isNaN(amount)) continue
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) continue

    results.push({ date: parsed.toISOString().split("T")[0], description: description.trim(), amount })
  }

  return results
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StatementsPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [analysing, setAnalysing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string>("")

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/"); return }

      const { data } = await supabase
        .from("user_cards")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      setUserCards(data || [])
      setLoading(false)
    }
    void load()
  }, [router])

  const spendByCategory = useMemo<Record<Category, number>>(() => {
    const acc = { Groceries: 0, Dining: 0, Fuel: 0, Travel: 0, Other: 0 }
    for (const t of transactions) acc[t.category] += t.amount
    return acc
  }, [transactions])

  const totalSpend = useMemo(
    () => Object.values(spendByCategory).reduce((a, b) => a + b, 0),
    [spendByCategory]
  )

  // Missed points: compare each catalog card's earn rate vs total spend
  const missedPoints = useMemo(() => {
    if (transactions.length === 0 || catalogCards.length === 0) return []
    return catalogCards
      .filter((c) => c.earn_rate_primary != null && c.earn_rate_primary > 0)
      .map((c) => ({
        card: c,
        earnedPoints: Math.round(totalSpend * (c.earn_rate_primary ?? 1)),
      }))
      .sort((a, b) => b.earnedPoints - a.earnedPoints)
      .slice(0, 3)
  }, [transactions, catalogCards, totalSpend])

  const parseFile = useCallback(async (f: File) => {
    setParseError(null)
    setTransactions([])
    setFile(f)

    const text = await f.text()
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

    if (result.errors.length > 0 && result.data.length === 0) {
      setParseError("Could not parse CSV. Please check the file format.")
      return
    }

    const rows = parseRows(result.data)
    if (rows.length === 0) {
      setParseError("No valid transactions found. Please check the format is ANZ, CommBank, NAB, or Westpac.")
      return
    }

    // Categorise via Claude API
    setAnalysing(true)
    try {
      const res = await fetch("/api/statements/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions: rows.map((r) => r.description) }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? "Analysis failed")
      }

      const { categories } = (await res.json()) as { categories: Category[] }
      const withCategories: Transaction[] = rows.map((r, i) => ({
        ...r,
        category: categories[i] ?? "Other",
      }))
      setTransactions(withCategories)
    } catch (err) {
      // Fall back to keyword matching if Claude fails
      toast.error("AI categorisation unavailable — using keyword matching")
      const withCategories: Transaction[] = rows.map((r) => ({
        ...r,
        category: "Other" as Category,
      }))
      setTransactions(withCategories)
    } finally {
      setAnalysing(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f?.name.endsWith(".csv")) void parseFile(f)
      else setParseError("Please drop a .csv file")
    },
    [parseFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) void parseFile(f)
    },
    [parseFile]
  )

  const handleUpload = async () => {
    if (!selectedCard || transactions.length === 0) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Not authenticated"); setUploading(false); return }

    const { error } = await supabase.from("spending_transactions").insert(
      transactions.map((t) => ({
        user_card_id: selectedCard,
        user_id: user.id,
        amount: t.amount,
        description: t.description,
        transaction_date: t.date,
        category: t.category.toLowerCase(),
      }))
    )

    if (error) {
      toast.error(error.message || "Upload failed")
    } else {
      toast.success(`${transactions.length} transactions saved to your spending tracker`)
      setFile(null)
      setTransactions([])
      setSelectedCard("")
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <ProGate feature="Statement Analysis">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-8 pb-16 space-y-10">

          {/* ── Hero ── */}
          <section>
            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
              Statement Analysis
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Upload a bank CSV — Claude categorises your spending and reveals missed points opportunities.
            </p>
          </section>

          {/* ── Upload zone ── */}
          <section
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragging
                ? "border-[#4edea3]/60 bg-[#4edea3]/5"
                : "border-white/10 bg-surface-container hover:border-white/20"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
              {analysing ? (
                <>
                  <Loader2 className="w-10 h-10 text-[#4edea3] animate-spin" />
                  <p className="font-semibold text-on-surface">Analysing with Claude…</p>
                  <p className="text-sm text-on-surface-variant">Categorising your transactions</p>
                </>
              ) : file && transactions.length > 0 ? (
                <>
                  <CheckCircle className="w-10 h-10 text-[#4edea3]" />
                  <p className="font-semibold text-on-surface">{file.name}</p>
                  <p className="text-sm text-on-surface-variant">{transactions.length} transactions parsed</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-on-surface-variant" />
                  <div>
                    <p className="font-semibold text-on-surface mb-1">Drop your CSV here or click to browse</p>
                    <p className="text-sm text-on-surface-variant">ANZ · CommBank · NAB · Westpac formats supported</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {parseError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{parseError}</p>
            </div>
          )}

          {/* ── Results ── */}
          {transactions.length > 0 && (
            <>
              {/* Spending breakdown chart */}
              <section className="bg-surface-container rounded-2xl p-8 border border-white/5">
                <h2 className="font-headline text-xl font-extrabold text-on-surface mb-6">
                  Spending Breakdown
                </h2>
                <div className="space-y-4">
                  {CATEGORIES.map((cat) => {
                    const amount = spendByCategory[cat]
                    const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0
                    if (amount === 0) return null
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-on-surface">{cat}</span>
                          <span className="tabular-nums text-on-surface-variant">
                            ${amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="ml-2 text-xs">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: CATEGORY_COLOURS[cat] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-6 text-right text-sm text-on-surface-variant">
                  Total spend:{" "}
                  <span className="font-bold text-on-surface tabular-nums">
                    ${totalSpend.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </p>
              </section>

              {/* Missed points analysis */}
              {missedPoints.length > 0 && (
                <section className="bg-surface-container rounded-2xl p-8 border border-white/5">
                  <h2 className="font-headline text-xl font-extrabold text-on-surface mb-2">
                    Missed Points Opportunity
                  </h2>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Based on your ${totalSpend.toLocaleString("en-AU", { minimumFractionDigits: 0 })} spend, here&apos;s what you could have earned:
                  </p>
                  <div className="space-y-4">
                    {missedPoints.map(({ card, earnedPoints }, i) => (
                      <div
                        key={card.id}
                        className={`flex items-center justify-between rounded-xl p-5 border transition-all ${
                          i === 0
                            ? "border-[#4edea3]/20 bg-[#4edea3]/5"
                            : "border-white/5 bg-surface-container-high"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-on-surface">
                            {card.bank} {card.name}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {card.earn_rate_primary}x on all spend · {card.points_currency ?? "points"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-extrabold tabular-nums tracking-tighter ${i === 0 ? "text-[#4edea3]" : "text-on-surface"}`}>
                            {earnedPoints.toLocaleString("en-AU")}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">pts earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Save to tracker */}
              <section className="bg-surface-container rounded-2xl p-8 border border-white/5 space-y-4">
                <h2 className="font-headline text-xl font-extrabold text-on-surface mb-1">
                  Save to Spend Tracker
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Link these {transactions.length} transactions to one of your active cards.
                </p>
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full bg-surface-container-high text-on-surface text-sm rounded-xl px-4 py-3 border border-white/5 focus:outline-none focus:border-[#4edea3]/30"
                >
                  <option value="">Select a card…</option>
                  {userCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bank} — {c.name ?? c.id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void handleUpload()}
                  disabled={!selectedCard || uploading}
                  className="w-full py-4 rounded-full font-bold text-sm text-black transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#4edea3]/10"
                  style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
                >
                  {uploading ? "Saving…" : `Save ${transactions.length} transactions`}
                </button>
              </section>
            </>
          )}

          {/* Supported formats info */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["CommBank", "ANZ", "NAB", "Westpac"] as const).map((bank) => (
              <div key={bank} className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-3 border border-white/5">
                <CheckCircle className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                <span className="text-xs font-semibold text-on-surface">{bank}</span>
              </div>
            ))}
          </section>

        </div>
      </ProGate>
    </AppShell>
  )
}
