"use client"

import Link from "next/link"
import { ExternalLink, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Recommendation } from "@/lib/recommendations"
import { formatPointsAsDollars, formatPointsWithValue } from "@/lib/points"

interface RecommendationCardProps {
  recommendation: Recommendation
  variant?: "hero" | "compact"
}

export function RecommendationCard({
  recommendation,
  variant = "hero",
}: RecommendationCardProps) {
  const { card, reason, eligibleNow } = recommendation

  if (variant === "compact") {
    return (
      <Link
        href={card.application_link || "#"}
        target={card.application_link ? "_blank" : undefined}
        className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">{card.bank}</p>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">{card.name}</h4>
          </div>
          {eligibleNow && (
            <div
              className="rounded-full px-2 py-1 text-xs font-semibold"
              style={{ backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }}
            >
              Eligible
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-4 text-sm">
          {card.welcome_bonus_points && (
            <div>
              <span className="text-xl font-bold text-[var(--accent)]">
                {formatPointsAsDollars(card.welcome_bonus_points, card.points_currency ?? "default")}
              </span>
              <span className="ml-1 text-xs text-[var(--text-secondary)]">
                ({card.welcome_bonus_points.toLocaleString()} pts)
              </span>
            </div>
          )}
          {card.annual_fee !== null && (
            <div className="text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">${card.annual_fee}</span>
              <span> fee</span>
            </div>
          )}
        </div>

        <p className="text-sm text-[var(--accent)]">{reason}</p>
      </Link>
    )
  }

  // Hero variant
  return (
    <Card
      className="overflow-hidden border border-[var(--accent)]/30 bg-[var(--surface)] shadow-sm"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--accent) 5%, var(--surface)) 100%)",
      }}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Recommended
            </p>
          </div>
          {eligibleNow && (
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }}
            >
              Eligible now
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{card.bank}</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">{card.name}</h3>
          </div>

          <div className="flex flex-wrap items-baseline gap-6">
            {card.welcome_bonus_points && (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-[var(--accent)]">
                    {formatPointsAsDollars(card.welcome_bonus_points, card.points_currency ?? "default")}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">bonus value</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {formatPointsWithValue(card.welcome_bonus_points, card.points_currency ?? "default")}
                </p>
                {card.bonus_spend_requirement && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Spend ${card.bonus_spend_requirement.toLocaleString()} in{" "}
                    {card.bonus_spend_window_months || 3} months
                  </p>
                )}
              </div>
            )}

            {card.annual_fee !== null && (
              <div className="rounded-xl bg-[var(--surface-strong)] px-4 py-2">
                <p className="text-xs text-[var(--text-secondary)]">Annual fee</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">${card.annual_fee}</p>
              </div>
            )}
          </div>

          <div
            className="rounded-xl border px-4 py-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)",
              borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
            }}
          >
            <p className="text-sm font-semibold text-[var(--accent)]">{reason}</p>
          </div>

          {card.notes && (
            <p className="text-sm text-[var(--text-secondary)]">{card.notes}</p>
          )}

          <div className="flex gap-3 pt-1">
            {card.application_link && (
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-full text-[var(--accent-contrast)] shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
              >
                <Link href={card.application_link} target="_blank" rel="noopener noreferrer">
                  Apply now
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/recommendations">See all</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
