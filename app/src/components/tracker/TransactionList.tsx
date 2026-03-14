"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Transaction = {
  id: string
  transaction_date: string
  merchant: string | null
  description: string | null
  amount: number
  excluded: boolean
  exclusion_reason: string | null
}

const EXCLUSION_REASONS = [
  { value: "annual_fee", label: "Annual fee" },
  { value: "cash_advance", label: "Cash advance" },
  { value: "bpay", label: "BPAY" },
  { value: "balance_transfer", label: "Balance transfer" },
  { value: "other", label: "Other" },
]

type Props = {
  userCardId: string
  onSpendChange?: () => void
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
}

export function TransactionList({ userCardId, onSpendChange }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [inlineExclude, setInlineExclude] = useState<string | null>(null)
  const [pendingReason, setPendingReason] = useState<string>("")

  async function fetchTransactions() {
    const { data } = await supabase
      .from("spending_transactions")
      .select("id, transaction_date, merchant, description, amount, excluded, exclusion_reason")
      .eq("user_card_id", userCardId)
      .order("transaction_date", { ascending: false })

    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [userCardId])

  const counted = transactions.filter((t) => !t.excluded)
  const excluded = transactions.filter((t) => t.excluded)
  const total = counted.reduce((s, t) => s + t.amount, 0)

  async function toggleExclude(tx: Transaction) {
    if (!tx.excluded) {
      // Show inline reason dropdown
      setInlineExclude(tx.id)
      setPendingReason("")
      return
    }
    // Un-exclude immediately
    const optimistic = transactions.map((t) =>
      t.id === tx.id ? { ...t, excluded: false, exclusion_reason: null } : t
    )
    setTransactions(optimistic)
    const { error } = await supabase
      .from("spending_transactions")
      .update({ excluded: false, exclusion_reason: null })
      .eq("id", tx.id)
    if (error) {
      toast.error("Failed to update transaction")
      fetchTransactions()
    } else {
      onSpendChange?.()
    }
  }

  async function saveExclusion(txId: string) {
    if (!pendingReason) { setInlineExclude(null); return }
    const optimistic = transactions.map((t) =>
      t.id === txId ? { ...t, excluded: true, exclusion_reason: pendingReason } : t
    )
    setTransactions(optimistic)
    setInlineExclude(null)
    const { error } = await supabase
      .from("spending_transactions")
      .update({ excluded: true, exclusion_reason: pendingReason })
      .eq("id", txId)
    if (error) {
      toast.error("Failed to update transaction")
      fetchTransactions()
    } else {
      onSpendChange?.()
    }
  }

  async function deleteTransaction(txId: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== txId))
    const { error } = await supabase
      .from("spending_transactions")
      .delete()
      .eq("id", txId)
    if (error) {
      toast.error("Failed to delete transaction")
      fetchTransactions()
    } else {
      toast.success("Transaction deleted")
      onSpendChange?.()
    }
  }

  if (loading) {
    return <div className="py-6 text-center text-sm text-[var(--text-secondary)]">Loading transactions…</div>
  }

  return (
    <div className="space-y-3">
      {/* Running totals */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
        <span>
          <span className="font-semibold text-[var(--text-primary)]">{counted.length}</span> counted
          {" · "}
          <span className="font-semibold text-[var(--text-primary)]">{fmt(total)}</span>
        </span>
        {excluded.length > 0 && (
          <span className="text-[var(--text-secondary)]/70">
            {excluded.length} excluded
          </span>
        )}
        <span className="text-[var(--text-secondary)]/70">
          {transactions.length} total
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
          No transactions yet. Add one above.
        </p>
      ) : (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Merchant</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">Amount</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Exclude</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Delete</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <>
                  <tr
                    key={tx.id}
                    className={`border-b border-[var(--border-default)] last:border-0 ${tx.excluded ? "opacity-50" : ""}`}
                  >
                    <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">
                      {tx.merchant ?? tx.description ?? "—"}
                      {tx.excluded && tx.exclusion_reason && (
                        <span className="ml-2 text-xs text-[var(--text-secondary)]">
                          ({EXCLUSION_REASONS.find((r) => r.value === tx.exclusion_reason)?.label ?? tx.exclusion_reason})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-[var(--text-primary)]">
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleExclude(tx)}
                        className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                          tx.excluded
                            ? "bg-[var(--surface-strong)] text-[var(--text-secondary)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger,#dc2626)]"
                            : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--warning-bg,#fef3c7)] hover:text-[var(--warning-fg,#d97706)]"
                        }`}
                        title={tx.excluded ? "Un-exclude" : "Exclude"}
                      >
                        {tx.excluded ? "Excluded" : "Exclude"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="rounded p-1 text-[var(--text-secondary)]/50 transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger,#dc2626)]"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the{" "}
                              <strong>{tx.merchant ?? tx.description ?? "transaction"}</strong> entry
                              for {fmt(tx.amount)}. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTransaction(tx.id)}
                              className="bg-[var(--danger,#dc2626)] text-white hover:bg-[var(--danger,#dc2626)]/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                  {/* Inline exclusion reason */}
                  {inlineExclude === tx.id && (
                    <tr key={`${tx.id}-reason`} className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      <td colSpan={5} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Reason:</span>
                          <select
                            value={pendingReason}
                            onChange={(e) => setPendingReason(e.target.value)}
                            className="rounded border border-[var(--border-default)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)]"
                            autoFocus
                          >
                            <option value="">Select reason…</option>
                            {EXCLUSION_REASONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveExclusion(tx.id)}
                            disabled={!pendingReason}
                            className="rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setInlineExclude(null)}
                            className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
