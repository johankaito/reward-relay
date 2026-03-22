"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

interface EditCardModalProps {
  card: UserCard | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const statuses: UserCard["status"][] = [
  "active",
  "pending",
  "applied",
  "cancelled",
]

export function EditCardModal({ card, isOpen, onClose, onUpdate }: EditCardModalProps) {
  const [bank, setBank] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<UserCard["status"]>("active")
  const [applicationDate, setApplicationDate] = useState("")
  const [cancellationDate, setCancellationDate] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const [notes, setNotes] = useState("")
  const [isBusiness, setIsBusiness] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (card) {
      setBank(card.bank || "")
      setName(card.name || "")
      setStatus(card.status || "active")
      setApplicationDate(card.application_date || "")
      setCancellationDate(card.cancellation_date || "")
      setAnnualFee(card.annual_fee ? String(card.annual_fee) : "")
      setNotes(card.notes || "")
      setIsBusiness(card.is_business || false)
    }
  }, [card])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!card) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("user_cards")
        .update({
          bank: bank || null,
          name: name || null,
          status,
          application_date: applicationDate || null,
          cancellation_date: cancellationDate || null,
          annual_fee: annualFee ? Number(annualFee) : null,
          notes: notes || null,
          is_business: isBusiness,
        })
        .eq("id", card.id)

      if (error) throw error

      toast.success("Card updated successfully")
      onUpdate()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update card"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!card) return
    if (!confirm("Are you sure you want to delete this card?")) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("user_cards")
        .delete()
        .eq("id", card.id)

      if (error) throw error

      toast.success("Card deleted successfully")
      onUpdate()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete card"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[var(--surface)] border-[var(--border-default)] text-white">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription className="text-on-surface">
            Update card details or delete it from your portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank" className="text-on-surface">
              Bank
            </Label>
            <Input
              id="bank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="e.g. ANZ"
              required
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-on-surface">
              Card Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frequent Flyer Black"
              required
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-on-surface">
              Status
            </Label>
            <Select value={status ?? undefined} onValueChange={(v) => setStatus(v as UserCard["status"])}>
              <SelectTrigger className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s ?? "active"} value={s ?? "active"}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicationDate" className="text-on-surface">
                Application Date
              </Label>
              <Input
                id="applicationDate"
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationDate" className="text-on-surface">
                Cancellation Date
              </Label>
              <Input
                id="cancellationDate"
                type="date"
                value={cancellationDate}
                onChange={(e) => setCancellationDate(e.target.value)}
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualFee" className="text-on-surface">
              Annual Fee
            </Label>
            <Input
              id="annualFee"
              type="number"
              value={annualFee}
              onChange={(e) => setAnnualFee(e.target.value)}
              placeholder="e.g. 425"
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-on-surface">
              Notes
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reminder or notes"
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] p-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Business card</p>
              <p className="text-xs text-[var(--text-secondary)]">Flag for FBT tracking and business P&L</p>
            </div>
            <Switch
              checked={isBusiness}
              onCheckedChange={setIsBusiness}
            />
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete Card
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}