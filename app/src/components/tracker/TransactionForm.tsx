"use client"

import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

const EXCLUSION_REASONS = [
  { value: "annual_fee", label: "Annual fee" },
  { value: "cash_advance", label: "Cash advance" },
  { value: "bpay", label: "BPAY" },
  { value: "balance_transfer", label: "Balance transfer" },
  { value: "other", label: "Other" },
]

type Props = {
  userCardId: string
  userId: string
  onSuccess: () => void
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

export function TransactionForm({ userCardId, userId, onSuccess }: Props) {
  const [date, setDate] = useState(todayISO())
  const [merchant, setMerchant] = useState("")
  const [amount, setAmount] = useState("")
  const [excluded, setExcluded] = useState(false)
  const [exclusionReason, setExclusionReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please fill in all required fields with valid values.")
      return
    }
    if (excluded && !exclusionReason) {
      toast.error("Please select an exclusion reason.")
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from("spending_transactions").insert({
      user_card_id: userCardId,
      user_id: userId,
      transaction_date: date,
      merchant: merchant.trim(),
      amount: parsedAmount,
      description: merchant.trim(),
      excluded,
      exclusion_reason: excluded ? exclusionReason : null,
    })
    setSubmitting(false)

    if (error) {
      toast.error("Failed to add transaction")
      return
    }

    toast.success("Transaction added")
    setDate(todayISO())
    setMerchant("")
    setAmount("")
    setExcluded(false)
    setExclusionReason("")
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Merchant <span className="text-[var(--danger,#dc2626)]">*</span>
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Woolworths"
            required
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Amount (AUD) <span className="text-[var(--danger,#dc2626)]">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={excluded}
            onChange={(e) => {
              setExcluded(e.target.checked)
              if (!e.target.checked) setExclusionReason("")
            }}
            className="rounded border-[var(--border-default)]"
          />
          Exclude from min-spend
        </label>

        {excluded && (
          <select
            value={exclusionReason}
            onChange={(e) => setExclusionReason(e.target.value)}
            required={excluded}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          >
            <option value="">Select reason…</option>
            {EXCLUSION_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        style={{ background: "var(--gradient-cta)" }}
      >
        {submitting ? "Adding…" : "Add transaction"}
      </button>
    </form>
  )
}
