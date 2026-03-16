"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProGate, ProBadge } from "@/components/ui/ProGate"
import { supabase } from "@/lib/supabase/client"
import { calculateNetWorth } from "@/lib/pointsNetWorth"
import type { LoyaltyBalance } from "@/lib/pointsNetWorth"

const PROGRAMS: Record<string, { name: string; emoji: string; color: string }> = {
  qff:      { name: "Qantas Frequent Flyer", emoji: "🦘", color: "#E8002A" },
  velocity: { name: "Velocity Frequent Flyer", emoji: "✈", color: "#CC0000" },
  amex_mr:  { name: "Amex Membership Rewards", emoji: "💳", color: "#016FD0" },
}

const PROGRAM_KEYS = ["qff", "velocity", "amex_mr"] as const

type EditState = {
  balance: string
  expiry: string
  notes: string
}

type Props = {
  userId: string
}

export function LoyaltyBalanceWidget({ userId }: Props) {
  const [balances, setBalances] = useState<LoyaltyBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProgram, setEditingProgram] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ balance: "", expiry: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const loadBalances = async () => {
    const { data, error } = await supabase
      .from("loyalty_balances")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      toast.error("Failed to load loyalty balances")
      setLoading(false)
      return
    }

    setBalances(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadBalances()
  }, [userId])

  const getBalance = (program: string): LoyaltyBalance | undefined =>
    balances.find((b) => b.program === program)

  const handleEditClick = (program: string) => {
    const existing = getBalance(program)
    setEditState({
      balance: existing ? String(existing.balance) : "0",
      expiry: existing?.expiry_date ?? "",
      notes: existing?.notes ?? "",
    })
    setEditingProgram(program)
  }

  const handleSave = async (program: string) => {
    setSaving(true)
    const balanceVal = parseInt(editState.balance, 10) || 0

    const { error } = await supabase.from("loyalty_balances").upsert(
      {
        user_id: userId,
        program: program as 'qff' | 'velocity' | 'amex_mr',
        balance: balanceVal,
        expiry_date: editState.expiry || null,
        notes: editState.notes || null,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id,program" }
    )

    setSaving(false)

    if (error) {
      toast.error("Failed to save balance")
      return
    }

    toast.success("Balance updated")
    setEditingProgram(null)
    await loadBalances()
  }

  const { breakdown, total } = calculateNetWorth(balances)

  const getBreakdown = (program: string) => breakdown.find((b) => b.program === program)

  return (
    <ProGate feature="loyalty balances">
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[var(--text-primary)]">Points Balances</CardTitle>
            <ProBadge />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadBalances}
            className="h-7 w-7 p-0 text-[var(--text-secondary)]"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
                {PROGRAM_KEYS.map((program, idx) => {
                  const meta = PROGRAMS[program]
                  const bal = getBalance(program)
                  const bd = getBreakdown(program)
                  const isExpiringSoon = bd?.isExpiringSoon ?? false
                  const isEditing = editingProgram === program

                  return (
                    <div key={program}>
                      {idx > 0 && <div className="border-t border-[var(--border-default)]" />}

                      <div className="px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <p className="font-medium text-[var(--text-primary)]">{meta.name}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-[var(--text-secondary)]">
                                  Balance (points)
                                </Label>
                                <Input
                                  type="number"
                                  value={editState.balance}
                                  onChange={(e) =>
                                    setEditState((s) => ({ ...s, balance: e.target.value }))
                                  }
                                  className="h-8 text-sm"
                                  min={0}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-[var(--text-secondary)]">
                                  Expiry (leave blank if none)
                                </Label>
                                <Input
                                  type="date"
                                  value={editState.expiry}
                                  onChange={(e) =>
                                    setEditState((s) => ({ ...s, expiry: e.target.value }))
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[var(--text-secondary)]">Notes</Label>
                              <Input
                                value={editState.notes}
                                onChange={(e) =>
                                  setEditState((s) => ({ ...s, notes: e.target.value }))
                                }
                                className="h-8 text-sm"
                                placeholder="Optional notes"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="rounded-full text-white"
                                style={{ background: "var(--gradient-cta)" }}
                                onClick={() => handleSave(program)}
                                disabled={saving}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setEditingProgram(null)}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full text-left"
                            onClick={() => handleEditClick(program)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{meta.emoji}</span>
                                <div>
                                  <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {meta.name}
                                  </p>
                                  <p className="text-xs text-[var(--text-secondary)]">
                                    {bal?.expiry_date ? (
                                      <span
                                        className={
                                          isExpiringSoon ? "text-amber-500" : ""
                                        }
                                      >
                                        Expires:{" "}
                                        {new Date(bal.expiry_date).toLocaleDateString("en-AU", {
                                          month: "short",
                                          year: "2-digit",
                                        })}
                                      </span>
                                    ) : (
                                      "No expiry"
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                  {(bal?.balance ?? 0).toLocaleString()} pts
                                </p>
                                <p
                                  className={`text-xs font-medium ${
                                    isExpiringSoon
                                      ? "text-amber-500"
                                      : "text-[var(--text-secondary)]"
                                  }`}
                                >
                                  ${(bd?.audValue ?? 0).toFixed(0)} AUD
                                </p>
                                {bal?.last_updated && (
                                  <p className="text-[10px] text-[var(--text-secondary)]">
                                    {formatDistanceToNow(new Date(bal.last_updated), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Total points net worth
                </p>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  ${total.toFixed(0)} AUD
                </p>
              </div>

              {/* Add/update hint */}
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border-default)] py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]"
                onClick={() => handleEditClick(PROGRAM_KEYS[0])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add / Update Balance
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </ProGate>
  )
}
