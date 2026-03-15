"use client"

import { useRouter } from "next/navigation"
import { Wallet, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"

export function SpendingEmptyState() {
  const router = useRouter()

  const ghostPreview = (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 text-left space-y-2">
      {["Groceries", "Dining", "Travel"].map((cat) => (
        <div key={cat} className="flex items-center gap-2">
          <span className="w-16 text-xs text-[var(--text-secondary)]">{cat}</span>
          <div className="flex-1 h-2 rounded-full bg-[var(--surface-strong)]" />
          <span className="text-xs text-[var(--text-secondary)]">$—</span>
        </div>
      ))}
    </div>
  )

  return (
    <EmptyState
      icon={<Wallet className="h-8 w-8" />}
      heading="Your recommendations are only as good as your spending data."
      body="Takes 2 minutes — use estimates, update anytime. We'll personalise your reward gap based on your actual spending mix."
      ghost={ghostPreview}
      cta={
        <>
          <Button
            className="rounded-full text-white shadow-sm"
            style={{ background: "var(--gradient-cta)" }}
            onClick={() => router.push("/spending")}
          >
            Set up my spending profile
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/statements")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import bank statement
          </Button>
        </>
      }
      socialProof="Tip: Import your bank statement to auto-populate your spending categories."
    />
  )
}
