"use client"

import { useState, useEffect } from "react"
import { Check, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import { PLANS } from "@/lib/stripe/config"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREE_FEATURES = [
  "Track up to 3 cards",
  "Basic reminders",
  "12-month rule tracking",
  "Manual transaction entry",
]

const PRO_FEATURES = [
  "Unlimited cards",
  "All personalised recommendations",
  "Card comparison tool (ranked by net value)",
  "Goal projections & timeline",
  "Daily insights & deals",
  "CSV statement upload",
  "Priority support",
]

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { trackEvent } = useAnalytics()
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)

  useEffect(() => {
    if (open) {
      trackEvent("upgrade_clicked", {
        source: "paywall",
      })
    }
  }, [open, trackEvent])

  const handleCheckout = async (plan: "monthly" | "annual") => {
    setLoading(plan)

    trackEvent("checkout_started", {
      tier: "pro",
      trial_status: "no_trial",
      days_since_signup: 0,
    })

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/"
          return
        }
        throw new Error(`Checkout error ${res.status}`)
      }

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err) {
      console.error("Checkout failed", err)
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--border-default)] bg-[var(--surface)] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Sparkles className="h-6 w-6 text-[#4edea3]" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-on-surface">
            Unlock all features with a 7-day free trial
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold text-on-surface-variant">Free</p>
            <p className="mt-1 text-2xl font-bold text-white">$0</p>
            <p className="text-xs text-on-surface-variant">Current plan</p>
            <ul className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-on-surface-variant" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-[#4edea3]/30 bg-[#4edea3]/5 p-4">
            <p className="text-sm font-semibold text-[#4edea3]">Pro</p>
            <p className="mt-1 text-2xl font-bold text-white">
              $9.99<span className="text-sm font-normal text-on-surface-variant">/mo</span>
            </p>
            <p className="text-xs text-[#4edea3]">7-day free trial</p>
            <ul className="mt-4 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4edea3]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => handleCheckout("monthly")}
            disabled={loading !== null}
            className="w-full rounded-full text-white shadow-lg"
            style={{ background: "var(--gradient-cta)" }}
          >
            {loading === "monthly" ? "Redirecting..." : `Start Trial — ${PLANS.monthly.display}`}
          </Button>
          <Button
            onClick={() => handleCheckout("annual")}
            disabled={loading !== null}
            variant="outline"
            className="w-full rounded-full"
          >
            {loading === "annual" ? "Redirecting..." : `Start Trial — ${PLANS.annual.display} (${PLANS.annual.savings})`}
          </Button>
          <p className="text-center text-xs text-on-surface-variant">
            Cancel anytime during your 7-day trial. No charge until trial ends.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
