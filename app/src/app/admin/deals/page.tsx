"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type Deal = Database["public"]["Tables"]["deals"]["Row"]
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"]

const ADMIN_EMAIL = "john.g.keto+rewardrelay@gmail.com"

const ISSUERS = [
  "ANZ",
  "American Express",
  "NAB",
  "Westpac",
  "CBA",
  "St.George",
  "Bankwest",
  "HSBC",
  "Virgin Money",
  "Macquarie",
  "Qantas",
  "Other",
]

const NETWORKS = ["visa", "mastercard", "amex", "any"]

const emptyForm: Partial<DealInsert> = {
  title: "",
  description: "",
  merchant: "",
  deal_url: "",
  specific_issuer: null,
  card_network: null,
  valid_from: null,
  valid_until: null,
  is_active: true,
}

export default function AdminDealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [form, setForm] = useState<Partial<DealInsert>>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      router.replace("/dashboard")
      return
    }
    await loadDeals()
  }

  const loadDeals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      toast.error("Failed to load deals")
    } else {
      setDeals(data ?? [])
    }
    setLoading(false)
  }

  const openAddModal = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (deal: Deal) => {
    setEditing(deal)
    setForm({
      title: deal.title,
      description: deal.description ?? "",
      merchant: deal.merchant,
      deal_url: deal.deal_url,
      specific_issuer: deal.specific_issuer,
      card_network: deal.card_network,
      valid_from: deal.valid_from,
      valid_until: deal.valid_until,
      is_active: deal.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.deal_url) {
      toast.error("Title and Deal URL are required")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from("deals")
          .update({
            title: form.title,
            description: form.description || null,
            merchant: form.merchant || "Various",
            deal_url: form.deal_url,
            specific_issuer: form.specific_issuer || null,
            card_network: form.card_network || null,
            valid_from: form.valid_from || null,
            valid_until: form.valid_until || null,
            is_active: form.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id)
        if (error) throw error
        toast.success("Deal updated")
      } else {
        const { error } = await supabase.from("deals").insert({
          title: form.title,
          description: form.description || null,
          merchant: form.merchant || "Various",
          deal_url: form.deal_url!,
          specific_issuer: form.specific_issuer || null,
          card_network: form.card_network || null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
          is_active: form.is_active ?? true,
          source: "manual",
          source_url: form.deal_url,
        })
        if (error) throw error
        toast.success("Deal added")
      }
      setModalOpen(false)
      await loadDeals()
    } catch (err) {
      toast.error("Failed to save deal")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (deal: Deal) => {
    const { error } = await supabase
      .from("deals")
      .update({ is_active: !deal.is_active, updated_at: new Date().toISOString() })
      .eq("id", deal.id)
    if (error) {
      toast.error("Failed to update deal")
    } else {
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, is_active: !d.is_active } : d))
      )
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("deals").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete deal")
    } else {
      toast.success("Deal deleted")
      setDeals((prev) => prev.filter((d) => d.id !== id))
    }
    setDeleteConfirmId(null)
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Admin: Deal Management
          </h1>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Deal
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                  Title
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-[var(--text-secondary)] md:table-cell">
                  Issuer
                </th>
                <th className="hidden px-4 py-3 text-left font-semibold text-[var(--text-secondary)] md:table-cell">
                  Expires
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">
                  Active
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[var(--text-secondary)]"
                  >
                    No deals yet. Click &ldquo;Add New Deal&rdquo; to get started.
                  </td>
                </tr>
              )}
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-muted)]"
                >
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium text-[var(--text-primary)]">
                      {deal.title}
                    </p>
                    {deal.source === "manual" && (
                      <Badge className="mt-1 text-xs" variant="outline">
                        manual
                      </Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--text-secondary)] md:table-cell">
                    {deal.specific_issuer ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--text-secondary)] md:table-cell">
                    {formatDate(deal.valid_until)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(deal)}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: deal.is_active
                          ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                          : "color-mix(in srgb, #ef4444 10%, transparent)",
                        color: deal.is_active ? "var(--accent)" : "#ef4444",
                      }}
                    >
                      {deal.is_active ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                      {deal.is_active ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(deal)}
                        className="h-7 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(deal.id)}
                        className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Deal" : "Add New Deal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="deal-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deal-title"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ANZ FF Black 120k bonus"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-description">Description</Label>
              <textarea
                id="deal-description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Details about the offer..."
                rows={3}
                className="w-full rounded-md border border-[var(--border-default)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-merchant">Merchant</Label>
              <Input
                id="deal-merchant"
                value={form.merchant ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
                placeholder="ANZ"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-url">
                Deal URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deal-url"
                type="url"
                value={form.deal_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, deal_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Specific Issuer</Label>
                <Select
                  value={form.specific_issuer ?? "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      specific_issuer: v === "none" ? null : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any issuer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any issuer</SelectItem>
                    {ISSUERS.map((issuer) => (
                      <SelectItem key={issuer} value={issuer}>
                        {issuer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Card Network</Label>
                <Select
                  value={form.card_network ?? "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      card_network: v === "none" ? null : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any network</SelectItem>
                    {NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deal-valid-from">Valid From</Label>
                <Input
                  id="deal-valid-from"
                  type="date"
                  value={form.valid_from ? form.valid_from.split("T")[0] : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      valid_from: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-valid-until">Valid Until</Label>
                <Input
                  id="deal-valid-until"
                  type="date"
                  value={form.valid_until ? form.valid_until.split("T")[0] : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      valid_until: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="deal-active">Active</Label>
              <button
                id="deal-active"
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: form.is_active
                    ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                    : "color-mix(in srgb, #ef4444 10%, transparent)",
                  color: form.is_active ? "var(--accent)" : "#ef4444",
                }}
              >
                {form.is_active ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
                {form.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete this deal? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
