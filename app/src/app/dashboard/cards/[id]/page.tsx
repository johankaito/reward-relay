"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Pencil } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

export default function CardDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.id as string

  const [card, setCard] = useState<UserCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadCard = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/")
      return
    }

    const { data, error } = await supabase
      .from("user_cards")
      .select("*")
      .eq("id", cardId)
      .single()

    if (error) {
      toast.error(error.message || "Unable to load card details")
      setLoading(false)
      return
    }

    setCard(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCard()
  }, [cardId, router])

  const handleUpdateComplete = () => {
    loadCard() // Reload card after edit
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading card details...
        </div>
      </AppShell>
    )
  }

  if (!card) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
            Card not found
          </div>
        </div>
      </AppShell>
    )
  }

  const status = card.status || "active"

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
          <Button
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit card
          </Button>
        </div>

        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-[var(--info-bg)] text-[var(--info-fg)]">
                  {card.bank || "Custom"}
                </Badge>
                <CardTitle className="text-2xl text-white">
                  {card.name || "Untitled card"}
                </CardTitle>
              </div>
              <Badge className="capitalize" style={statusStyle(status)}>
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Application Date
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {card.application_date || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Cancellation Target
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {card.cancellation_date || "Not set"}
                </p>
              </div>
            </div>

            {card.notes && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                  Notes
                </p>
                <p className="text-sm text-slate-200">{card.notes}</p>
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                Card Information
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-medium capitalize text-white">{status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank:</span>
                  <span className="font-medium text-white">{card.bank || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Added:</span>
                  <span className="font-medium text-white">
                    {card.created_at
                      ? new Date(card.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditCardModal
        card={card}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateComplete}
      />
    </AppShell>
  )
}

function statusStyle(status: string) {
  if (status === "active") {
    return { backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }
  }
  if (status === "pending" || status === "applied") {
    return { backgroundColor: "var(--warning-bg)", color: "var(--warning-fg)" }
  }
  if (status === "cancelled") {
    return { backgroundColor: "var(--surface-strong)", color: "var(--text-primary)" }
  }
  return {}
}
