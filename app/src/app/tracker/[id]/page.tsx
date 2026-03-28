"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { SpendProgressBar } from "@/components/tracker/SpendProgressBar"
import { TransactionForm } from "@/components/tracker/TransactionForm"
import { TransactionList } from "@/components/tracker/TransactionList"
import { FileUpload } from "@/components/tracker/FileUpload"
import { supabase } from "@/lib/supabase/client"

type CardDetail = {
  id: string
  bank: string | null
  name: string | null
  status: string | null
  current_spend: number | null
  application_date: string | null
  bonus_spend_deadline: string | null
  bonus_earned: boolean
  user_id: string
  card: {
    name: string
    bank: string
    bonus_spend_requirement: number | null
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[var(--success-bg,#dcfce7)] text-[var(--success-fg,#16a34a)]",
  cancelled: "bg-[var(--surface-strong)] text-[var(--text-secondary)]",
  pending: "bg-[var(--warning-bg,#fef3c7)] text-[var(--warning-fg,#d97706)]",
  applied: "bg-[var(--accent)]/10 text-[var(--accent)]",
}

export default function TrackerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [card, setCard] = useState<CardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [addTab, setAddTab] = useState<"manual" | "upload">("manual")

  const loadCard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data } = await supabase
      .from("user_cards")
      .select("id, bank, name, status, current_spend, application_date, bonus_spend_deadline, bonus_earned, user_id, card:cards(name, bank, bonus_spend_requirement)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    setCard(data as CardDetail | null)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadCard()
  }, [loadCard])

  function handleSpendChange() {
    loadCard()
    setRefreshKey((k) => k + 1)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-48 items-center justify-center text-[var(--text-secondary)]">Loading…</div>
      </AppShell>
    )
  }

  if (!card) {
    return (
      <AppShell>
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-[var(--text-secondary)]">Card not found.</p>
          <button onClick={() => router.push("/tracker")} className="text-sm text-[var(--accent)] underline">
            Back to tracker
          </button>
        </div>
      </AppShell>
    )
  }

  const cardName = card.name ?? card.card?.name ?? "Card"
  const bank = card.bank ?? card.card?.bank ?? ""
  const requirement = card.card?.bonus_spend_requirement ?? 0
  const statusKey = card.status ?? "active"
  const badgeClass = STATUS_BADGE[statusKey] ?? STATUS_BADGE.active

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Back button */}
        <button
          onClick={() => router.push("/tracker")}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[#4edea3]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracker
        </button>

        {/* Card header */}
        <div className="flex items-start justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
          <div>
            <p className="text-lg font-bold text-[#4edea3]">{cardName}</p>
            <p className="text-sm text-[var(--text-secondary)]">{bank}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
            {statusKey}
          </span>
        </div>

        {/* Progress bar */}
        {card.application_date && card.bonus_spend_deadline && requirement > 0 && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
            <SpendProgressBar
              currentSpend={card.current_spend ?? 0}
              requirement={requirement}
              applicationDate={card.application_date}
              deadline={card.bonus_spend_deadline}
              variant="full"
            />
          </div>
        )}

        {/* Add Transaction */}
        {userId && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center gap-1">
              {(["manual", "upload"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAddTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    addTab === tab
                      ? "bg-[var(--surface-strong)] text-[#4edea3]"
                      : "text-[var(--text-secondary)] hover:text-[#4edea3]"
                  }`}
                >
                  {tab === "manual" ? "Manual entry" : "Upload statement"}
                </button>
              ))}
            </div>
            {addTab === "manual" ? (
              <TransactionForm
                userCardId={card.id}
                userId={userId}
                onSuccess={handleSpendChange}
              />
            ) : (
              <FileUpload
                userCardId={card.id}
                userId={userId}
                onSuccess={handleSpendChange}
              />
            )}
          </div>
        )}

        {/* Transaction history */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 font-semibold text-[#4edea3]">Transaction History</h2>
          <TransactionList
            key={refreshKey}
            userCardId={card.id}
            onSpendChange={handleSpendChange}
          />
        </div>
      </div>
    </AppShell>
  )
}
