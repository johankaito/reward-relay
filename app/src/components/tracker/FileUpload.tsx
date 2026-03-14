"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

type ParsedTransaction = {
  date: string
  merchant: string
  amount: number
  excluded: boolean
}

type Props = {
  userCardId: string
  userId: string
  onSuccess: () => void
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
}

export function FileUpload({ userCardId, userId, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [transactions, setTransactions] = useState<ParsedTransaction[] | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["text/csv", "application/pdf", "text/plain", "application/octet-stream"]
    const ext = file.name.toLowerCase().split(".").pop() ?? ""
    const allowedExts = ["csv", "ofx", "qif", "pdf"]
    if (!allowedExts.includes(ext) && !allowed.includes(file.type)) {
      toast.error("Unsupported file type. Upload CSV, OFX, QIF, or PDF.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)")
      return
    }

    setParsing(true)
    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/api/tracker/parse-transactions", { method: "POST", body: form })
    setParsing(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error((err as { error?: string }).error ?? "Failed to parse file")
      return
    }

    const { transactions: parsed } = (await res.json()) as { transactions: Array<{ date: string; merchant: string; amount: number }> }
    setTransactions(parsed.map((t) => ({ ...t, excluded: false })))
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  async function confirmImport() {
    if (!transactions?.length) return
    setSaving(true)

    const rows = transactions.map((t) => ({
      user_card_id: userCardId,
      user_id: userId,
      transaction_date: t.date,
      merchant: t.merchant,
      description: t.merchant,
      amount: t.amount,
      excluded: t.excluded,
      exclusion_reason: null,
    }))

    const { error } = await supabase.from("spending_transactions").insert(rows)
    setSaving(false)

    if (error) {
      toast.error("Failed to import transactions")
      return
    }

    toast.success(`Imported ${rows.length} transaction${rows.length === 1 ? "" : "s"}`)
    setTransactions(null)
    onSuccess()
  }

  if (transactions) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {transactions.length} transaction{transactions.length === 1 ? "" : "s"} found
          </p>
          <button
            onClick={() => setTransactions(null)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border-default)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface-subtle)]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Merchant</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">Amount</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Exclude</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={i}
                  className={`border-t border-[var(--border-default)] ${tx.excluded ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{tx.merchant}</td>
                  <td className="px-3 py-2 text-right font-medium text-[var(--text-primary)]">
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={tx.excluded}
                      onChange={(e) =>
                        setTransactions((prev) =>
                          prev!.map((t, j) => j === i ? { ...t, excluded: e.target.checked } : t)
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={confirmImport}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--gradient-cta)" }}
          >
            <CheckCircle className="h-4 w-4" />
            {saving ? "Importing…" : `Import ${transactions.filter((t) => !t.excluded).length} transactions`}
          </button>
          <button
            onClick={() => setTransactions(null)}
            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border-default)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-subtle)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.ofx,.qif,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {parsing ? (
        <p className="text-sm text-[var(--text-secondary)]">Parsing file…</p>
      ) : (
        <>
          <Upload className="h-8 w-8 text-[var(--text-secondary)]/40" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Drop a statement file or click to browse
          </p>
          <p className="text-xs text-[var(--text-secondary)]">CSV, OFX, QIF, or PDF — max 10MB</p>
        </>
      )}
    </div>
  )
}
