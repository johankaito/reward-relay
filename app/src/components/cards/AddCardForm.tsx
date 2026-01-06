"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { CardRecord } from "./CardGrid"

type Props = {
  cards: CardRecord[]
  onCreated?: () => void
}

const statuses: Database["public"]["Tables"]["user_cards"]["Row"]["status"][] = [
  "active",
  "pending",
  "applied",
  "cancelled",
]

export function AddCardForm({ cards, onCreated }: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string>("")
  const [bank, setBank] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<
    Database["public"]["Tables"]["user_cards"]["Row"]["status"]
  >("active")
  const [applicationDate, setApplicationDate] = useState("")
  const [cancellationDate, setCancellationDate] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId),
    [cards, selectedCardId],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be signed in to track a card.")
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from("user_cards").insert({
        user_id: user.id,
        card_id: selectedCardId || null,
        bank: bank || selectedCard?.bank || null,
        name: name || selectedCard?.name || null,
        status,
        application_date: applicationDate || null,
        cancellation_date: cancellationDate || null,
        annual_fee: annualFee ? Number(annualFee) : selectedCard?.annual_fee ?? null,
        notes: notes || null,
      })

      if (error) throw error

      toast.success("Card tracked")
      setSelectedCardId("")
      setBank("")
      setName("")
      setStatus("active")
      setApplicationDate("")
      setCancellationDate("")
      setAnnualFee("")
      setNotes("")
      onCreated?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save card. Try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
      <CardHeader className="border-b border-[var(--border-default)] bg-[var(--surface-strong)]/60">
        <CardTitle className="text-lg text-white">Track a card</CardTitle>
        <p className="text-sm text-slate-300">
          Pick from catalog or add custom. Add your primary card and churn target first.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-200">Select from catalog (optional)</Label>
            <Select
              value={selectedCardId || "none"}
              onValueChange={(value) => {
                setSelectedCardId(value === "none" ? "" : value)
                const found = cards.find((c) => c.id === value)
                if (found) {
                  setBank(found.bank)
                  setName(found.name)
                  setAnnualFee(found.annual_fee ? String(found.annual_fee) : "")
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Custom / not in catalog --</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.bank} — {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank" className="text-slate-200">
              Bank
            </Label>
            <Input
              id="bank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="e.g. ANZ"
              required={!selectedCard}
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Card name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frequent Flyer Black"
              required={!selectedCard}
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-200">
              Status
            </Label>
            <Select value={status ?? undefined} onValueChange={(v) => setStatus(v as typeof status)}>
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

          <div className="space-y-2">
            <Label htmlFor="applicationDate" className="text-slate-200">
              Application date
            </Label>
            <Input
              id="applicationDate"
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationDate" className="text-slate-200">
              Cancellation date
            </Label>
            <Input
              id="cancellationDate"
              type="date"
              value={cancellationDate}
              onChange={(e) => setCancellationDate(e.target.value)}
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualFee" className="text-slate-200">
              Annual fee
            </Label>
            <Input
              id="annualFee"
              type="number"
              inputMode="decimal"
              value={annualFee}
              onChange={(e) => setAnnualFee(e.target.value)}
              placeholder="e.g. 425"
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes" className="text-slate-200">
              Notes
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reminder or spend target"
              className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? "Saving..." : "Track this card"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
