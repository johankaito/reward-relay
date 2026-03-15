"use client"

import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"

export function CardsEmptyState() {
  const router = useRouter()

  const ghostPreview = (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 text-left">
      <p className="text-xs font-medium text-[var(--text-secondary)]">ANZ Rewards Visa</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">1.0 pt per $1</p>
      <div className="mt-2 h-2 rounded-full bg-[var(--surface-strong)]" />
      <div className="mt-1.5 h-2 w-2/3 rounded-full bg-[var(--surface-strong)]" />
    </div>
  )

  return (
    <EmptyState
      icon={<CreditCard className="h-8 w-8" />}
      heading="Your reward engine starts here."
      body="See exactly how much you're earning — and where you're missing out. Add your current cards to get started."
      ghost={ghostPreview}
      cta={
        <Button
          className="rounded-full text-white shadow-sm"
          style={{ background: "var(--gradient-cta)" }}
          onClick={() => router.push("/cards")}
        >
          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
          Add your first card
        </Button>
      }
      socialProof="The average Australian holds 2 rewards cards — most don't know their earn rates by category."
    />
  )
}
