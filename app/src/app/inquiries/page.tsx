"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, subMonths } from "date-fns"
import { toast } from "sonner"
import { PlusCircle, Trash2, Pencil } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { CadenceAdvisor } from "@/components/inquiries/CadenceAdvisor"
import type { Database } from "@/types/database.types"

type CreditInquiry = Database["public"]["Tables"]["credit_inquiries"]["Row"]
type BankRule = Database["public"]["Tables"]["bank_rules"]["Row"]

type OutcomeType = "approved" | "declined" | "pending" | "withdrawn"

const OUTCOME_LABELS: Record<OutcomeType, string> = {
  approved: "Approved",
  declined: "Declined",
  pending: "Pending",
  withdrawn: "Withdrawn",
}

const OUTCOME_STYLES: Record<OutcomeType, string> = {
  approved: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  declined: "bg-red-100 text-[var(--danger)]",
  pending: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  withdrawn: "bg-[var(--surface-strong)] text-[var(--text-secondary)]",
}

const AU_BANKS = [
  "ANZ",
  "American Express",
  "Bankwest",
  "CBA",
  "Citi",
  "HSBC",
  "Macquarie",
  "NAB",
  "St.George",
  "Virgin Money",
  "Westpac",
  "Other",
]

const DEFAULT_FORM = {
  bank: "",
  card_name: "",
  application_date: format(new Date(), "yyyy-MM-dd"),
  outcome: "pending" as OutcomeType,
  notes: "",
}

export default function InquiriesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<CreditInquiry[]>([])
  const [bankRules, setBankRules] = useState<BankRule[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<CreditInquiry>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const loadInquiries = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent("/inquiries")}`)
      return
    }

    const [inquiriesResult, rulesResult] = await Promise.all([
      supabase
        .from("credit_inquiries")
        .select("*")
        .order("application_date", { ascending: false }),
      supabase.from("bank_rules").select("*").order("bank"),
    ])

    if (inquiriesResult.error) {
      toast.error(inquiriesResult.error.message || "Unable to load inquiries")
    } else {
      setInquiries(inquiriesResult.data ?? [])
    }

    if (!rulesResult.error) {
      setBankRules(rulesResult.data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadInquiries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bank || !form.card_name || !form.application_date) {
      toast.error("Bank, card name, and date are required")
      return
    }
    setSubmitting(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.error("Not authenticated")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("credit_inquiries").insert({
      user_id: session.user.id,
      bank: form.bank,
      card_name: form.card_name,
      application_date: form.application_date,
      outcome: form.outcome,
      notes: form.notes || null,
    })

    if (error) {
      toast.error(error.message || "Failed to add application")
    } else {
      toast.success("Application added")
      setForm(DEFAULT_FORM)
      await loadInquiries()
    }
    setSubmitting(false)
  }

  const handleEditSave = async (id: string) => {
    const { error } = await supabase
      .from("credit_inquiries")
      .update({
        outcome: editForm.outcome,
        notes: editForm.notes ?? null,
      })
      .eq("id", id)

    if (error) {
      toast.error(error.message || "Failed to update")
    } else {
      toast.success("Updated")
      setEditingId(null)
      setEditForm({})
      await loadInquiries()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("credit_inquiries").delete().eq("id", id)
    if (error) {
      toast.error(error.message || "Failed to delete")
    } else {
      toast.success("Deleted")
      setDeleteConfirmId(null)
      await loadInquiries()
    }
  }

  const now = new Date()
  const last3m = inquiries.filter(
    (i) => new Date(i.application_date) > subMonths(now, 3)
  ).length
  const last6m = inquiries.filter(
    (i) => new Date(i.application_date) > subMonths(now, 6)
  ).length
  const last12m = inquiries.filter(
    (i) => new Date(i.application_date) > subMonths(now, 12)
  ).length

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Credit
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            Credit Tracker
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Monitor your application history
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Last 3 months
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-2xl font-semibold text-[var(--text-primary)]">
              {last3m}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Last 6 months
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-2xl font-semibold text-[var(--text-primary)]">
              {last6m}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Last 12 months
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-2xl font-semibold text-[var(--text-primary)]">
              {last12m}
            </CardContent>
          </Card>
        </div>

        {/* Add application form */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="border-b border-[var(--border-default)]">
            <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <PlusCircle className="h-4 w-4 text-[var(--accent)]" />
              Add Application
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Bank */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Bank
                  </label>
                  <Select
                    value={form.bank}
                    onValueChange={(v) => setForm((f) => ({ ...f, bank: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {AU_BANKS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Card name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Card name
                  </label>
                  <input
                    type="text"
                    value={form.card_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, card_name: e.target.value }))
                    }
                    placeholder="e.g. ANZ Frequent Flyer Black"
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Application date
                  </label>
                  <input
                    type="date"
                    value={form.application_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, application_date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Outcome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Outcome
                  </label>
                  <Select
                    value={form.outcome}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, outcome: v as OutcomeType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Any notes about this application..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="text-white shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
              >
                {submitting ? "Adding..." : "Add Application"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Application history table */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="border-b border-[var(--border-default)]">
            <CardTitle className="text-[var(--text-primary)]">Application history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inquiries.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
                No applications tracked yet. Add your first one above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        Card
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        Outcome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-secondary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {inquiries.map((inquiry) => {
                      const isEditing = editingId === inquiry.id
                      const isDeleteConfirm = deleteConfirmId === inquiry.id
                      const outcome = (inquiry.outcome ?? "pending") as OutcomeType

                      return (
                        <tr
                          key={inquiry.id}
                          className="transition-colors hover:bg-[var(--surface-subtle)]"
                        >
                          {/* Date */}
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                            {format(new Date(inquiry.application_date), "d MMM yyyy")}
                          </td>

                          {/* Card */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text-primary)]">
                              {inquiry.card_name}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              {inquiry.bank}
                            </div>
                          </td>

                          {/* Outcome */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Select
                                value={(editForm.outcome ?? outcome) as string}
                                onValueChange={(v) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    outcome: v as OutcomeType,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="declined">Declined</SelectItem>
                                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_STYLES[outcome]}`}
                              >
                                {OUTCOME_LABELS[outcome]}
                              </span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="max-w-[200px] px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.notes ?? ""}
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    notes: e.target.value,
                                  }))
                                }
                                className="w-full rounded border border-[var(--border-default)] bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                              />
                            ) : (
                              <span className="truncate text-xs text-[var(--text-secondary)]">
                                {inquiry.notes ?? "—"}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {isDeleteConfirm ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-[var(--text-secondary)]">
                                  Delete?
                                </span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleDelete(inquiry.id)}
                                >
                                  Yes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  No
                                </Button>
                              </div>
                            ) : isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs text-white"
                                  style={{ background: "var(--gradient-cta)" }}
                                  onClick={() => handleEditSave(inquiry.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditForm({})
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                  onClick={() => {
                                    setEditingId(inquiry.id)
                                    setEditForm({
                                      outcome: inquiry.outcome,
                                      notes: inquiry.notes ?? "",
                                    })
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-[var(--danger)]"
                                  onClick={() => setDeleteConfirmId(inquiry.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safe Cadence Advisor — Pro feature */}
        {bankRules.length > 0 && (
          <CadenceAdvisor
            inquiries={inquiries}
            bankRules={bankRules}
            isPro={false}
          />
        )}
      </div>
    </AppShell>
  )
}
