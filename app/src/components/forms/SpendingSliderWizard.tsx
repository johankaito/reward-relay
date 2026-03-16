"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import {
  NATIONAL_AVERAGE_SPEND,
  SPEND_CATEGORY_LABELS,
  SPEND_CATEGORY_RANGES,
  type SpendCategory,
} from "@/lib/constants"

const CATEGORIES: SpendCategory[] = ["groceries", "dining", "travel", "fuel", "other"]

function formatDollars(n: number): string {
  return `$${n.toLocaleString("en-AU")}`
}

type SpendValues = Record<SpendCategory, number>

type Props = {
  userId: string
  existingValues?: Partial<SpendValues>
  stepLabel?: string
  onSaved?: () => void
}

export function SpendingSliderWizard({ userId, existingValues, stepLabel = "Step 2 of 3", onSaved }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [values, setValues] = useState<SpendValues>({
    groceries: existingValues?.groceries ?? NATIONAL_AVERAGE_SPEND.groceries,
    dining: existingValues?.dining ?? NATIONAL_AVERAGE_SPEND.dining,
    travel: existingValues?.travel ?? NATIONAL_AVERAGE_SPEND.travel,
    fuel: existingValues?.fuel ?? NATIONAL_AVERAGE_SPEND.fuel,
    other: existingValues?.other ?? NATIONAL_AVERAGE_SPEND.other,
  })

  const totalMonthly = Object.values(values).reduce((s, v) => s + v, 0)

  const handleSave = async () => {
    setSaving(true)
    try {
      const totalSpend = totalMonthly
      const toPercent = (v: number) => totalSpend > 0 ? Math.round((v / totalSpend) * 100) : 0

      const { error } = await supabase.from("spending_profiles").upsert(
        {
          user_id: userId,
          monthly_spend: totalSpend,
          groceries_pct: toPercent(values.groceries),
          dining_pct: toPercent(values.dining),
          travel_pct: toPercent(values.travel),
          other_pct: toPercent(values.other + values.fuel),
        },
        { onConflict: "user_id" },
      )

      if (error) {
        toast.error(error.message || "Failed to save spending profile")
        return
      }

      toast.success("Spending profile saved!")
      onSaved?.()
      router.push("/dashboard#gap")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-secondary)]">{stepLabel}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Total: {formatDollars(totalMonthly)}/mo
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Your Monthly Spending</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Help us personalise your recommendations. Estimates are fine — you can update anytime.
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const range = SPEND_CATEGORY_RANGES[cat]
          const value = values[cat]
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`slider-${cat}`}
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  {SPEND_CATEGORY_LABELS[cat]}
                </label>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  ~{formatDollars(value)}/mo
                </span>
              </div>
              <input
                id={`slider-${cat}`}
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [cat]: Number(e.target.value) }))
                }
                className="w-full accent-[var(--accent)] cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                <span>{formatDollars(range.min)}</span>
                <span>{formatDollars(range.max)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          className="rounded-full text-[var(--text-secondary)]"
          onClick={() => router.push("/cards")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          className="flex-1 rounded-full text-white shadow-sm"
          style={{ background: "var(--gradient-cta)" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Show me my gap"}
          {!saving && <ArrowRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
